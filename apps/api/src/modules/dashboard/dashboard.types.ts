export interface StatCardDTO {
  label: string;
  value: number;
  format: "currency" | "number" | "percent";
  deltaPercent: number; // e.g. 8.2 means +8.2% vs previous period
}

export interface DashboardSummaryDTO {
  range: "this_week" | "this_month" | "this_quarter";
  stats: {
    revenue: StatCardDTO;
    newLeads: StatCardDTO;
    dealsWon: StatCardDTO;
    conversionRate: StatCardDTO;
  };
}

export interface PipelineStageDTO {
  stage: string;
  dealCount: number;
  totalValue: number;
}

export interface PipelineOverviewDTO {
  stages: PipelineStageDTO[];
}

export interface ActivityDTO {
  id: string;
  type: string;
  message: string;
  actorName: string | null;
  createdAt: string;
}
