import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../api/crm-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { ContactQuery, CreateContactInput, UpdateContactInput } from "../types";

export function useContacts(query: ContactQuery) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["crm", "contacts", query, ctx.organizationId],
    queryFn: () => crmApi.listContacts(ctx, query),
    staleTime: 30_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: CreateContactInput) => crmApi.createContact(ctx, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm", "contacts"] }),
  });
}

export function useUpdateContact(id: string) {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: UpdateContactInput) => crmApi.updateContact(ctx, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm", "contacts"] }),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteContact(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm", "contacts"] }),
  });
}
