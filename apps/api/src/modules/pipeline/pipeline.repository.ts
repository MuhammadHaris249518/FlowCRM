import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import type { CreateDealInput, DealQuery, UpdateDealInput } from "./pipeline.validation";
import type { DealStage } from "./pipeline.types";

// Same rep-scoping pattern as leads.repository.leadScopeFilter and
// dashboard.repository.scopeFilter — SALES_REP only sees deals assigned
// to them, everyone else sees the whole org.
function dealScopeFilter(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, assigneeId: auth.userId };
  }
  return base;
}

const dealInclude = {
  company: { select: { name: true } },
  contact: { select: { fullName: true } },
  assignee: { select: { fullName: true } },
} as const;

// Fixed board column order — Prisma groupBy doesn't guarantee ordering
// matching the Kanban's intended left-to-right stage progression.
export const DEAL_STAGE_ORDER: DealStage[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const pipelineRepository = {
  async list(auth: AuthContext, query: DealQuery) {
    const where: Prisma.DealWhereInput = {
      ...dealScopeFilter(auth),
      ...(query.stage ? { stage: query.stage } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: dealInclude,
      }),
      prisma.deal.count({ where }),
    ]);

    return { items, total };
  },

  // Board loads every in-scope deal unpaginated — acceptable at MVP deal
  // volumes (same tradeoff documented in docs/database/schema.md for the
  // dashboard's aggregate queries). Revisit if an org's deal count grows
  // large enough that this becomes a real payload-size concern.
  async board(auth: AuthContext) {
    return prisma.deal.findMany({
      where: dealScopeFilter(auth),
      orderBy: { createdAt: "desc" },
      include: dealInclude,
    });
  },

  async getById(auth: AuthContext, id: string) {
    return prisma.deal.findFirst({
      where: { id, ...dealScopeFilter(auth) },
      include: dealInclude,
    });
  },

  async exists(auth: AuthContext, id: string) {
    const deal = await prisma.deal.findFirst({
      where: { id, ...dealScopeFilter(auth) },
      select: { id: true },
    });
    return Boolean(deal);
  },

  async companyExists(auth: AuthContext, companyId: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, organizationId: auth.organizationId },
      select: { id: true },
    });
    return Boolean(company);
  },

  async contactExists(auth: AuthContext, contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: auth.organizationId },
      select: { id: true },
    });
    return Boolean(contact);
  },

  async create(auth: AuthContext, input: CreateDealInput) {
    return prisma.deal.create({
      data: {
        organizationId: auth.organizationId,
        title: input.title,
        value: input.value,
        stage: input.stage ?? "NEW",
        companyId: input.companyId,
        contactId: input.contactId,
        assigneeId: input.assigneeId ?? (auth.role === "SALES_REP" ? auth.userId : undefined),
      },
      include: dealInclude,
    });
  },

  async update(_auth: AuthContext, id: string, input: UpdateDealInput) {
    return prisma.deal.update({
      where: { id },
      data: input,
      include: dealInclude,
    });
  },

  // closedAt is derived, never client-supplied: set on entering WON/LOST,
  // cleared if a deal is moved back out of a closed stage (e.g. reopened
  // after being marked Lost by mistake).
  async updateStage(_auth: AuthContext, id: string, stage: DealStage) {
    const isClosedStage = stage === "WON" || stage === "LOST";
    return prisma.deal.update({
      where: { id },
      data: { stage, closedAt: isClosedStage ? new Date() : null },
      include: dealInclude,
    });
  },

  async delete(_auth: AuthContext, id: string) {
    return prisma.deal.delete({ where: { id } });
  },

  async logStageChangeActivity(auth: AuthContext, dealTitle: string, newStage: DealStage) {
    await prisma.activity.create({
      data: {
        organizationId: auth.organizationId,
        type: "DEAL_STAGE_CHANGED",
        message: `Deal "${dealTitle}" moved to ${newStage}`,
        actorId: auth.userId,
      },
    });
  },
};
