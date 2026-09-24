import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assistantApi } from "../api/assistant-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { AssistantMessage } from "../types";

export function useAssistantChat() {
  const ctx = useApiContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messages: Pick<AssistantMessage, "role" | "content">[]) =>
      assistantApi.chat(ctx, messages),
    onSuccess: (result) => {
      if (result.actions.some((a) => a.type === "lead_scored")) {
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
      if (result.actions.some((a) => a.type === "email_draft")) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      }
    },
  });
}
