import type { Request, Response } from "express";
import { AppError } from "../../errors/app-error";
import { dashboardService } from "./dashboard.service";
import {
  dashboardSummaryQuerySchema,
  recentActivitiesQuerySchema,
} from "./dashboard.validation";

export const dashboardController = {
  async getSummary(req: Request, res: Response) {
    if (!req.auth) throw AppError.unauthorized();
    const query = dashboardSummaryQuerySchema.parse(req.query);
    const data = await dashboardService.getSummary(req.auth, query.range);
    res.json({ success: true, data });
  },

  async getPipelineOverview(req: Request, res: Response) {
    if (!req.auth) throw AppError.unauthorized();
    const data = await dashboardService.getPipelineOverview(req.auth);
    res.json({ success: true, data });
  },

  async getRecentActivities(req: Request, res: Response) {
    if (!req.auth) throw AppError.unauthorized();
    const query = recentActivitiesQuerySchema.parse(req.query);
    const data = await dashboardService.getRecentActivities(req.auth, query.limit);
    res.json({ success: true, data });
  },
};
