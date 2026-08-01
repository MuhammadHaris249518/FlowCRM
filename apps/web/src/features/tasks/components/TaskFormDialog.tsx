"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/shared/Modal";
import { useCreateTask, useUpdateTask } from "../hooks/use-tasks";
import {
  createTaskFormSchema,
  editTaskFormSchema,
  TASK_PRIORITIES,
  type CreateTaskFormValues,
  type EditTaskFormValues,
} from "../validation";
import type { Task } from "../types";

function stripEmpty<T extends Record<string, unknown>>(values: T): Partial<T> {
  const result: Partial<T> = {};
  (Object.keys(values) as (keyof T)[]).forEach((key) => {
    const value = values[key];
    if (value !== "" && value !== undefined) result[key] = value;
  });
  return result;
}

// datetime-local inputs give "2026-07-20T14:30" — the backend's z.coerce.date()
// parses that fine, so no conversion is needed beyond stripping empty strings.

export function TaskFormDialog({
  open,
  onClose,
  task,
  defaultDueAt,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaultDueAt?: string; // used when opened from a calendar day cell
}) {
  const isEditing = Boolean(task);

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Task" : "New Task"}>
      {isEditing ? (
        <EditTaskForm task={task as Task} onClose={onClose} />
      ) : (
        <CreateTaskForm onClose={onClose} defaultDueAt={defaultDueAt} />
      )}
    </Modal>
  );
}

function CreateTaskForm({
  onClose,
  defaultDueAt,
}: {
  onClose: () => void;
  defaultDueAt?: string;
}) {
  const createTask = useCreateTask();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: { title: "", description: "", priority: "MEDIUM", dueAt: defaultDueAt ?? "" },
  });

  const onSubmit = async (values: CreateTaskFormValues) => {
    const payload = stripEmpty(values);
    await createTask.mutateAsync(payload as CreateTaskFormValues & { title: string });
    reset();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Title" error={errors.title?.message}>
        <input
          {...register("title")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="Follow up with Jane"
        />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          placeholder="Optional details..."
        />
      </Field>
      <Field label="Priority" error={errors.priority?.message}>
        <select
          {...register("priority")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        >
          {TASK_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Due date" error={errors.dueAt?.message}>
        <input
          type="datetime-local"
          {...register("dueAt")}
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
          Create Task
        </button>
      </div>
    </form>
  );
}

function EditTaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useUpdateTask(task.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      dueAt: task.dueAt ? task.dueAt.slice(0, 16) : "", // ISO -> datetime-local value
    },
  });

  const onSubmit = async (values: EditTaskFormValues) => {
    const payload = stripEmpty(values);
    await updateTask.mutateAsync(payload);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {(task.contactName || task.dealTitle || task.leadContactName) && (
        <div className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-500">
          Linked to: {[task.contactName, task.dealTitle, task.leadContactName].filter(Boolean).join(" · ")}
        </div>
      )}
      <Field label="Title" error={errors.title?.message}>
        <input
          {...register("title")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Priority" error={errors.priority?.message}>
        <select
          {...register("priority")}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        >
          {TASK_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Due date" error={errors.dueAt?.message}>
        <input
          type="datetime-local"
          {...register("dueAt")}
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
