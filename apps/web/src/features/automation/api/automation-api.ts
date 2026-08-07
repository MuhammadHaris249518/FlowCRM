import { apiClient, type RequestContext } from "@/lib/api-client";
import type { CreateWorkflowInput, Paginated, UpdateWorkflowInput, WorkflowDTO, WorkflowQuery } from "../types";

function toParams(query: WorkflowQuery): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params[key] = String(value);
  });
  return params;
}

export const automationApi = {
  list: (ctx: RequestContext, query: WorkflowQuery = {}) =>
    apiClient.get<Paginated<WorkflowDTO>>("/automation", ctx, toParams(query)),

  getById: (ctx: RequestContext, id: string) => apiClient.get<WorkflowDTO>(`/automation/${id}`, ctx),

  create: (ctx: RequestContext, input: CreateWorkflowInput) =>
    apiClient.post<WorkflowDTO>("/automation", ctx, input),

  update: (ctx: RequestContext, id: string, input: UpdateWorkflowInput) =>
    apiClient.patch<WorkflowDTO>(`/automation/${id}`, ctx, input),

  delete: (ctx: RequestContext, id: string) => apiClient.delete(`/automation/${id}`, ctx),
};
