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

export interface WinLossByRepDTO {
  assigneeId: string | null;
  assigneeName: string | null;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  winRate: number; // wonCount / (wonCount + lostCount), as a percent
}

export interface WinLossByReasonDTO {
  reason: string;
  count: number;
  value: number;
}

export interface WinLossReportDTO {
  range: "this_week" | "this_month" | "this_quarter";
  totalWon: number;
  totalLost: number;
  overallWinRate: number;
  byRep: WinLossByRepDTO[];
  byLostReason: WinLossByReasonDTO[];
}

export interface TrendPointDTO {
  period: string; // "2026-03" format
  revenue: number;
  newLeads: number;
  dealsWon: number;
  conversionRate: number;
}

export interface TrendsReportDTO {
  months: number;
  points: TrendPointDTO[];
}
