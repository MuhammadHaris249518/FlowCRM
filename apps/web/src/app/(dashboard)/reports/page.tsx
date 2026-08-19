"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ConversionFunnelChart } from "@/features/reports/components/ConversionFunnelChart";
import { WinLossPanel } from "@/features/reports/components/WinLossPanel";
import { TrendsChart } from "@/features/reports/components/TrendsChart";
import {
  useConversionFunnel,
  useWinLossReport,
  useTrends,
} from "@/features/reports/hooks/use-reports";
import { RangeSelector } from "@/features/dashboard/components/RangeSelector";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import { reportsApi } from "@/features/reports/api/reports-api";
import type { ReportsRange } from "@/features/reports/types";

export default function ReportsPage() {
  const [range, setRange] = useState<ReportsRange>("this_month");
  const apiCtx = useApiContext();
  const funnel = useConversionFunnel(range);
  const winLoss = useWinLossReport(range);
  const trends = useTrends(6);

  const isLoading = funnel.isPending || winLoss.isPending || trends.isPending;
  const isError = funnel.isError || winLoss.isError || trends.isError;

  return (
    <>
      <Topbar title="Reports" />
      <main className="space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-end">
          <RangeSelector value={range} onChange={setRange} />
        </div>

        {isLoading && (
          <div className="h-64 animate-pulse rounded-2xl bg-white/60" />
        )}
        {isError && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            Couldn't load report data. Retry in a moment.
          </div>
        )}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {funnel.data && (
                <>
                  <div className="flex items-center justify-between">
                    <div />
                    <button
                      onClick={() => reportsApi.exportConversionFunnel(apiCtx, range)}
                      className="text-xs font-medium text-brand-500 hover:text-brand-600"
                    >
                      Export CSV
                    </button>
                  </div>
                  <ConversionFunnelChart stages={funnel.data.stages} />
                  {funnel.data.disqualifiedCount > 0 && (
                    <p className="text-xs text-ink-500">
                      {funnel.data.disqualifiedCount} lead(s) disqualified during this period (not shown in funnel above).
                    </p>
                  )}
                </>
              )}
              {trends.data && (
                <>
                  <div className="flex items-center justify-between">
                    <div />
                    <button
                      onClick={() => reportsApi.exportTrends(apiCtx, 6)}
                      className="text-xs font-medium text-brand-500 hover:text-brand-600"
                    >
                      Export CSV
                    </button>
                  </div>
                  <TrendsChart points={trends.data.points} />
                </>
              )}
            </div>

            <div>
              {winLoss.data && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div />
                    <button
                      onClick={() => reportsApi.exportWinLoss(apiCtx, range)}
                      className="text-xs font-medium text-brand-500 hover:text-brand-600"
                    >
                      Export CSV
                    </button>
                  </div>
                  <WinLossPanel report={winLoss.data} />
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
