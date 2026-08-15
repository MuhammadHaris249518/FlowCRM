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

export interface WinLossByRep {
  assigneeId: string | null;
  assigneeName: string | null;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  winRate: number;
}

export interface WinLossByReason {
  reason: string;
  count: number;
  value: number;
}

export interface WinLossReport {
  range: ReportsRange;
  totalWon: number;
  totalLost: number;
  overallWinRate: number;
  byRep: WinLossByRep[];
  byLostReason: WinLossByReason[];
}

export interface TrendPoint {
  period: string;
  revenue: number;
  newLeads: number;
  dealsWon: number;
  conversionRate: number;
}

export interface TrendsReport {
  months: number;
  points: TrendPoint[];
}
