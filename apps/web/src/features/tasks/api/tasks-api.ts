import { apiClient, type RequestContext } from "@/lib/api-client";
import type {
  CreateTaskInput,
  Paginated,
  Task,
  TaskCalendarQuery,
  TaskQuery,
  UpdateTaskInput,
} from "../types";

function toParams(query: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params[key] = String(value);
  });
  return params;
}

export const tasksApi = {
  list: (ctx: RequestContext, query: TaskQuery = {}) =>
    apiClient.get<Paginated<Task>>("/tasks", ctx, toParams(query)),

  calendar: (ctx: RequestContext, query: TaskCalendarQuery) =>
    apiClient.get<Task[]>("/tasks/calendar", ctx, toParams(query)),

  getById: (ctx: RequestContext, id: string) => apiClient.get<Task>(`/tasks/${id}`, ctx),

  create: (ctx: RequestContext, input: CreateTaskInput) =>
    apiClient.post<Task>("/tasks", ctx, input),

  update: (ctx: RequestContext, id: string, input: UpdateTaskInput) =>
    apiClient.patch<Task>(`/tasks/${id}`, ctx, input),

  complete: (ctx: RequestContext, id: string) =>
    apiClient.patch<Task>(`/tasks/${id}/complete`, ctx),

  reopen: (ctx: RequestContext, id: string) =>
    apiClient.patch<Task>(`/tasks/${id}/reopen`, ctx),

  delete: (ctx: RequestContext, id: string) => apiClient.delete(`/tasks/${id}`, ctx),
};
