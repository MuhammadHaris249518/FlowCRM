# FlowCRM AI — Execution Plan

**Status as of:** August 14, 2026 (post Workflow Automation Engine, AI Poller & Visual DAG Builder UI Implementation)  
**Owner:** Muhammad Haris  
**Architect/Engineer:** Antigravity (this project)  

This document is the single source of truth for sequencing. It is re-verified against the live repository code each time it's updated — see `docs/api/*.md` for per-module contracts.

---

## 0. Current State Snapshot

| Module | Backend | Frontend | Tests | Docs | Status |
|---|---|---|---|---|---|
| Homepage / Marketing | — | ✅ | — | — | **Done** |
| Authentication (Clerk) | ✅ | ✅ | ✅ | — | Real session verification, org-on-signup, webhook sync, RBAC middleware all live |
| Dashboard | ✅ | ✅ | ✅ | ✅ | `dashboard.rbac.test.ts` exists — RBAC-tested |
| CRM (Companies & Contacts) | ✅ | ✅ | ✅ | ✅ | `crm.rbac.test.ts` exists — RBAC-tested |
| Leads | ✅ | ✅ | ✅ | ✅ | Full CRUD + `/convert` (transactional) + `/:id/score` (AI scoring), `LEAD_SCORE_CHANGED` outbox event, RBAC-tested |
| Sales Pipeline | ✅ | ✅ | ✅ | ✅ | Kanban board, stage transitions w/ `closedAt` + Activity logging, RBAC-tested |
| Tasks / Calendar | ✅ | ✅ | ✅ | ✅ | Full CRUD + complete/reopen actions, month-view calendar, RBAC-tested |
| AI Workspace / `apps/ai-service` | ✅ | 🟡 | ✅ | ✅ | FastAPI service live (`POST /score-lead`, `POST /email/draft`), wired to Leads and AI Poller. Frontend UI action pending |
| Workflow Automation | ✅ | ✅ | ✅ | ✅ | Engine live (`automation.engine.ts`), outbox poller (5–10s loop), AI poller (5s loop), `ACTION_AI` async draft task creation, `LEAD_SCORE_CHANGED` trigger, nested payloads (`entity: {...}`), React Flow visual builder UI complete |
| Communication Hub | ❌ | ❌ | — | — | Not started |
| Reports (dedicated module) | ✅ | ✅ | ✅ | ✅ | **Done** | `reports.funnel.test.ts` passed — conversion funnel API, RBAC scoping & UI complete |
| Documents | ❌ | ❌ | — | — | Not modeled |
| Integrations | ❌ | ❌ | — | — | Not started |
| CI/CD, Docker, Deployment | 🟡 | — | ✅ | ✅ | **Partial** | Local `docker-compose.yml` and Dockerfiles live with build ARGs; GitHub Actions CI/CD pipeline pending (`.gitkeep`) |

**Overall completion: ~75% of full SRS scope.** Phase 1 (Auth/CRM/Leads/Pipeline), Tasks/Calendar, AI Lead Scoring backend, Workflow Automation Engine backend & Visual DAG UI, and local Docker dev setup are complete.

Legend: ✅ done and verified against live repo · 🟡 exists but incomplete/unverified · ❌ not started

---

## 1. Guiding Principles (recap — do not deviate)

- **Architecture before code**, every module: business requirement → affected modules → DB design → API design → backend → frontend → validation → error handling → tests → docs.
- **Layering is fixed**: `routes → controller → service → repository → Prisma`. Every module follows this exactly — no shortcuts that skip the service or repository layer.
- **RBAC scoping happens in the repository layer**, via `AuthContext` (`userId`, `organizationId`, `role`) — `SALES_REP` scoping is enforced with a `scopeFilter()`-style function in every repository, never left to the route.
- **Side-effecting state changes get dedicated action endpoints**, not generic PATCH — established by Pipeline's `PATCH /:id/stage`, Tasks' `PATCH /:id/complete`, and Leads' `POST /:id/score`. Any field whose change writes an Activity log or triggers a cascading effect must have its own route.
- **The AI service never touches Prisma or the DB directly** — Node is the only caller, authenticating with `X-Internal-Service-Key` against a shared secret (no second Clerk integration in Python). Confirmed in `apps/ai-service/app/core/security.py`.
- **Workflow State & Outbox stay in Node + Postgres** — Node owns the durable workflow runtime (`WorkflowRun`, `WorkflowStepLog`, scheduling, delay timers, and RBAC scoping). `apps/ai-service` (FastAPI + LangGraph) is called statelessly for steps requiring AI drafting, LLM reasoning, or intelligent branching.
- **Lead scoring sends boolean signals, not raw PII** — confirmed in `apps/api/src/modules/leads/leads.service.ts`: payload to `ai-service` uses boolean flags (`hasFullName`, `hasEmail`, `hasPhone`), never raw PII.
- **No module is "done" without**: migration run against a real DB, at least one integration test hitting the actual endpoint, and `docs/api/<module>.md` written.
- **No dead UI affordances** — a button either goes somewhere real or doesn't exist yet.
- **Never trust an agent's self-reported completion** — status is verified against live repo files.

---

## 2. Phase-by-Phase Plan

### ✅ Phase 1A — Authentication — DONE
Clerk integration, webhook sync, `requireAuth()` resolving `authContext`, org-on-signup, RBAC middleware. Verified via `auth.middleware.test.ts`.

### ✅ Phase 1B — CRM (Contacts & Companies) — DONE
Full CRUD for both, org-scoped, documented in `docs/api/crm.md`. RBAC-tested via `crm.rbac.test.ts`.

### ✅ Phase 1C — Lead Management — DONE
CRUD + `/:id/convert` (atomic transaction: marks lead `CONVERTED`, creates a linked `Deal`) + `/:id/score` (AI qualification scoring via FastAPI) + `LEAD_SCORE_CHANGED` outbox event emission on score change (deduped). RBAC-tested, documented in `docs/api/leads.md`.

### ✅ Phase 1D — Sales Pipeline — DONE
Kanban board (`GET /board`), deal CRUD, dedicated `/:id/stage` endpoint (handles `closedAt` + `DEAL_STAGE_CHANGED` Activity logging). RBAC-tested, documented in `docs/api/pipeline.md`.

### ✅ Phase 2 (partial) — Tasks & Calendar — DONE
Full CRUD, dedicated `/:id/complete` and `/:id/reopen` action endpoints (Activity logging on completion), optional links to Contact/Lead/Deal, month-view calendar backed by `GET /calendar?from&to`. RBAC-tested, documented in `docs/api/tasks.md`.

### ✅ Phase 4 (backend) — AI Workspace / Lead Scoring — BACKEND DONE
`apps/ai-service` FastAPI service live (`POST /score-lead`, `POST /email/draft`, shared-secret auth). Wired end-to-end to `POST /api/v1/leads/:id/score` and Node `automation.ai-poller.ts`. Venv & pycache untracked. Integration tests in `tests/integration/leads.scoring.test.ts`.

**Remaining to complete AI Workspace:**
1. Frontend UI — "Score with AI" button on Lead detail / table views.
2. Dashboard `AIInsightsPanel` wired to real backend AI summary endpoint.

### ✅ Phase 3 — Workflow Automation Engine & UI — DONE
**Architecture Decision: Node/Postgres Outbox Engine + LangGraph AI Nodes + React Flow Visual Builder**
- **Durable Runtime**: Node.js + Postgres (`Workflow`, `WorkflowNode`, `WorkflowEdge`, `WorkflowRun`, `WorkflowRunLog` in Prisma).
- **Outbox Poller**: Background worker (`automation.outbox-poller.ts`) executing on a 5–10s loop, picking up unprocessed `OutboxEvent` rows (`processedAt == null`).
- **AI Poller**: Independent background worker (`automation.ai-poller.ts`) running on a 5s loop to resolve pending `ACTION_AI` email draft jobs.
- **Resume Poller**: Background worker (`automation.resume-poller.ts`) checking `WAITING` runs and scheduled `DELAY` resumptions.
- **Triggers**: Event-driven (`LEAD_CREATED`, `LEAD_STATUS_CHANGED`, `LEAD_SCORE_CHANGED`, `DEAL_STAGE_CHANGED`, `TASK_OVERDUE`, `ACTIVITY_LOGGED`) + Cron schedules.
- **Node Types**:
  - `TRIGGER`: Starts workflow run.
  - `CONDITION`: Filter/branch on entity attributes or past step outputs.
  - `DELAY`: Durable pause ("wait N hours/days" using scheduler queue).
  - `ACTION_STATIC`: Fixed actions executed by Node (`CREATE_TASK`, `UPDATE_LEAD_STATUS`, `SEND_EMAIL_TEMPLATE`, `SEND_SLACK_WEBHOOK`).
  - `ACTION_AI`: AI-driven steps calling `apps/ai-service` (`AI_DRAFT_EMAIL`, `AI_DECIDE_ESCALATION`, `AI_SUMMARIZE_LEAD`).
- **Visual DAG Builder UI**: React Flow canvas (`WorkflowCanvas.tsx`), node configuration drawer (`NodeConfigPanel.tsx`), node palette (`NodePalette.tsx`), and workflow toolbar (`WorkflowToolbar.tsx`).
- **Integration Tests**: `automation.rbac.test.ts`, `automation.engine.test.ts`, `automation.ai-poller.test.ts`, `automation.lead-score-trigger.test.ts` verified against live database.

#### Key Design Decisions — AI-driven Actions & Human-in-the-Loop Gates

1. **Human-in-the-Loop Draft Task Creation:**
   - AI drafts an email as a pending `Task` for human review.
   - Emails are **NEVER** auto-sent in v1 (no SendGrid/SMTP automated dispatch, no score >= 75 auto-send path, no dual-path approval gate). A human always reviews the draft Task and sends manually.
2. **`ACTION_AI` nodes are asynchronous, not blocking.**
   - Execution dispatches `POST /email/draft` to `apps/ai-service` (returns 202 with `job_id`) and sets workflow run state to `WAITING` with an `aiJobId`.
   - The dedicated 5s AI Poller polls `GET /email/draft/{job_id}` and resolves the run upon job completion to create the review Task.
3. **Consistent Nested Outbox Payloads:**
   - `LEAD_CREATED`, `LEAD_STATUS_CHANGED`, and `LEAD_SCORE_CHANGED` emit consistent nested `entity: { ... }` structures so `CONDITION` nodes can parse attributes (`entity.score`, `entity.toStatus`, etc.).

### ❌ Phase 5 — Communication Hub, Reports, Integrations — DEFERRED TO AFTER PHASE 3 & 4
- **Communication Hub**: Unified interaction log (Email, WhatsApp Cloud API, Twilio SMS).
- **Dedicated Reports Module**: Exportable metrics, conversion funnel analysis, win/loss reports, historical trend tracking.
- **Integrations & Billing**: Stripe subscription management, external calendar sync.

---

## 3. Cross-Cutting Workstreams

| Workstream | Current state | Action |
|---|---|---|
| **Testing** | 13 test files covering Auth, CRM, Dashboard, Leads (rbac/convert/scoring/outbox-payload), Pipeline, Tasks, Automation (engine/ai-poller/lead-score-trigger/rbac) | Add pytest coverage in `apps/ai-service` |
| **CI/CD** | `.github/workflows/.gitkeep` pending | GitHub Actions: lint + typecheck + test on PR |
| **Docker** | ✅ Done — `docker-compose.yml` for local Postgres + API + ai-service + web (with `NEXT_PUBLIC_API_URL` build ARG fix) | Production container hardening |
| **Deployment** | Local Docker Compose verified | Vercel (web) + Railway (api + Postgres + ai-service) |
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

1. **AI Workspace Frontend**:
   - Add "Score with AI" UI action on Leads frontend table and detail views.
   - Wire `AIInsightsPanel` on the Dashboard to the live AI backend endpoint.
2. **CI/CD & Cloud Infrastructure**:
   - Write GitHub Actions workflow for automated testing on PRs.

