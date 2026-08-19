import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { reportsService } from "./reports.service";
import { reportsRangeQuerySchema, trendsQuerySchema } from "./reports.validation";
import { conversionFunnelToCsv, winLossToCsv, trendsToCsv } from "./reports.csv";

export const reportsController = {
  async getConversionFunnel(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = reportsRangeQuerySchema.parse(req.query);
    const data = await reportsService.getConversionFunnel(req.authContext, query.range);
    res.json({ success: true, data });
  },

  async getWinLossReport(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = reportsRangeQuerySchema.parse(req.query);
    const data = await reportsService.getWinLossReport(req.authContext, query.range);
    res.json({ success: true, data });
  },

  async getTrends(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = trendsQuerySchema.parse(req.query);
    const data = await reportsService.getTrends(req.authContext, query.months);
    res.json({ success: true, data });
  },

  async exportConversionFunnel(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = reportsRangeQuerySchema.parse(req.query);
    const data = await reportsService.getConversionFunnel(req.authContext, query.range);
    const csv = conversionFunnelToCsv(data);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="conversion-funnel-${query.range}.csv"`);
    res.send(csv);
  },

  async exportWinLoss(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = reportsRangeQuerySchema.parse(req.query);
    const data = await reportsService.getWinLossReport(req.authContext, query.range);
    const csv = winLossToCsv(data);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="win-loss-${query.range}.csv"`);
    res.send(csv);
  },

  async exportTrends(req: Request, res: Response) {
    if (!req.authContext) throw AppError.unauthorized();
    const query = trendsQuerySchema.parse(req.query);
    const data = await reportsService.getTrends(req.authContext, query.months);
    const csv = trendsToCsv(data);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="trends-${query.months}mo.csv"`);
    res.send(csv);
  },
};
