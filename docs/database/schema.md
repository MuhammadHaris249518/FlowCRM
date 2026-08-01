# Database schema — core entities

Multi-tenant model: every business table carries `organizationId`. There is no
shared-nothing database-per-tenant split for the MVP — row-level scoping is
enforced in the repository layer (see `dashboardRepository.scopeFilter`).
This is the right tradeoff for MVP velocity; if a large enterprise customer
later demands isolation, `organizationId`-sharded databases can be introduced
without changing the application-layer query shape.

## Entities

- **Organization** — the tenant boundary. `slug` is unique and indexed (used for subdomain routing).
- **User** — one row per human, keyed by `clerkId` (Clerk owns auth identity). A user can hold **Memberships** in multiple orgs.
- **Membership** — join table between User and Organization carrying `role` (`SUPER_ADMIN` | `ORG_OWNER` | `SALES_MANAGER` | `SALES_REP`). `@@unique([userId, organizationId])` prevents duplicate memberships.
- **Contact / Company** — CRM records. A Contact optionally belongs to a Company (`onDelete: SetNull` — deleting a company shouldn't delete its contacts, just orphan the reference).
- **Lead** — pre-deal record with `status` and AI `score`. Indexed on `[organizationId, status]` (list views filter by status constantly) and `[organizationId, createdAt]` (dashboard "new leads this period" queries).
- **Deal** — the pipeline record. `value` is `Decimal(12,2)` — never use `Float` for money (rounding errors compound). Indexed on `[organizationId, stage]` (Kanban board queries) and `[organizationId, closedAt]` (revenue-by-period aggregation — this is the index the Dashboard's revenue query relies on).
- **Task / Activity** — supporting records for the dashboard's task counts and activity feed.

## Cascade rules

- `Organization` deleted → cascades to everything (an org going away should remove its data; `onDelete: Cascade` throughout).
- `Company`/`Contact`/`User` deleted → related Leads/Deals get `SetNull` on the foreign key rather than cascading deletes. Losing the salesperson who resigned shouldn't delete the deal they were working — it should just become unassigned.

## AI Workspace fields

`Lead.score` (0–100, default `0`) is written either manually or by the AI
service (see `docs/api/ai-service.md`). When the AI service sets it, an
`AI_LEAD_SCORED` row is written to `ActivityType` in the same transaction —
the AI service itself never touches this table or any other; only the Node
API (`apps/api`) writes to the database. `ActivityType` is otherwise
unchanged from the original CRM design (`LEAD_CREATED`, `EMAIL_SENT`,
`CALL_LOGGED`, `MEETING_SCHEDULED`, `DEAL_STAGE_CHANGED`, `NOTE_ADDED`,
`TASK_COMPLETED`, plus `AI_LEAD_SCORED`).

Phase 3 (Workflow Automation) will add `Workflow`, `WorkflowNode`,
`WorkflowEdge`, `WorkflowRun`, `WorkflowRunLog`, and an outbox table for
event-driven triggers — none of these exist yet. See
`docs/architecture/workflow-automation.md` for the design and
`docs/EXECUTION_PLAN.md` §2 Phase 3 for current status.

## Why no `DashboardSnapshot` cache table yet

At MVP scale (single-digit thousands of deals/leads per org), the aggregate
queries in `dashboard.repository.ts` run in well under 50ms with the indexes
above. A materialized snapshot/cache table is the correct next step once an
org's deal count reaches ~100k+ rows or dashboard read volume creates DB load
— but building it now would be premature optimization. Documented here so
future-us knows this was a conscious deferral, not an oversight.
