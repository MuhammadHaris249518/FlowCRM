import type { AuthContext } from "../../middleware/auth";
import { dashboardRepository, periodBounds } from "./dashboard.repository";
import type { DashboardSummaryQuery } from "./dashboard.validation";
import type {
  ActivityDTO,
  DashboardSummaryDTO,
  PipelineOverviewDTO,
  StatCardDTO,
} from "./dashboard.types";

function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildStat(
  label: string,
  current: number,
  previous: number,
  format: StatCardDTO["format"]
): StatCardDTO {
  return { label, value: current, format, deltaPercent: percentDelta(current, previous) };
}

export const dashboardService = {
  async getSummary(
    auth: AuthContext,
    range: DashboardSummaryQuery["range"]
  ): Promise<DashboardSummaryDTO> {
    const { currentStart, previousStart } = periodBounds(range);
    const currentWindow = { gte: currentStart };
    const previousWindow = { gte: previousStart, lt: currentStart };

    // Run current + previous period queries in parallel — this is 8 independent
    // aggregate queries; sequential awaits would needlessly serialize round-trips.
    const [
      revenueNow,
      revenuePrev,
      leadsNow,
      leadsPrev,
      dealsWonNow,
      dealsWonPrev,
      conversionNow,
      conversionPrev,
    ] = await Promise.all([
      dashboardRepository.getRevenue(auth, currentWindow),
      dashboardRepository.getRevenue(auth, previousWindow),
      dashboardRepository.getNewLeadsCount(auth, currentWindow),
      dashboardRepository.getNewLeadsCount(auth, previousWindow),
      dashboardRepository.getDealsWonCount(auth, currentWindow),
      dashboardRepository.getDealsWonCount(auth, previousWindow),
      dashboardRepository.getConversionRate(auth, currentWindow),
      dashboardRepository.getConversionRate(auth, previousWindow),
    ]);

    return {
      range,
      stats: {
        revenue: buildStat("Total Revenue", revenueNow, revenuePrev, "currency"),
        newLeads: buildStat("New Leads", leadsNow, leadsPrev, "number"),
        dealsWon: buildStat("Deals Won", dealsWonNow, dealsWonPrev, "number"),
        conversionRate: buildStat(
          "Conversion Rate",
          conversionNow,
          conversionPrev,
          "percent"
        ),
      },
    };
  },

  async getPipelineOverview(auth: AuthContext): Promise<PipelineOverviewDTO> {
    const stages = await dashboardRepository.getPipelineByStage(auth);
    return { stages };
  },

  async getRecentActivities(auth: AuthContext, limit: number): Promise<ActivityDTO[]> {
    const activities = await dashboardRepository.getRecentActivities(auth, limit);
    return activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      actorName: activity.actor?.fullName ?? null,
      createdAt: activity.createdAt.toISOString(),
    }));
  },
};
