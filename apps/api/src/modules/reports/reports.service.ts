import type { AuthContext } from "../../middleware/auth";
import { reportsRepository } from "./reports.repository";
import type { ReportsRangeQuery } from "./reports.validation";
import type {
  ConversionFunnelDTO,
  FunnelStageDTO,
  WinLossByReasonDTO,
  WinLossByRepDTO,
  WinLossReportDTO,
  TrendPointDTO,
  TrendsReportDTO,
} from "./reports.types";

function pct(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current / previous) * 100).toFixed(1));
}

export const reportsService = {
  async getConversionFunnel(
    auth: AuthContext,
    range: ReportsRangeQuery["range"]
  ): Promise<ConversionFunnelDTO> {
    const counts = await reportsRepository.getLeadStatusCounts(auth, range);

    // Cumulative "reached this stage" — a lead currently QUALIFIED has
    // necessarily passed through NEW and CONTACTED too.
    const reachedNew = counts.NEW + counts.CONTACTED + counts.QUALIFIED + counts.CONVERTED;
    const reachedContacted = counts.CONTACTED + counts.QUALIFIED + counts.CONVERTED;
    const reachedQualified = counts.QUALIFIED + counts.CONVERTED;
    const reachedConverted = counts.CONVERTED;

    const stages: FunnelStageDTO[] = [
      { stage: "NEW", label: "New", count: reachedNew, conversionRateFromPrevious: null },
      {
        stage: "CONTACTED",
        label: "Contacted",
        count: reachedContacted,
        conversionRateFromPrevious: pct(reachedContacted, reachedNew),
      },
      {
        stage: "QUALIFIED",
        label: "Qualified",
        count: reachedQualified,
        conversionRateFromPrevious: pct(reachedQualified, reachedContacted),
      },
      {
        stage: "CONVERTED",
        label: "Converted",
        count: reachedConverted,
        conversionRateFromPrevious: pct(reachedConverted, reachedQualified),
      },
    ];

    return {
      range,
      totalLeads: reachedNew + counts.DISQUALIFIED,
      stages,
      disqualifiedCount: counts.DISQUALIFIED,
    };
  },

  async getWinLossReport(
    auth: AuthContext,
    range: ReportsRangeQuery["range"]
  ): Promise<WinLossReportDTO> {
    const deals = await reportsRepository.getClosedDeals(auth, range);

    const won = deals.filter((d) => d.stage === "WON");
    const lost = deals.filter((d) => d.stage === "LOST");
    const totalWon = won.length;
    const totalLost = lost.length;
    const overallWinRate = pct(totalWon, totalWon + totalLost) ?? 0;

    const byRepMap = new Map<string, WinLossByRepDTO>();
    for (const deal of deals) {
      const key = deal.assigneeId ?? "unassigned";
      if (!byRepMap.has(key)) {
        byRepMap.set(key, {
          assigneeId: deal.assigneeId,
          assigneeName: deal.assignee?.fullName ?? "Unassigned",
          wonCount: 0,
          wonValue: 0,
          lostCount: 0,
          lostValue: 0,
          winRate: 0,
        });
      }
      const row = byRepMap.get(key)!;
      if (deal.stage === "WON") {
        row.wonCount += 1;
        row.wonValue += Number(deal.value);
      } else {
        row.lostCount += 1;
        row.lostValue += Number(deal.value);
      }
    }
    const byRep = Array.from(byRepMap.values()).map((row) => ({
      ...row,
      winRate: pct(row.wonCount, row.wonCount + row.lostCount) ?? 0,
    }));

    const byReasonMap = new Map<string, WinLossByReasonDTO>();
    for (const deal of lost) {
      const reason = deal.lostReason ?? "UNSPECIFIED";
      if (!byReasonMap.has(reason)) {
        byReasonMap.set(reason, { reason, count: 0, value: 0 });
      }
      const row = byReasonMap.get(reason)!;
      row.count += 1;
      row.value += Number(deal.value);
    }

    return {
      range,
      totalWon,
      totalLost,
      overallWinRate,
      byRep,
      byLostReason: Array.from(byReasonMap.values()),
    };
  },

  async getTrends(auth: AuthContext, months: number): Promise<TrendsReportDTO> {
    const now = new Date();
    const monthBounds: { start: Date; end: Date; label: string }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      monthBounds.push({ start, end, label });
    }

    // One query set per month, run in parallel — same approach as
    // dashboard.service's current/previous period queries, just N buckets
    // instead of 2. Fine at this scale per docs/database/schema.md's
    // documented tradeoff (single-digit-thousands rows per org).
    const results = await Promise.all(
      monthBounds.map((m) => reportsRepository.getMonthlyTrendData(auth, m.start, m.end))
    );

    const points: TrendPointDTO[] = monthBounds.map((m, i) => {
      const r = results[i];
      const conversionRate =
        r.totalLeadsForConversion === 0
          ? 0
          : Number(((r.convertedLeads / r.totalLeadsForConversion) * 100).toFixed(1));
      return {
        period: m.label,
        revenue: r.revenue,
        newLeads: r.newLeads,
        dealsWon: r.dealsWon,
        conversionRate,
      };
    });

    return { months, points };
  },
};
