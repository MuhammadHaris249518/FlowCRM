import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { DashboardRange } from "../types";

export function useDashboardSummary(range: DashboardRange) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["dashboard", "summary", range, ctx.organizationId],
    queryFn: () => dashboardApi.getSummary(ctx, range),
    enabled: Boolean(ctx.organizationId),
    staleTime: 60_000,
  });
}

export function usePipelineOverview() {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["dashboard", "pipeline-overview", ctx.organizationId],
    queryFn: () => dashboardApi.getPipelineOverview(ctx),
    enabled: Boolean(ctx.organizationId),
    staleTime: 60_000,
  });
}

export function useRecentActivities(limit = 10) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["dashboard", "recent-activities", limit, ctx.organizationId],
    queryFn: () => dashboardApi.getRecentActivities(ctx, limit),
    enabled: Boolean(ctx.organizationId),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}