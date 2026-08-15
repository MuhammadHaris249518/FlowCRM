import { apiGet } from "@/lib/api-client";
import type { ConversionFunnel, ReportsRange } from "../types";

export const reportsApi = {
  getConversionFunnel: (range: ReportsRange) =>
    apiGet<ConversionFunnel>("/reports/conversion-funnel", { range }),
};
