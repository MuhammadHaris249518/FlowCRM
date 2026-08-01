"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { useCreateCompany, useUpdateCompany } from "../hooks/use-companies";
import { companyFormSchema, type CompanyFormValues } from "../validation";
import type { Company } from "../types";

function stripEmpty<T extends Record<string, unknown>>(values: T): Partial<T> {
  const result: Partial<T> = {};
  (Object.keys(values) as (keyof T)[]).forEach((key) => {
    const value = values[key];
    if (value !== "" && value !== undefined) result[key] = value;
  });
  return result;
}

export function CompanyFormDialog({
  open,
  onClose,
  company,
}: {
  open: boolean;
  onClose: () => void;
  company?: Company;
}) {
  const isEditing = Boolean(company);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany(company?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: company?.name ?? "",
      domain: company?.domain ?? "",
      industry: company?.industry ?? "",
      website: company?.website ?? "",
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    const payload = stripEmpty(values);
    if (isEditing) {
      await updateCompany.mutateAsync(payload);
    } else {
      await createCompany.mutateAsync(payload as CompanyFormValues & { name: string });
    }
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Company" : "New Company"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Company name" error={errors.name?.message}>
          <input
            {...register("name")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="Acme Inc."
          />
        </Field>
        <Field label="Domain" error={errors.domain?.message}>
          <input
            {...register("domain")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="acme.com"
          />
        </Field>
        <Field label="Industry" error={errors.industry?.message}>
          <input
            {...register("industry")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="Software"
          />
        </Field>
        <Field label="Website" error={errors.website?.message}>
          <input
            {...register("website")}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
            placeholder="https://acme.com"
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
            {isEditing ? "Save Changes" : "Create Company"}
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
