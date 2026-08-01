import { apiClient, type RequestContext } from "@/lib/api-client";
import type {
  Activity,
  DashboardRange,
  DashboardSummary,
  PipelineOverview,
} from "../types";

export const dashboardApi = {
  getSummary: (ctx: RequestContext, range: DashboardRange) =>
    apiClient.get<DashboardSummary>("/dashboard/summary", ctx, { range }),

  getPipelineOverview: (ctx: RequestContext) =>
    apiClient.get<PipelineOverview>("/dashboard/pipeline-overview", ctx),

  getRecentActivities: (ctx: RequestContext, limit = 10) =>
    apiClient.get<Activity[]>("/dashboard/recent-activities", ctx, {
      limit: String(limit),
    }),
};