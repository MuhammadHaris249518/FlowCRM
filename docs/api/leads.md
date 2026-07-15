# Leads API

All routes require `Authorization: Bearer <clerk_session_token>` and
`X-Organization-Id: <organization_id>`, and are scoped to the caller's active
organization via `requireAuth()`.

**Role scoping:** rep-scoped, same as CRM Contacts — a `SALES_REP` only sees
leads where they are the `assigneeId`. `SALES_MANAGER`, `ORG_OWNER`, and
`SUPER_ADMIN` see every lead in the organization.

Base path: `/api/v1/leads`

## GET /

Paginated, searchable, filterable list.

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| page | number | 1 | 1-indexed |
| pageSize | number | 20 | max 100 |
| search | string | — | matches the linked contact's `fullName` or `email` |
| status | enum | — | `NEW`, `CONTACTED`, `QUALIFIED`, `DISQUALIFIED`, `CONVERTED` |
| assigneeId | string (cuid) | — | filter to one assignee |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "status": "NEW",
        "source": "Website Form",
        "score": 0,
        "contactId": "clx...",
        "contactName": "Jane Doe",
        "contactEmail": "jane@acme.com",
        "assigneeId": "clx...",
        "assigneeName": "Haris",
        "createdAt": "2026-07-12T09:00:00.000Z",
        "updatedAt": "2026-07-12T09:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## POST /

**Request body** — provide **either** `contactId` (an existing contact) **or**
`contactFullName` (creates a new contact alongside the lead, in the same
transaction).

| Field | Type | Required | Notes |
|---|---|---|---|
| contactId | string (cuid) | conditional | must belong to the caller's org |
| contactFullName | string | conditional | 1–200 chars; required if `contactId` omitted |
| contactEmail | string | no | only used when creating a new contact |
| contactPhone | string | no | only used when creating a new contact |
| source | string | no | max 100 chars, e.g. `"Website Form"`, `"Referral"` |
| status | enum | no | defaults to `NEW` |
| score | number | no | 0–100, defaults to `0` |
| assigneeId | string (cuid) | no | `SALES_REP` callers are auto-assigned as owner if omitted |

**Response `201`**: single lead object (same shape as list items above).

**Errors:** `400 BAD_REQUEST` if neither `contactId` nor `contactFullName` is
provided, or if `contactId` doesn't resolve to a contact in the caller's org.

## GET /:id

**Errors:** `404 NOT_FOUND` (also returned if the lead exists but is assigned
to a different rep and the caller is a `SALES_REP`).

## PATCH /:id

Updates the lead's own fields only — `status`, `source`, `score`,
`assigneeId`. To change the linked contact's name/email/phone, use the CRM
contact endpoints instead.

**Errors:** `404 NOT_FOUND`; `403 FORBIDDEN` if a `SALES_REP` attempts to set
`assigneeId` to someone other than themselves.

## DELETE /:id

**Response `204`**, empty body.

**Errors:** `404 NOT_FOUND`.

## POST /:id/convert

Marks the lead `CONVERTED` and creates a linked `Deal` in stage `NEW`, in a
single transaction. The deal carries over the lead's contact, the contact's
company (if any), and the lead's assignee.

**Request body**

| Field     | Type   | Required | Notes                                              |
| --------- | ------ | -------- | --------------------------------------------------- |
| dealValue | number | Yes      | Deal value has no source on the Lead — must be supplied at conversion time. |
| dealTitle | string | No       | Defaults to `"{Contact Name} — Deal"`.               |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "lead": { "...": "updated lead, status CONVERTED" },
    "deal": { "id": "clx...", "title": "Jane Doe — Deal", "value": 4200, "stage": "NEW" }
  }
}
```

**Errors:** `404 NOT_FOUND`, `400 BAD_REQUEST` (missing/invalid `dealValue`).

## Error envelope (all endpoints)

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Lead not found" } }
```
