"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StepConfigPanel } from "./StepConfigPanel";
import { SequenceTimeline } from "./SequenceTimeline";
import { MessagePreviewModal } from "./MessagePreviewModal";
import { type StepData, type Channel } from "./types";
import { usePracticeStore } from "@/stores/practice-store";

const ALTERNATING_CHANNELS: Channel[] = ["sms", "email", "sms", "voicemail"];

function generateId() {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface SequenceBuilderProps {
  initialName?: string;
  initialProcedures?: string[];
  initialSteps?: StepData[];
  sequenceId?: string;
  onSave: (data: {
    name: string;
    procedures: string[];
    steps: StepData[];
  }) => Promise<void>;
}

export function SequenceBuilder({
  initialName = "",
  initialProcedures = [],
  initialSteps = [],
  sequenceId,
  onSave,
}: SequenceBuilderProps) {
  const router = useRouter();
  const practiceId = usePracticeStore((s) => s.activePracticeId);

  const [name, setName] = useState(initialName);
  const [procedures, setProcedures] = useState<string[]>(initialProcedures);
  const [steps, setSteps] = useState<StepData[]>(initialSteps);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState<StepData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const addStep = useCallback(() => {
    const lastStep = steps[steps.length - 1];
    const nextDay = lastStep ? lastStep.dayOffset + 7 : 3;
    const nextChannel = ALTERNATING_CHANNELS[steps.length % ALTERNATING_CHANNELS.length];

    const newStep: StepData = {
      id: generateId(),
      dayOffset: nextDay,
      channel: nextChannel,
      tone: "friendly",
      templateOverride: "",
      position: steps.length,
    };

    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  }, [steps]);

  const updateStep = useCallback((id: string, updates: Partial<StepData>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteStep = useCallback(
    (id: string) => {
      setSteps((prev) =>
        prev
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, position: i }))
      );
      if (selectedStepId === id) {
        setSelectedStepId(null);
      }
    },
    [selectedStepId]
  );

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ name, procedures, steps });
      router.push("/sequences");
    } catch {
      // error handling done by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
        <div className="flex items-center gap-3">
          <Link href="/sequences">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Back to sequences">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold">
              {sequenceId ? "Edit Sequence" : "New Sequence"}
            </h1>
            {name && (
              <p className="text-xs text-muted-foreground">{name}</p>
            )}
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          size="sm"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-2 h-3.5 w-3.5" />
          )}
          Save Sequence
        </Button>
      </div>

      {/* Builder layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — config */}
        <div className="w-[340px] shrink-0 border-r overflow-y-auto p-5">
          <StepConfigPanel
            sequenceName={name}
            onSequenceNameChange={setName}
            procedures={procedures}
            onProceduresChange={setProcedures}
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onUpdateStep={updateStep}
            onAddStep={addStep}
            onPreviewStep={setPreviewStep}
          />
        </div>

        {/* Right panel — timeline */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-xl mx-auto">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Sequence Timeline
            </h2>
            <SequenceTimeline
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={setSelectedStepId}
              onDeleteStep={deleteStep}
              onReorderSteps={setSteps}
              onAddStep={addStep}
              onPreviewStep={setPreviewStep}
            />
          </div>
        </div>
      </div>

      {/* Message preview modal */}
      <MessagePreviewModal
        open={!!previewStep}
        onOpenChange={(open) => !open && setPreviewStep(null)}
        step={previewStep}
        practiceId={practiceId ?? ""}
        onUseTemplate={(stepId, message) => {
          updateStep(stepId, { templateOverride: message });
        }}
      />
    </div>
  );
}
