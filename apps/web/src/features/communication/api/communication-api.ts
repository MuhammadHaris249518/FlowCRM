import { apiClient, type RequestContext } from "@/lib/api-client";
import type { Message } from "../types";

export const communicationApi = {
  getThread: (
    ctx: RequestContext,
    params: { leadId?: string; contactId?: string; limit?: number }
  ) => {
    const query: Record<string, string> = {};
    if (params.leadId) query.leadId = params.leadId;
    if (params.contactId) query.contactId = params.contactId;
    if (params.limit) query.limit = String(params.limit);
    return apiClient.get<Message[]>("/communication/messages", ctx, query);
  },

  sendDraft: (ctx: RequestContext, messageId: string) =>
    apiClient.post<Message>(`/communication/messages/${messageId}/send`, ctx),
};
