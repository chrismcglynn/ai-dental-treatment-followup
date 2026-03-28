"use client";

import { useState } from "react";
import {
  MessageSquare,
  Mail,
  Phone,
  Eye,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type StepData, type Channel, type Tone, TONE_CONFIG } from "./types";

interface StepConfigPanelProps {
  sequenceName: string;
  onSequenceNameChange: (name: string) => void;
  procedures: string[];
  onProceduresChange: (procedures: string[]) => void;
  steps: StepData[];
  selectedStepId: string | null;
  onSelectStep: (id: string | null) => void;
  onUpdateStep: (id: string, updates: Partial<StepData>) => void;
  onAddStep: () => void;
  onPreviewStep: (step: StepData) => void;
}

const channelButtons: { value: Channel; icon: typeof MessageSquare; label: string; activeClass: string }[] = [
  { value: "sms", icon: MessageSquare, label: "SMS", activeClass: "bg-blue-500/10 border-blue-500 text-blue-600" },
  { value: "email", icon: Mail, label: "Email", activeClass: "bg-purple-500/10 border-purple-500 text-purple-600" },
  { value: "voicemail", icon: Phone, label: "Voicemail", activeClass: "bg-amber-500/10 border-amber-500 text-amber-600" },
];

export function StepConfigPanel({
  sequenceName,
  onSequenceNameChange,
  procedures,
  onProceduresChange,
  steps,
  selectedStepId,
  onSelectStep,
  onUpdateStep,
  onAddStep,
  onPreviewStep,
}: StepConfigPanelProps) {
  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const [procedureInput, setProcedureInput] = useState("");

  function addProcedure() {
    const trimmed = procedureInput.trim();
    if (trimmed && !procedures.includes(trimmed)) {
      onProceduresChange([...procedures, trimmed]);
      setProcedureInput("");
    }
  }

  function removeProcedure(p: string) {
    onProceduresChange(procedures.filter((x) => x !== p));
  }

  if (selectedStep) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => onSelectStep(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sequence
        </button>

        <div>
          <h3 className="font-semibold text-base mb-4">
            Step {selectedStep.position + 1} Configuration
          </h3>
        </div>

        <div className="space-y-2">
          <Label>Send on day</Label>
          <Input
            type="number"
            min={0}
            value={selectedStep.dayOffset}
            onChange={(e) =>
              onUpdateStep(selectedStep.id, {
                dayOffset: parseInt(e.target.value) || 0,
              })
            }
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Days after enrollment to send this message
          </p>
        </div>

        <div className="space-y-2">
          <Label>Channel</Label>
          <div className="grid grid-cols-3 gap-2">
            {channelButtons.map(({ value, icon: Icon, label, activeClass }) => (
              <button
                key={value}
                type="button"
                onClick={() => onUpdateStep(selectedStep.id, { channel: value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                  selectedStep.channel === value
                    ? activeClass
                    : "border-border text-muted-foreground hover:border-muted-foreground/50"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <div className="flex gap-2">
            {(Object.entries(TONE_CONFIG) as [Tone, typeof TONE_CONFIG[Tone]][]).map(
              ([value, config]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onUpdateStep(selectedStep.id, { tone: value })}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all",
                    selectedStep.tone === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  {config.label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Template override (optional)</Label>
          <Textarea
            value={selectedStep.templateOverride}
            onChange={(e) =>
              onUpdateStep(selectedStep.id, {
                templateOverride: e.target.value,
              })
            }
            placeholder="Leave blank for AI-generated message..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            If blank, AI will generate the message based on channel and tone
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => onPreviewStep(selectedStep)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview Message
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="seq-name" className="text-xs text-muted-foreground uppercase tracking-wider">
          Sequence name
        </Label>
        <Input
          id="seq-name"
          value={sequenceName}
          onChange={(e) => onSequenceNameChange(e.target.value)}
          placeholder="e.g., Crown Follow-up"
          className="text-lg font-semibold h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Procedure filters
        </Label>
        <div className="flex gap-2">
          <Input
            value={procedureInput}
            onChange={(e) => setProcedureInput(e.target.value)}
            placeholder="e.g., D2740 - Crown"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProcedure();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addProcedure}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {procedures.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {procedures.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
              >
                {p}
                <button
                  onClick={() => removeProcedure(p)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Steps ({steps.length})
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className="w-full flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold",
                  step.channel === "sms"
                    ? "bg-blue-500"
                    : step.channel === "email"
                    ? "bg-purple-500"
                    : "bg-amber-500"
                )}
              >
                {step.position + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Day {step.dayOffset}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {step.channel} &middot; {step.tone}
                </p>
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={onAddStep}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </div>
    </div>
  );
}
