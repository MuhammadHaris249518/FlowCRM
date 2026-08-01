# apps/api tests

## Running

```bash
cd apps/api
npm install
npm run prisma:generate
npm test          # runs once
npm run test:watch
```

Requires a real `.env` (copy from `.env.example`) with a working
`DATABASE_URL` — tests run against your actual dev Postgres (Supabase), not a
separate test database. See "Isolation" below for why that's safe.

## What's covered so far

- `tests/integration/auth.middleware.test.ts` — every rejection path in
  `requireAuth()`: no session, missing org header, unknown Clerk user, no
  membership in the org, and the happy path.
- `tests/integration/leads.rbac.test.ts` — `SALES_REP` only sees/edits leads
  assigned to them; managers see everything; reps can't reassign leads to
  other users.
- `tests/integration/leads.convert.test.ts` — the lead→deal conversion
  transaction: lead flips to `CONVERTED`, deal is created correctly, an
  `Activity` row is logged.
- `tests/integration/pipeline.rbac.test.ts` — same RBAC pattern for deals,
  plus the `closedAt` derivation logic (set on `WON`/`LOST`, cleared when
  moved back out) and activity logging on stage change.

## Not covered yet (next batch)

- CRM (Contacts/Companies) RBAC — same pattern as Leads.
- Dashboard aggregate queries.
- Zod validation edge cases.
- Frontend tests (Vitest + RTL) — not started.

## How auth is faked

`requireAuth()` calls Clerk's `getAuth(req)` to get a `clerkId`, then looks up
a real `User`/`Membership` row in Postgres from there. Tests mock only
`getAuth()` — everything downstream (DB lookups, RBAC scoping, business
logic) runs for real against real Postgres.

## Isolation

Every test file creates its own `Organization` (slug prefixed `test-<random>`)
plus its own `User`/`Membership` rows, and deletes them in `afterAll`.
Deleting the Organization cascades to everything under it. If a run crashes
mid-way, leftover rows are identifiable and safe to remove manually:

```sql
delete from "Organization" where slug like 'test-%';
delete from "User" where email like '%@flowcrm-tests.local';
```
