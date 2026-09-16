import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";

function scopeFilter(auth: AuthContext) {
  return { organizationId: auth.organizationId };
}

export const documentsRepository = {
  async findById(auth: AuthContext, id: string) {
    return prisma.document.findFirst({ where: { id, ...scopeFilter(auth) } });
  },

  async list(auth: AuthContext, filter: { contactId?: string; leadId?: string; dealId?: string; libraryOnly?: boolean }) {
    return prisma.document.findMany({
      where: {
        ...scopeFilter(auth),
        ...(filter.contactId ? { contactId: filter.contactId } : {}),
        ...(filter.leadId ? { leadId: filter.leadId } : {}),
        ...(filter.dealId ? { dealId: filter.dealId } : {}),
        ...(filter.libraryOnly ? { contactId: null, leadId: null, dealId: null } : {}),
      },
      include: { uploadedBy: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: {
    organizationId: string;
    contactId: string | null;
    leadId: string | null;
    dealId: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storageKey: string;
    uploadedById: string;
  }) {
    return prisma.document.create({ data, include: { uploadedBy: { select: { fullName: true } } } });
  },

  async delete(id: string) {
    return prisma.document.delete({ where: { id } });
  },
};
