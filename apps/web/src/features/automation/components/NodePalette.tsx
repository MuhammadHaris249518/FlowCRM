"use client";

import { PALETTE_ORDER, NODE_TYPE_DEFS } from "../lib/node-defs";
import type { WorkflowNodeType } from "../types";

// Drag payload read by WorkflowCanvas's onDrop handler.
export const PALETTE_DRAG_MIME = "application/flowcrm-node-type";

export function NodePalette({ hasTrigger }: { hasTrigger: boolean }) {
  return (
    <aside className="w-60 shrink-0 rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Nodes</h2>
      <p className="mb-3 text-[11px] text-ink-300">Drag a node onto the canvas.</p>

      <div className="space-y-2">
        {PALETTE_ORDER.map((type) => (
          <PaletteItem key={type} type={type} disabled={type === "TRIGGER" && hasTrigger} />
        ))}
      </div>
    </aside>
  );
}

function PaletteItem({ type, disabled }: { type: WorkflowNodeType; disabled: boolean }) {
  const def = NODE_TYPE_DEFS[type];
  const Icon = def.icon;

  return (
    <div
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_DRAG_MIME, type);
        e.dataTransfer.effectAllowed = "move";
      }}
      title={disabled ? "This workflow already has a Trigger node" : def.description}
      className={`flex items-start gap-2.5 rounded-xl border p-2.5 transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : `cursor-grab active:cursor-grabbing hover:bg-surface-muted ${def.accent.split(" ")[2]}`
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${def.accent}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-900">{def.label}</p>
        <p className="text-[11px] leading-snug text-ink-500">{def.description}</p>
      </div>
    </div>
  );
}
