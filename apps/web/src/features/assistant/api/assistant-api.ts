import { apiClient, type RequestContext } from "@/lib/api-client";
import type { AssistantChatResult, AssistantMessage } from "../types";

export const assistantApi = {
  chat: (ctx: RequestContext, messages: Pick<AssistantMessage, "role" | "content">[]) =>
    apiClient.post<AssistantChatResult>("/assistant/chat", ctx, { messages }),
};
