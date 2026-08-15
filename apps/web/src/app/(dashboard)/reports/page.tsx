"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ConversionFunnelChart } from "@/features/reports/components/ConversionFunnelChart";
import { useConversionFunnel } from "@/features/reports/hooks/use-reports";
import { RangeSelector } from "@/features/dashboard/components/RangeSelector";
import type { ReportsRange } from "@/features/reports/types";

export default function ReportsPage() {
  const [range, setRange] = useState<ReportsRange>("this_month");
  const funnel = useConversionFunnel(range);

  return (
    <>
      <Topbar title="Reports" />
      <main className="space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-end">
          <RangeSelector value={range} onChange={setRange} />
        </div>

        {funnel.isPending && (
          <div className="h-64 animate-pulse rounded-2xl bg-white/60" />
        )}
        {funnel.isError && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            Couldn't load the conversion funnel. Retry in a moment.
          </div>
        )}
        {funnel.data && (
          <>
            <ConversionFunnelChart stages={funnel.data.stages} />
            {funnel.data.disqualifiedCount > 0 && (
              <p className="text-xs text-ink-500">
                {funnel.data.disqualifiedCount} lead(s) disqualified during this period (not shown in funnel above).
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}
