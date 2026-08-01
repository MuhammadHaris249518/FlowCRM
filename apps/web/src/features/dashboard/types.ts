export type DashboardRange = "this_week" | "this_month" | "this_quarter";

export interface StatCard {
  label: string;
  value: number;
  format: "currency" | "number" | "percent";
  deltaPercent: number;
}

export interface DashboardSummary {
  range: DashboardRange;
  stats: {
    revenue: StatCard;
    newLeads: StatCard;
    dealsWon: StatCard;
    conversionRate: StatCard;
  };
}

export interface PipelineStage {
  stage: string;
  dealCount: number;
  totalValue: number;
}

export interface PipelineOverview {
  stages: PipelineStage[];
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  actorName: string | null;
  createdAt: string;
}
