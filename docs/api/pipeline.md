# Pipeline API

All routes require `Authorization: Bearer <clerk_session_token>` and
`X-Organization-Id: <organization_id>`, and are scoped to the caller's active
organization via `requireAuth()`.

**Role scoping:** rep-scoped, same as Leads and Tasks — a `SALES_REP` only
sees deals where they are the `assigneeId`. `SALES_MANAGER`, `ORG_OWNER`, and
`SUPER_ADMIN` see every deal in the organization.

Base path: `/api/v1/pipeline`

## GET /board

Returns every deal in the caller's scope, grouped by stage, with per-stage
deal count and total value. Powers the Kanban board.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "stage": "NEW",
        "dealCount": 2,
        "totalValue": 12500,
        "deals": [
          {
            "id": "clx...",
            "title": "Acme Corp — Deal",
            "value": 8000,
            "stage": "NEW",
            "companyId": "clx...",
            "companyName": "Acme Corp",
            "contactId": "clx...",
            "contactName": "Jane Doe",
            "assigneeId": "clx...",
            "assigneeName": "Haris",
            "closedAt": null,
            "createdAt": "2026-07-12T09:00:00.000Z",
            "updatedAt": "2026-07-12T09:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

## GET /deals

Paginated, searchable, filterable list — same deal shape as above, flat
(not grouped by stage). Use this for a table view; use `/board` for the
Kanban view.

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| page | number | 1 | 1-indexed |
| pageSize | number | 20 | max 100 |
| search | string | — | matches deal title |
| stage | enum | — | `NEW`, `CONTACTED`, `QUALIFIED`, `MEETING`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST` |
| assigneeId | string (cuid) | — | filter to one assignee |
| companyId | string (cuid) | — | filter to one company |
| contactId | string (cuid) | — | filter to one contact |

## POST /deals

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| title | string | Yes | 1–200 chars |
| value | number | Yes | 0–999,999,999,999.99 |
| stage | enum | No | defaults to `NEW` |
| companyId | string (cuid) | No | must belong to caller's org |
| contactId | string (cuid) | No | must belong to caller's org |
| assigneeId | string (cuid) | No | |

**Response `201`**: single deal object (same shape as board/list items above).

**Errors:** `400 BAD_REQUEST` if `companyId`/`contactId` doesn't resolve to a
record in the caller's org.

## GET /deals/:id

**Errors:** `404 NOT_FOUND` (also returned if the deal exists but is assigned
to a different rep and the caller is a `SALES_REP`).

## PATCH /deals/:id

Updates `title`, `value`, `companyId`, `contactId`, `assigneeId`.
**`stage` is intentionally not accepted here** — stage moves must go through
`PATCH /deals/:id/stage` so `closedAt` and Activity logging can't be
bypassed.

**Errors:** `404 NOT_FOUND`.

## PATCH /deals/:id/stage

Moves a deal to a new stage. Setting `stage` to `WON` or `LOST` sets
`closedAt` to now; moving out of `WON`/`LOST` back into an open stage clears
`closedAt`. Every move logs a `DEAL_STAGE_CHANGED` Activity.

**Request body**

| Field | Type | Required |
|---|---|---|
| stage | enum | Yes |

**Response `200`**: updated deal object.

**Errors:** `404 NOT_FOUND` (a `SALES_REP` moving a deal they can't see gets
404, not 403 — scoping happens at lookup, same as Leads/Tasks).

## DELETE /deals/:id

**Response `204`**, empty body.

**Errors:** `404 NOT_FOUND`.

## Error envelope (all endpoints)

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Deal not found" } }
```
