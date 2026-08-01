"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCardGrid } from "@/features/dashboard/components/StatCardGrid";
import { PipelineOverview } from "@/features/dashboard/components/PipelineOverview";
import { RecentActivityFeed } from "@/features/dashboard/components/RecentActivityFeed";
import { AIInsightsPanel } from "@/features/dashboard/components/AIInsightsPanel";
import { RangeSelector } from "@/features/dashboard/components/RangeSelector";
import {
  useDashboardSummary,
  usePipelineOverview,
  useRecentActivities,
} from "@/features/dashboard/hooks/use-dashboard";
import type { DashboardRange } from "@/features/dashboard/types";

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("this_month");

  const summary = useDashboardSummary(range);
  const pipeline = usePipelineOverview();
  const activities = useRecentActivities(5);

  return (
    <>
      <Topbar title="Dashboard" />

      <main className="space-y-8 p-6 sm:p-8">
        <div className="flex items-center justify-end">
          <RangeSelector value={range} onChange={setRange} />
        </div>

        {summary.isPending && <StatCardSkeleton />}
        {summary.isError && (
          <ErrorState message="Couldn't load your dashboard stats. Retry in a moment." />
        )}
        {summary.data && <StatCardGrid stats={summary.data.stats} />}

        {pipeline.isPending && <SectionSkeleton />}
        {pipeline.isError && <ErrorState message="Couldn't load pipeline data." />}
        {pipeline.data && <PipelineOverview stages={pipeline.data.stages} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AIInsightsPanel />

          {activities.isPending && <SectionSkeleton />}
          {activities.isError && <ErrorState message="Couldn't load recent activity." />}
          {activities.data && <RecentActivityFeed activities={activities.data} />}
        </div>
      </main>
    </>
  );
}

function StatCardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/60" />
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white/60" />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}
