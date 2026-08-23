# Communication API

**Phase 2 scope: email + SMS.** WhatsApp is planned but not implemented.

Base path: `/api/v1/communication`. All routes require
`Authorization: Bearer <clerk_session_token>`.

## GET /messages

Returns a conversation thread — every `Message` for a given Contact or
Lead, newest first.

**Query params:** `contactId` or `leadId` (one required), `limit` (default 20, max 100).

## POST /messages/:id/send

Sends an existing **draft** message via SendGrid. This is the only send
path in Phase 1 — there's no free-form "compose new email" endpoint yet.
The primary source of draft messages is the `ACTION_AI` workflow node
(see `docs/architecture/workflow-automation.md`) — when its email loop
finishes, it creates both a review Task and a linked `DRAFT` Message; this
endpoint is what the Task's (future) "Send" button calls.

**Errors:** `400 NOT_A_DRAFT` if the message was already sent,
`400 MISSING_RECIPIENT` if there's no `toAddress` on the message,
`400 SEND_FAILED` if SendGrid rejects the send (message is marked `FAILED`, not deleted).

## POST /webhooks/twilio-sms (Twilio → this app)

Not called by a FlowCRM client — Twilio calls this when an SMS is received
at your configured number. Records an inbound `Message` with `channel: SMS`,
best-effort-linked to a `Contact` by matching phone number.

**Known Phase 2 limitations, same shape as the SendGrid webhook:** no
`X-Twilio-Signature` verification yet, and `DEFAULT_ORG_ID_FOR_INBOUND_SMS`
is a single hardcoded org — real per-tenant routing (e.g. by which Twilio
number received the text) is follow-up work.

## POST /webhooks/sendgrid (SendGrid Inbound Parse → this app)

Not called by a FlowCRM client — SendGrid calls this when an email is
received at your configured inbound address. Records an inbound `Message`,
best-effort-linked to a `Contact` by matching the sender's email address.

**Known Phase 1 limitation:** no signature verification on this webhook
yet, and no per-tenant inbound routing (`DEFAULT_ORG_ID_FOR_INBOUND_EMAIL`
is a single hardcoded org for now). Both need real solutions before this
handles production traffic — flagged, not hidden.

