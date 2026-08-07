import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { automationApi } from "../api/automation-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { CreateWorkflowInput, UpdateWorkflowInput, WorkflowQuery } from "../types";

export function useWorkflows(query: WorkflowQuery) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["automation", "list", query, ctx.organizationId],
    queryFn: () => automationApi.list(ctx, query),
    staleTime: 30_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useWorkflow(id: string | null) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["automation", "detail", id, ctx.organizationId],
    queryFn: () => automationApi.getById(ctx, id as string),
    enabled: Boolean(id && ctx.organizationId),
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: CreateWorkflowInput) => automationApi.create(ctx, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation", "list"] }),
  });
}

export function useUpdateWorkflow(id: string) {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: UpdateWorkflowInput) => automationApi.update(ctx, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation", "list"] });
      queryClient.invalidateQueries({ queryKey: ["automation", "detail", id] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => automationApi.delete(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation", "list"] }),
  });
}
