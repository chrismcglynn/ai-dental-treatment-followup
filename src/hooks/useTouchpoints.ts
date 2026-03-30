import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTouchpoints,
  createTouchpoint,
  updateTouchpoint,
  deleteTouchpoint,
  reorderTouchpoints,
} from "@/lib/api/touchpoints";
import { type InsertTables, type UpdateTables } from "@/types/database.types";
import { type Touchpoint } from "@/types/app.types";
import { usePracticeStore } from "@/stores/practice-store";
import { useUiStore } from "@/stores/ui-store";
import { sequenceKeys } from "./useSequences";
import { useSandbox } from "@/lib/sandbox";
import { simulateDelay } from "@/lib/sandbox/utils";

// Query keys factory
export const touchpointKeys = {
  all: (sequenceId: string) => ["touchpoints", sequenceId] as const,
  list: (sequenceId: string) =>
    [...touchpointKeys.all(sequenceId), "list"] as const,
};

export function useTouchpoints(sequenceId: string) {
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: touchpointKeys.list(sequenceId),
    queryFn: async (): Promise<Touchpoint[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getTouchpoints(sequenceId) as Touchpoint[];
      }
      return getTouchpoints(sequenceId);
    },
    enabled: !!sequenceId,
  });
}

export function useCreateTouchpoint() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async (touchpoint: InsertTables<"touchpoints">) => {
      if (isSandbox) {
        await simulateDelay(500);
        return sandboxStore.createTouchpoint(touchpoint as Omit<Touchpoint, "id" | "created_at" | "updated_at">);
      }
      return createTouchpoint(touchpoint);
    },
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
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      data: UpdateTables<"touchpoints">;
      sequenceId: string;
    }) => {
      if (isSandbox) {
        await simulateDelay(500);
        const updated = sandboxStore.updateTouchpoint(vars.id, vars.data);
        if (!updated) throw new Error("Touchpoint not found");
        return updated;
      }
      return updateTouchpoint(vars.id, vars.data);
    },
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
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      sequenceId: string;
    }) => {
      if (isSandbox) {
        await simulateDelay(400);
        sandboxStore.deleteTouchpoint(id);
        return;
      }
      return deleteTouchpoint(id);
    },
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
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({
      sequenceId,
      orderedIds,
    }: {
      sequenceId: string;
      orderedIds: string[];
    }) => {
      if (isSandbox) {
        await simulateDelay(300);
        sandboxStore.reorderTouchpoints(sequenceId, orderedIds);
        return;
      }
      return reorderTouchpoints(sequenceId, orderedIds);
    },
    onSuccess: (_, { sequenceId }) => {
      queryClient.invalidateQueries({
        queryKey: touchpointKeys.all(sequenceId),
      });
    },
  });
}
