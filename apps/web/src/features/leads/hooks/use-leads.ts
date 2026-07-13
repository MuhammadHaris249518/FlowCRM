import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../api/leads-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { CreateLeadInput, LeadQuery, UpdateLeadInput } from "../types";

export function useLeads(query: LeadQuery) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["leads", "list", query, ctx.organizationId],
    queryFn: () => leadsApi.list(ctx, query),
    staleTime: 30_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => leadsApi.create(ctx, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: UpdateLeadInput) => leadsApi.update(ctx, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => leadsApi.convert(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}
