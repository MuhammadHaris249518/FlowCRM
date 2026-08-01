import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../api/crm-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { CompanyQuery, CreateCompanyInput, UpdateCompanyInput } from "../types";

export function useCompanies(query: CompanyQuery) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["crm", "companies", query, ctx.organizationId],
    queryFn: () => crmApi.listCompanies(ctx, query),
    staleTime: 30_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useCompany(id: string | null) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["crm", "companies", "detail", id, ctx.organizationId],
    queryFn: () => crmApi.getCompany(ctx, id as string),
    enabled: Boolean(id && ctx.organizationId),
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: CreateCompanyInput) => crmApi.createCompany(ctx, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm", "companies"] }),
  });
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: UpdateCompanyInput) => crmApi.updateCompany(ctx, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm", "companies"] }),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteCompany(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm", "companies"] }),
  });
}
