import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import type { CreateLeadInput, LeadQuery, UpdateLeadInput } from "./leads.validation";

// Same rep-scoping pattern as dashboard.repository.scopeFilter and
// crm.repository.contactScopeFilter — SALES_REP only sees leads assigned
// to them, everyone else sees the whole org.
function leadScopeFilter(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, assigneeId: auth.userId };
  }
  return base;
}

const leadInclude = {
  contact: { select: { fullName: true, email: true } },
  assignee: { select: { fullName: true } },
} as const;

export const leadsRepository = {
  async list(auth: AuthContext, query: LeadQuery) {
    const where: Prisma.LeadWhereInput = {
      ...leadScopeFilter(auth),
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.search
        ? {
            contact: {
              is: {
                OR: [
                  { fullName: { contains: query.search, mode: "insensitive" } },
                  { email: { contains: query.search, mode: "insensitive" } },
                ],
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: leadInclude,
      }),
      prisma.lead.count({ where }),
    ]);

    return { items, total };
  },

  async getById(auth: AuthContext, id: string) {
    return prisma.lead.findFirst({
      where: { id, ...leadScopeFilter(auth) },
      include: leadInclude,
    });
  },

  async exists(auth: AuthContext, id: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, ...leadScopeFilter(auth) },
      select: { id: true },
    });
    return Boolean(lead);
  },

  // Separate from getById's leadInclude — scoring needs company context
  // that the normal list/detail views don't, so this stays a dedicated
  // query rather than bloating leadInclude for every other endpoint.
  async getForScoring(auth: AuthContext, id: string) {
    return prisma.lead.findFirst({
      where: { id, ...leadScopeFilter(auth) },
      include: {
        contact: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            company: { select: { name: true, domain: true } },
          },
        },
      },
    });
  },

  async contactExists(auth: AuthContext, contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: auth.organizationId },
      select: { id: true },
    });
    return Boolean(contact);
  },

  // Creates the Lead, and — if no existing contactId was given — creates the
  // linked Contact in the same transaction, so a lead is never left pointing
  // at nothing. Mirrors the Organization+Membership transaction pattern
  // already established in auth.service.ts.
  async create(auth: AuthContext, input: CreateLeadInput) {
    return prisma.$transaction(async (tx) => {
      let contactId = input.contactId ?? null;

      if (!contactId && input.contactFullName) {
        const contact = await tx.contact.create({
          data: {
            fullName: input.contactFullName,
            email: input.contactEmail,
            phone: input.contactPhone,
            organizationId: auth.organizationId,
          },
        });
        contactId = contact.id;
      }

      return tx.lead.create({
        data: {
          organizationId: auth.organizationId,
          contactId,
          source: input.source,
          status: input.status,
          score: input.score,
          assigneeId: input.assigneeId ?? (auth.role === "SALES_REP" ? auth.userId : undefined),
        },
        include: leadInclude,
      });
    });
  },

  async update(auth: AuthContext, id: string, input: UpdateLeadInput) {
    return prisma.lead.update({
      where: { id },
      data: input,
      include: leadInclude,
    });
  },

  async delete(auth: AuthContext, id: string) {
    return prisma.lead.delete({ where: { id } });
  },

  async updateScore(auth: AuthContext, id: string, score: number, reasoning: string) {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id },
        data: { score },
        include: leadInclude,
      });

      await tx.activity.create({
        data: {
          organizationId: auth.organizationId,
          type: "AI_LEAD_SCORED",
          message: `AI scored "${lead.contact?.fullName ?? "this lead"}" at ${score}/100 — ${reasoning}`,
          actorId: auth.userId,
        },
      });

      return lead;
    });
  },

  // Single transaction: update the lead to CONVERTED and create the linked
  // Deal, so a crash mid-conversion can never leave a lead marked converted
  // with no deal to show for it (or vice versa).
  async convertToDeal(auth: AuthContext, id: string, dealTitle: string | undefined, dealValue: number) {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: { id, ...leadScopeFilter(auth) },
        include: { contact: { select: { fullName: true, companyId: true } } },
      });
      if (!lead) return null;

      const updatedLead = await tx.lead.update({
        where: { id },
        data: { status: "CONVERTED" },
        include: leadInclude,
      });

      const deal = await tx.deal.create({
        data: {
          organizationId: auth.organizationId,
          title: dealTitle?.trim() || `${lead.contact?.fullName ?? "New Lead"} — Deal`,
          value: dealValue,
          stage: "NEW",
          contactId: lead.contactId,
          companyId: lead.contact?.companyId ?? null,
          assigneeId: lead.assigneeId,
        },
      });

      // Reuses DEAL_STAGE_CHANGED rather than adding a DEAL_CREATED enum
      // value — same deliberate deferral noted when Pipeline was built.
      await tx.activity.create({
        data: {
          organizationId: auth.organizationId,
          type: "DEAL_STAGE_CHANGED",
          message: `Deal "${deal.title}" created from converted lead, entering New`,
          actorId: auth.userId,
        },
      });

      return { lead: updatedLead, deal };
    });
  },
};
