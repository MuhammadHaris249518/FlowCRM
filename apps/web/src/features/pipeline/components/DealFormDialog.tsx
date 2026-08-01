"use client";

import { useState } from "react";
import { useCreateDeal } from "../hooks/use-pipeline";

export function DealFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createDeal = useCreateDeal();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numericValue = Number(value);
    if (!title.trim()) return setError("Title is required.");
    if (!value || Number.isNaN(numericValue) || numericValue < 0) {
      return setError("Enter a valid deal value.");
    }

    try {
      await createDeal.mutateAsync({ title: title.trim(), value: numericValue });
      setTitle("");
      setValue("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the deal.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel">
        <h2 className="text-sm font-semibold text-ink-900">New Deal</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
              placeholder="e.g. Acme Corp — Annual Plan"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500">Value (USD)</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="number"
              min="0"
              step="0.01"
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
              disabled={createDeal.isPending}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {createDeal.isPending ? "Creating…" : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
