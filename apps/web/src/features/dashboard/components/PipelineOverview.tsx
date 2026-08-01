import Link from "next/link";
import type { PipelineStage } from "../types";
import { formatCurrency } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New Lead",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  MEETING: "Meeting",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export function PipelineOverview({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Sales Pipeline</h2>
        <Link href="/pipeline" className="text-xs font-medium text-brand-500 hover:text-brand-600">
          View Pipeline →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 divide-x divide-surface-border sm:grid-cols-4 lg:grid-cols-7 lg:gap-x-0">
        {stages.map((stage) => (
          <div key={stage.stage} className="pl-0 first:pl-0 lg:pl-4 lg:first:pl-0">
            <p className="truncate text-xs text-ink-500">
              {STAGE_LABELS[stage.stage] ?? stage.stage}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {formatCurrency(stage.totalValue)}
            </p>
            <p className="text-xs text-ink-300">{stage.dealCount} deals</p>
          </div>
        ))}
      </div>
    </div>
  );
}
