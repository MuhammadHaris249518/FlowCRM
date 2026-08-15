import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reports-api";
import type { ReportsRange } from "../types";

export function useConversionFunnel(range: ReportsRange) {
  return useQuery({
    queryKey: ["reports", "conversion-funnel", range],
    queryFn: () => reportsApi.getConversionFunnel(range),
    staleTime: 60_000,
  });
}

export function useWinLossReport(range: ReportsRange) {
  return useQuery({
    queryKey: ["reports", "win-loss", range],
    queryFn: () => reportsApi.getWinLossReport(range),
    staleTime: 60_000,
  });
}

export function useTrends(months: number) {
  return useQuery({
    queryKey: ["reports", "trends", months],
    queryFn: () => reportsApi.getTrends(months),
    staleTime: 60_000,
  });
}
