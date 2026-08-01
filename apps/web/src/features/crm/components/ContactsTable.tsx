"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useContacts, useDeleteContact } from "../hooks/use-contacts";
import { ContactFormDialog } from "./ContactFormDialog";
import type { Contact } from "../types";

export function ContactsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogContact, setDialogContact] = useState<Contact | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const contacts = useContacts({ page, pageSize: 20, search: search || undefined });
  const deleteContact = useDeleteContact();

  const totalPages = contacts.data
    ? Math.max(1, Math.ceil(contacts.data.total / contacts.data.pageSize))
    : 1;

  const openCreate = () => {
    setDialogContact(undefined);
    setDialogOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setDialogContact(contact);
    setDialogOpen(true);
  };

  const handleDelete = async (contact: Contact) => {
    if (!window.confirm(`Delete ${contact.fullName}?`)) return;
    await deleteContact.mutateAsync(contact.id);
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
            placeholder="Search contacts..."
            className="w-56 bg-transparent outline-none"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Contact
        </button>
      </div>

      {contacts.isPending && (
        <div className="py-10 text-center text-sm text-ink-500">Loading contacts...</div>
      )}
      {contacts.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Couldn't load contacts. Retry in a moment.
        </div>
      )}
      {contacts.data && contacts.data.items.length === 0 && (
        <div className="py-10 text-center text-sm text-ink-500">No contacts yet — create your first one.</div>
      )}

      {contacts.data && contacts.data.items.length > 0 && (
        <>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-ink-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Company</th>
                <th className="pb-2 font-medium">Owner</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.data.items.map((contact) => (
                <tr key={contact.id} className="border-b border-surface-border last:border-0">
                  <td className="py-3 font-medium text-ink-900">{contact.fullName}</td>
                  <td className="py-3 text-ink-500">{contact.email ?? "—"}</td>
                  <td className="py-3 text-ink-500">{contact.companyName ?? "—"}</td>
                  <td className="py-3 text-ink-500">{contact.ownerName ?? "Unassigned"}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEdit(contact)}
                        aria-label={`Edit ${contact.fullName}`}
                        className="text-ink-300 hover:text-brand-500"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => handleDelete(contact)}
                        aria-label={`Delete ${contact.fullName}`}
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
              Page {contacts.data.page} of {totalPages} — {contacts.data.total} total
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

      <ContactFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} contact={dialogContact} />
    </div>
  );
}
