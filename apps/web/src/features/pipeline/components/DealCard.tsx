"use client";

import type { Deal } from "../types";
import { formatCurrency } from "@/lib/utils";

export function DealCard({
  deal,
  onDragStart,
  onClick,
}: {
  deal: Deal;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={onClick}
      className="cursor-grab rounded-xl border border-surface-border bg-white p-3 shadow-card transition-shadow hover:shadow-panel active:cursor-grabbing"
    >
      <p className="truncate text-sm font-semibold text-ink-900">{deal.title}</p>
      <p className="mt-1 text-sm font-medium text-brand-600">{formatCurrency(deal.value)}</p>
      {deal.companyName && (
        <p className="mt-1 truncate text-xs text-ink-500">{deal.companyName}</p>
      )}
      {deal.assigneeName && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full bg-brand-100 text-[9px] font-semibold leading-4 text-brand-600 text-center">
            {deal.assigneeName.charAt(0)}
          </span>
          <span className="truncate text-[11px] text-ink-300">{deal.assigneeName}</span>
        </div>
      )}
    </div>
  );
}
