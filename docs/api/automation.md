# Workflow Automation API

All routes require `Authorization: Bearer <clerk_session_token>` and
`X-Organization-Id: <organization_id>`, and are scoped to the caller's active
organization via `requireAuth()`.

**Role scoping:** Organization-scoped — any authenticated member (`SALES_REP`,
`SALES_MANAGER`, `ORG_OWNER`, `SUPER_ADMIN`) in the organization can create, view,
update, and delete workflows belonging to their active organization. Workflows belonging
to other organizations return `404 NOT_FOUND`.

Base path: `/api/v1/automation`

## GET /

Paginated list of workflow definitions in the organization.

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| page | number | 1 | 1-indexed |
| pageSize | number | 20 | max 100 |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "name": "Lead Nurture Sequence",
        "isActive": true,
        "nodes": [
          {
            "id": "node_1",
            "workflowId": "clx...",
            "type": "TRIGGER",
            "config": { "trigger": "LEAD_CREATED" },
            "positionX": 0,
            "positionY": 0
          }
        ],
        "edges": [
          {
            "id": "edge_1",
            "workflowId": "clx...",
            "sourceNodeId": "node_1",
            "targetNodeId": "node_2",
            "label": null
          }
        ],
        "createdAt": "2026-07-28T00:00:00.000Z",
        "updatedAt": "2026-07-28T00:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## POST /

Creates a new workflow definition and its node/edge graph.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | Yes | 1–200 characters |
| isActive | boolean | No | defaults to `false` |
| nodes | array | Yes | minimum 1 node |
| edges | array | Yes | list of directed edges connecting temp node IDs |

**Node object schema**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | temp client-side ID used for edge references |
| type | enum | Yes | `TRIGGER`, `CONDITION`, `DELAY`, `ACTION_STATIC`, `ACTION_AI` |
| config | object | Yes | type-specific config |
| positionX | number | No | canvas X position (default 0) |
| positionY | number | No | canvas Y position (default 0) |

**Edge object schema**

| Field | Type | Required | Notes |
|---|---|---|---|
| sourceNodeId | string | Yes | temp ID of source node |
| targetNodeId | string | Yes | temp ID of target node |
| label | string | No | max 50 chars (e.g. `"true"`, `"false"`) |

**Response `201`**: full created workflow object including DB-persisted nodes and edges.

## GET /:id

Retrieves a single workflow definition by ID.

**Response `200`**: single workflow object.

**Errors:** `404 NOT_FOUND` if workflow does not exist or belongs to another org.

## PATCH /:id

Updates a workflow definition. If `nodes` and `edges` are provided, they replace the existing node-edge graph.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | No | 1–200 characters |
| isActive | boolean | No | boolean flag |
| nodes | array | No | full graph node replacement |
| edges | array | No | full graph edge replacement |

**Response `200`**: updated workflow object.

**Errors:** `404 NOT_FOUND`.

## DELETE /:id

Deletes a workflow definition and cascades deletion to nodes, edges, and runs.

**Response `204`**, empty body.

**Errors:** `404 NOT_FOUND`.

## Error envelope (all endpoints)

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Workflow not found" } }
```
