# FlowCRM AI — Execution Plan

**This is the single, only status document for this project.** Do not
create a second one (`v1.md`, `STATUS.md`, `PROGRESS.md`, or similar) —
that's exactly how this document went stale for as long as it did last
time. If a status write-up is needed for an external audience, generate
it from this file at the time it's needed rather than maintaining a
parallel copy.

**Status as of:** current session — re-verified against a fresh pull of
`master`, not agent self-report.
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
| Dashboard | ✅ | ✅ | ✅ | ✅ | Includes AI Insights panel wired to real lead/deal/task counts (no LLM call — pure data aggregation) |
| CRM (Companies & Contacts) | ✅ | ✅ | ✅ | ✅ | RBAC-tested |
| Leads | ✅ | ✅ | ✅ | ✅ | Full CRUD + `/convert` (transactional) + `/:id/score` (AI scoring, reasoning surfaced in UI) + `LEAD_SCORE_CHANGED` outbox event |
| Sales Pipeline | ✅ | ✅ | ✅ | ✅ | Kanban board, stage transitions w/ `closedAt` + Activity logging |
| Tasks / Calendar | ✅ | ✅ | ✅ | ✅ | Full CRUD + complete/reopen, month-view calendar |
| AI Workspace / `apps/ai-service` | ✅ | ✅ | ✅ | ✅ | **Fully done.** FastAPI service (`/score-lead`, `/email/draft`), Score-with-AI button with loading/reasoning-tooltip/error states, LangGraph Evaluator-Optimizer email loop |
| Workflow Automation | ✅ | ✅ | ✅ | ✅ | Outbox + AI + resume pollers, `TRIGGER`/`CONDITION`/`DELAY`/`ACTION_STATIC`/`ACTION_AI` node types, React Flow visual builder |
| **Communication Hub** | ✅ | ✅ | ❌ | ✅ | **Email-only by product decision.** SendGrid send/receive, conversation thread UI (`ConversationThreadBox`, per-Lead messages page), Send button auto-completes linked AI-draft Tasks. SMS (Twilio) was implemented in Phase 2, then fully removed — see below. WhatsApp was never built and is not planned. **Zero automated test coverage — manual verification only, a real gap.** |
| Reports | ✅ | ✅ | ✅ | — | Funnel, win/loss, CSV export — `reports.funnel.test.ts`, `reports.win-loss.test.ts`, `reports.export.test.ts`, `reports.csv.test.ts`, `reports.trends.test.ts` |
| Documents | ❌ | ❌ | — | — | Not modeled |
| Integrations | ❌ | ❌ | — | — | Not started (Stripe billing, external calendar sync) |
| CI/CD, Docker, Deployment | 🟡 | — | — | — | Local `docker-compose.yml` + Dockerfiles live; GitHub Actions still just `.gitkeep` |

**Overall completion: ~85% of full SRS scope.** Every core CRM module,
AI Workspace, Workflow Automation, and Communication Hub (email-only, by
product decision) are done. Remaining: Documents, Integrations/billing,
CI/CD.

Legend: ✅ done and verified against live repo · 🟡 exists but incomplete/unverified · ❌ not started

---

## 1. Guiding Principles (recap — do not deviate)

- **Architecture before code**, every module: business requirement → affected
  modules → DB design → API design → backend → frontend → validation → error
  handling → tests → docs.
- **Layering is fixed**: `routes → controller → service → repository → Prisma`.
- **RBAC scoping happens in the repository layer**, via `AuthContext`
  (`userId`, `organizationId`, `role`).
- **Side-effecting state changes get dedicated action endpoints**, not
  generic PATCH — `PATCH /:id/stage`, `PATCH /:id/complete`,
  `POST /:id/score`, `POST /communication/messages/:id/send`.
- **The AI service never touches Prisma or the DB directly** — Node is the
  only caller, `X-Internal-Service-Key` shared secret.
- **Workflow state & the outbox stay in Node + Postgres.** `apps/ai-service`
  is called statelessly for AI reasoning steps only.
- **Lead scoring sends boolean signals, not raw PII.**
- **AI-drafted content is always human-approved, never auto-sent.** Applies
  to the email loop — the only channel this project supports.
- **`ACTION_AI` nodes are asynchronous** via the same `WAITING`/resume
  mechanism as `DELAY` nodes.
- **No module is "done" without**: migration run against a real DB, at
  least one integration test hitting the actual endpoint, and
  `docs/api/<module>.md` written. **Communication Hub is the one
  exception on file right now** — it's functionally complete but has no
  automated tests yet; tracked as real debt, not silently ignored.
- **No dead UI affordances.**
- **Never trust an agent's self-reported completion** — every status here
  is verified by re-pulling the `master` tarball and reading the actual
  files.

---

## 2. Phase-by-Phase Plan

### ✅ Phase 1A — Authentication — DONE
### ✅ Phase 1B — CRM (Contacts & Companies) — DONE
### ✅ Phase 1C — Lead Management — DONE
### ✅ Phase 1D — Sales Pipeline — DONE
### ✅ Phase 2 — Tasks & Calendar — DONE
### ✅ Phase 4 — AI Workspace / Lead Scoring — DONE

Backend and frontend both verified: FastAPI service, `/:id/score` wired
end-to-end, Score-with-AI button with reasoning tooltip and error states,
`docs/api/ai-service.md` and `docs/api/leads.md` both accurate.

### ✅ Phase 3 — Workflow Automation Engine & UI — DONE

Outbox poller, AI poller, resume poller; `TRIGGER`/`CONDITION`/`DELAY`/
`ACTION_STATIC`/`ACTION_AI` node types; React Flow visual builder
(`WorkflowCanvas.tsx`, `NodeConfigPanel.tsx`, `NodePalette.tsx`,
`WorkflowToolbar.tsx`). `ACTION_AI` dispatches to `apps/ai-service`
asynchronously (`WAITING` state, same mechanism as `DELAY`), creates a
draft Task on completion — never auto-sends. Full design in
`docs/architecture/workflow-automation.md`.

### ✅ Phase 6 — Communication Hub (Email-Only) — DONE, TESTS PENDING

**Email — done:** `Message` model, SendGrid client, `POST
/communication/messages/:id/send`, SendGrid Inbound Parse webhook,
conversation thread UI (`ConversationThreadBox`, `MessageBubble`,
`LeadMessagesDialog`, `/leads/[id]/messages` page). The `ACTION_AI` email
loop creates a real linked `DRAFT` `Message` alongside its review Task —
sending it completes the Task automatically.

**SMS — implemented, then removed.** `MessageChannel.SMS`, the Twilio
client, and the Twilio inbound webhook were built and manually verified,
then fully removed by product decision (this is a professional platform;
email-only was judged the right scope). If SMS is ever revisited, this
history and the original agent plans are the reference point — don't
rebuild from scratch without checking what changed since.

**Known gaps, not hidden:**
- **No automated tests for this module at all** — every verification so
  far has been manual (`curl` + checking a real inbox). This is the top
  testing priority right now.
- No webhook signature verification on the SendGrid webhook — flagged in
  the webhook file's comments and in `docs/api/communication.md`.
- Single hardcoded `DEFAULT_ORG_ID_FOR_INBOUND_EMAIL` — no real
  per-tenant inbound routing yet.

**Not planned:** SMS, WhatsApp.

### ❌ Phase 5 — Documents & Integrations — NOT STARTED
Document storage/attachments (not modeled at all), Stripe billing,
external calendar sync (Google/Outlook).

---

## 3. Cross-Cutting Workstreams

| Workstream | Current state | Action |
|---|---|---|
| **Testing** | 18 test files: Auth, CRM, Dashboard, Leads, Pipeline, Tasks, Reports, Automation (engine/ai-poller/rbac/lead-score-trigger) | **Communication Hub has zero coverage — add integration tests for `sendDraft` (both channels) and the two inbound webhooks before anything else** |
| **CI/CD** | `.github/workflows/.gitkeep` — still nothing | GitHub Actions: lint + typecheck + test on PR |
| **Docker** | ✅ Done — `docker-compose.yml`, all 4 services | Production container hardening |
| **Deployment** | Local Docker Compose only | Vercel (web) + Railway (api + Postgres + ai-service) |
| **Security hardening** | Helmet + rate-limit; shared-secret AI auth | Webhook signature verification (SendGrid), CSRF for Clerk sessions |
| **Python build hygiene** | ✅ Done, re-verified clean on every audit | — |

---

## 4. Definition of Done (applies to every module, no exceptions)

1. Prisma migration run against a real Postgres instance.
2. At least one integration test hits the real endpoint and passes.
3. Frontend loading/error/empty states implemented.
4. `docs/api/<module>.md` written.
5. No button, link, or form points to a route that 404s.

**Communication Hub does not yet meet criterion 2** — tracked explicitly
above, not swept under "done."

---

## 5. Immediate Next Action

1. **Communication Hub test coverage** — the single highest-priority gap
   right now. Integration tests for `POST /messages/:id/send` and the
   SendGrid inbound webhook.
2. **CI/CD** — GitHub Actions running lint + typecheck + the full test
   suite on every PR. Increasingly overdue given the codebase's size.
3. **Webhook signature verification** — SendGrid, currently unverified
   by design-with-a-flag, not by oversight — but real work before it
   handles production traffic.
4. Only after 1–3: WhatsApp (Communication Hub Phase 3), Documents,
   Integrations/billing.

No module should be started until this section is updated to name it
explicitly.
