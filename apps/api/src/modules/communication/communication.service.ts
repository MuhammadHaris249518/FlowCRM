import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import { AppError } from "../../errors/app-error";
import { sendgridClient } from "../../lib/sendgrid-client";
import { twilioClient, toE164 } from "../../lib/twilio-client";
import { communicationRepository } from "./communication.repository";
import type { MessageDTO } from "./communication.types";

function toDTO(m: {
  id: string; channel: string; direction: string; status: string;
  subject: string | null; body: string; fromAddress: string | null;
  toAddress: string | null; sentAt: Date | null; receivedAt: Date | null;
  createdAt: Date;
}): MessageDTO {
  return {
    id: m.id,
    channel: m.channel,
    direction: m.direction,
    status: m.status,
    subject: m.subject,
    body: m.body,
    fromAddress: m.fromAddress,
    toAddress: m.toAddress,
    sentAt: m.sentAt?.toISOString() ?? null,
    receivedAt: m.receivedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

export const communicationService = {
  async listThread(
    auth: AuthContext,
    params: { contactId?: string; leadId?: string },
    limit: number
  ): Promise<MessageDTO[]> {
    if (!params.contactId && !params.leadId) {
      throw AppError.badRequest("contactId or leadId is required");
    }
    const rows = params.contactId
      ? await communicationRepository.listForContact(auth, params.contactId, limit)
      : await communicationRepository.listForLead(auth, params.leadId!, limit);
    return rows.map(toDTO);
  },

  // Sends an existing DRAFT message (e.g. the one an AI-drafted Task links
  // to). This is the ONLY send path in Phase 1/2 — no free-form compose yet.
  // Branches on channel: EMAIL -> SendGrid, SMS -> Twilio. Everything after
  // the actual provider call (marking sent, logging Activity, completing
  // the linked Task) is identical for both channels.
  async sendDraft(auth: AuthContext, messageId: string): Promise<MessageDTO> {
    const message = await communicationRepository.findById(auth, messageId);
    if (!message) throw AppError.notFound("Message not found");
    if (message.status !== "DRAFT") {
      throw AppError.badRequest(`Message is already ${message.status}, not a draft`, "NOT_A_DRAFT");
    }
    if (!message.toAddress) {
      throw AppError.badRequest("Message has no recipient address", "MISSING_RECIPIENT");
    }

    try {
      let externalId: string | null;

      if (message.channel === "SMS") {
        const to = toE164(message.toAddress);
        if (!to) {
          throw AppError.badRequest("Recipient phone number is invalid", "INVALID_PHONE");
        }
        const result = await twilioClient.sendSms({ to, body: message.body });
        externalId = result.externalId;
      } else {
        const result = await sendgridClient.sendEmail({
          to: message.toAddress,
          subject: message.subject ?? "(no subject)",
          text: message.body,
        });
        externalId = result.externalId;
      }

      const sent = await communicationRepository.markSent(message.id, externalId);

      // Same transactional-Activity pattern used everywhere else (Lead
      // scoring, Pipeline stage changes) — log it, and if this message is
      // linked to a Task, mark that Task complete too, closing the loop.
      await prisma.$transaction([
        prisma.activity.create({
          data: {
            organizationId: auth.organizationId,
            type: sent.channel === "SMS" ? "SMS_SENT" : "EMAIL_SENT",
            message:
              sent.channel === "SMS"
                ? `SMS sent to ${sent.toAddress}`
                : `Email sent: ${sent.subject ?? "(no subject)"}`,
            actorId: auth.userId,
          },
        }),
        prisma.task.updateMany({
          where: { messageId: sent.id, completedAt: null },
          data: { completedAt: new Date() },
        }),
      ]);

      return toDTO(sent);
    } catch (err) {
      await communicationRepository.markFailed(message.id, (err as Error).message);
      throw AppError.badRequest(
        `Failed to send ${message.channel === "SMS" ? "SMS" : "email"} — see server logs`,
        "SEND_FAILED"
      );
    }
  },

  async recordInbound(input: {
    organizationId: string;
    fromAddress: string;
    toAddress: string;
    subject: string | null;
    body: string;
    externalId: string | null;
  }) {
    // Correlate the inbound sender's email address to an existing Contact
    // in this org, if one exists — best-effort, not a hard requirement.
    const contact = await prisma.contact.findFirst({
      where: { organizationId: input.organizationId, email: input.fromAddress },
    });

    const message = await communicationRepository.createInbound({
      organizationId: input.organizationId,
      contactId: contact?.id ?? null,
      leadId: null,
      channel: "EMAIL",
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      subject: input.subject,
      body: input.body,
      externalId: input.externalId,
    });

    await prisma.activity.create({
      data: {
        organizationId: input.organizationId,
        type: "EMAIL_RECEIVED",
        message: `Email received: ${input.subject ?? "(no subject)"}`,
      },
    });

    return message;
  },

  async recordInboundSms(input: {
    organizationId: string;
    fromPhone: string;
    toPhone: string;
    body: string;
    externalId: string | null;
  }) {
    // Correlate by phone number instead of email — same best-effort logic.
    const contact = await communicationRepository.findContactByPhone(
      input.organizationId,
      input.fromPhone
    );

    const message = await communicationRepository.createInbound({
      organizationId: input.organizationId,
      contactId: contact?.id ?? null,
      leadId: null,
      channel: "SMS",
      fromAddress: input.fromPhone,
      toAddress: input.toPhone,
      subject: null,
      body: input.body,
      externalId: input.externalId,
    });

    await prisma.activity.create({
      data: {
        organizationId: input.organizationId,
        type: "SMS_RECEIVED",
        message: `SMS received from ${input.fromPhone}`,
      },
    });

    return message;
  },
};
