export type ReportsRange = "this_week" | "this_month" | "this_quarter";

export interface FunnelStage {
  stage: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED";
  label: string;
  count: number;
  conversionRateFromPrevious: number | null;
}

export interface ConversionFunnel {
  range: ReportsRange;
  totalLeads: number;
  stages: FunnelStage[];
  disqualifiedCount: number;
}
