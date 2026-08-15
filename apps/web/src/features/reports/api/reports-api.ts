import { apiGet } from "@/lib/api-client";
import type { ConversionFunnel, ReportsRange, WinLossReport, TrendsReport } from "../types";

export const reportsApi = {
  getConversionFunnel: (range: ReportsRange) =>
    apiGet<ConversionFunnel>("/reports/conversion-funnel", { range }),
  getWinLossReport: (range: ReportsRange) =>
    apiGet<WinLossReport>("/reports/win-loss", { range }),
  getTrends: (months: number) =>
    apiGet<TrendsReport>("/reports/trends", { months: String(months) }),
};
