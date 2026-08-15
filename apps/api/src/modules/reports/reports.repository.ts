import { prisma } from "../../lib/prisma";
import type { AuthContext } from "../../middleware/auth";
import type { ReportsRangeQuery } from "./reports.validation";

// Identical pattern to dashboard.repository.ts's scopeFilter — duplicated
// per-module by existing convention in this codebase, not imported.
function scopeFilter(auth: AuthContext) {
  const base = { organizationId: auth.organizationId };
  if (auth.role === "SALES_REP") {
    return { ...base, assigneeId: auth.userId };
  }
  return base;
}

function periodStart(range: ReportsRangeQuery["range"]): Date {
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

export const reportsRepository = {
  async getLeadStatusCounts(auth: AuthContext, range: ReportsRangeQuery["range"]) {
    const createdAt = { gte: periodStart(range) };
    const grouped = await prisma.lead.groupBy({
      by: ["status"],
      where: { ...scopeFilter(auth), createdAt },
      _count: { _all: true },
    });

    // Return as a lookup so the service doesn't need to search an array.
    const counts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      DISQUALIFIED: 0,
      CONVERTED: 0,
    };
    for (const row of grouped) {
      counts[row.status] = row._count._all;
    }
    return counts;
  },

  async getClosedDeals(auth: AuthContext, range: ReportsRangeQuery["range"]) {
    const closedAt = { gte: periodStart(range) };
    return prisma.deal.findMany({
      where: {
        ...scopeFilter(auth),
        stage: { in: ["WON", "LOST"] },
        closedAt,
      },
      select: {
        stage: true,
        value: true,
        lostReason: true,
        assigneeId: true,
        assignee: { select: { fullName: true } },
      },
    });
  },

  async getMonthlyTrendData(auth: AuthContext, monthStart: Date, monthEnd: Date) {
    const scope = scopeFilter(auth);
    const window = { gte: monthStart, lt: monthEnd };

    const [revenueAgg, newLeadsCount, dealsWonCount, totalLeadsCount, convertedLeadsCount] =
      await Promise.all([
        prisma.deal.aggregate({
          where: { ...scope, stage: "WON", closedAt: window },
          _sum: { value: true },
        }),
        prisma.lead.count({ where: { ...scope, createdAt: window } }),
        prisma.deal.count({ where: { ...scope, stage: "WON", closedAt: window } }),
        prisma.lead.count({ where: { ...scope, createdAt: window } }),
        prisma.lead.count({ where: { ...scope, status: "CONVERTED", createdAt: window } }),
      ]);

    return {
      revenue: Number(revenueAgg._sum.value ?? 0),
      newLeads: newLeadsCount,
      dealsWon: dealsWonCount,
      totalLeadsForConversion: totalLeadsCount,
      convertedLeads: convertedLeadsCount,
    };
  },
};
