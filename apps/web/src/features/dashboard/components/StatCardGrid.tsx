import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { StatCard } from "../types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

function formatValue(stat: StatCard): string {
  if (stat.format === "currency") return formatCurrency(stat.value);
  if (stat.format === "percent") return formatPercent(stat.value);
  return formatNumber(stat.value);
}

export function StatCardGrid({
  stats,
}: {
  stats: { revenue: StatCard; newLeads: StatCard; dealsWon: StatCard; conversionRate: StatCard };
}) {
  const cards = [stats.revenue, stats.newLeads, stats.dealsWon, stats.conversionRate];
  const accents = ["bg-emerald-400", "bg-blue-400", "bg-amber-400", "bg-brand-400"];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat, i) => {
        const isPositive = stat.deltaPercent >= 0;
        return (
          <div
            key={stat.label}
            className="rounded-2xl bg-white p-5 shadow-card"
          >
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-6 rounded-full ${accents[i]}`} />
              <p className="text-xs text-ink-500">{stat.label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{formatValue(stat)}</p>
            <div
              className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                isPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {Math.abs(stat.deltaPercent)}% vs last period
            </div>
          </div>
        );
      })}
    </div>
  );
}
