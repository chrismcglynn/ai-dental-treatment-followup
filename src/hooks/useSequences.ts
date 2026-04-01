import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSequences,
  getSequence,
  createSequence,
  updateSequence,
  deleteSequence,
} from "@/lib/api/sequences";
import { type InsertTables, type UpdateTables } from "@/types/database.types";
import { type SequenceFilters, type Sequence, type SequenceWithTouchpoints } from "@/types/app.types";
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
    queryFn: async (): Promise<Sequence[]> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getSequences(filters) as Sequence[];
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
    queryFn: async (): Promise<SequenceWithTouchpoints | undefined> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getSequence(sequenceId) as SequenceWithTouchpoints | undefined;
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
        return sandboxStore.createSequence(sequence as Omit<Sequence, "id" | "created_at" | "updated_at">);
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

// --- AI-powered sequence suggestion ---

interface SuggestSequenceParams {
  treatmentDescriptions: string[];
  treatmentCodes: string[];
  sequences: Array<{
    id: string;
    name: string;
    description: string | null;
    treatment_type: string | null;
    conversion_rate: number;
    patient_count: number;
  }>;
}

interface SequenceSuggestion {
  sequenceId: string;
  score: number;
  reason: string;
}

export function useSuggestSequence() {
  const { isSandbox } = useSandbox();

  return useMutation<{ suggestions: SequenceSuggestion[] }, Error, SuggestSequenceParams>({
    mutationFn: async (params) => {
      if (isSandbox) {
        await simulateDelay(800);
        // Return sequences sorted by code overlap for sandbox
        const suggestions = params.sequences.map((seq) => {
          const seqCodes = (seq.treatment_type ?? "")
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
          const matchCount = params.treatmentCodes.filter((code) =>
            seqCodes.includes(code)
          ).length;
          return {
            sequenceId: seq.id,
            score: matchCount > 0 ? 70 + matchCount * 10 : 30,
            reason:
              matchCount > 0
                ? `${matchCount} code${matchCount > 1 ? "s" : ""} match`
                : "No direct code overlap",
          };
        });
        suggestions.sort((a, b) => b.score - a.score);
        return { suggestions };
      }

      const response = await fetch("/api/ai/suggest-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("AI suggestions unavailable");
      }

      return response.json();
    },
  });
}

// --- AI-powered sequence generation (when no sequences exist) ---

interface GenerateSequenceParams {
  treatmentDescriptions: string[];
  treatmentCodes: string[];
}

export interface GeneratedSequence {
  name: string;
  procedures: string[];
  steps: Array<{
    dayOffset: number;
    channel: "sms" | "email" | "voicemail";
    tone: "friendly" | "clinical" | "urgent";
  }>;
  reasoning: string;
}

export function useGenerateSequence() {
  const { isSandbox } = useSandbox();

  return useMutation<GeneratedSequence, Error, GenerateSequenceParams>({
    mutationFn: async (params) => {
      if (isSandbox) {
        await simulateDelay(1200);
        return {
          name: "AI-Recommended Follow-Up",
          procedures: params.treatmentCodes,
          steps: [
            { dayOffset: 3, channel: "sms", tone: "friendly" },
            { dayOffset: 10, channel: "email", tone: "friendly" },
            { dayOffset: 21, channel: "sms", tone: "clinical" },
          ],
          reasoning:
            "3-step sequence with SMS-first approach for highest engagement",
        };
      }

      const response = await fetch("/api/ai/generate-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("AI generation unavailable");
      }

      return response.json();
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
