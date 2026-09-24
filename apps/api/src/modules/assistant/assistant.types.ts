export type AssistantChatRole = "user" | "assistant";

export interface AssistantChatMessageDTO {
  role: AssistantChatRole;
  content: string;
}

export type AssistantActionDTO =
  | {
      type: "email_draft";
      messageId: string;
      taskId: string;
      leadId: string | null;
      subject: string;
    }
  | {
      type: "lead_scored";
      leadId: string;
      score: number;
      reasoning: string;
    };

export interface AssistantChatResultDTO {
  reply: string;
  actions: AssistantActionDTO[];
}

export interface AssistantLlmToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AssistantLlmMessage {
  role: "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: AssistantLlmToolCall[];
}

export interface AssistantToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
