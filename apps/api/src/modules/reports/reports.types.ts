export interface FunnelStageDTO {
  stage: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED";
  label: string;
  count: number;
  conversionRateFromPrevious: number | null; // null for the first stage
}

export interface ConversionFunnelDTO {
  range: "this_week" | "this_month" | "this_quarter";
  totalLeads: number;
  stages: FunnelStageDTO[];
  disqualifiedCount: number;
}
