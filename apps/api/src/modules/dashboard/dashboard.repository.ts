import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import type { DashboardSummaryQuery } from "./dashboard.validation";

// Sales Reps only ever see their own assigned records; managers/owners see
// the whole org. Centralizing this filter here means every query in this
// module is scoped consistently — no risk of one query leaking cross-tenant
// or cross-rep data because someone forgot a `where` clause.
function scopeFilter(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, assigneeId: auth.userId };
  }
  return base;
}

function periodStart(range: DashboardSummaryQuery["range"]): Date {
  const now = new Date();
  if (range === "this_week") {
    const day = now.getDay();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  }
  if (range === "this_quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), quarterStartMonth, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1); // this_month
}

// Previous period of equal length, used to compute the "+8.2%"-style deltas.
// E.g. for this_month, returns [start of last month, start of this month).
export function periodBounds(range: DashboardSummaryQuery["range"]) {
  const currentStart = periodStart(range);
  const now = new Date();
  const msInPeriod = now.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - msInPeriod);
  return { currentStart, previousStart, now };
}

type Window = { gte: Date; lt?: Date };

export const dashboardRepository = {
  async getRevenue(auth: AuthContext, window: Window) {
    const result = await prisma.deal.aggregate({
      where: { ...scopeFilter(auth), stage: "WON", closedAt: window },
      _sum: { value: true },
    });
    return Number(result._sum.value ?? 0);
  },

  async getNewLeadsCount(auth: AuthContext, window: Window) {
    return prisma.lead.count({
      where: { ...scopeFilter(auth), createdAt: window },
    });
  },

  async getDealsWonCount(auth: AuthContext, window: Window) {
    return prisma.deal.count({
      where: { ...scopeFilter(auth), stage: "WON", closedAt: window },
    });
  },

  async getConversionRate(auth: AuthContext, window: Window) {
    const [totalLeads, convertedLeads] = await Promise.all([
      prisma.lead.count({ where: { ...scopeFilter(auth), createdAt: window } }),
      prisma.lead.count({
        where: { ...scopeFilter(auth), status: "CONVERTED", createdAt: window },
      }),
    ]);
    return totalLeads === 0 ? 0 : Number(((convertedLeads / totalLeads) * 100).toFixed(1));
  },

  async getPipelineByStage(auth: AuthContext) {
    const deals = await prisma.deal.groupBy({
      by: ["stage"],
      where: scopeFilter(auth),
      _count: { _all: true },
      _sum: { value: true },
    });
    return deals.map((row) => ({
      stage: row.stage,
      dealCount: row._count._all,
      totalValue: Number(row._sum.value ?? 0),
    }));
  },

  async getRecentActivities(auth: AuthContext, limit: number) {
    return prisma.activity.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { actor: { select: { fullName: true } } },
    });
  },

  // "Needs follow-up" = still in an early, unresolved status and nobody's
  // touched it in a while. QUALIFIED/CONVERTED/DISQUALIFIED are excluded —
  // those are past the point where "follow up" is the right verb.
  async getFollowUpLeadsCount(auth: AuthContext, staleDays: number) {
    const staleSince = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
    return prisma.lead.count({
      where: {
        ...scopeFilter(auth),
        status: { in: ["NEW", "CONTACTED"] },
        updatedAt: { lt: staleSince },
      },
    });
  },

  // Any deal not yet WON or LOST that hasn't moved stage (or been touched
  // at all) in staleDays — generalizes "stuck in Proposal for 5 days" to
  // any active stage, not just Proposal specifically.
  async getStuckDealsCount(auth: AuthContext, staleDays: number) {
    const staleSince = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
    return prisma.deal.count({
      where: {
        ...scopeFilter(auth),
        stage: { notIn: ["WON", "LOST"] },
        updatedAt: { lt: staleSince },
      },
    });
  },

  async getOverdueTasksCount(auth: AuthContext) {
    return prisma.task.count({
      where: {
        ...scopeFilter(auth),
        completedAt: null,
        dueAt: { lt: new Date() },
      },
    });
  },
};
