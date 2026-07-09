import { Deal, Lead, Activity } from "../../models";
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
    const result = await Deal.aggregate([
      { $match: { ...scopeFilter(auth), stage: "WON", closedAt: { ...window } } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$value" },
        },
      },
    ]);
    return result[0]?.totalValue ?? 0;
  },

  async getNewLeadsCount(auth: AuthContext, window: Window) {
    return Lead.countDocuments({ ...scopeFilter(auth), createdAt: window });
  },

  async getDealsWonCount(auth: AuthContext, window: Window) {
    return Deal.countDocuments({ ...scopeFilter(auth), stage: "WON", closedAt: window });
  },

  async getConversionRate(auth: AuthContext, window: Window) {
    const [totalLeads, convertedLeads] = await Promise.all([
      Lead.countDocuments({ ...scopeFilter(auth), createdAt: window }),
      Lead.countDocuments({ ...scopeFilter(auth), status: "CONVERTED", createdAt: window }),
    ]);
    return totalLeads === 0 ? 0 : Number(((convertedLeads / totalLeads) * 100).toFixed(1));
  },

  async getPipelineByStage(auth: AuthContext) {
    const deals = await Deal.aggregate([
      { $match: scopeFilter(auth) },
      {
        $group: {
          _id: "$stage",
          dealCount: { $sum: 1 },
          totalValue: { $sum: "$value" },
        },
      },
    ]);
    return deals.map((row: any) => ({
      stage: row._id,
      dealCount: row.dealCount,
      totalValue: row.totalValue ?? 0,
    }));
  },

  async getRecentActivities(auth: AuthContext, limit: number) {
    const activities = await Activity.find({ organizationId: auth.organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "fullName")
      .exec();
    return activities.map((activity: any) => ({
      ...activity.toObject(),
      actor: activity.actor ? { fullName: activity.actor.fullName } : null,
    }));
  },
};