"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTasksCalendar } from "../hooks/use-tasks";
import { TaskFormDialog } from "./TaskFormDialog";
import type { Task, TaskPriority } from "../types";

const PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW: "bg-blue-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-red-400",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Builds the full 6-row grid for a month, including the trailing/leading
// days from the adjacent months needed to fill complete weeks.
function buildMonthGrid(monthAnchor: Date): Date[] {
  const first = startOfMonth(monthAnchor);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export function CalendarView() {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTask, setDialogTask] = useState<Task | undefined>();
  const [dialogDefaultDate, setDialogDefaultDate] = useState<string | undefined>();

  const days = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const rangeFrom = days[0];
  const rangeTo = days[days.length - 1];

  const tasks = useTasksCalendar({
    from: rangeFrom!.toISOString(),
    to: rangeTo!.toISOString(),
  });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    (tasks.data ?? []).forEach((task) => {
      if (!task.dueAt) return;
      const key = task.dueAt.slice(0, 10);
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    });
    return map;
  }, [tasks.data]);

  const goToPrevMonth = () =>
    setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToToday = () => setMonthAnchor(startOfMonth(new Date()));

  const openTask = (task: Task) => {
    setDialogTask(task);
    setDialogDefaultDate(undefined);
    setDialogOpen(true);
  };

  const openNewTaskForDay = (day: Date) => {
    setDialogTask(undefined);
    setDialogDefaultDate(`${toISODate(day)}T09:00`);
    setDialogOpen(true);
  };

  const todayKey = toISODate(new Date());

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">
          {monthAnchor.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-surface-muted"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            aria-label="Previous month"
            className="rounded-lg border border-surface-border p-1.5 text-ink-500 hover:bg-surface-muted"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded-lg border border-surface-border p-1.5 text-ink-500 hover:bg-surface-muted"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {tasks.isError && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Couldn't load the calendar. Retry in a moment.
        </div>
      )}

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-surface-border bg-surface-border">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="bg-surface-muted p-2 text-center text-[11px] font-medium text-ink-500">
            {label}
          </div>
        ))}

        {days.map((day) => {
          const key = toISODate(day);
          const isCurrentMonth = day.getMonth() === monthAnchor.getMonth();
          const dayTasks = tasksByDate.get(key) ?? [];

          return (
            <div
              key={key}
              onClick={() => openNewTaskForDay(day)}
              className={`min-h-[92px] cursor-pointer bg-white p-1.5 transition-colors hover:bg-surface-muted ${
                isCurrentMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  key === todayKey ? "bg-brand-500 font-semibold text-white" : "text-ink-500"
                }`}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTask(task);
                    }}
                    className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] ${
                      task.completedAt ? "text-ink-300 line-through" : "text-ink-700"
                    } hover:bg-surface-border/60`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <div className="px-1 text-[10px] text-ink-300">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={dialogTask}
        defaultDueAt={dialogDefaultDate}
      />
    </div>
  );
}
