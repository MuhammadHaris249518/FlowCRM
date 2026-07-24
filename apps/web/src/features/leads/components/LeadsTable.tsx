"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useDeleteLead, useLeads, useScoreLead } from "../hooks/use-leads";
import { LeadFormDialog } from "./LeadFormDialog";
import { ConvertLeadDialog } from "./ConvertLeadDialog";
import type { Lead, LeadStatus } from "../types";

const STATUS_OPTIONS: { value: LeadStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "DISQUALIFIED", label: "Disqualified" },
  { value: "CONVERTED", label: "Converted" },
];

const STATUS_BADGE: Record<LeadStatus, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  QUALIFIED: "bg-brand-50 text-brand-600",
  DISQUALIFIED: "bg-red-50 text-red-700",
  CONVERTED: "bg-emerald-50 text-emerald-700",
};

export function LeadsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [dialogLead, setDialogLead] = useState<Lead | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const leads = useLeads({
    page,
    pageSize: 20,
    search: search || undefined,
    status: status || undefined,
  });
  const deleteLead = useDeleteLead();
  const scoreLead = useScoreLead();
  const [scoringLeadId, setScoringLeadId] = useState<string | null>(null);

  const handleScore = async (lead: Lead) => {
    setScoringLeadId(lead.id);
    try {
      await scoreLead.mutateAsync(lead.id);
    } finally {
      setScoringLeadId(null);
    }
  };

  const totalPages = leads.data
    ? Math.max(1, Math.ceil(leads.data.total / leads.data.pageSize))
    : 1;

  const openCreate = () => {
    setDialogLead(undefined);
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setDialogLead(lead);
    setDialogOpen(true);
  };

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`Delete this lead${lead.contactName ? ` for ${lead.contactName}` : ""}?`)) return;
    await deleteLead.mutateAsync(lead.id);
  };

  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const handleConvert = (lead: Lead) => setConvertingLead(lead);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm text-ink-500">
            <Search className="h-4 w-4" aria-hidden />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search leads..."
              className="w-56 bg-transparent outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as LeadStatus | "");
            }}
            className="rounded-lg border border-surface-border px-3 py-2 text-sm text-ink-700"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Lead
        </button>
      </div>

      {leads.isPending && (
        <div className="py-10 text-center text-sm text-ink-500">Loading leads...</div>
      )}
      {leads.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Couldn't load leads. Retry in a moment.
        </div>
      )}
      {leads.data && leads.data.items.length === 0 && (
        <div className="py-10 text-center text-sm text-ink-500">No leads yet — create your first one.</div>
      )}

      {leads.data && leads.data.items.length > 0 && (
        <>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-ink-500">
                <th className="pb-2 font-medium">Contact</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">Assignee</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leads.data.items.map((lead) => (
                <tr key={lead.id} className="border-b border-surface-border last:border-0">
                  <td className="py-3">
                    <div className="font-medium text-ink-900">{lead.contactName ?? "—"}</div>
                    <div className="text-xs text-ink-300">{lead.contactEmail ?? ""}</div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3 text-ink-500">{lead.source ?? "—"}</td>
                  <td className="py-3 text-ink-500">{lead.score}</td>
                  <td className="py-3 text-ink-500">{lead.assigneeName ?? "Unassigned"}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleScore(lead)}
                        disabled={scoringLeadId === lead.id}
                        aria-label="Score with AI"
                        className="text-ink-300 hover:text-brand-500 disabled:opacity-40"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden />
                      </button>
                      {lead.status !== "CONVERTED" && (
                        <button
                          onClick={() => handleConvert(lead)}
                          aria-label="Mark as converted"
                          className="text-ink-300 hover:text-emerald-600"
                        >
                          <Check className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(lead)}
                        aria-label="Edit lead"
                        className="text-ink-300 hover:text-brand-500"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => handleDelete(lead)}
                        aria-label="Delete lead"
                        className="text-ink-300 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
            <span>
              Page {leads.data.page} of {totalPages} — {leads.data.total} total
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

      <LeadFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} lead={dialogLead} />
      <ConvertLeadDialog lead={convertingLead} onClose={() => setConvertingLead(null)} />
    </div>
  );
}
