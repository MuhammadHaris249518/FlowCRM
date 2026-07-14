"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { usePipelineBoard, useUpdateDealStage } from "../hooks/use-pipeline";
import { DealCard } from "./DealCard";
import { DealFormDialog } from "./DealFormDialog";
import { formatCurrency } from "@/lib/utils";
import type { DealStage } from "../types";

const STAGE_LABELS: Record<DealStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  MEETING: "Meeting",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export function PipelineBoard() {
  const board = usePipelineBoard();
  const updateStage = useUpdateDealStage();
  const [formOpen, setFormOpen] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  function handleDragStart(e: React.DragEvent, dealId: string) {
    e.dataTransfer.setData("text/plain", dealId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent, stage: DealStage) {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData("text/plain");
    if (dealId) updateStage.mutate({ id: dealId, stage });
  }

  if (board.isPending) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white/60" />;
  }

  if (board.isError) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        Couldn't load your pipeline. Retry in a moment.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Deal
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.data?.stages.map((column) => (
          <div
            key={column.stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(column.stage);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, column.stage)}
            className={`w-72 shrink-0 rounded-2xl border p-3 transition-colors ${
              dragOverStage === column.stage
                ? "border-brand-300 bg-brand-50/60"
                : "border-surface-border bg-surface-muted"
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                {STAGE_LABELS[column.stage]}
              </p>
              <span className="text-[11px] text-ink-300">{column.dealCount}</span>
            </div>
            <p className="mb-3 px-1 text-xs font-medium text-ink-700">
              {formatCurrency(column.totalValue)}
            </p>

            <div className="space-y-2">
              {column.deals.length === 0 ? (
                <p className="px-1 text-xs text-ink-300">No deals here yet.</p>
              ) : (
                column.deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onDragStart={handleDragStart}
                    onClick={() => {
                      /* TODO: deal detail drawer — follow-up pass */
                    }}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <DealFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
