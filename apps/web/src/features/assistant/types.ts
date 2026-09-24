export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
}

export type AssistantAction =
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

export interface AssistantChatResult {
  reply: string;
  actions: AssistantAction[];
}
