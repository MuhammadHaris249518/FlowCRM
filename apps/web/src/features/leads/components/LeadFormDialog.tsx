"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { useCreateLead, useUpdateLead } from "../hooks/use-leads";
import {
  createLeadFormSchema,
  editLeadFormSchema,
  LEAD_STATUSES,
  type CreateLeadFormValues,
  type EditLeadFormValues,
} from "../validation";
import type { Lead } from "../types";

function stripEmpty<T extends Record<string, unknown>>(values: T): Partial<T> {
  const result: Partial<T> = {};
  (Object.keys(values) as (keyof T)[]).forEach((key) => {
    const value = values[key];
    if (value !== "" && value !== undefined) result[key] = value;
  });
  return result;
}

export function LeadFormDialog({
  open,
  onClose,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  lead?: Lead;
}) {
  const isEditing = Boolean(lead);

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Lead" : "New Lead"}>
      {isEditing ? (
        <EditLeadForm lead={lead as Lead} onClose={onClose} />
      ) : (
        <CreateLeadForm onClose={onClose} />
      )}
    </Modal>
  );
}

function CreateLeadForm({ onClose }: { onClose: () => void }) {
  const createLead = useCreateLead();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: { contactFullName: "", contactEmail: "", contactPhone: "", source: "" },
  });

  const onSubmit = async (values: CreateLeadFormValues) => {
    const payload = stripEmpty(values);
    await createLead.mutateAsync(payload as CreateLeadFormValues & { contactFullName: string });
    reset();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Contact name" error={errors.contactFullName?.message}>
        <input
          {...register("contactFullName")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="Jane Doe"
        />
      </Field>
      <Field label="Contact email" error={errors.contactEmail?.message}>
        <input
          {...register("contactEmail")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="jane@example.com"
        />
      </Field>
      <Field label="Contact phone" error={errors.contactPhone?.message}>
        <input
          {...register("contactPhone")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="+1 555 0100"
        />
      </Field>
      <Field label="Source" error={errors.source?.message}>
        <input
          {...register("source")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="Website Form"
        />
      </Field>
      <Field label="Notes" error={errors.notes?.message}>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="Budget, timeline, anything relevant..."
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Create Lead
        </button>
      </div>
    </form>
  );
}

function EditLeadForm({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const updateLead = useUpdateLead(lead.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditLeadFormValues>({
    resolver: zodResolver(editLeadFormSchema),
    defaultValues: {
      status: lead.status,
      source: lead.source ?? "",
      notes: lead.notes ?? "",
      score: lead.score,
    },
  });

  const onSubmit = async (values: EditLeadFormValues) => {
    const payload = stripEmpty(values);
    await updateLead.mutateAsync(payload);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-500">
        {lead.contactName ?? "No linked contact"}
      </div>
      <Field label="Status" error={errors.status?.message}>
        <select
          {...register("status")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        >
          {LEAD_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Source" error={errors.source?.message}>
        <input
          {...register("source")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="Website Form"
        />
      </Field>
      <Field label="Notes" error={errors.notes?.message}>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="Budget, timeline, anything relevant..."
        />
      </Field>
      <Field label="Score (0-100)" error={errors.score?.message}>
        <input
          type="number"
          min={0}
          max={100}
          {...register("score", { valueAsNumber: true })}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
