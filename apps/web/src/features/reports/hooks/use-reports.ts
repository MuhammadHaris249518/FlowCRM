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
