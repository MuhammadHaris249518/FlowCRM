import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pipelineApi } from "../api/pipeline-api";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import type { CreateDealInput, DealStage, UpdateDealInput } from "../types";

export function usePipelineBoard() {
  const ctx = useApiContext();
  return useQuery({
    queryKey: ["pipeline", "board", ctx.organizationId],
    queryFn: () => pipelineApi.board(ctx),
    staleTime: 15_000,
    enabled: Boolean(ctx.organizationId),
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: CreateDealInput) => pipelineApi.create(ctx, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useUpdateDeal(id: string) {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (input: UpdateDealInput) => pipelineApi.update(ctx, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();
  return useMutation({
    mutationFn: (id: string) => pipelineApi.delete(ctx, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

// Optimistic stage update — the whole point of a Kanban drag is that it
// feels instant. We patch the cached board immediately, then reconcile
// with the server response (or roll back on error).
export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  const ctx = useApiContext();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      pipelineApi.updateStage(ctx, id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["pipeline", "board"] });
      const previous = queryClient.getQueryData(["pipeline", "board", ctx.organizationId]);

      queryClient.setQueryData(["pipeline", "board", ctx.organizationId], (old: any) => {
        if (!old) return old;
        let movedDeal: any = null;
        const stages = old.stages.map((s: any) => {
          const found = s.deals.find((d: any) => d.id === id);
          if (found) movedDeal = { ...found, stage };
          return { ...s, deals: s.deals.filter((d: any) => d.id !== id) };
        });
        if (movedDeal) {
          const target = stages.find((s: any) => s.stage === stage);
          if (target) target.deals.unshift(movedDeal);
        }
        return { stages };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["pipeline", "board", ctx.organizationId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}
