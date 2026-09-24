import type { DealStage, LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";

function leadDealTaskScope(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, assigneeId: auth.userId };
  }
  return base;
}

function contactScope(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, ownerId: auth.userId };
  }
  return base;
}

const MAX_TAKE = 15;

export const assistantRepository = {
  async searchLeads(
    auth: AuthContext,
    opts: {
      search?: string;
      status?: string;
      minScore?: number;
      sortBy?: "score" | "createdAt" | "updatedAt";
      limit?: number;
    }
  ) {
    const where: Prisma.LeadWhereInput = {
      ...leadDealTaskScope(auth),
      ...(opts.status ? { status: opts.status as LeadStatus } : {}),
      ...(typeof opts.minScore === "number" ? { score: { gte: opts.minScore } } : {}),
      ...(opts.search
        ? {
            contact: {
              is: {
                OR: [
                  { fullName: { contains: opts.search, mode: "insensitive" } },
                  { email: { contains: opts.search, mode: "insensitive" } },
                ],
              },
            },
          }
        : {}),
    };

    const sortBy = opts.sortBy ?? "score";
    const items = await prisma.lead.findMany({
      where,
      orderBy: { [sortBy]: "desc" },
      take: Math.min(opts.limit ?? 10, MAX_TAKE),
      include: {
        contact: { select: { fullName: true, email: true, company: { select: { name: true } } } },
        assignee: { select: { fullName: true } },
      },
    });

    return items.map((lead) => ({
      id: lead.id,
      status: lead.status,
      source: lead.source,
      score: lead.score,
      notes: lead.notes,
      contactName: lead.contact?.fullName ?? null,
      contactEmail: lead.contact?.email ?? null,
      companyName: lead.contact?.company?.name ?? null,
      assigneeName: lead.assignee?.fullName ?? null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }));
  },

  async getLead(auth: AuthContext, id: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, ...leadDealTaskScope(auth) },
      include: {
        contact: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: { select: { id: true, name: true, domain: true } },
          },
        },
        assignee: { select: { fullName: true } },
      },
    });
    if (!lead) return null;
    return {
      id: lead.id,
      status: lead.status,
      source: lead.source,
      score: lead.score,
      notes: lead.notes,
      contact: lead.contact
        ? {
            id: lead.contact.id,
            fullName: lead.contact.fullName,
            email: lead.contact.email,
            company: lead.contact.company,
          }
        : null,
      assigneeName: lead.assignee?.fullName ?? null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  },

  async searchContacts(auth: AuthContext, opts: { search?: string; limit?: number }) {
    const where: Prisma.ContactWhereInput = {
      ...contactScope(auth),
      ...(opts.search
        ? {
            OR: [
              { fullName: { contains: opts.search, mode: "insensitive" } },
              { email: { contains: opts.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const items = await prisma.contact.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: Math.min(opts.limit ?? 10, MAX_TAKE),
      include: { company: { select: { name: true } }, owner: { select: { fullName: true } } },
    });
    return items.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      companyName: c.company?.name ?? null,
      ownerName: c.owner?.fullName ?? null,
    }));
  },

  async searchCompanies(auth: AuthContext, opts: { search?: string; limit?: number }) {
    const where: Prisma.CompanyWhereInput = {
      organizationId: auth.organizationId,
      ...(opts.search ? { name: { contains: opts.search, mode: "insensitive" } } : {}),
    };
    const items = await prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
      take: Math.min(opts.limit ?? 10, MAX_TAKE),
    });
    return items.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      industry: c.industry,
    }));
  },

  async searchDeals(
    auth: AuthContext,
    opts: { search?: string; stage?: string; stuckDays?: number; limit?: number }
  ) {
    const staleSince =
      typeof opts.stuckDays === "number"
        ? new Date(Date.now() - opts.stuckDays * 24 * 60 * 60 * 1000)
        : undefined;

    const where: Prisma.DealWhereInput = {
      ...leadDealTaskScope(auth),
      ...(opts.stage
        ? { stage: opts.stage as DealStage }
        : staleSince
          ? { stage: { notIn: ["WON", "LOST"] } }
          : {}),
      ...(opts.search ? { title: { contains: opts.search, mode: "insensitive" } } : {}),
      ...(staleSince ? { updatedAt: { lt: staleSince } } : {}),
    };

    const items = await prisma.deal.findMany({
      where,
      orderBy: { value: "desc" },
      take: Math.min(opts.limit ?? 10, MAX_TAKE),
      include: {
        company: { select: { name: true } },
        contact: { select: { fullName: true } },
        assignee: { select: { fullName: true } },
      },
    });

    return items.map((d) => ({
      id: d.id,
      title: d.title,
      value: Number(d.value),
      stage: d.stage,
      lostReason: d.lostReason,
      companyName: d.company?.name ?? null,
      contactName: d.contact?.fullName ?? null,
      assigneeName: d.assignee?.fullName ?? null,
      closedAt: d.closedAt?.toISOString() ?? null,
      updatedAt: d.updatedAt.toISOString(),
    }));
  },

  async getDeal(auth: AuthContext, id: string) {
    const deal = await prisma.deal.findFirst({
      where: { id, ...leadDealTaskScope(auth) },
      include: {
        company: { select: { name: true, domain: true } },
        contact: { select: { fullName: true, email: true } },
        assignee: { select: { fullName: true } },
      },
    });
    if (!deal) return null;
    return {
      id: deal.id,
      title: deal.title,
      value: Number(deal.value),
      stage: deal.stage,
      lostReason: deal.lostReason,
      company: deal.company,
      contact: deal.contact,
      assigneeName: deal.assignee?.fullName ?? null,
      closedAt: deal.closedAt?.toISOString() ?? null,
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    };
  },

  async searchTasks(
    auth: AuthContext,
    opts: { search?: string; overdue?: boolean; completed?: boolean; limit?: number }
  ) {
    const where: Prisma.TaskWhereInput = {
      ...leadDealTaskScope(auth),
      ...(opts.search ? { title: { contains: opts.search, mode: "insensitive" } } : {}),
      ...(opts.completed === true ? { completedAt: { not: null } } : {}),
      ...(opts.completed === false || opts.overdue ? { completedAt: null } : {}),
      ...(opts.overdue ? { dueAt: { lt: new Date() } } : {}),
    };

    const items = await prisma.task.findMany({
      where,
      orderBy: { dueAt: "asc" },
      take: Math.min(opts.limit ?? 10, MAX_TAKE),
      include: {
        assignee: { select: { fullName: true } },
        lead: { include: { contact: { select: { fullName: true } } } },
        deal: { select: { title: true } },
      },
    });

    return items.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueAt: t.dueAt?.toISOString() ?? null,
      completedAt: t.completedAt?.toISOString() ?? null,
      assigneeName: t.assignee?.fullName ?? null,
      leadName: t.lead?.contact?.fullName ?? null,
      dealTitle: t.deal?.title ?? null,
    }));
  },

  async listMessages(auth: AuthContext, opts: { leadId?: string; contactId?: string; limit?: number }) {
    if (!opts.leadId && !opts.contactId) {
      return { error: "leadId or contactId is required" };
    }
    const items = await prisma.message.findMany({
      where: {
        organizationId: auth.organizationId,
        ...(opts.leadId ? { leadId: opts.leadId } : {}),
        ...(opts.contactId ? { contactId: opts.contactId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(opts.limit ?? 10, MAX_TAKE),
    });
    return items.map((m) => ({
      id: m.id,
      direction: m.direction,
      status: m.status,
      subject: m.subject,
      fromAddress: m.fromAddress,
      toAddress: m.toAddress,
      createdAt: m.createdAt.toISOString(),
    }));
  },

  async listWorkflows(auth: AuthContext) {
    const items = await prisma.workflow.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: "desc" },
      take: MAX_TAKE,
      include: { _count: { select: { nodes: true } } },
    });
    return items.map((w) => ({
      id: w.id,
      name: w.name,
      isActive: w.isActive,
      nodeCount: w._count.nodes,
    }));
  },

  async listDocuments(auth: AuthContext, opts: { libraryOnly?: boolean; limit?: number }) {
    const items = await prisma.document.findMany({
      where: {
        organizationId: auth.organizationId,
        ...(opts.libraryOnly ? { contactId: null, leadId: null, dealId: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(opts.limit ?? 10, MAX_TAKE),
    });
    return items.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      mimeType: d.mimeType,
      fileSize: d.fileSize,
      leadId: d.leadId,
      dealId: d.dealId,
      contactId: d.contactId,
    }));
  },

  async createEmailDraftArtifacts(input: {
    organizationId: string;
    userId: string;
    leadId: string | null;
    contactId: string | null;
    toAddress: string | null;
    subject: string;
    body: string;
    revisionCount: number;
  }) {
    const message = await prisma.message.create({
      data: {
        organizationId: input.organizationId,
        leadId: input.leadId,
        contactId: input.contactId,
        channel: "EMAIL",
        direction: "OUTBOUND",
        status: "DRAFT",
        subject: input.subject,
        body: input.body,
        toAddress: input.toAddress,
      },
    });

    const task = await prisma.task.create({
      data: {
        organizationId: input.organizationId,
        assigneeId: input.userId,
        title: `Review AI-drafted email: ${input.subject}`,
        description: `Subject: ${input.subject}\n\n${input.body}\n\n---\nDrafted by AI (${input.revisionCount} revision(s)). Review and send via the linked draft — not auto-sent.`,
        leadId: input.leadId,
        contactId: input.contactId,
        priority: "MEDIUM",
        messageId: message.id,
      },
    });

    return { messageId: message.id, taskId: task.id };
  },
};
