import express, { Router } from "express";
import { Webhook } from "svix";
import { asyncHandler } from "../../../middleware/error-handler";
import { AppError } from "../../../errors/app-error";
import { authService } from "../auth.service";

export const clerkWebhookRouter = Router();

interface ClerkEmailAddress {
  email_address: string;
}

interface ClerkUserPayload {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  first_name: string | null;
  last_name: string | null;
  image_url?: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserPayload;
}

clerkWebhookRouter.post(
  "/",
  // Needs the RAW body for svix signature verification — must run before the
  // global express.json() parser (see app.ts mount order).
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
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
    let event: ClerkWebhookEvent;
    try {
      event = webhook.verify(req.body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      throw AppError.badRequest("Invalid webhook signature", "INVALID_SIGNATURE");
    }

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const data = event.data;
        await authService.syncUserFromClerkWebhook({
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address ?? "",
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.image_url ?? null,
        });
        break;
      }
      case "user.deleted": {
        await authService.deleteUserFromClerkWebhook(event.data.id);
        break;
      }
      // Other event types (session.*, organization.*) are ignored for now.
    }

    res.status(200).json({ received: true });
  })
);