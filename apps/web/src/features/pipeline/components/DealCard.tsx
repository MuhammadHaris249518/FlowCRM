"use client";

import { Building2 } from "lucide-react";
import type { Deal, DealStage } from "../types";
import { formatCurrency } from "@/lib/utils";

const STAGE_ACCENT: Record<DealStage, string> = {
  NEW: "border-l-blue-400",
  CONTACTED: "border-l-sky-400",
  QUALIFIED: "border-l-violet-400",
  MEETING: "border-l-amber-400",
  PROPOSAL: "border-l-brand-400",
  NEGOTIATION: "border-l-brand-600",
  WON: "border-l-emerald-500",
  LOST: "border-l-ink-300",
};

export function DealCard({
  deal,
  onDragStart,
  onClick,
}: {
  deal: Deal;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onClick: () => void;
}) {
  const isLost = deal.stage === "LOST";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={onClick}
      className={`cursor-grab rounded-xl border-l-4 bg-white p-3 shadow-card transition-shadow hover:shadow-panel active:cursor-grabbing ${
        STAGE_ACCENT[deal.stage]
      } ${isLost ? "opacity-70" : ""}`}
    >
      <p className="truncate text-sm font-semibold text-ink-900">{deal.title}</p>
      <p className="mt-1 text-sm font-semibold text-brand-600">{formatCurrency(deal.value)}</p>

      {deal.companyName && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
          <Building2 className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{deal.companyName}</span>
        </div>
      )}

      {deal.assigneeName && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-surface-border pt-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-600">
            {deal.assigneeName.charAt(0)}
          </span>
          <span className="truncate text-[11px] text-ink-300">{deal.assigneeName}</span>
        </div>
      )}
    </div>
  );
}
