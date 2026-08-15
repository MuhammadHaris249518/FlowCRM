import type { WinLossReport } from "../types";
import { formatCurrency } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  BUDGET: "Budget",
  TIMING: "Timing",
  COMPETITOR: "Lost to competitor",
  NO_RESPONSE: "No response",
  NOT_A_FIT: "Not a fit",
  OTHER: "Other",
  UNSPECIFIED: "No reason given",
};

export function WinLossPanel({ report }: { report: WinLossReport }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-ink-900">Win / Loss</h2>
      <p className="mb-4 text-sm text-ink-500">
        {report.totalWon} won, {report.totalLost} lost — {report.overallWinRate}% win rate
      </p>

      <h3 className="mb-2 text-xs font-semibold uppercase text-ink-300">By rep</h3>
      <ul className="mb-4 space-y-1">
        {report.byRep.map((row) => (
          <li key={row.assigneeId ?? "unassigned"} className="flex justify-between text-sm">
            <span className="text-ink-700">{row.assigneeName}</span>
            <span className="text-ink-500">
              {row.wonCount}W / {row.lostCount}L ({row.winRate}%) — {formatCurrency(row.wonValue)}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mb-2 text-xs font-semibold uppercase text-ink-300">Lost reasons</h3>
      <ul className="space-y-1">
        {report.byLostReason.map((row) => (
          <li key={row.reason} className="flex justify-between text-sm">
            <span className="text-ink-700">{REASON_LABELS[row.reason] ?? row.reason}</span>
            <span className="text-ink-500">
              {row.count} ({formatCurrency(row.value)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
