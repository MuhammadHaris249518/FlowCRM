import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";

function scopeFilter(auth: AuthContext) {
  return { organizationId: auth.organizationId };
}

export const communicationRepository = {
  async findById(auth: AuthContext, id: string) {
    return prisma.message.findFirst({ where: { id, ...scopeFilter(auth) } });
  },

  async listForContact(auth: AuthContext, contactId: string, limit: number) {
    return prisma.message.findMany({
      where: { ...scopeFilter(auth), contactId },
      include: { attachments: { include: { document: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async listForLead(auth: AuthContext, leadId: string, limit: number) {
    return prisma.message.findMany({
      where: { ...scopeFilter(auth), leadId },
      include: { attachments: { include: { document: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async markSent(id: string, externalId: string | null) {
    return prisma.message.update({
      where: { id },
      data: { status: "SENT", externalId, sentAt: new Date() },
      include: { attachments: { include: { document: true } } },
    });
  },

  async markFailed(id: string, errorMessage: string) {
    return prisma.message.update({
      where: { id },
      data: { status: "FAILED", errorMessage },
    });
  },

  async createInbound(data: {
    organizationId: string;
    contactId: string | null;
    leadId: string | null;
    fromAddress: string;
    toAddress: string;
    subject: string | null;
    body: string;
    externalId: string | null;
  }) {
    return prisma.message.create({
      data: {
        ...data,
        channel: "EMAIL",
        direction: "INBOUND",
        status: "RECEIVED",
        receivedAt: new Date(),
      },
    });
  },
};
