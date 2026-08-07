"use client";

import { Handle, Position } from "reactflow";
import { AlertTriangle } from "lucide-react";
import { NODE_TYPE_DEFS } from "../../lib/node-defs";
import type { WorkflowNodeType } from "../../types";

export function BaseNode({
  nodeType,
  title,
  subtitle,
  selected,
}: {
  nodeType: WorkflowNodeType;
  title: string;
  subtitle: string;
  selected: boolean;
}) {
  const def = NODE_TYPE_DEFS[nodeType];
  const Icon = def.icon;

  return (
    <div
      className={`w-56 rounded-xl border bg-white p-3 shadow-card transition-shadow ${def.accent.split(" ")[2]} ${
        selected ? "ring-2 ring-brand-400" : ""
      }`}
    >
      {!def.isEntryPoint && (
        <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-ink-300" />
      )}

      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${def.accent}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink-900">{title}</p>
          <p className="truncate text-[11px] text-ink-500">{subtitle}</p>
        </div>
        {!def.implemented && (
          <span title="Not runnable yet" className="ml-auto shrink-0 text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-ink-300" />
    </div>
  );
}
