import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/tasks-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { CreateTaskInput, TaskCalendarQuery, TaskQuery, UpdateTaskInput } from "../types";

export function useTasks(query: TaskQuery) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["tasks", "list", query, ctx.organizationId],
    queryFn: () => tasksApi.list(ctx, query),
    staleTime: 30_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useTasksCalendar(query: TaskCalendarQuery) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["tasks", "calendar", query, ctx.organizationId],
    queryFn: () => tasksApi.calendar(ctx, query),
    staleTime: 30_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(ctx, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => tasksApi.update(ctx, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useReopenTask() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => tasksApi.reopen(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
