import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import { AppError } from "../../errors/app-error";
import { resendClient } from "../../lib/resend-client";
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
  // to). This is the ONLY send path — no free-form compose yet. Email-only
  // by product decision (SMS was removed — see docs/EXECUTION_PLAN.md).
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
      const result = await resendClient.sendEmail({
        to: message.toAddress,
        subject: message.subject ?? "(no subject)",
        text: message.body,
      });

      const sent = await communicationRepository.markSent(message.id, result.externalId);

      // Same transactional-Activity pattern used everywhere else (Lead
      // scoring, Pipeline stage changes) — log it, and if this message is
      // linked to a Task, mark that Task complete too, closing the loop.
      await prisma.$transaction([
        prisma.activity.create({
          data: {
            organizationId: auth.organizationId,
            type: "EMAIL_SENT",
            message: `Email sent: ${sent.subject ?? "(no subject)"}`,
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
      throw AppError.badRequest("Failed to send email — see server logs", "SEND_FAILED");
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
};
