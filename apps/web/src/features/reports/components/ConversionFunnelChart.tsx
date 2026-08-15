import type { FunnelStage } from "../types";

export function ConversionFunnelChart({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-ink-900">Conversion Funnel</h2>
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.stage}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-ink-700">{stage.label}</span>
              <span className="text-ink-500">
                {stage.count}
                {stage.conversionRateFromPrevious !== null && (
                  <span className="ml-2 text-ink-300">
                    ({stage.conversionRateFromPrevious}% from previous)
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-surface-muted">
              <div
                className="h-3 rounded-full bg-brand-500"
                style={{ width: `${Math.max((stage.count / maxCount) * 100, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
