# Communication API

**Email-only by product decision.** SMS was implemented and then removed;
WhatsApp was never built (see `docs/EXECUTION_PLAN.md`).

Provider: **Resend** (switched from SendGrid — SendGrid required phone
verification that was a real onboarding blocker; Resend's inbound
webhooks are also properly signature-verified via Svix, closing a gap
the SendGrid integration had left open).

Base path: `/api/v1/communication`. All routes require
`Authorization: Bearer <clerk_session_token>`.

## GET /messages

Returns a conversation thread — every `Message` for a given Contact or
Lead, newest first.

**Query params:** `contactId` or `leadId` (one required), `limit` (default 20, max 100).

## POST /messages/:id/send

Sends an existing **draft** message via Resend. This is the only send
path — there's no free-form "compose new email" endpoint yet. The primary
source of draft messages is the `ACTION_AI` workflow node (see
`docs/architecture/workflow-automation.md`).

**Errors:** `400 NOT_A_DRAFT` if the message was already sent,
`400 MISSING_RECIPIENT` if there's no `toAddress` on the message,
`400 SEND_FAILED` if Resend rejects the send (message is marked `FAILED`, not deleted).

## POST /webhooks/resend (Resend → this app)

Not called by a FlowCRM client — Resend calls this on the `email.received`
event when an email arrives at your configured inbound address (either a
Resend-managed `<id>.resend.app` subdomain, or your own verified domain).
Records an inbound `Message`, best-effort-linked to a `Contact` by
matching the sender's email address.

**Signature verification is real here** (unlike the previous SendGrid
integration) — requests are Svix-signed and verified the same way the
Clerk webhook is (`RESEND_WEBHOOK_SECRET`, `svix-id`/`svix-timestamp`/
`svix-signature` headers). An unsigned or incorrectly-signed request is
rejected with `400 INVALID_SIGNATURE`.

**Still a known limitation:** no per-tenant inbound routing yet —
`DEFAULT_ORG_ID_FOR_INBOUND_EMAIL` is a single hardcoded org.
