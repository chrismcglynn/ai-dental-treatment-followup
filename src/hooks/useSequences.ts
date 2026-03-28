import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSequences,
  getSequence,
  createSequence,
  updateSequence,
  deleteSequence,
} from "@/lib/api/sequences";
import { type InsertTables, type UpdateTables } from "@/types/database.types";
import { type SequenceFilters } from "@/types/app.types";
import { usePracticeStore } from "@/stores/practice-store";
import { useUiStore } from "@/stores/ui-store";
import { useSandbox } from "@/lib/sandbox";
import { simulateDelay } from "@/lib/sandbox/utils";

// Query keys factory
export const sequenceKeys = {
  all: (practiceId: string) => ["sequences", practiceId] as const,
  list: (practiceId: string, filters?: SequenceFilters) =>
    [...sequenceKeys.all(practiceId), "list", filters] as const,
  detail: (practiceId: string, sequenceId: string) =>
    [...sequenceKeys.all(practiceId), "detail", sequenceId] as const,
};

export function useSequences(filters?: SequenceFilters) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: sequenceKeys.list(activePracticeId!, filters),
    queryFn: async () => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getSequences(filters);
      }
      return getSequences(activePracticeId!, filters?.status);
    },
    enabled: !!activePracticeId,
  });
}

export function useSequence(sequenceId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: sequenceKeys.detail(activePracticeId!, sequenceId),
    queryFn: async () => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getSequence(sequenceId);
      }
      return getSequence(sequenceId);
    },
    enabled: !!activePracticeId && !!sequenceId,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async (sequence: InsertTables<"sequences">) => {
      if (isSandbox) {
        await simulateDelay(600);
        return sandboxStore.createSequence(sequence);
      }
      return createSequence(sequence);
    },
    onSuccess: () => {
      addToast({ title: "Sequence created", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: sequenceKeys.all(activePracticeId!),
      });
    },
    onError: () => {
      addToast({ title: "Failed to create sequence", variant: "destructive" });
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"sequences">;
    }) => {
      if (isSandbox) {
        await simulateDelay(500);
        const updated = sandboxStore.updateSequence(id, data);
        if (!updated) throw new Error("Sequence not found");
        return updated;
      }
      return updateSequence(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Optimistic update for status toggle
      if (data.status) {
        await queryClient.cancelQueries({
          queryKey: sequenceKeys.list(activePracticeId!),
        });
        const previousList = queryClient.getQueryData(
          sequenceKeys.list(activePracticeId!)
        );
        queryClient.setQueryData(
          sequenceKeys.list(activePracticeId!),
          (old: Array<Record<string, unknown>> | undefined) =>
            old?.map((seq) =>
              (seq as { id: string }).id === id ? { ...seq, ...data } : seq
            )
        );
        return { previousList };
      }
    },
    onSuccess: (_, { id }) => {
      addToast({ title: "Sequence updated", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: sequenceKeys.list(activePracticeId!),
      });
      queryClient.invalidateQueries({
        queryKey: sequenceKeys.detail(activePracticeId!, id),
      });
    },
    onError: (_, __, context) => {
      addToast({ title: "Failed to update sequence", variant: "destructive" });
      if (context?.previousList) {
        queryClient.setQueryData(
          sequenceKeys.list(activePracticeId!),
          context.previousList
        );
      }
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async (sequenceId: string) => {
      if (isSandbox) {
        await simulateDelay(500);
        sandboxStore.deleteSequence(sequenceId);
        return;
      }
      return deleteSequence(sequenceId);
    },
    onSuccess: () => {
      addToast({ title: "Sequence deleted", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: sequenceKeys.all(activePracticeId!),
      });
    },
    onError: () => {
      addToast({ title: "Failed to delete sequence", variant: "destructive" });
    },
  });
}
