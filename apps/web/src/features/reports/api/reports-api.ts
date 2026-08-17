import { apiClient, type RequestContext } from "@/lib/api-client";
import type { ConversionFunnel, ReportsRange, WinLossReport, TrendsReport } from "../types";

export const reportsApi = {
  getConversionFunnel: (ctx: RequestContext, range: ReportsRange) =>
    apiClient.get<ConversionFunnel>("/reports/conversion-funnel", ctx, { range }),
  getWinLossReport: (ctx: RequestContext, range: ReportsRange) =>
    apiClient.get<WinLossReport>("/reports/win-loss", ctx, { range }),
  getTrends: (ctx: RequestContext, months: number) =>
    apiClient.get<TrendsReport>("/reports/trends", ctx, { months: String(months) }),
};
