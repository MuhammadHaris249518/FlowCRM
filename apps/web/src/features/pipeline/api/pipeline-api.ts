import { apiClient, type RequestContext } from "@/lib/api-client";
import type {
  CreateDealInput,
  Deal,
  DealQuery,
  PipelineBoard,
  Paginated,
  UpdateDealInput,
  DealStage,
} from "../types";

function toParams(query: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params[key] = String(value);
  });
  return params;
}

export const pipelineApi = {
  board: (ctx: RequestContext) => apiClient.get<PipelineBoard>("/pipeline/board", ctx),

  list: (ctx: RequestContext, query: DealQuery = {}) =>
    apiClient.get<Paginated<Deal>>("/pipeline/deals", ctx, toParams(query)),

  getById: (ctx: RequestContext, id: string) =>
    apiClient.get<Deal>(`/pipeline/deals/${id}`, ctx),

  create: (ctx: RequestContext, input: CreateDealInput) =>
    apiClient.post<Deal>("/pipeline/deals", ctx, input),

  update: (ctx: RequestContext, id: string, input: UpdateDealInput) =>
    apiClient.patch<Deal>(`/pipeline/deals/${id}`, ctx, input),

  updateStage: (ctx: RequestContext, id: string, stage: DealStage) =>
    apiClient.patch<Deal>(`/pipeline/deals/${id}/stage`, ctx, { stage }),

  delete: (ctx: RequestContext, id: string) => apiClient.delete(`/pipeline/deals/${id}`, ctx),
};
