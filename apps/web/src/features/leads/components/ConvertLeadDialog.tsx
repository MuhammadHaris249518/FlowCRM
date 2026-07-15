"use client";

import { useState } from "react";
import { useConvertLead } from "../hooks/use-leads";
import type { Lead } from "../types";

export function ConvertLeadDialog({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const convertLead = useConvertLead();

  if (!lead) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numericValue = Number(dealValue);
    if (!dealValue || Number.isNaN(numericValue) || numericValue < 0) {
      return setError("Enter the deal's value to convert this lead.");
    }

    try {
      await convertLead.mutateAsync({
        id: lead!.id,
        input: { dealValue: numericValue, dealTitle: dealTitle.trim() || undefined },
      });
      setDealTitle("");
      setDealValue("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert this lead.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel">
        <h2 className="text-sm font-semibold text-ink-900">Convert to Deal</h2>
        <p className="mt-1 text-xs text-ink-500">
          {lead.contactName ?? "This lead"} will move to your pipeline in the New stage.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-500">Deal title (optional)</label>
            <input
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
              placeholder={`${lead.contactName ?? "New Lead"} — Deal`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500">Deal value (USD)</label>
            <input
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              autoFocus
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-500 hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={convertLead.isPending}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {convertLead.isPending ? "Converting…" : "Convert Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
