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
Decision: no n8n. External side effects (Slack, SendGrid) are called
directly from Node/Python integration functions instead.

## Core pattern: Postgres outbox + Node background poller

1. **Transactional Event Logging:** Whenever a new lead is created (or deal stage changed), an outbox event row (`OutboxEvent`) is written to Postgres within the **exact same database transaction** as the domain write. This guarantees zero event loss and zero duplicate triggers.
2. **Background Poller (5–10s Interval):** A background poller process (`automation.outbox-poller.ts`) polls the `OutboxEvent` table every 5 to 10 seconds for unprocessed events (`processedAt == null`).
3. **Workflow Execution:**
   - The poller fetches active matching workflows.
   - It instantiates a `WorkflowRun` state machine.
   - It dispatches the lead data to `apps/ai-service` (`POST /score-lead`).
   - Based on the score (e.g. `Score >= 75` vs `Score < 70`), it triggers either AI Email Generation (with 3-attempt retry logic) or Team Review Task creation.
   - Once executed, the outbox event is marked as `processedAt = new Date()`.

This keeps API request/response paths lightweight and sub-100ms while guaranteeing reliable background execution.

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

## Worked example: Lead AI Scoring & Dual-Path Human Approval (with Retry & Fallback)

This canonical workflow demonstrates FlowCRM's dual-path automation with Human-in-the-Loop (HITL) approval gates, Retry Policy, and Error Fallbacks:

```
                  ┌─────────────────────────────────┐
                  │ TRIGGER: Lead Created           │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │ ACTION_AI: Score Lead (0-100)   │
                  └────────────────┬────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
          Score >= 75│                           │Score < 70
                     ▼                           ▼
  ┌──────────────────────────────────┐ ┌──────────────────────────────────┐
  │ ACTION_AI: Generate Email Draft  │ │ ACTION_STATIC: Create Team Review│
  └──────────────────┬───────────────┘ └──────────────────┬───────────────┘
                     │                                    │
           ┌─────────┴─────────┐                          ▼
           │ Success?          │               ┌──────────────────────────────────┐
           │                   │               │ TEAM REVIEW: Manager Approves?   │
        Yes│                 No│(Attempts < 3) └───────────┬──────────────┬───────┘
           ▼                   ▼                               │ Yes          │ No
┌──────────────────┐ ┌───────────────────┐                     ▼              ▼
│ TASK: Employee   │ │ RETRY NODE: Retry │             ┌──────────────────────┐ ┌─────────┐
│ Reviews Draft    │ │ AI Email Draft    │             │ Move to Email Service│ │ Reject  │
└──────────┬───────┘ └─────────┬─────────┘             └──────────────────────┘ └─────────┘
           │                   │
           ▼                   ▼ (Failed 3 Times)
┌──────────────────┐ ┌─────────────────────────────────────────────────┐
│ ACTION_STATIC:   │ │ FALLBACK TASK & UI ALERT:                       │
│ Auto Send Email  │ │ "Email Generation Failed - Manually Create Draft│
└──────────────────┘ └─────────────────────────────────────────────────┘
```

1. **Trigger (`LEAD_CREATED`):** A new lead enters the system (via API, Web Form, or Manual Entry). An outbox event `LEAD_CREATED` is emitted transactionally.
2. **AI Lead Scoring (`ACTION_AI`):** The workflow engine invokes `apps/ai-service` (`POST /score-lead`), returning a score (0–100).
3. **Condition Branching:**
   - **Path A (High Quality: `score >= 75`):**
     - The engine executes `ACTION_AI` to generate an outreach email draft.
     - **Retry Mechanism (Up to 3 Retries):** If AI generation fails (e.g. LLM rate limit or timeout), the **Retry Node** re-attempts execution automatically up to 3 times with exponential backoff.
     - **Success Case:** The generated email is presented to the employee as a Task: *"Review & Improve AI Email Draft"*. Once the employee reviews and clicks **Approve**, the email is automatically dispatched via the email service (`SEND_EMAIL`).
     - **Fallback Failure Case (After 3 Failed Retries):** If AI generation fails 3 times, a **UI Alert & High-Priority Task** is displayed on the employee's screen: *"Email Generation Failed - Please manually draft and send outreach email"*.
   - **Path B (Low / Needs Review: `score < 70`):**
     - The engine creates a **Team Review Task** for sales management.
     - The team inspects the lead. If **Approved**, the lead is unlocked to enter the email outreach pipeline; if **Rejected**, the lead is marked `UNQUALIFIED`.



## Open items for implementation phase

- Exact outbox table schema and polling vs. `LISTEN/NOTIFY` decision.
- Scheduler mechanism for `DELAY` node resumption.
- Visual builder: React Flow (or custom node-graph) round-trip against the
  normalized `WorkflowNode`/`WorkflowEdge` tables.
- Rate/cost ceiling for `ACTION_AI` nodes at scale (each Evaluator-Optimizer
  loop is up to ~6 sequential Groq calls).
