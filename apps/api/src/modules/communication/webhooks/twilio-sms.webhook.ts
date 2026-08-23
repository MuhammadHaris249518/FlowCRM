import { Router } from "express";
import multer from "multer";
import { communicationService } from "../communication.service";

// Twilio's inbound SMS webhook posts application/x-www-form-urlencoded,
// not JSON or multipart — multer's .none() still parses urlencoded bodies
// fine here since it's mounted the same way as the SendGrid webhook.
const upload = multer();
export const twilioSmsWebhookRouter = Router();

twilioSmsWebhookRouter.post("/", upload.none(), async (req, res) => {
  // NOTE: same limitation as the SendGrid webhook — no signature
  // verification yet. Twilio signs requests via the X-Twilio-Signature
  // header (HMAC-SHA1 against your auth token + full URL + params); that
  // verification is real follow-up work, not done in this pass.
  const from = req.body.From as string | undefined;
  const to = req.body.To as string | undefined;
  const body = (req.body.Body as string | undefined) ?? "";
  const messageSid = req.body.MessageSid as string | undefined;

  if (!from || !to) {
    res.status(200).send("<Response></Response>"); // Twilio expects TwiML back, even on drop
    return;
  }

  // Same single-org placeholder as the SendGrid webhook — real per-tenant
  // routing (e.g. by which Twilio number received the text) is follow-up
  // work, not solved here.
  const organizationId = process.env.DEFAULT_ORG_ID_FOR_INBOUND_SMS ?? "";
  if (!organizationId) {
    res.status(200).send("<Response></Response>");
    return;
  }

  await communicationService.recordInboundSms({
    organizationId,
    fromPhone: from,
    toPhone: to,
    body,
    externalId: messageSid ?? null,
  });

  // Twilio expects TwiML (XML) as the response, even an empty one — an
  // empty <Response/> means "don't auto-reply."
  res.set("Content-Type", "text/xml");
  res.status(200).send("<Response></Response>");
});
