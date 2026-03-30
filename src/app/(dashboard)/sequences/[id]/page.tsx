"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { SequenceBuilder } from "@/components/features/sequences";
import { type StepData, type Tone } from "@/components/features/sequences/types";
import { useSequence, useUpdateSequence } from "@/hooks/useSequences";
import {
  useCreateTouchpoint,
  useUpdateTouchpoint,
  useDeleteTouchpoint,
} from "@/hooks/useTouchpoints";
import { usePracticeStore } from "@/stores/practice-store";

export default function EditSequencePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = params instanceof Promise ? use(params) : params;
  const { id } = resolved;
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { data: sequence, isLoading } = useSequence(id);
  const updateSequence = useUpdateSequence();
  const createTouchpoint = useCreateTouchpoint();
  const updateTouchpoint = useUpdateTouchpoint();
  const deleteTouchpoint = useDeleteTouchpoint();

  if (isLoading || !sequence) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initialSteps: StepData[] = (sequence.touchpoints ?? []).map(
    (tp) => ({
      id: tp.id,
      dayOffset: tp.delay_days,
      channel: tp.channel,
      tone: "friendly" as Tone,
      templateOverride: tp.body_template || "",
      position: tp.position,
    })
  );

  async function handleSave(data: {
    name: string;
    procedures: string[];
    steps: StepData[];
  }) {
    if (!activePracticeId) throw new Error("No practice selected");

    await updateSequence.mutateAsync({
      id,
      data: {
        name: data.name,
        treatment_type: data.procedures.join(", ") || null,
      },
    });

    const existingIds = new Set(
      (sequence!.touchpoints ?? []).map((tp) => tp.id)
    );
    const newStepIds = new Set(
      data.steps.filter((s) => existingIds.has(s.id)).map((s) => s.id)
    );

    // Delete removed touchpoints
    for (const tp of sequence!.touchpoints ?? []) {
      if (!newStepIds.has(tp.id)) {
        await deleteTouchpoint.mutateAsync({
          id: tp.id,
          sequenceId: id,
        });
      }
    }

    // Create or update touchpoints
    for (const step of data.steps) {
      if (existingIds.has(step.id)) {
        await updateTouchpoint.mutateAsync({
          id: step.id,
          sequenceId: id,
          data: {
            position: step.position,
            channel: step.channel,
            delay_days: step.dayOffset,
            body_template: step.templateOverride || "",
            ai_personalize: !step.templateOverride,
          },
        });
      } else {
        await createTouchpoint.mutateAsync({
          sequence_id: id,
          position: step.position,
          channel: step.channel,
          delay_days: step.dayOffset,
          delay_hours: 0,
          body_template: step.templateOverride || "",
          ai_personalize: !step.templateOverride,
        });
      }
    }
  }

  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <SequenceBuilder
        sequenceId={id}
        initialName={sequence.name}
        initialProcedures={
          sequence.treatment_type
            ? sequence.treatment_type.split(", ").filter(Boolean)
            : []
        }
        initialSteps={initialSteps}
        onSave={handleSave}
      />
    </div>
  );
}
