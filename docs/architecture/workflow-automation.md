# Workflow Automation — Architecture

Status: **designed, not yet implemented**. No `Workflow*` Prisma models,
no outbox table, and no engine code exist in the repo yet. This document
is the design reference for when that work starts. See
`docs/EXECUTION_PLAN.md` §2 Phase 3 for current build status.

## Why this exists

Every other module in FlowCRM (CRM, Leads, Pipeline, Tasks) records what a
user did. Workflow Automation is what makes FlowCRM act on the user's
behalf — e.g. auto-creating a follow-up Task when a Lead sits in
`CONTACTED` for 3 days without progress, or auto-drafting a personalized
outreach email when a Lead's AI score crosses a threshold.

## Why not n8n

n8n is a strong fit for one thing this project doesn't need it for:
pre-built third-party connectors. It's a poor fit for owning *domain
state* — "this workflow is on step 2 of 4, waiting on a 3-day timer, tied
to Lead #4821" is core product logic, not integration glue, and needs the
same transactional guarantees and RBAC scoping as the rest of the CRM data.
Decision: no n8n. External side effects (Slack, Twilio, SMTP) are called
directly from Node/Python integration functions instead.

## Core pattern: Postgres outbox + Node state machine

1. Any transactional write that could be a trigger (Lead created, Deal
   stage changed, Task overdue) also writes an outbox event row, in the
   **same DB transaction** as the domain write. This guarantees the event
   is never lost or duplicated relative to the actual data change.
2. A background worker polls the outbox table for unprocessed rows and
   checks whether any active workflow's trigger matches.
3. If yes, a `WorkflowRun` is created and the state machine begins
   executing nodes in order, persisting progress after every step so a
   crash mid-run resumes rather than restarting.

This keeps normal CRUD request/response paths fast and unaffected by
automation logic, while giving at-least-once delivery for triggers.

## Data model (Prisma models — not yet created)

- `Workflow` — one row per automation definition: name, org, active flag,
  trigger type + config.
- `WorkflowNode` / `WorkflowEdge` — the DAG: node type, config, and the
  edges connecting them. Normalized tables (not a single JSON blob) —
  this was a deliberate choice over a JSON-DAG-on-one-column approach so
  individual nodes/edges can be queried and edited directly; the tradeoff
  is more joins when assembling a full graph for the visual builder.
- `WorkflowRun` — one row per triggered execution: status, current node,
  context (which Lead/Deal/Task triggered it).
- `WorkflowRunLog` — one row per step execution, the audit/debug trail.
- Outbox table — event type, payload, processed timestamp, written in the
  same transaction as the domain change that triggered it.

## Node types

- `TRIGGER` — entry point, matches an outbox event type + config (e.g.
  `LEAD_CREATED`, `DEAL_STAGE_CHANGED`, `TASK_OVERDUE`, `ACTIVITY_LOGGED`,
  or a cron schedule).
- `CONDITION` — branches on entity data or a previous step's output (e.g.
  `lead.score >= 70`).
- `DELAY` — durable pause ("wait 3 days"), resumed by a scheduler, not a
  held-open process.
- `ACTION_STATIC` — fixed effect executed directly by Node: `CREATE_TASK`,
  `UPDATE_LEAD_STATUS`, `SEND_EMAIL_TEMPLATE`, `SEND_SLACK_WEBHOOK`.
- `ACTION_AI` — calls `apps/ai-service` for LLM-driven steps: `AI_DRAFT_EMAIL`,
  `AI_DECIDE_ESCALATION`, `AI_SUMMARIZE_LEAD`.

## ACTION_AI: LangGraph Evaluator-Optimizer loop

For `AI_DRAFT_EMAIL` and similar reasoning-heavy actions, the AI service
runs a LangGraph loop: **Draft agent** generates an initial email → **Evaluator
agent** scores it 1–10 on personalization, tone/brevity, and call-to-action
→ if score < 8 and revisions < 3, **Rewrite agent** injects the critique and
loops back to the Evaluator → otherwise, **Finalize** returns the draft,
score, and critique.

### Locked-in decisions (do not implement differently without revisiting this doc)

1. **AI-drafted content is always human-approved, never auto-sent (v1).**
   Output always becomes a draft Task assigned to the relevant rep, even at
   a high quality score. An LLM evaluating its own draft is a soft quality
   heuristic, not a correctness guarantee — a human stays in the loop
   before anything reaches a real customer.
2. **`ACTION_AI` nodes execute asynchronously, not as a blocking call.**
   Node calls `ai-service`, gets a job id back immediately, and the
   `WorkflowRun` moves to the same `WAITING` state used by `DELAY` nodes —
   it does not hold an HTTP connection open across a multi-call LangGraph
   loop. A webhook or poll from `ai-service` resolves the run once the
   loop finishes.

## Worked example

1. `leads.service.ts` updates a Lead to `CONTACTED`; in the same
   transaction, an outbox event `LEAD_STATUS_CHANGED` is written.
2. The outbox poller finds an active workflow matching that trigger,
   creates a `WorkflowRun`, starts at a `DELAY` node ("wait 3 days").
3. After 3 days, a scheduled check resumes the run, evaluates a
   `CONDITION` node ("still in CONTACTED?"), and if true, runs an
   `ACTION_STATIC` node that creates a follow-up Task — reusing the
   existing Tasks module code, not duplicating it.

## Open items for implementation phase

- Exact outbox table schema and polling vs. `LISTEN/NOTIFY` decision.
- Scheduler mechanism for `DELAY` node resumption.
- Visual builder: React Flow (or custom node-graph) round-trip against the
  normalized `WorkflowNode`/`WorkflowEdge` tables.
- Rate/cost ceiling for `ACTION_AI` nodes at scale (each Evaluator-Optimizer
  loop is up to ~6 sequential Groq calls).
