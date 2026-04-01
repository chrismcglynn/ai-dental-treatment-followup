"use client";

import { useRouter } from "next/navigation";
import { Zap, Plus } from "lucide-react";
import { usePageHeader } from "@/hooks/usePageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SequenceCard } from "@/components/features/sequences";
import {
  useSequences,
  useUpdateSequence,
  useDeleteSequence,
  useCreateSequence,
} from "@/hooks/useSequences";
import { usePracticeStore } from "@/stores/practice-store";
import { type SequenceWithTouchpoints } from "@/types/app.types";

export default function SequencesPage() {
  const router = useRouter();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { data: sequences, isLoading } = useSequences();
  const updateSequence = useUpdateSequence();
  const deleteSequence = useDeleteSequence();
  const createSequence = useCreateSequence();

  function handleToggleStatus(id: string, active: boolean) {
    updateSequence.mutate({
      id,
      data: { status: active ? "active" : "paused" },
    });
  }

  async function handleDuplicate(id: string) {
    const seq = sequences?.find((s) => s.id === id);
    if (!seq || !activePracticeId) return;
    createSequence.mutate({
      practice_id: activePracticeId,
      name: `${seq.name} (Copy)`,
      description: seq.description,
      treatment_type: seq.treatment_type,
      status: "draft",
      trigger_type: seq.trigger_type,
    });
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this sequence?")) {
      deleteSequence.mutate(id);
    }
  }

  const hasSequences = !isLoading && sequences && sequences.length > 0;

  usePageHeader({
    title: "Sequences",
    actions: hasSequences ? (
      <Button size="sm" onClick={() => router.push("/sequences/new")}>
        <Plus className="mr-2 h-4 w-4" />
        Create Sequence
      </Button>
    ) : undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {hasSequences ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sequences.map((seq) => (
            <SequenceCard
              key={seq.id}
              sequence={seq as SequenceWithTouchpoints}
              onToggleStatus={handleToggleStatus}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Zap}
          title="No sequences yet"
          description="Create your first follow-up sequence to automatically engage patients who have pending treatments."
        >
          <Button onClick={() => router.push("/sequences/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Sequence
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
