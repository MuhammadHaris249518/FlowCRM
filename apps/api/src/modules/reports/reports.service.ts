import type { AuthContext } from "../../middleware/auth";
import { reportsRepository } from "./reports.repository";
import type { ReportsRangeQuery } from "./reports.validation";
import type { ConversionFunnelDTO, FunnelStageDTO } from "./reports.types";

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
};
