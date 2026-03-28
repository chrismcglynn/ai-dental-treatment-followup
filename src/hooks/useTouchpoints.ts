import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTouchpoints,
  createTouchpoint,
  updateTouchpoint,
  deleteTouchpoint,
  reorderTouchpoints,
} from "@/lib/api/touchpoints";
import { type InsertTables, type UpdateTables } from "@/types/database.types";
import { usePracticeStore } from "@/stores/practice-store";
import { useUiStore } from "@/stores/ui-store";
import { sequenceKeys } from "./useSequences";

// Query keys factory
export const touchpointKeys = {
  all: (sequenceId: string) => ["touchpoints", sequenceId] as const,
  list: (sequenceId: string) =>
    [...touchpointKeys.all(sequenceId), "list"] as const,
};

export function useTouchpoints(sequenceId: string) {
  return useQuery({
    queryKey: touchpointKeys.list(sequenceId),
    queryFn: () => getTouchpoints(sequenceId),
    enabled: !!sequenceId,
  });
}

export function useCreateTouchpoint() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (touchpoint: InsertTables<"touchpoints">) =>
      createTouchpoint(touchpoint),
    onSuccess: (data) => {
      addToast({ title: "Step added", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: touchpointKeys.all(data.sequence_id),
      });
      queryClient.invalidateQueries({
        queryKey: sequenceKeys.detail(activePracticeId!, data.sequence_id),
      });
    },
    onError: () => {
      addToast({ title: "Failed to add step", variant: "destructive" });
    },
  });
}

export function useUpdateTouchpoint() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (vars: {
      id: string;
      data: UpdateTables<"touchpoints">;
      sequenceId: string;
    }) => updateTouchpoint(vars.id, vars.data),
    onSuccess: (_, { sequenceId }) => {
      addToast({ title: "Step updated", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: touchpointKeys.all(sequenceId),
      });
      queryClient.invalidateQueries({
        queryKey: sequenceKeys.detail(activePracticeId!, sequenceId),
      });
    },
    onError: () => {
      addToast({ title: "Failed to update step", variant: "destructive" });
    },
  });
}

export function useDeleteTouchpoint() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string;
      sequenceId: string;
    }) => deleteTouchpoint(id),
    onSuccess: (_, { sequenceId }) => {
      addToast({ title: "Step deleted", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: touchpointKeys.all(sequenceId),
      });
    },
    onError: () => {
      addToast({ title: "Failed to delete step", variant: "destructive" });
    },
  });
}

export function useReorderTouchpoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sequenceId,
      orderedIds,
    }: {
      sequenceId: string;
      orderedIds: string[];
    }) => reorderTouchpoints(sequenceId, orderedIds),
    onSuccess: (_, { sequenceId }) => {
      queryClient.invalidateQueries({
        queryKey: touchpointKeys.all(sequenceId),
      });
    },
  });
}
