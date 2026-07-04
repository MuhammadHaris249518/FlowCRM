import { apiGet } from "@/lib/api-client";
import type {
  Activity,
  DashboardRange,
  DashboardSummary,
  PipelineOverview,
} from "../types";

export const dashboardApi = {
  getSummary: (range: DashboardRange) =>
    apiGet<DashboardSummary>("/dashboard/summary", { range }),

  getPipelineOverview: () =>
    apiGet<PipelineOverview>("/dashboard/pipeline-overview"),

  getRecentActivities: (limit = 10) =>
    apiGet<Activity[]>("/dashboard/recent-activities", { limit: String(limit) }),
};
