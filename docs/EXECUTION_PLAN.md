# FlowCRM AI — Execution Plan

**Status as of:** current session (post Python venv cleanup & AI Lead Scoring Backend)
**Owner:** Muhammad Haris
**Architect/Engineer:** Claude (this project)

This document is the single source of truth for sequencing. It is
re-verified against the live `master` branch (tarball audit, not agent
self-report) each time it's updated — see `docs/api/*.md` for per-module
contracts.

---

## 0. Current State Snapshot

| Module | Backend | Frontend | Tests | Docs | Status |
|---|---|---|---|---|---|
| Homepage / Marketing | — | ✅ | — | — | Done |
| Authentication (Clerk) | ✅ | ✅ | ✅ | — | Real session verification, org-on-signup, webhook sync, RBAC middleware all live |
| Dashboard | ✅ | ✅ | ✅ | ✅ | `dashboard.rbac.test.ts` exists — RBAC-tested |
| CRM (Companies & Contacts) | ✅ | ✅ | ✅ | ✅ | `crm.rbac.test.ts` exists — RBAC-tested |
| Leads | ✅ | ✅ | ✅ | ✅ | Full CRUD + `/convert` (transactional) + `/:id/score` (AI scoring), RBAC-tested |
| Sales Pipeline | ✅ | ✅ | ✅ | ✅ | Kanban board, stage transitions w/ `closedAt` + Activity logging, RBAC-tested |
| Tasks / Calendar | ✅ | ✅ | ✅ | ✅ | Full CRUD + complete/reopen actions, month-view calendar, RBAC-tested |
| AI Workspace / `apps/ai-service` | 🟡 | ❌ | ✅ | ❌ | FastAPI service live, wired to Leads via `/:id/score`. Committed `venv` cleaned up. Frontend UI & `docs/api/ai-service.md` pending |
| Workflow Automation | 🟡 | ❌ | ✅ | ✅ | Sync engine live (TRIGGER/CONDITION/DELAY/ACTION_STATIC), outbox + resume pollers running. ACTION_AI and visual builder pending — see sprint 2 |
| Communication Hub | ❌ | ❌ | — | — | Not started |
| Reports (dedicated module) | ❌ | ❌ | — | — | Not started; Dashboard currently covers headline stats only |
| Documents | ❌ | ❌ | — | — | Not modeled |
| Integrations | ❌ | ❌ | — | — | Not started |
| CI/CD, Docker, Deployment | ❌ | — | — | — | Not started |

**Overall completion: ~55% of full SRS scope.** Phase 1 (Auth/CRM/Leads/Pipeline), Tasks/Calendar, Python venv cleanup, and AI Lead Scoring backend are complete.

Legend: ✅ done and verified against live repo · 🟡 exists but incomplete/unverified · ❌ not started

---

## 1. Guiding Principles (recap — do not deviate)

- **Architecture before code**, every module: business requirement → affected
  modules → DB design → API design → backend → frontend → validation → error
  handling → tests → docs.
- **Layering is fixed**: `routes → controller → service → repository → Prisma`.
  Every module follows this exactly — no shortcuts that skip the service or repository layer.
- **RBAC scoping happens in the repository layer**, via `AuthContext` (`userId`,
  `organizationId`, `role`) — `SALES_REP` scoping is enforced with a
  `scopeFilter()`-style function in every repository, never left to the route.
- **Side-effecting state changes get dedicated action endpoints**, not
  generic PATCH — established by Pipeline's `PATCH /:id/stage`, Tasks'
  `PATCH /:id/complete`, and Leads' `POST /:id/score`. Any field whose
  change writes an Activity log or triggers a cascading effect must have its own route.
- **The AI service never touches Prisma or the DB directly** — Node is the
  only caller, authenticating with `X-Internal-Service-Key` against a shared
  secret (no second Clerk integration in Python). Confirmed in
  `apps/ai-service/app/core/security.py`.
- **Workflow State & Outbox stay in Node + Postgres** — Node owns the durable
  workflow runtime (`WorkflowRun`, `WorkflowStepLog`, scheduling, delay timers, and RBAC scoping). `apps/ai-service` (FastAPI + LangGraph) is called statelessly for steps requiring AI drafting, LLM reasoning, or intelligent branching.
- **Lead scoring sends boolean signals, not raw PII** — confirmed in
  `apps/api/src/modules/leads/leads.service.ts`: payload to `ai-service`
  uses boolean flags (`hasFullName`, `hasEmail`, `hasPhone`), never raw PII.
- **No module is "done" without**: migration run against a real DB, at least
  one integration test hitting the actual endpoint, and `docs/api/<module>.md`
  written.
- **No dead UI affordances** — a button either goes somewhere real or doesn't
  exist yet.
- **Never trust an agent's self-reported completion** — status is verified against live repo files.

---

## 2. Phase-by-Phase Plan

### ✅ Phase 1A — Authentication — DONE
Clerk integration, webhook sync, `requireAuth()` resolving `authContext`,
org-on-signup, RBAC middleware. Verified via `auth.middleware.test.ts`.

### ✅ Phase 1B — CRM (Contacts & Companies) — DONE
Full CRUD for both, org-scoped, documented in `docs/api/crm.md`.
RBAC-tested via `crm.rbac.test.ts`.

### ✅ Phase 1C — Lead Management — DONE
CRUD + `/:id/convert` (atomic transaction: marks lead `CONVERTED`, creates a
linked `Deal`) + `/:id/score` (AI qualification scoring via FastAPI).
RBAC-tested, documented in `docs/api/leads.md`.

### ✅ Phase 1D — Sales Pipeline — DONE
Kanban board (`GET /board`), deal CRUD, dedicated `/:id/stage` endpoint
(handles `closedAt` + `DEAL_STAGE_CHANGED` Activity logging). RBAC-tested,
documented in `docs/api/pipeline.md`.

### ✅ Phase 2 (partial) — Tasks & Calendar — DONE
Full CRUD, dedicated `/:id/complete` and `/:id/reopen` action endpoints
(Activity logging on completion), optional links to Contact/Lead/Deal,
month-view calendar backed by `GET /calendar?from&to`. RBAC-tested,
documented in `docs/api/tasks.md`.

### 🟡 Phase 4 (backend) — AI Workspace / Lead Scoring — BACKEND DONE
`apps/ai-service` FastAPI service live (`POST /score-lead`, shared-secret auth).
Wired end-to-end to `POST /api/v1/leads/:id/score`. Venv & pycache untracked.
Integration tests in `tests/integration/leads.scoring.test.ts`.

**Remaining to complete AI Workspace:**
1. `docs/api/ai-service.md` documentation file.
2. Frontend UI — "Score with AI" button on Lead detail / table views.
3. Dashboard `AIInsightsPanel` wired to real backend AI summary endpoint.
4. AI content generation / reasoning endpoints for Workflow Automation (`POST /ai/workflow/reason`).

### ❌ Phase 3 — Workflow Automation — REDESIGNED & NEXT
**Architecture Decision: Node/Postgres Outbox Engine + LangGraph AI Nodes**
- **Durable Runtime**: Node.js + Postgres (`Workflow`, `WorkflowNode`, `WorkflowEdge`, `WorkflowRun`, `WorkflowRunLog` in Prisma).
- **Triggers**: Event-driven (`LEAD_CREATED`, `DEAL_STAGE_CHANGED`, `TASK_OVERDUE`, `ACTIVITY_LOGGED`) + Cron schedules.
- **Node Types**:
  - `TRIGGER`: Starts workflow run.
  - `CONDITION`: Filter/branch on entity attributes or past step outputs.
  - `DELAY`: Durable pause ("wait N hours/days" using scheduler queue).
  - `ACTION_STATIC`: Fixed actions executed by Node (e.g. `SEND_EMAIL_TEMPLATE`, `CREATE_TASK`, `UPDATE_LEAD_STATUS`, `SEND_SLACK_WEBHOOK`).
  - `ACTION_AI`: AI-driven steps calling `apps/ai-service` (e.g. `AI_DRAFT_EMAIL`,
    `AI_DECIDE_ESCALATION`, `AI_SUMMARIZE_LEAD`). Supports **LangGraph Evaluator
    Loops** (Draft Agent → Evaluator Agent → Conditional Rewrite if score < 8/10
    → Finalize). **Executes asynchronously**: Node calls `ai-service`, receives
    a job id immediately, and the `WorkflowRun` moves to `WAITING` state — the
    same resume mechanism used by the `DELAY` node type, not a blocking HTTP
    call held open inside the state machine. A webhook or poll from
    `ai-service` resolves the run once the loop finishes.
- **Connectors**: Direct Python/Node integration functions (Slack Webhooks, Twilio SMS, SMTP/SendGrid) eliminating external n8n dependencies while avoiding binary 2-way DB syncs.
- **Frontend UI**: Visual DAG workflow builder (React Flow or custom node-graph), workflow run history execution logs, trigger configuration modal.

#### Key Design Decisions — AI-driven Actions (locked in before implementation)

1. **AI-drafted content is always human-approved, never auto-sent (v1).**
   `AI_DRAFT_EMAIL` and similar `ACTION_AI` outputs are created as a draft
   Task assigned to the relevant rep, not dispatched automatically — even
   at a high `quality_score`. Rationale: an LLM evaluating its own draft
   is a soft quality heuristic, not a correctness guarantee, so a human
   stays in the loop before anything reaches a real customer. Revisit only
   after the pattern has a track record.
2. **`ACTION_AI` nodes are asynchronous, not blocking.** They use the same
   `WAITING`/resume mechanism as `DELAY` nodes rather than holding an HTTP
   connection open across a multi-call LangGraph loop. This keeps the
   Node state machine's execution model consistent (every non-instant step
   behaves the same way) and avoids long-lived synchronous requests between
   `apps/api` and `apps/ai-service`.

### ❌ Phase 5 — Communication Hub, Reports, Integrations — DEFERRED TO AFTER PHASE 3 & 4
- **Communication Hub**: Unified interaction log (Email, WhatsApp Cloud API, Twilio SMS).
- **Dedicated Reports Module**: Exportable metrics, conversion funnel analysis, win/loss reports, historical trend tracking.
- **Integrations & Billing**: Stripe subscription management, external calendar sync.

---

## 3. Cross-Cutting Workstreams

| Workstream | Current state | Action |
|---|---|---|
| **Testing** | 8 integration test files covering Auth, CRM, Dashboard, Leads (rbac/convert/scoring), Pipeline, Tasks | Add pytest coverage in `apps/ai-service` and integration tests for Workflow engine |
| **CI/CD** | `.github/workflows/` empty | GitHub Actions: lint + typecheck + test on PR |
| **Docker** | `docker/` empty | `docker-compose.yml` for local Postgres + API + ai-service |
| **Deployment** | Nothing deployed | Vercel (web) + Railway (api + Postgres + ai-service) |
| **Security hardening** | Helmet + rate-limit on Node API; shared-secret auth on ai-service | CSRF protection for cookie-based Clerk sessions, audit logging table |
| **API client unification** | ✅ Done — `dashboard-api.ts` uses context-aware `apiClient` | — |
| **Python build hygiene** | ✅ Done — `venv`/`__pycache__` untracked & `.gitignore` updated | — |

---

## 4. Definition of Done (applies to every module, no exceptions)

A module is **not done** until all of the following are true:
1. Prisma migration has actually been run against a real Postgres instance.
2. At least one integration test hits the real endpoint and passes.
3. Frontend loading/error/empty states are implemented (not just the happy path).
4. `docs/api/<module>.md` is written.
5. No button, link, or form in the module points to a route that 404s.

---

## 5. Immediate Next Action

1. **AI Workspace Frontend & API Documentation**:
   - Add "Score with AI" UI action on Leads frontend table/detail views.
   - Write `docs/api/ai-service.md`.
2. **Phase 3 Workflow Automation**:
   - Write architectural design document `docs/architecture/workflow-automation.md` detailing the Postgres outbox schema (`Workflow`, `WorkflowRun`), execution state machine, and LangGraph integration endpoints.
   - Implement database models and Prisma migration.
