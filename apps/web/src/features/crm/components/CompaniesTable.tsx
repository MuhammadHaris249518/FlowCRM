"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCompanies, useDeleteCompany } from "../hooks/use-companies";
import { CompanyFormDialog } from "./CompanyFormDialog";
import type { Company } from "../types";

export function CompaniesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogCompany, setDialogCompany] = useState<Company | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const companies = useCompanies({ page, pageSize: 20, search: search || undefined });
  const deleteCompany = useDeleteCompany();

  const totalPages = companies.data
    ? Math.max(1, Math.ceil(companies.data.total / companies.data.pageSize))
    : 1;

  const openCreate = () => {
    setDialogCompany(undefined);
    setDialogOpen(true);
  };

  const openEdit = (company: Company) => {
    setDialogCompany(company);
    setDialogOpen(true);
  };

  const handleDelete = async (company: Company) => {
    if (!window.confirm(`Delete ${company.name}? Its contacts will be kept but unlinked.`)) return;
    await deleteCompany.mutateAsync(company.id);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm text-ink-500">
          <Search className="h-4 w-4" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search companies..."
            className="w-56 bg-transparent outline-none"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Company
        </button>
      </div>

      {companies.isPending && (
        <div className="py-10 text-center text-sm text-ink-500">Loading companies...</div>
      )}
      {companies.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Couldn't load companies. Retry in a moment.
        </div>
      )}
      {companies.data && companies.data.items.length === 0 && (
        <div className="py-10 text-center text-sm text-ink-500">No companies yet — create your first one.</div>
      )}

      {companies.data && companies.data.items.length > 0 && (
        <>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-ink-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Domain</th>
                <th className="pb-2 font-medium">Industry</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {companies.data.items.map((company) => (
                <tr key={company.id} className="border-b border-surface-border last:border-0">
                  <td className="py-3 font-medium text-ink-900">{company.name}</td>
                  <td className="py-3 text-ink-500">{company.domain ?? "—"}</td>
                  <td className="py-3 text-ink-500">{company.industry ?? "—"}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEdit(company)}
                        aria-label={`Edit ${company.name}`}
                        className="text-ink-300 hover:text-brand-500"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
                        aria-label={`Delete ${company.name}`}
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
              Page {companies.data.page} of {totalPages} — {companies.data.total} total
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

      <CompanyFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} company={dialogCompany} />
    </div>
  );
}
