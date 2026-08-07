"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Props {
  name: string;
  onNameChange: (name: string) => void;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
  canEdit: boolean;
  dirty: boolean;
  saving: boolean;
  errors: string[];
  onSave: () => void;
}

export function WorkflowToolbar({
  name,
  onNameChange,
  isActive,
  onActiveChange,
  canEdit,
  dirty,
  saving,
  errors,
  onSave,
}: Props) {
  return (
    <div className="mb-4 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/automation"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-ink-500 hover:bg-surface-muted"
          aria-label="Back to workflows"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>

        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={!canEdit}
          placeholder="Untitled workflow"
          className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold text-ink-900 hover:border-surface-border focus:border-brand-400 focus:outline-none disabled:hover:border-transparent"
        />

        <label className="flex items-center gap-2 text-xs font-medium text-ink-700">
          <input
            type="checkbox"
            checked={isActive}
            disabled={!canEdit}
            onChange={(e) => onActiveChange(e.target.checked)}
            className="h-4 w-4 rounded border-surface-border"
          />
          Active
        </label>

        {dirty && !saving && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}

        {canEdit && (
          <button
            onClick={onSave}
            disabled={saving || errors.length > 0}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {saving ? "Saving…" : "Save workflow"}
          </button>
        )}

        {!canEdit && (
          <span className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink-500">
            View only — ask an owner or manager to make changes
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {errors.map((err) => (
            <li key={err}>• {err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
