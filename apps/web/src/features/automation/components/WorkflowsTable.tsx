"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, Zap, ZapOff } from "lucide-react";
import { useMe } from "@/features/auth/hooks/use-me";
import { useActiveOrganization } from "@/features/auth/provider/ActiveOrganizationProvider";
import { useWorkflows } from "../hooks/use-automation";
import { DeleteWorkflowDialog } from "./DeleteWorkflowDialog";
import type { WorkflowDTO } from "../types";

const EDITOR_ROLES = new Set(["ORG_OWNER", "SALES_MANAGER", "SUPER_ADMIN"]);

export function WorkflowsTable() {
  const [page, setPage] = useState(1);
  const workflows = useWorkflows({ page, pageSize: 20 });
  const [pendingDelete, setPendingDelete] = useState<WorkflowDTO | null>(null);

  const me = useMe();
  const { activeOrganizationId } = useActiveOrganization();
  const activeRole = me.data?.organizations.find((o) => o.id === activeOrganizationId)?.role;
  const canEdit = activeRole ? EDITOR_ROLES.has(activeRole) : false;

  const totalPages = workflows.data ? Math.max(1, Math.ceil(workflows.data.total / workflows.data.pageSize)) : 1;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">Automate follow-ups, task creation, and status changes.</p>
        {canEdit && (
          <Link
            href="/automation/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Workflow
          </Link>
        )}
      </div>

      {workflows.isPending && <div className="py-10 text-center text-sm text-ink-500">Loading workflows...</div>}
      {workflows.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Couldn't load workflows. Retry in a moment.
        </div>
      )}
      {workflows.data && workflows.data.items.length === 0 && (
        <div className="py-10 text-center text-sm text-ink-500">
          No workflows yet — {canEdit ? "create your first one." : "ask an owner or manager to set one up."}
        </div>
      )}

      {workflows.data && workflows.data.items.length > 0 && (
        <>
          <ul className="divide-y divide-surface-border">
            {workflows.data.items.map((wf) => (
              <li key={wf.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {wf.isActive ? (
                    <Zap className="h-4 w-4 text-emerald-500" aria-hidden />
                  ) : (
                    <ZapOff className="h-4 w-4 text-ink-300" aria-hidden />
                  )}
                  <div>
                    <p className="text-sm font-medium text-ink-900">{wf.name}</p>
                    <p className="text-xs text-ink-300">
                      {wf.nodes.length} node{wf.nodes.length === 1 ? "" : "s"} · {wf.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/automation/${wf.id}`}
                    aria-label={canEdit ? `Edit ${wf.name}` : `View ${wf.name}`}
                    className="text-ink-300 hover:text-brand-500"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
                  {canEdit && (
                    <button
                      onClick={() => setPendingDelete(wf)}
                      aria-label={`Delete ${wf.name}`}
                      className="text-ink-300 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
            <span>
              Page {workflows.data.page} of {totalPages} — {workflows.data.total} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-surface-border px-3 py-1.5 font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-surface-border px-3 py-1.5 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <DeleteWorkflowDialog workflow={pendingDelete} onClose={() => setPendingDelete(null)} />
    </div>
  );
}
