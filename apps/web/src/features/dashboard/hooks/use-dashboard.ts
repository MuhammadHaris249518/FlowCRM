import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";
import type { DashboardRange } from "../types";

export function useDashboardSummary(range: DashboardRange) {
  return useQuery({
    queryKey: ["dashboard", "summary", range],
    queryFn: () => dashboardApi.getSummary(range),
    staleTime: 60_000, // revenue/leads don't need to refetch on every focus
  });
}

export function usePipelineOverview() {
  return useQuery({
    queryKey: ["dashboard", "pipeline-overview"],
    queryFn: dashboardApi.getPipelineOverview,
    staleTime: 60_000,
  });
}

export function useRecentActivities(limit = 10) {
  return useQuery({
    queryKey: ["dashboard", "recent-activities", limit],
    queryFn: () => dashboardApi.getRecentActivities(limit),
    // Activity feed should feel live — refetch more eagerly than stats.
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
