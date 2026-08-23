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
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async listForLead(auth: AuthContext, leadId: string, limit: number) {
    return prisma.message.findMany({
      where: { ...scopeFilter(auth), leadId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async markSent(id: string, externalId: string | null) {
    return prisma.message.update({
      where: { id },
      data: { status: "SENT", externalId, sentAt: new Date() },
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
    channel: "EMAIL" | "SMS";
    fromAddress: string;
    toAddress: string;
    subject: string | null;
    body: string;
    externalId: string | null;
  }) {
    return prisma.message.create({
      data: {
        ...data,
        direction: "INBOUND",
        status: "RECEIVED",
        receivedAt: new Date(),
      },
    });
  },

  async findContactByPhone(organizationId: string, phone: string) {
    return prisma.contact.findFirst({ where: { organizationId, phone } });
  },
};
