"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { useCompanies } from "../hooks/use-companies";
import { useCreateContact, useUpdateContact } from "../hooks/use-contacts";
import { contactFormSchema, type ContactFormValues } from "../validation";
import type { Contact } from "../types";

function stripEmpty<T extends Record<string, unknown>>(values: T): Partial<T> {
  const result: Partial<T> = {};
  (Object.keys(values) as (keyof T)[]).forEach((key) => {
    const value = values[key];
    if (value !== "" && value !== undefined) result[key] = value;
  });
  return result;
}

export function ContactFormDialog({
  open,
  onClose,
  contact,
}: {
  open: boolean;
  onClose: () => void;
  contact?: Contact;
}) {
  const isEditing = Boolean(contact);
  const companies = useCompanies({ pageSize: 100 });
  const createContact = useCreateContact();
  const updateContact = useUpdateContact(contact?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: contact?.fullName ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      title: contact?.title ?? "",
      companyId: contact?.companyId ?? "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    const payload = stripEmpty(values);
    if (isEditing) {
      await updateContact.mutateAsync(payload);
    } else {
      await createContact.mutateAsync(payload as ContactFormValues & { fullName: string });
    }
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Contact" : "New Contact"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" error={errors.fullName?.message}>
          <input
            {...register("fullName")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="jane@acme.com"
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input
            {...register("phone")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="+1 555 000 0000"
          />
        </Field>
        <Field label="Job title" error={errors.title?.message}>
          <input
            {...register("title")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="VP Sales"
          />
        </Field>
        <Field label="Company" error={errors.companyId?.message}>
          <select
            {...register("companyId")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          >
            <option value="">No company</option>
            {companies.data?.items.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
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
            {isEditing ? "Save Changes" : "Create Contact"}
          </button>
        </div>
      </form>
    </Modal>
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
