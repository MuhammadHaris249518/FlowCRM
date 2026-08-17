import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reports-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { ReportsRange } from "../types";

export function useConversionFunnel(range: ReportsRange) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["reports", "conversion-funnel", range, ctx.organizationId],
    queryFn: () => reportsApi.getConversionFunnel(ctx, range),
    staleTime: 60_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useWinLossReport(range: ReportsRange) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["reports", "win-loss", range, ctx.organizationId],
    queryFn: () => reportsApi.getWinLossReport(ctx, range),
    staleTime: 60_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useTrends(months: number) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["reports", "trends", months, ctx.organizationId],
    queryFn: () => reportsApi.getTrends(ctx, months),
    staleTime: 60_000,
    enabled: Boolean(ctx.organizationId),
  });
}
