import { Router } from "express";
import multer from "multer";
import { communicationService } from "../communication.service";

// SendGrid Inbound Parse posts multipart/form-data, not JSON.
const upload = multer();
export const sendgridWebhookRouter = Router();

sendgridWebhookRouter.post("/", upload.none(), async (req, res) => {
  // NOTE: no signature verification in this pass — SendGrid Inbound Parse
  // doesn't sign requests the way the Event Webhook does. Restricting this
  // endpoint by IP allowlist or a shared secret query param is real
  // follow-up work before this handles production traffic; flagged here
  // rather than silently shipped as if it were already hardened.
  const { from, to, subject, text, envelope } = req.body;

  let fromAddress = from;
  let toAddress = to;
  try {
    const parsedEnvelope = JSON.parse(envelope);
    fromAddress = parsedEnvelope.from ?? from;
    toAddress = parsedEnvelope.to?.[0] ?? to;
  } catch {
    // envelope not present/parseable — fall back to the raw from/to fields
  }

  // No organizationId in this payload — Phase 1 is single-inbox; once
  // there's a real per-tenant receiving address scheme, resolve org here
  // instead of this placeholder.
  const organizationId = process.env.DEFAULT_ORG_ID_FOR_INBOUND_EMAIL ?? "";
  if (!organizationId) {
    res.status(200).send("no org configured, dropped");
    return;
  }

  await communicationService.recordInbound({
    organizationId,
    fromAddress,
    toAddress,
    subject: subject ?? null,
    body: text ?? "",
    externalId: null,
  });

  res.status(200).send("ok");
});
