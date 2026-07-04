"use client";

import type { DashboardRange } from "../types";

const OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
];

export function RangeSelector({
  value,
  onChange,
}: {
  value: DashboardRange;
  onChange: (range: DashboardRange) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DashboardRange)}
      className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm font-medium text-ink-700"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
