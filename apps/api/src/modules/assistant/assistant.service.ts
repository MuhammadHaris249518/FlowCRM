import { AppError } from "../../errors/app-error";
import type { AuthContext } from "../../middleware/auth";
import { aiServiceClient } from "../../lib/ai-service-client";
import { ASSISTANT_TOOLS, executeAssistantTool } from "./assistant.tools";
import type {
  AssistantActionDTO,
  AssistantChatMessageDTO,
  AssistantChatResultDTO,
  AssistantLlmMessage,
} from "./assistant.types";

const MAX_TOOL_ROUNDS = 6;

export const assistantService = {
  async chat(auth: AuthContext, history: AssistantChatMessageDTO[]): Promise<AssistantChatResultDTO> {
    const messages: AssistantLlmMessage[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const actions: AssistantActionDTO[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let turn;
      try {
        turn = await aiServiceClient.assistantChat({
          messages,
          tools: ASSISTANT_TOOLS,
        });
      } catch {
        throw new AppError(
          "AI assistant is temporarily unavailable. Try again in a moment.",
          503,
          "AI_SERVICE_UNAVAILABLE"
        );
      }

      if (turn.tool_calls && turn.tool_calls.length > 0) {
        messages.push({
          role: "assistant",
          content: turn.content,
          tool_calls: turn.tool_calls,
        });

        for (const call of turn.tool_calls) {
          let result: unknown;
          try {
            result = await executeAssistantTool(auth, call.name, call.arguments ?? {}, actions);
          } catch (err) {
            result = { error: err instanceof Error ? err.message : "Tool failed" };
          }
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.name,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      const reply = (turn.content ?? "").trim();
      if (!reply) {
        throw new AppError(
          "The assistant returned an empty reply. Try rephrasing your question.",
          502,
          "AI_EMPTY_REPLY"
        );
      }
      return { reply, actions };
    }

    return {
      reply:
        "I needed too many lookups to finish that. Try a more specific question — for example a lead name, or 'top 5 leads by score'.",
      actions,
    };
  },
};
