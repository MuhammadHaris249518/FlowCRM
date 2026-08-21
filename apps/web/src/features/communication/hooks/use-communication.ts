import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communicationApi } from "../api/communication-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";

export function useMessageThread(leadId: string, limit = 5) {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["communication", "thread", "lead", leadId, limit, ctx.organizationId],
    queryFn: () => communicationApi.getThread(ctx, { leadId, limit }),
    enabled: Boolean(ctx.organizationId) && Boolean(leadId),
    staleTime: 15_000,
  });
}

export function useSendDraft() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (messageId: string) => communicationApi.sendDraft(ctx, messageId),
    onSuccess: () => {
      // Refetches the thread (status flips DRAFT -> SENT) and the Tasks
      // list (sending completes the linked Task on the backend).
      queryClient.invalidateQueries({ queryKey: ["communication"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
