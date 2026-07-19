# FlowCRM AI — Execution Plan

**Status as of:** current session (post Tasks/Calendar module)
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
| Dashboard | ✅ | ✅ | ❌ | ✅ | Functional against live Auth; no integration tests yet |
| CRM (Companies & Contacts) | ✅ | ✅ | ❌ | ✅ | Full CRUD, rep-scoping; no integration tests yet |
| Leads | ✅ | ✅ | ✅ | ✅ | Full CRUD + `/convert` (transactional), RBAC-tested |
| Sales Pipeline | ✅ | ✅ | ✅ | ✅ | Kanban board, stage transitions w/ `closedAt` + Activity logging, RBAC-tested |
| Tasks / Calendar | ✅ | ✅ | ✅ | ✅ | Full CRUD + complete/reopen actions, month-view calendar, RBAC-tested |
| Workflow Automation | ❌ | ❌ | — | — | Not started |
| AI Workspace / `apps/ai-service` | ❌ | — | — | — | Still empty — no FastAPI app exists |
| Communication Hub | ❌ | ❌ | — | — | Not started |
| Reports (dedicated module) | ❌ | ❌ | — | — | Not started; Dashboard currently covers headline stats only |
| Documents | ❌ | ❌ | — | — | Not modeled |
| Integrations | ❌ | ❌ | — | — | Not started |
| CI/CD, Docker, Deployment | ❌ | — | — | — | Not started |

**Overall completion: ~45% of full SRS scope. Phase 1 (Auth/CRM/Leads/Pipeline) + Tasks/Calendar are done.**

Legend: ✅ done and verified against live repo · 🟡 exists but incomplete/unverified · ❌ not started

---

## 1. Guiding Principles (recap — do not deviate)

- **Architecture before code**, every module: business requirement → affected
  modules → DB design → API design → backend → frontend → validation → error
  handling → tests → docs.
- **Layering is fixed**: `routes → controller → service → repository → Prisma`.
  Every module built so far (Dashboard, CRM, Leads, Pipeline, Tasks) follows
  this exactly — no shortcuts that skip the service or repository layer.
- **RBAC scoping happens in the repository layer**, via `AuthContext` (`userId`,
  `organizationId`, `role`) — `SALES_REP` scoping is enforced with a
  `scopeFilter()`-style function in every repository, never left to the route.
- **Side-effecting state changes get dedicated action endpoints**, not
  generic PATCH — established by Pipeline's `PATCH /:id/stage` and Tasks'
  `PATCH /:id/complete`. Any field whose change also writes an Activity log
  or triggers a cascading effect must be excluded from the generic update
  schema and given its own route.
- **No module is "done" without**: migration run against a real DB, at least
  one integration test hitting the actual endpoint, and `docs/api/<module>.md`
  written.
- **No dead UI affordances** — a button either goes somewhere real or doesn't
  exist yet.
- **Never trust an agent's self-reported completion** — every status in this
  document is verified by re-pulling the `master` tarball and grepping the
  actual files, not by reading commit messages or agent summaries.

---

## 2. Phase-by-Phase Plan

### ✅ Phase 1A — Authentication — DONE
Clerk integration, webhook sync, `requireAuth()` resolving `authContext`,
org-on-signup, RBAC middleware. Verified via `auth.middleware.test.ts`.

### ✅ Phase 1B — CRM (Contacts & Companies) — DONE
Full CRUD for both, org-scoped, documented in `docs/api/crm.md`.
**Gap:** no integration tests exist for this module yet — only manual/live
verification was done historically. Should get an RBAC test file matching
the pattern in `leads.rbac.test.ts` before being called fully closed.

### ✅ Phase 1C — Lead Management — DONE
CRUD + `/:id/convert` (atomic transaction: marks lead `CONVERTED`, creates a
linked `Deal`). RBAC-tested, documented in `docs/api/leads.md`.

### ✅ Phase 1D — Sales Pipeline — DONE
Kanban board (`GET /board`), deal CRUD, dedicated `/:id/stage` endpoint
(handles `closedAt` + `DEAL_STAGE_CHANGED` Activity logging). RBAC-tested,
now documented in `docs/api/pipeline.md`.

### ✅ Phase 2 (partial) — Tasks & Calendar — DONE
Full CRUD, dedicated `/:id/complete` and `/:id/reopen` action endpoints
(Activity logging on completion), optional links to Contact/Deal/Lead,
month-view calendar backed by `GET /calendar?from&to`. RBAC-tested,
documented in `docs/api/tasks.md`.

**Not done from original Phase 2 scope:** Documents (no `Document` model
exists), external Calendar sync (Google Calendar — deferred to an
Integrations phase, internal model was intentionally built without it).

### ❌ Phase 3 — Workflow Automation — NOT STARTED
n8n integration, webhook ingestion endpoints, automation triggers off
Activity/Lead/Deal state changes (e.g. auto-create a follow-up Task when a
Lead sits in `CONTACTED` for N days — now buildable since Tasks exists).

### ❌ Phase 4 — AI Workspace — NOT STARTED
`apps/ai-service` is still just `.gitkeep` placeholders — zero FastAPI code.
This is where OpenAI integration for lead qualification scoring (the
`Lead.score` field already exists and defaults to 0, unused), AI summary
generation, and the Dashboard's currently-hardcoded `AIInsightsPanel` get
wired up. Stated as the platform's differentiating feature — currently 0%
built despite everything else around it (Leads, Pipeline, Tasks) being ready
to feed it data.

### ❌ Phase 5 — Communication Hub, Reports, Integrations — NOT STARTED
WhatsApp Cloud API, Twilio SMS, Stripe billing, a dedicated Reports module
distinct from Dashboard (export-focused, historical trend analysis).

---

## 3. Cross-Cutting Workstreams (still not started, unchanged since last review)

| Workstream | Current state | Action |
|---|---|---|
| **Testing** | 4 modules covered (Auth, Leads, Pipeline, Tasks); Dashboard and CRM have none | Add RBAC test files for Dashboard and CRM using the existing `fixtures.ts`/`test-app.ts` helpers before starting Phase 3 |
| **CI/CD** | `.github/workflows/` empty | GitHub Actions: lint + typecheck + test on PR |
| **Docker** | `docker/` empty | `docker-compose.yml` for local Postgres + API |
| **Deployment** | Nothing deployed | Vercel (web) + Railway (api + Postgres) |
| **Security hardening** | Helmet + rate-limit only | CSRF protection for cookie-based Clerk sessions, audit logging table |
| **API client unification** | Two clients coexist in `apps/web/src/lib/api-client.ts`: legacy header-less `apiGet/apiPost` (still used by `dashboard-api.ts`) and the context-aware `apiClient` (used by CRM/Leads/Pipeline/Tasks) | Migrate `dashboard-api.ts` to `apiClient` and delete the legacy functions |

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

Phase 1 (Auth, CRM, Leads, Pipeline) and Tasks/Calendar are all functionally
complete and verified. Two decisions are open, not yet resolved:

1. **Close the small gaps first** — write RBAC tests for CRM and Dashboard,
   migrate `dashboard-api.ts` off the legacy client — before starting new
   surface area. (Low effort, removes accumulating tech debt.)
2. **Then pick the next big module**: either Phase 3 (Automation) or Phase 4
   (AI Workspace / `apps/ai-service`). AI Workspace is the larger lift (new
   Python service from scratch) but is the platform's stated differentiator
   and currently 0% built; Automation is faster to ship and can immediately
   act on the Leads/Pipeline/Tasks data that now exists.

No module should be started until this document's "Immediate Next Action"
section is updated to name it explicitly.
