# AI Service API

`apps/ai-service` is an internal-only FastAPI service. It is never exposed
publicly and has no user-facing auth (no Clerk integration) — the Node API
(`apps/api`) is its only caller, authenticating with a shared secret. This
keeps the AI layer stateless and simple: it never touches Prisma or the
database directly, and has no concept of `AuthContext`, organizations, or
RBAC roles. All multi-tenant scoping happens on the Node side, before and
after the AI service is called.

Base URL (local dev): `http://localhost:8000` (configurable via
`AI_SERVICE_URL` on the Node side, `PORT` on the ai-service side).

## Authentication

Every route except `/health` requires the header:

```
X-Internal-Service-Key: <shared secret, set via INTERNAL_SERVICE_KEY env var>
```

Requests with a missing or incorrect key receive `401 Unauthorized`
(`{"detail": "Invalid internal service key"}`). This is enforced by the
`verify_internal_key` FastAPI dependency in `app/core/security.py`.

**Why a shared secret instead of a second Clerk integration:** the AI
service only ever receives derived signals from Node (never a user's
session token), so it doesn't need to know who the end user is — only that
the caller is genuinely the FlowCRM Node API and not an arbitrary client.

## GET /health

No auth required. Basic liveness check.

**Response `200`**
```json
{ "status": "ok" }
```

## POST /score-lead

Scores a lead's likelihood to convert, called by
`POST /api/v1/leads/:id/score` on the Node side (see `docs/api/leads.md`).

**Privacy note:** the request body never includes the lead's actual name,
email, or phone number — only booleans indicating whether each field is
present (`hasFullName`, `hasEmail`, `hasPhone`). Raw PII never leaves
`apps/api`.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| source | string \| null | no | e.g. `"Referral"`, `"Website Form"` |
| notes | string \| null | no | free-text lead notes, read for buying signals |
| status | string | yes | current `LeadStatus` |
| daysSinceCreated | number | yes | staleness signal |
| contact | object \| null | no | see below |
| contact.hasFullName | boolean | yes (if contact present) | |
| contact.hasEmail | boolean | yes (if contact present) | |
| contact.hasPhone | boolean | yes (if contact present) | |
| contact.companyName | string \| null | no | |
| contact.companyDomain | string \| null | no | |

**Example request**
```json
{
  "source": "Referral",
  "notes": "Wants 5 laptops for office, budget ~500k, needs by end of month",
  "status": "NEW",
  "daysSinceCreated": 0,
  "contact": {
    "hasFullName": true,
    "hasEmail": true,
    "hasPhone": true,
    "companyName": "TechHub Electronics",
    "companyDomain": "techhub.com"
  }
}
```

**Response `200`**

| Field | Type | Notes |
|---|---|---|
| score | number | 0–100, clamped server-side even if the model returns out of range |
| reasoning | string | one sentence, truncated to 300 chars |

```json
{ "score": 85, "reasoning": "Clear bulk order with budget and timeline, referral source, complete contact info." }
```

**Errors**
- `401` — missing/invalid `X-Internal-Service-Key`
- `422` — request body fails validation (missing required field, wrong type)
- `500` — Groq call failed or returned unparseable output

**Model:** `llama-3.3-70b-versatile` via Groq, `temperature: 0.2`,
JSON-mode response format. Configurable via `GROQ_MODEL` env var.

## POST /email/draft

Runs a LangGraph Draft → Evaluate loop (max 2 revisions) to produce a
personalized outreach email. Returns immediately with a job ID — the
actual drafting happens in a background asyncio task on this same
process. Node polls `GET /email/draft/{jobId}` for the result.

**This endpoint never sends anything.** The output is always meant to
become a draft Task for a human sales rep to review — see
`docs/architecture/workflow-automation-architecture-walkthrough.md` for
how Node's workflow engine will eventually wire this into the WAITING
state (not yet implemented on the Node side as of this writing).

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| instructions | string | yes | 1–2000 chars, from the ACTION_AI node's config |
| context | object | no | see below, all fields optional |
| context.contactName | string \| null | no | |
| context.companyName | string \| null | no | |
| context.leadStatus | string \| null | no | |
| context.leadSource | string \| null | no | |
| context.dealStage | string \| null | no | |
| context.dealTitle | string \| null | no | |
| context.notes | string \| null | no | |

**Response `202`**
```json
{ "jobId": "a1b2c3d4-...", "status": "pending" }
```

## GET /email/draft/{jobId}

Poll this until `status` is `completed` or `failed`.

**Response `200`** (while running)
```json
{ "jobId": "a1b2c3d4-...", "status": "running", "result": null, "error": null }
```

**Response `200`** (completed)
```json
{
  "jobId": "a1b2c3d4-...",
  "status": "completed",
  "result": {
    "subject": "Following up on your pricing question",
    "body": "Hi Sarah, wanted to circle back on...",
    "revisionCount": 2,
    "finalFeedback": "Approved — addresses the pricing question directly, professional tone."
  },
  "error": null
}
```

**Errors**
- `401` — missing/invalid `X-Internal-Service-Key`
- `404` — unknown `jobId`
- `422` — request body fails validation

**Known limitation:** job state is stored in-memory, per-process. It does
not survive a restart and will not work correctly across multiple
uvicorn workers. See `app/services/job_store.py` for the documented
tradeoff.


## Environment variables

| Var | Purpose |
|---|---|
| GROQ_API_KEY | Groq API credential |
| GROQ_MODEL | defaults to `llama-3.3-70b-versatile` |
| INTERNAL_SERVICE_KEY | shared secret, must match Node's copy |
| PORT | defaults to `8000` |
