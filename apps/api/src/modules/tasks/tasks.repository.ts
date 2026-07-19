import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import type { CreateTaskInput, TaskCalendarQuery, TaskQuery, UpdateTaskInput } from "./tasks.validation";

// Same rep-scoping pattern as dashboard/leads/pipeline — SALES_REP only sees
// tasks assigned to them, everyone else sees the whole org.
function taskScopeFilter(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, assigneeId: auth.userId };
  }
  return base;
}

const taskInclude = {
  assignee: { select: { fullName: true } },
  contact: { select: { fullName: true } },
  deal: { select: { title: true } },
  lead: { include: { contact: { select: { fullName: true } } } },
} as const;

export const tasksRepository = {
  async list(auth: AuthContext, query: TaskQuery) {
    const where: Prisma.TaskWhereInput = {
      ...taskScopeFilter(auth),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.dealId ? { dealId: query.dealId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.completed === "true" ? { completedAt: { not: null } } : {}),
      ...(query.completed === "false" ? { completedAt: null } : {}),
      ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.dueBefore || query.dueAfter
        ? {
            dueAt: {
              ...(query.dueAfter ? { gte: query.dueAfter } : {}),
              ...(query.dueBefore ? { lte: query.dueBefore } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        // Soonest due date first; tasks with no due date sort last rather
        // than first (Postgres default for ASC is NULLS LAST, made explicit
        // here so the intent isn't accidentally reversed by a future edit).
        orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: taskInclude,
      }),
      prisma.task.count({ where }),
    ]);

    return { items, total };
  },

  // Unpaginated by design — always called with a bounded [from, to] window
  // (one visible calendar month), so the result set is naturally small.
  async calendar(auth: AuthContext, query: TaskCalendarQuery) {
    return prisma.task.findMany({
      where: {
        ...taskScopeFilter(auth),
        ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
        dueAt: { gte: query.from, lte: query.to },
      },
      orderBy: { dueAt: "asc" },
      include: taskInclude,
    });
  },

  async getById(auth: AuthContext, id: string) {
    return prisma.task.findFirst({
      where: { id, ...taskScopeFilter(auth) },
      include: taskInclude,
    });
  },

  async exists(auth: AuthContext, id: string) {
    const task = await prisma.task.findFirst({
      where: { id, ...taskScopeFilter(auth) },
      select: { id: true },
    });
    return Boolean(task);
  },

  async contactExists(auth: AuthContext, contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: auth.organizationId },
      select: { id: true },
    });
    return Boolean(contact);
  },

  async dealExists(auth: AuthContext, dealId: string) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId: auth.organizationId },
      select: { id: true },
    });
    return Boolean(deal);
  },

  async leadExists(auth: AuthContext, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: auth.organizationId },
      select: { id: true },
    });
    return Boolean(lead);
  },

  // Defaults assigneeId to the creator when omitted — unlike Leads (which
  // only defaults for SALES_REP), a task is almost always self-assigned
  // unless explicitly delegated, regardless of the creator's role.
  async create(auth: AuthContext, input: CreateTaskInput) {
    return prisma.task.create({
      data: {
        organizationId: auth.organizationId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueAt: input.dueAt,
        assigneeId: input.assigneeId ?? auth.userId,
        contactId: input.contactId,
        dealId: input.dealId,
        leadId: input.leadId,
      },
      include: taskInclude,
    });
  },

  async update(auth: AuthContext, id: string, input: UpdateTaskInput) {
    return prisma.task.update({
      where: { id },
      data: input,
      include: taskInclude,
    });
  },

  async delete(auth: AuthContext, id: string) {
    return prisma.task.delete({ where: { id } });
  },

  // Single transaction: mark complete + log Activity, so a crash mid-request
  // can't leave a task completed with no audit trail (same reasoning as
  // leads.repository.convertToDeal).
  async complete(auth: AuthContext, id: string) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: { completedAt: new Date() },
        include: taskInclude,
      });

      await tx.activity.create({
        data: {
          organizationId: auth.organizationId,
          type: "TASK_COMPLETED",
          message: `Task "${task.title}" marked complete`,
          actorId: auth.userId,
        },
      });

      return task;
    });
  },

  async reopen(auth: AuthContext, id: string) {
    return prisma.task.update({
      where: { id },
      data: { completedAt: null },
      include: taskInclude,
    });
  },
};
