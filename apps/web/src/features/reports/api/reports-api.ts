import { apiClient, downloadFile, type RequestContext } from "@/lib/api-client";
import type { ConversionFunnel, ReportsRange, WinLossReport, TrendsReport } from "../types";

export const reportsApi = {
  getConversionFunnel: (ctx: RequestContext, range: ReportsRange) =>
    apiClient.get<ConversionFunnel>("/reports/conversion-funnel", ctx, { range }),
  getWinLossReport: (ctx: RequestContext, range: ReportsRange) =>
    apiClient.get<WinLossReport>("/reports/win-loss", ctx, { range }),
  getTrends: (ctx: RequestContext, months: number) =>
    apiClient.get<TrendsReport>("/reports/trends", ctx, { months: String(months) }),
  exportConversionFunnel: (ctx: RequestContext, range: ReportsRange) =>
    downloadFile("/reports/conversion-funnel/export", ctx, { range }, `conversion-funnel-${range}.csv`),
  exportWinLoss: (ctx: RequestContext, range: ReportsRange) =>
    downloadFile("/reports/win-loss/export", ctx, { range }, `win-loss-${range}.csv`),
  exportTrends: (ctx: RequestContext, months: number) =>
    downloadFile("/reports/trends/export", ctx, { months: String(months) }, `trends-${months}mo.csv`),
};
