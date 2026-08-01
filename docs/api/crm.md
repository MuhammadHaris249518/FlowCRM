# CRM API — Companies & Contacts

All routes require `Authorization: Bearer <clerk_session_token>` and
`X-Organization-Id: <organization_id>`, and are scoped to the caller's active
organization via `requireAuth()`.

**Role scoping differs between the two resources:**
- **Companies** are visible org-wide to every role (Sales Rep, Sales Manager,
  Org Owner) — they aren't assigned to an individual.
- **Contacts** are rep-scoped: a `SALES_REP` only sees contacts where they are
  the `ownerId`. `SALES_MANAGER`, `ORG_OWNER`, and `SUPER_ADMIN` see every
  contact in the organization.

Base path: `/api/v1/crm`

---

## Companies

### GET /companies

Paginated, searchable list of companies in the caller's organization.

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| page | number | 1 | 1-indexed |
| pageSize | number | 20 | max 100 |
| search | string | — | case-insensitive match on `name` |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "name": "Acme Inc.",
        "domain": "acme.com",
        "industry": "Software Development",
        "website": "https://acme.com",
        "createdAt": "2026-07-10T09:00:00.000Z",
        "updatedAt": "2026-07-10T09:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### POST /companies

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | yes | 1–200 chars |
| domain | string | no | max 200 chars |
| industry | string | no | max 100 chars |
| website | string | no | must be a valid URL, max 300 chars |

**Response `201`**: single company object (same shape as list items above).

**Errors:** `409 CONFLICT` if a company with the same name already exists in
the organization (unique constraint).

### GET /companies/:id

Returns a single company **with its contacts** (`CompanyDetailDTO` — same
fields as the list shape, plus a `contacts` array of contact objects, see
below).

**Errors:** `404 NOT_FOUND` if the company doesn't exist or belongs to a
different organization.

### PATCH /companies/:id

Same body shape as `POST /companies`, all fields optional (partial update).

**Errors:** `404 NOT_FOUND`, `409 CONFLICT` (duplicate name).

### DELETE /companies/:id

**Response `204`**, empty body. Contacts linked to the deleted company keep
their row — `companyId` is set to `null` (`onDelete: SetNull` in the schema),
not cascaded.

**Errors:** `404 NOT_FOUND`.

---

## Contacts

### GET /contacts

Paginated, searchable, optionally company-filtered list. **Rep-scoped** — see
role-scoping note above.

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| page | number | 1 | 1-indexed |
| pageSize | number | 20 | max 100 |
| search | string | — | matches `fullName` or `email`, case-insensitive |
| companyId | string (cuid) | — | filter to one company |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "fullName": "Jane Doe",
        "email": "jane@acme.com",
        "phone": "+1 555 0100",
        "title": "VP Sales",
        "companyId": "clx...",
        "companyName": "Acme Inc.",
        "ownerId": "clx...",
        "ownerName": "Haris",
        "createdAt": "2026-07-10T09:00:00.000Z",
        "updatedAt": "2026-07-10T09:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### POST /contacts

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| fullName | string | yes | 1–200 chars |
| email | string | no | must be a valid email |
| phone | string | no | max 30 chars |
| title | string | no | max 150 chars |
| companyId | string (cuid) | no | must belong to the caller's org |
| ownerId | string (cuid) | no | see auto-assignment note below |

**Auto-assignment:** if the caller is a `SALES_REP` and `ownerId` is omitted,
the contact is automatically owned by the caller. Managers/Owners can assign
to any teammate by passing `ownerId` explicitly.

**Response `201`**: single contact object (same shape as list items above).

**Errors:**
- `400 BAD_REQUEST` (`companyId does not exist in your organization`) if
  `companyId` is set but doesn't resolve to a company in the caller's org
  (cross-tenant reference is rejected here, not just filtered).
- `409 CONFLICT` if a contact with the same email already exists in the
  organization (`@@unique([organizationId, email])` — contacts without an
  email are exempt from this check).

### GET /contacts/:id

**Errors:** `404 NOT_FOUND` (also returned if the contact exists but belongs
to a different rep and the caller is a `SALES_REP` — indistinguishable from
"doesn't exist" by design, so as not to leak existence of other reps' data).

### PATCH /contacts/:id

Same body shape as `POST /contacts`, all fields optional. If `companyId` is
included, it's re-validated against the caller's org the same way as create.

**Errors:** `404 NOT_FOUND`, `400 BAD_REQUEST` (invalid `companyId`),
`409 CONFLICT` (duplicate email).

### DELETE /contacts/:id

**Response `204`**, empty body.

**Errors:** `404 NOT_FOUND`.

---

## Error envelope (all endpoints)

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Company not found" } }
```

Validation errors (missing/malformed fields) return `400` with
`code: "VALIDATION_ERROR"` and a `fields` array — see Task 2 of the
`IMPLEMENTATION_PLAN_close_phase1b.md` plan for the exact shape.
