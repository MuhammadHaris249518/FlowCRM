# FlowCRM AI — Execution Plan

**Status as of:** current session
**Owner:** Muhammad Haris
**Architect/Engineer:** Claude (this project)

This document is the single source of truth for sequencing. It reflects the SRS's
5-phase roadmap, reordered where the *actual* dependency graph (not the SRS's
narrative order) demands it — most importantly, Authentication must be real
before any RBAC-scoped module built on top of it can be considered done, not
just "code-complete."

---

## 0. Current State Snapshot

| Module | Backend | Frontend | DB | Tests | Status |
|---|---|---|---|---|---|
| Homepage / Marketing | — | ✅ | — | ❌ | Done, navigation verified working |
| Authentication | ✅ | ✅ | ✅ modeled | ❌ | Real Clerk verification, org-on-signup, RBAC middleware all working end-to-end |
| Dashboard | ✅ | ✅ | ✅ modeled | ❌ | Fully functional against live Auth |
| CRM (Companies & Contacts) | ✅ | ✅ | ✅ modeled | ❌ | CRUD, search, pagination, rep-scoping done; live cross-role RBAC verification still pending |
| Lead Management | ❌ | ❌ | ✅ modeled | ❌ | Not started — next up |
| Sales Pipeline | ❌ | ❌ | ✅ modeled | ❌ | Not started |
| Tasks / Calendar / Documents | ❌ | ❌ | 🟡 partial | ❌ | Not started |
| Workflow Automation | ❌ | ❌ | ❌ | ❌ | Not started |
| AI Workspace | ❌ | ❌ | ❌ | ❌ | `apps/ai-service` empty, no FastAPI app |
| Communication Hub | ❌ | ❌ | ❌ | ❌ | Not started |
| Reports | 🟡 overlaps w/ Dashboard | ❌ | ✅ modeled | ❌ | Not started as dedicated module |
| Integrations | ❌ | ❌ | ❌ | ❌ | Not started |
| CI/CD, Docker, Deployment | ❌ | — | — | — | Not started |

**Overall completion: ~25% of full SRS scope. ~40% of Phase 1 scope.**

Legend: ✅ done and verified · 🟡 exists but incomplete/unverified · ❌ not started

---

## 1. Guiding Principles (recap — do not deviate)

- **Architecture before code**, every module: business requirement → affected
  modules → DB design → API design → backend → frontend → validation → error
  handling → tests → docs.
- **Layering is fixed**: `routes → controller → service → repository → Prisma`,
  established in the Dashboard module. Every new backend module follows this
  exactly — no shortcuts that skip the service or repository layer.
- **RBAC scoping happens in the repository layer**, via `AuthContext` (`userId`,
  `organizationId`, `role`) — never trust a route to remember to filter by org.
- **No module is "done" without**: migration run against a real DB, at least
  one integration test hitting the actual endpoint, and docs updated in `docs/`.
- **No dead UI affordances** — a button either goes somewhere real or doesn't
  exist yet (established precedent: Navbar/CTA fix, Features "Learn more" removal).

---

## 2. Sequencing — Why Auth Comes First

Every module from CRM onward will write Prisma queries scoped by
`req.auth.organizationId` and gated by `req.auth.role`, identical to
`dashboardRepository.scopeFilter()`. If Auth stays stubbed while CRM/Leads/
Pipeline get built, all three will need to be revisited the moment Clerk is
wired in — effectively double work. Building Auth for real now is the
highest-leverage single task available.

---

## 3. Phase-by-Phase Plan

### Phase 1A — Authentication (do this now)

**Business requirement:** Every other module's data isolation depends on
knowing who the user is and which organization/role they belong to. Without
this, "Sales Rep only sees their own leads" is a comment, not a guarantee.

**Scope:**
- Clerk integration: sign-up, sign-in, session verification middleware
  (`requireAuth()` — replace the `TODO` with real `@clerk/express` verification)
- On first sign-up: create `Organization` + `Membership` (role = `ORG_OWNER`)
- Invite flow: `ORG_OWNER`/`SALES_MANAGER` can invite teammates → creates
  `Membership` with assigned role
- `GET /api/v1/auth/me` → returns `{ user, organization, role }` for frontend
  session hydration
- Frontend: wrap app in Clerk provider, protect `(dashboard)` route group,
  real form submission (replace the stubbed promise in login/register pages)

**DB changes:** None new — `User`, `Organization`, `Membership` already modeled.
Needs: **first real `prisma migrate dev` run.**

**API endpoints:**
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/organizations` | Clerk session | Create org on signup |
| GET | `/api/v1/auth/me` | Clerk session | Hydrate frontend session |
| POST | `/api/v1/organizations/:id/invites` | `ORG_OWNER`, `SALES_MANAGER` | Invite teammate |

**Tests:** unit test `requireAuth()` rejects missing/invalid tokens; integration
test for org-creation-on-signup; RBAC test confirming `SALES_REP` cannot hit
`requireRole(['ORG_OWNER'])` routes.

**Exit criteria:** A real user can sign up, land on `/dashboard`, and
`req.auth` is populated with real data from the DB — Dashboard's existing
RBAC-scoped queries start returning correct, isolated data with zero changes
to Dashboard's own code.

---

### Phase 1B — CRM (Contacts & Companies)

**Business requirement:** Per SRS: "Customer information is stored in
multiple places." CRM is the single source of truth for who a business talks to.

**Scope:** Contact/Company CRUD, list views with pagination, search, tags,
notes, custom fields (SRS Module 3).

**DB changes:** `Contact`/`Company` already modeled — likely needs a `Tag`
model and `notes` relation added.

**API endpoints:** standard CRUD under `/api/v1/contacts`, `/api/v1/companies`,
each RBAC-scoped identically to Dashboard's pattern.

**Frontend:** `features/crm/` — list/detail/create views, TanStack Query +
React Hook Form + Zod, following the exact pattern in `features/dashboard/`.

---

### Phase 1C — Lead Management

**Business requirement:** "Leads are forgotten" — SRS's #1 stated problem.

**Scope:** Lead capture (manual + webhook-ready), assignment, scoring field
(AI qualification comes in Phase 4, but the field/UI exists now), source
tracking, duplicate detection.

**DB changes:** `Lead` already modeled with `score`/`source`/`status`.

**API endpoints:** `/api/v1/leads` CRUD + `/api/v1/leads/:id/assign`.

---

### Phase 1D — Sales Pipeline

**Business requirement:** Visual deal tracking — SRS Module 5.

**Scope:** Kanban board (drag-and-drop stage changes), deal CRUD, forecast
totals (Dashboard already aggregates this — reuse `dashboardRepository`
patterns, don't duplicate).

**DB changes:** `Deal`/`DealStage` already modeled.

---

### Phase 2 — Tasks, Calendar, Documents

Per SRS roadmap. Task model exists; Calendar and Documents need new models
(`Meeting`, `Document`) and Google Calendar sync (external integration,
Phase 5 territory — build the internal model now, defer the sync).

### Phase 3 — Workflow Automation

n8n integration, webhook ingestion endpoints, email automation triggers off
Activity/Lead/Deal state changes.

### Phase 4 — AI Workspace

This is where `apps/ai-service` (currently empty) gets built: FastAPI app,
OpenAI integration for lead qualification scoring, AI summary generation, AI
email drafting, chat assistant. Dashboard's `AIInsightsPanel` (currently
hardcoded text) gets wired to this service's `/ai/daily-summary` endpoint.

### Phase 5 — Communication Hub, Reports, Integrations

WhatsApp Cloud API, Twilio SMS, Stripe billing, dedicated Reports module
(distinct from Dashboard — deeper historical/export-focused reporting).

---

## 4. Cross-Cutting Workstreams (run in parallel, not deferred to "later")

| Workstream | Current state | Action |
|---|---|---|
| **Testing** | 0 test files exist anywhere | Add Jest to `apps/api`, Vitest/RTL to `apps/web` starting with Phase 1A — don't accumulate more untested modules |
| **CI/CD** | `.github/workflows/` empty | GitHub Actions: lint + typecheck + test on PR, before Phase 1B ships |
| **Docker** | `docker/` empty | `docker-compose.yml` for local Postgres + API, before any teammate other than Haris touches this repo |
| **Deployment** | Nothing deployed | Vercel (web) + Railway (api + Postgres) — target after Phase 1A so there's something real to show |
| **Security hardening** | Helmet + rate-limit only | Add CSRF protection for cookie-based Clerk sessions, audit logging table (SRS non-functional requirement) |

---

## 5. Definition of Done (applies to every module, no exceptions)

A module is **not done** until all of the following are true:
1. Prisma migration has actually been run against a real Postgres instance.
2. At least one integration test hits the real endpoint and passes.
3. Frontend loading/error/empty states are implemented (not just the happy path).
4. `docs/api/<module>.md` and any DB changes are documented.
5. No button, link, or form in the module points to a route that 404s.

---

## 6. Immediate Next Action

Phase 1A (Auth) and Phase 1B (CRM: Companies & Contacts) are functionally
complete. Two loose ends remain before Phase 1B is formally closed: a live
manual RBAC verification (Sales Rep vs Manager/Owner contact visibility —
not something an agent can perform, requires a human observing two test
accounts) and tagging `phase-1b-complete` once that passes.

Next build target: **Phase 1C — Lead Management**, following the exact same
layered pattern (`routes → controller → service → repository`) established
in Dashboard and CRM. Lead capture, assignment, status transitions
(`NEW → CONTACTED → QUALIFIED → DISQUALIFIED/CONVERTED`), and the existing
`Lead.score` field (AI scoring itself is Phase 4 — the field and UI exist
now, the actual scoring logic comes later).
