import type { ConversionFunnelDTO, WinLossReportDTO, TrendsReportDTO } from "./reports.types";

// Minimal, dependency-free CSV cell escaper: wraps in quotes only when the
// value actually contains a comma, quote, or newline, and doubles up any
// embedded quotes — the two rules that matter for a valid CSV cell.
function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(cells: (string | number)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

export function conversionFunnelToCsv(report: ConversionFunnelDTO): string {
  const lines = [
    toCsvRow(["Stage", "Count", "Conversion Rate From Previous (%)"]),
    ...report.stages.map((s) =>
      toCsvRow([s.label, s.count, s.conversionRateFromPrevious ?? ""])
    ),
    "",
    toCsvRow(["Disqualified", report.disqualifiedCount]),
    toCsvRow(["Total Leads", report.totalLeads]),
  ];
  return lines.join("\n");
}

export function winLossToCsv(report: WinLossReportDTO): string {
  const lines = [
    toCsvRow(["Summary"]),
    toCsvRow(["Total Won", report.totalWon]),
    toCsvRow(["Total Lost", report.totalLost]),
    toCsvRow(["Overall Win Rate (%)", report.overallWinRate]),
    "",
    toCsvRow(["By Rep"]),
    toCsvRow(["Rep", "Won Count", "Won Value", "Lost Count", "Lost Value", "Win Rate (%)"]),
    ...report.byRep.map((r) =>
      toCsvRow([r.assigneeName ?? "Unassigned", r.wonCount, r.wonValue, r.lostCount, r.lostValue, r.winRate])
    ),
    "",
    toCsvRow(["By Lost Reason"]),
    toCsvRow(["Reason", "Count", "Value"]),
    ...report.byLostReason.map((r) => toCsvRow([r.reason, r.count, r.value])),
  ];
  return lines.join("\n");
}

export function trendsToCsv(report: TrendsReportDTO): string {
  const lines = [
    toCsvRow(["Period", "Revenue", "New Leads", "Deals Won", "Conversion Rate (%)"]),
    ...report.points.map((p) =>
      toCsvRow([p.period, p.revenue, p.newLeads, p.dealsWon, p.conversionRate])
    ),
  ];
  return lines.join("\n");
}
