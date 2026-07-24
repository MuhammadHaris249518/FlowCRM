import { apiClient, type RequestContext } from "@/lib/api-client";
import type {
  CreateLeadInput,
  Lead,
  LeadQuery,
  Paginated,
  UpdateLeadInput,
  ConvertLeadInput,
  ConvertLeadResult,
} from "../types";

function toParams(query: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params[key] = String(value);
  });
  return params;
}

export const leadsApi = {
  list: (ctx: RequestContext, query: LeadQuery = {}) =>
    apiClient.get<Paginated<Lead>>("/leads", ctx, toParams(query)),

  getById: (ctx: RequestContext, id: string) => apiClient.get<Lead>(`/leads/${id}`, ctx),

  create: (ctx: RequestContext, input: CreateLeadInput) =>
    apiClient.post<Lead>("/leads", ctx, input),

  update: (ctx: RequestContext, id: string, input: UpdateLeadInput) =>
    apiClient.patch<Lead>(`/leads/${id}`, ctx, input),

  delete: (ctx: RequestContext, id: string) => apiClient.delete(`/leads/${id}`, ctx),

  convert: (ctx: RequestContext, id: string, input: ConvertLeadInput) =>
    apiClient.post<ConvertLeadResult>(`/leads/${id}/convert`, ctx, input),

  scoreWithAi: (ctx: RequestContext, id: string) =>
    apiClient.post<Lead>(`/leads/${id}/score`, ctx),
};
