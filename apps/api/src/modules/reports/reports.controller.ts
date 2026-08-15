import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { reportsService } from "./reports.service";
import { reportsRangeQuerySchema, trendsQuerySchema } from "./reports.validation";

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
};
