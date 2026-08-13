"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { NODE_CONFIG_SCHEMAS, NODE_TYPE_DEFS } from "../lib/node-defs";
import type { BuilderNode } from "../lib/graph-transform";

interface Props {
  node: BuilderNode | null;
  onChange: (nodeId: string, config: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

/**
 * Renders a typed form for whichever node is currently selected. Local
 * `draft` state exists so free-text fields (title, field path) don't
 * commit to the canvas on every keystroke — commits happen onBlur, matching
 * the rest of the app's form patterns (react-hook-form's default mode).
 * Selects/number steppers commit immediately since there's no typing burst.
 */
export function NodeConfigPanel({ node, onChange, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Record<string, unknown>>(node?.data.config ?? {});

  useEffect(() => {
    setDraft(node?.data.config ?? {});
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!node) {
    return (
      <aside className="w-72 shrink-0 rounded-2xl bg-white p-5 text-sm text-ink-300 shadow-card">
        Select a node to edit its settings.
      </aside>
    );
  }

  const def = NODE_TYPE_DEFS[node.data.nodeType];
  const validation = NODE_CONFIG_SCHEMAS[node.data.nodeType].safeParse(draft);

  function commit(next: Record<string, unknown>) {
    setDraft(next);
    onChange(node!.id, next);
  }

  return (
    <aside className="w-72 shrink-0 rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{def.label}</p>
          {!def.implemented && (
            <p className="mt-0.5 text-[11px] text-amber-600">Not runnable yet — safe to build, won't execute.</p>
          )}
        </div>
        <button onClick={onClose} className="text-xs font-medium text-ink-300 hover:text-ink-700">
          Close
        </button>
      </div>

      <div className="space-y-4">
        {node.data.nodeType === "TRIGGER" && <TriggerFields draft={draft} commit={commit} />}
        {node.data.nodeType === "CONDITION" && <ConditionFields draft={draft} commit={commit} />}
        {node.data.nodeType === "DELAY" && <DelayFields draft={draft} commit={commit} />}
        {node.data.nodeType === "ACTION_STATIC" && <ActionStaticFields draft={draft} commit={commit} />}
        {node.data.nodeType === "ACTION_AI" && <ActionAiFields draft={draft} commit={commit} />}
      </div>

      {!validation.success && (
        <p className="mt-3 text-xs text-red-600">{validation.error.issues[0]?.message}</p>
      )}

      <button
        onClick={() => onDelete(node.id)}
        className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Delete node
      </button>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}

const selectClass = "w-full rounded-lg border border-surface-border px-3 py-2 text-sm";
const inputClass = selectClass;

function TriggerFields({ draft, commit }: { draft: Record<string, unknown>; commit: (v: Record<string, unknown>) => void }) {
  return (
    <Field label="Fires when">
      <select
        className={selectClass}
        value={(draft.trigger as string) ?? ""}
        onChange={(e) => commit({ ...draft, trigger: e.target.value })}
      >
        <option value="LEAD_CREATED">A lead is created</option>
        <option value="LEAD_STATUS_CHANGED">A lead's status changes</option>
        <option value="LEAD_SCORE_CHANGED">A lead's AI score changes</option>
        <option value="DEAL_STAGE_CHANGED">A deal's stage changes</option>
        <option value="TASK_OVERDUE">A task becomes overdue</option>
        <option value="ACTIVITY_LOGGED">An activity is logged</option>
      </select>
    </Field>
  );
}

function ConditionFields({ draft, commit }: { draft: Record<string, unknown>; commit: (v: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Field">
        <input
          className={inputClass}
          defaultValue={(draft.field as string) ?? ""}
          placeholder="entity.score"
          onBlur={(e) => commit({ ...draft, field: e.target.value })}
        />
      </Field>
      <Field label="Comparison">
        <select
          className={selectClass}
          value={(draft.op as string) ?? "eq"}
          onChange={(e) => commit({ ...draft, op: e.target.value })}
        >
          <option value="eq">Equals</option>
          <option value="neq">Does not equal</option>
          <option value="gte">Greater than or equal to</option>
          <option value="lte">Less than or equal to</option>
        </select>
      </Field>
      <Field label="Value">
        <input
          className={inputClass}
          defaultValue={String(draft.value ?? "")}
          onBlur={(e) => commit({ ...draft, value: e.target.value })}
        />
      </Field>
    </>
  );
}

function DelayFields({ draft, commit }: { draft: Record<string, unknown>; commit: (v: Record<string, unknown>) => void }) {
  return (
    <Field label="Wait (hours)">
      <input
        type="number"
        min={0.25}
        step={0.25}
        className={inputClass}
        defaultValue={typeof draft.hours === "number" ? draft.hours : 24}
        onBlur={(e) => commit({ ...draft, hours: Number(e.target.value) })}
      />
    </Field>
  );
}

function ActionStaticFields({ draft, commit }: { draft: Record<string, unknown>; commit: (v: Record<string, unknown>) => void }) {
  const action = (draft.action as string) ?? "CREATE_TASK";

  return (
    <>
      <Field label="Action">
        <select
          className={selectClass}
          value={action}
          onChange={(e) =>
            commit(
              e.target.value === "CREATE_TASK"
                ? { action: "CREATE_TASK", title: "Follow up", priority: "MEDIUM" }
                : { action: "UPDATE_LEAD_STATUS", status: "CONTACTED" }
            )
          }
        >
          <option value="CREATE_TASK">Create a task</option>
          <option value="UPDATE_LEAD_STATUS">Update lead status</option>
        </select>
      </Field>

      {action === "CREATE_TASK" && (
        <>
          <Field label="Task title">
            <input
              className={inputClass}
              defaultValue={(draft.title as string) ?? ""}
              onBlur={(e) => commit({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="Priority">
            <select
              className={selectClass}
              value={(draft.priority as string) ?? "MEDIUM"}
              onChange={(e) => commit({ ...draft, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </Field>
        </>
      )}

      {action === "UPDATE_LEAD_STATUS" && (
        <Field label="New status">
          <select
            className={selectClass}
            value={(draft.status as string) ?? "CONTACTED"}
            onChange={(e) => commit({ ...draft, status: e.target.value })}
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="DISQUALIFIED">Disqualified</option>
            <option value="CONVERTED">Converted</option>
          </select>
        </Field>
      )}
    </>
  );
}

function ActionAiFields({ draft, commit }: { draft: Record<string, unknown>; commit: (v: Record<string, unknown>) => void }) {
  return (
    <Field label="Instructions (draft only — not executed yet)">
      <textarea
        rows={4}
        className={inputClass}
        defaultValue={(draft.instructions as string) ?? ""}
        onBlur={(e) => commit({ ...draft, instructions: e.target.value })}
      />
    </Field>
  );
}
