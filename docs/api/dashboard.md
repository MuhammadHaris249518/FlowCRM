# Dashboard API

All routes require `Authorization: Bearer <clerk_session_token>` and are scoped
to the caller's active organization. Sales Reps see only their own assigned
leads/deals; Sales Managers and Org Owners see the whole organization.

Base path: `/api/v1/dashboard`

## GET /summary

Returns headline stats with period-over-period deltas.

**Query params**

| Param | Type                                     | Default      |
| ----- | ----------------------------------------- | ------------ |
| range | `this_week` \| `this_month` \| `this_quarter` | `this_month` |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "range": "this_month",
    "stats": {
      "revenue": { "label": "Total Revenue", "value": 128430, "format": "currency", "deltaPercent": 8.2 },
      "newLeads": { "label": "New Leads", "value": 1642, "format": "number", "deltaPercent": 6.5 },
      "dealsWon": { "label": "Deals Won", "value": 326, "format": "number", "deltaPercent": 1.7 },
      "conversionRate": { "label": "Conversion Rate", "value": 19.8, "format": "percent", "deltaPercent": 2.3 }
    }
  }
}
```

**Errors:** `401 UNAUTHORIZED` if no valid session.

## GET /pipeline-overview

Returns deal count and total value grouped by pipeline stage.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "stages": [
      { "stage": "NEW", "dealCount": 3, "totalValue": 32440 },
      { "stage": "WON", "dealCount": 2, "totalValue": 30780 }
    ]
  }
}
```

## GET /recent-activities

**Query params**

| Param | Type   | Default | Max |
| ----- | ------ | ------- | --- |
| limit | number | 10      | 50  |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "type": "DEAL_STAGE_CHANGED",
      "message": "Deal moved to Proposal stage",
      "actorName": "Haris",
      "createdAt": "2026-07-04T09:15:00.000Z"
    }
  ]
}
```

## Error envelope (all endpoints)

```json
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```
