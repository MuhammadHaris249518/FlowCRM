import express, { Router } from "express";
import { Webhook } from "svix";
import { asyncHandler } from "../../../middleware/error-handler";
import { AppError } from "../../../errors/app-error";
import { communicationService } from "../communication.service";

export const resendWebhookRouter = Router();

interface ResendInboundEvent {
  type: string;
  data: {
    from?: string;
    to?: string[] | string;
    subject?: string;
    text?: string;
    html?: string;
  };
}

resendWebhookRouter.post(
  "/",
  // Needs the RAW body for svix signature verification — same requirement
  // and same reasoning as the Clerk webhook (see app.ts mount order).
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      throw AppError.badRequest("Webhook secret not configured", "WEBHOOK_MISCONFIGURED");
    }

    const svixId = req.header("svix-id");
    const svixTimestamp = req.header("svix-timestamp");
    const svixSignature = req.header("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw AppError.badRequest("Missing svix headers", "INVALID_WEBHOOK");
    }

    const webhook = new Webhook(secret);
    let event: ResendInboundEvent;
    try {
      event = webhook.verify(req.body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ResendInboundEvent;
    } catch {
      throw AppError.badRequest("Invalid webhook signature", "INVALID_SIGNATURE");
    }

    if (event.type !== "email.received") {
      res.status(200).json({ received: true, skipped: event.type });
      return;
    }

    const { from, to, subject, text } = event.data;
    const toAddress = Array.isArray(to) ? to[0] : to;

    if (!from || !toAddress) {
      // Log the raw shape once so a real payload can be compared against
      // this plan's assumed field names — see the "one thing to verify" note.
      console.warn("[resend.webhook] unexpected inbound payload shape:", event.data);
      res.status(200).json({ received: true, skipped: "missing from/to" });
      return;
    }

    // No organizationId in this payload — same single-inbox placeholder as
    // before, not a new limitation introduced by this swap.
    const organizationId = process.env.DEFAULT_ORG_ID_FOR_INBOUND_EMAIL ?? "";
    if (!organizationId) {
      res.status(200).json({ received: true, skipped: "no org configured" });
      return;
    }

    await communicationService.recordInbound({
      organizationId,
      fromAddress: from,
      toAddress,
      subject: subject ?? null,
      body: text ?? "",
      externalId: svixId,
    });

    res.status(200).json({ received: true });
  })
);
