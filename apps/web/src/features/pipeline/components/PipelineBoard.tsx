"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePipelineBoard, useUpdateDealStage } from "../hooks/use-pipeline";
import { DealCard } from "./DealCard";
import { DealFormDialog } from "./DealFormDialog";
import { formatCurrency } from "@/lib/utils";
import type { DealStage } from "../types";

const STAGE_META: Record<DealStage, { label: string; dot: string }> = {
  NEW: { label: "New", dot: "bg-blue-400" },
  CONTACTED: { label: "Contacted", dot: "bg-sky-400" },
  QUALIFIED: { label: "Qualified", dot: "bg-violet-400" },
  MEETING: { label: "Meeting", dot: "bg-amber-400" },
  PROPOSAL: { label: "Proposal", dot: "bg-brand-400" },
  NEGOTIATION: { label: "Negotiation", dot: "bg-brand-600" },
  WON: { label: "Won", dot: "bg-emerald-500" },
  LOST: { label: "Lost", dot: "bg-ink-300" },
};

const COLUMN_WIDTH = 256; // px — must match w-64 below

export function PipelineBoard() {
  const board = usePipelineBoard();
  const updateStage = useUpdateDealStage();
  const [formOpen, setFormOpen] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollByColumns(direction: -1 | 1) {
    scrollRef.current?.scrollBy({ left: direction * (COLUMN_WIDTH + 12), behavior: "smooth" });
  }

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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {board.data?.stages.reduce((sum, s) => sum + s.dealCount, 0) ?? 0} deals across your
          pipeline
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByColumns(-1)}
            aria-label="Scroll pipeline left"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-ink-500 transition-colors hover:bg-surface-muted sm:flex"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            onClick={() => scrollByColumns(1)}
            aria-label="Scroll pipeline right"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-ink-500 transition-colors hover:bg-surface-muted sm:flex"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Deal
          </button>
        </div>
      </div>

      <div className="relative -mx-6 sm:-mx-8">
        {/* Edge fades hint there's more to scroll to — purely visual, non-interactive */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 sm:w-8 bg-gradient-to-r from-surface-muted to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 sm:w-8 bg-gradient-to-l from-surface-muted to-transparent"
          aria-hidden
        />

        <div
          ref={scrollRef}
          className="board-scroll flex gap-3 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollSnapType: "x proximity" }}
        >
          {/* Spacer to keep the first column out from under the left fade when scrolled all the way left */}
          <div className="w-3 sm:w-5 shrink-0" aria-hidden />

          {board.data?.stages.map((column) => {
            const meta = STAGE_META[column.stage];
            const isClosed = column.stage === "WON" || column.stage === "LOST";
            const isFirstClosedStage = column.stage === "WON";

            return (
              <div
                key={column.stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(column.stage);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, column.stage)}
                style={{ scrollSnapAlign: "start" }}
                className={`w-64 shrink-0 rounded-2xl border p-3 shadow-card transition-colors ${
                  isFirstClosedStage ? "ml-3 border-l-2 border-l-surface-border pl-3" : ""
                } ${
                  dragOverStage === column.stage
                    ? "border-brand-300 bg-brand-50/50"
                    : isClosed
                      ? "border-surface-border bg-surface-muted/40"
                      : "border-surface-border bg-white"
                }`}
              >
                <div className="mb-1 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-700">
                      {meta.label}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-500">
                    {column.dealCount}
                  </span>
                </div>

                <p
                  className={`mb-3 px-1 text-sm font-semibold ${
                    column.dealCount === 0 ? "text-ink-300" : "text-ink-900"
                  }`}
                >
                  {column.dealCount === 0 ? "—" : formatCurrency(column.totalValue)}
                </p>

                <div className="space-y-2">
                  {column.deals.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-surface-border p-4 text-center text-xs text-ink-300">
                      No deals yet
                    </div>
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
            );
          })}

          {/* Spacer to keep the last column out from under the right fade when scrolled all the way right. Guaranteed cross-browser unlike padding-right on a flex container. */}
          <div className="w-3 sm:w-5 shrink-0" aria-hidden />
        </div>
      </div>

      <DealFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
