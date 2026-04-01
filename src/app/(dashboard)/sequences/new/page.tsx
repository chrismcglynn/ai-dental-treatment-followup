"use client";

import { useEffect, useState } from "react";
import { SequenceBuilder } from "@/components/features/sequences";
import { useCreateSequence } from "@/hooks/useSequences";
import { useCreateTouchpoint } from "@/hooks/useTouchpoints";
import { usePracticeStore } from "@/stores/practice-store";
import { useUiStore } from "@/stores/ui-store";
import { type StepData } from "@/components/features/sequences/types";

function generateId() {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function NewSequencePage() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const createSequence = useCreateSequence();
  const createTouchpoint = useCreateTouchpoint();
  const aiSuggested = useUiStore((s) => s.aiSuggestedSequence);
  const clearAiSuggested = useUiStore((s) => s.setAiSuggestedSequence);

  // Convert AI suggestion to initial steps (only on first render)
  const [initialData] = useState(() => {
    if (!aiSuggested) return null;

    const steps: StepData[] = aiSuggested.steps.map((step, i) => ({
      id: generateId(),
      dayOffset: step.dayOffset,
      channel: step.channel,
      tone: step.tone,
      templateOverride: "",
      position: i,
    }));

    return {
      name: aiSuggested.name,
      procedures: aiSuggested.procedures,
      steps,
    };
  });

  // Clear the store after reading so it doesn't persist
  useEffect(() => {
    if (aiSuggested) {
      clearAiSuggested(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <SequenceBuilder
        initialName={initialData?.name}
        initialProcedures={initialData?.procedures}
        initialSteps={initialData?.steps}
        onSave={handleSave}
      />
    </div>
  );
}
