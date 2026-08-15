import type { TrendPoint } from "../types";
import { formatCurrency } from "@/lib/utils";

export function TrendsChart({ points }: { points: TrendPoint[] }) {
  const maxRevenue = Math.max(...points.map((p) => p.revenue), 1);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-ink-900">Revenue Trend</h2>
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {points.map((p) => (
          <div key={p.period} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-brand-500"
              style={{ height: `${Math.max((p.revenue / maxRevenue) * 130, 2)}px` }}
              title={formatCurrency(p.revenue)}
            />
            <span className="text-[10px] text-ink-300">{p.period.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
