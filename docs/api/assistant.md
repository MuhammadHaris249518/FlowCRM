# Assistant API

In-product CRM chat. The browser talks only to this Node API. Node is the
only caller of `apps/ai-service`. The Python service never touches Prisma.

Base path: `/api/v1/assistant`. All routes require
`Authorization: Bearer <clerk_session_token>` and
`X-Organization-Id: <organization_id>`.

**Role scoping:** the same repository filters as the rest of the product.
A `SALES_REP` only sees leads/deals/tasks assigned to them and contacts they
own. Managers and owners see the whole organization. Tool results never
cross `organizationId`.

## POST /chat

Runs one user turn. Node loops (max 6 rounds) with Groq tool-calling:

1. Node sends conversation + tool schemas to `POST /assistant/chat` on
   `apps/ai-service`.
2. If the model returns `tool_calls`, Node executes them against Postgres
   (RBAC applied) and sends the JSON results back.
3. When the model returns text, that is the reply.

**This endpoint never sends email.** `draft_email` creates a `DRAFT`
`Message` plus a review `Task`, same human-approval rule as workflow
`ACTION_AI`.

**PII note (intentional exception vs lead scoring):** scoring still sends
boolean contact signals only. The assistant must name people to answer
questions like “who are my best target leads?”, so tool results include
names and emails already in the caller's scope. Phone numbers are not
returned.

### Request

```json
{
  "messages": [
    { "role": "user", "content": "Who are my best target leads?" }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| messages | array | 1–20 items. Each `content` 1–8000 chars. Last message must be `user`. Client may include prior `assistant` turns for continuity. |

### Response `200`

```json
{
  "success": true,
  "data": {
    "reply": "Your highest-scoring open lead is Amina Khan (91)…",
    "actions": [
      {
        "type": "email_draft",
        "messageId": "clx...",
        "taskId": "clx...",
        "leadId": "clx...",
        "subject": "Following up on the 20-seat rollout"
      }
    ]
  }
}
```

`actions` is empty for read-only questions. `lead_scored` appears when the
model called `score_lead` (persists via `POST /leads/:id/score` internals).

### Errors

- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR` — empty messages, last turn not `user`
- `503 AI_SERVICE_UNAVAILABLE` — ai-service / Groq down
- `502 AI_EMPTY_REPLY` — model returned no text and no tools

## Tools Node will execute (not callable from the browser)

| Tool | What it reads / writes |
|---|---|
| `get_workspace_snapshot` | Dashboard summary, pipeline, AI insight counts |
| `search_leads` / `get_lead` | Leads; `sortBy=score` for best targets |
| `search_contacts` / `search_companies` | CRM directory |
| `search_deals` / `get_deal` | Pipeline; `stuckDays` for idle deals |
| `search_tasks` | Tasks; `overdue=true` for past due |
| `get_reports` | Funnel, win/loss, trends |
| `list_messages` | Email thread for a lead or contact |
| `list_workflows` | Automation names and active flag |
| `list_documents` | Document library / linked files |
| `score_lead` | Writes score via existing AI scoring path |
| `draft_email` | Groq draft loop → DRAFT message + review Task |

The model cannot change deal stages, delete records, send mail, or create
workflows through this API.

See `docs/api/ai-service.md` for the internal `/assistant/chat` contract.
