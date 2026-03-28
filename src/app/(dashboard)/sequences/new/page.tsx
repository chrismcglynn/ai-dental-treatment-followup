"use client";

import { SequenceBuilder } from "@/components/features/sequences";
import { useCreateSequence } from "@/hooks/useSequences";
import { useCreateTouchpoint } from "@/hooks/useTouchpoints";
import { usePracticeStore } from "@/stores/practice-store";
import { type StepData } from "@/components/features/sequences/types";

export default function NewSequencePage() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const createSequence = useCreateSequence();
  const createTouchpoint = useCreateTouchpoint();

  async function handleSave(data: {
    name: string;
    procedures: string[];
    steps: StepData[];
  }) {
    if (!activePracticeId) throw new Error("No practice selected");

    const sequence = await createSequence.mutateAsync({
      practice_id: activePracticeId,
      name: data.name,
      treatment_type: data.procedures.join(", ") || null,
      status: "draft",
      trigger_type: "manual",
    });

    for (const step of data.steps) {
      await createTouchpoint.mutateAsync({
        sequence_id: sequence.id,
        position: step.position,
        channel: step.channel,
        delay_days: step.dayOffset,
        delay_hours: 0,
        body_template: step.templateOverride || "",
        ai_personalize: !step.templateOverride,
      });
    }
  }

  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <SequenceBuilder onSave={handleSave} />
    </div>
  );
}
