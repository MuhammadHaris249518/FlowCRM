# Tasks API

All routes require `Authorization: Bearer <clerk_session_token>` and
`X-Organization-Id: <org_id>`. Sales Reps see only tasks assigned to them;
Sales Managers, Org Owners, and Super Admins see the whole organization.

Base path: `/api/v1/tasks`

## GET /

Paginated list, filterable.

**Query params:** `page`, `pageSize`, `search`, `assigneeId`, `priority` (`LOW`|`MEDIUM`|`HIGH`), `contactId`, `dealId`, `leadId`, `completed` (`true`|`false`)

## GET /calendar

Unpaginated list of tasks with `dueAt` inside `[from, to]`. Used by the calendar month view.

**Query params (required):** `from`, `to` (ISO dates). Optional: `assigneeId`.

## GET /:id · POST / · PATCH /:id · DELETE /:id

Standard CRUD. `POST` body:

```json
{ "title": "Follow up with Jane", "priority": "HIGH", "dueAt": "2026-07-20T14:00:00Z", "contactId": "clx..." }
```

## PATCH /:id/complete

Sets `completedAt` to now and logs a `TASK_COMPLETED` Activity. Cannot be done via the generic `PATCH /:id`.

## PATCH /:id/reopen

Clears `completedAt`.

## Error envelope

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Task not found" } }
```
