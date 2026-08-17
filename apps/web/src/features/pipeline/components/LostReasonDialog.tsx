"use client";

import { useState } from "react";
import type { DealLostReason } from "../types";

const REASONS: { value: DealLostReason; label: string }[] = [
  { value: "BUDGET", label: "Budget" },
  { value: "TIMING", label: "Timing" },
  { value: "COMPETITOR", label: "Lost to competitor" },
  { value: "NO_RESPONSE", label: "No response" },
  { value: "NOT_A_FIT", label: "Not a fit" },
  { value: "OTHER", label: "Other" },
];

export function LostReasonDialog({
  open,
  onCancel,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: DealLostReason) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState<DealLostReason>("BUDGET");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel">
        <h2 className="text-sm font-semibold text-ink-900">Why was this lost?</h2>
        <p className="mt-1 text-xs text-ink-500">
          This helps the team spot patterns in lost deals.
        </p>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as DealLostReason)}
          className="mt-4 w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-500 hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(reason)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Mark as Lost"}
          </button>
        </div>
      </div>
    </div>
  );
}
