"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCompleteTask, useDeleteTask, useReopenTask, useTasks } from "../hooks/use-tasks";
import { TaskFormDialog } from "./TaskFormDialog";
import type { Task, TaskPriority } from "../types";

const PRIORITY_OPTIONS: { value: TaskPriority | ""; label: string }[] = [
  { value: "", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: "bg-blue-50 text-blue-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

function formatDue(dueAt: string | null): string {
  if (!dueAt) return "No due date";
  return new Date(dueAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TasksTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [completed, setCompleted] = useState<"true" | "false" | "">("false");
  const [dialogTask, setDialogTask] = useState<Task | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const tasks = useTasks({
    page,
    pageSize: 20,
    search: search || undefined,
    priority: priority || undefined,
    completed: completed || undefined,
  });
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const deleteTask = useDeleteTask();

  const totalPages = tasks.data
    ? Math.max(1, Math.ceil(tasks.data.total / tasks.data.pageSize))
    : 1;

  const openCreate = () => {
    setDialogTask(undefined);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setDialogTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await deleteTask.mutateAsync(task.id);
  };

  const toggleComplete = async (task: Task) => {
    if (task.completedAt) {
      await reopenTask.mutateAsync(task.id);
    } else {
      await completeTask.mutateAsync(task.id);
    }
  };

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
              placeholder="Search tasks..."
              className="w-56 bg-transparent outline-none"
            />
          </div>
          <select
            value={priority}
            onChange={(e) => {
              setPage(1);
              setPriority(e.target.value as TaskPriority | "");
            }}
            className="rounded-lg border border-surface-border px-3 py-2 text-sm text-ink-700"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={completed}
            onChange={(e) => {
              setPage(1);
              setCompleted(e.target.value as "true" | "false" | "");
            }}
            className="rounded-lg border border-surface-border px-3 py-2 text-sm text-ink-700"
          >
            <option value="false">Open</option>
            <option value="true">Completed</option>
            <option value="">All</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Task
        </button>
      </div>

      {tasks.isPending && (
        <div className="py-10 text-center text-sm text-ink-500">Loading tasks...</div>
      )}
      {tasks.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Couldn't load tasks. Retry in a moment.
        </div>
      )}
      {tasks.data && tasks.data.items.length === 0 && (
        <div className="py-10 text-center text-sm text-ink-500">No tasks yet — create your first one.</div>
      )}

      {tasks.data && tasks.data.items.length > 0 && (
        <>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-ink-500">
                <th className="pb-2 font-medium"></th>
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Priority</th>
                <th className="pb-2 font-medium">Due</th>
                <th className="pb-2 font-medium">Assignee</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.data.items.map((task) => (
                <tr key={task.id} className="border-b border-surface-border last:border-0">
                  <td className="py-3">
                    <button
                      onClick={() => toggleComplete(task)}
                      aria-label={task.completedAt ? "Reopen task" : "Mark complete"}
                      className={task.completedAt ? "text-emerald-600" : "text-ink-300 hover:text-emerald-600"}
                    >
                      {task.completedAt ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <Circle className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </td>
                  <td className="py-3">
                    <div className={`font-medium ${task.completedAt ? "text-ink-300 line-through" : "text-ink-900"}`}>
                      {task.title}
                    </div>
                    {(task.contactName || task.dealTitle || task.leadContactName) && (
                      <div className="text-xs text-ink-300">
                        {[task.contactName, task.dealTitle, task.leadContactName].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 text-ink-500">{formatDue(task.dueAt)}</td>
                  <td className="py-3 text-ink-500">{task.assigneeName ?? "Unassigned"}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEdit(task)}
                        aria-label="Edit task"
                        className="text-ink-300 hover:text-brand-500"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
                        aria-label="Delete task"
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
              Page {tasks.data.page} of {totalPages} — {tasks.data.total} total
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

      <TaskFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} task={dialogTask} />
    </div>
  );
}
