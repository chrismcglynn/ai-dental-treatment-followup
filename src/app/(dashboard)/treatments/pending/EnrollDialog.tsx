"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Plus, Users, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSequences, useSuggestSequence, useGenerateSequence } from "@/hooks/useSequences";
import { useBulkEnroll, type PendingTreatmentRow } from "@/hooks/usePatients";
import { useUiStore } from "@/stores/ui-store";
import { type Sequence } from "@/types/app.types";

interface EnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRows: PendingTreatmentRow[];
  onEnrolled: () => void;
}

export function EnrollDialog({
  open,
  onOpenChange,
  selectedRows,
  onEnrolled,
}: EnrollDialogProps) {
  const router = useRouter();
  const { data: sequences } = useSequences({ status: "active" });
  const bulkEnroll = useBulkEnroll();
  const suggestSequence = useSuggestSequence();
  const generateSequence = useGenerateSequence();
  const setAiSuggestedSequence = useUiStore((s) => s.setAiSuggestedSequence);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(
    null
  );

  // Get unique treatment codes from selection
  const selectedCodes = useMemo(
    () => Array.from(new Set(selectedRows.map((r) => r.treatment.code))),
    [selectedRows]
  );

  const selectedDescriptions = useMemo(
    () => Array.from(new Set(selectedRows.map((r) => r.treatment.description))),
    [selectedRows]
  );

  // Get unique patient IDs
  const patientIds = useMemo(
    () => Array.from(new Set(selectedRows.map((r) => r.patient.id))),
    [selectedRows]
  );

  const totalValue = useMemo(
    () => selectedRows.reduce((sum, r) => sum + r.treatment.amount, 0),
    [selectedRows]
  );

  // Score sequences by how many selected treatment codes they cover (fallback sort)
  const scoredSequences = useMemo(() => {
    if (!sequences) return [];
    return sequences
      .map((seq) => {
        const seqCodes = (seq.treatment_type ?? "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        const matchCount = selectedCodes.filter((code) =>
          seqCodes.includes(code)
        ).length;
        return { sequence: seq, matchCount, seqCodes };
      })
      .sort((a, b) => b.matchCount - a.matchCount);
  }, [sequences, selectedCodes]);

  // AI suggestion state
  const aiSuggestions = suggestSequence.data?.suggestions;

  // Merge AI suggestions with scored sequences
  const displaySequences = useMemo(() => {
    if (!aiSuggestions || aiSuggestions.length === 0) return scoredSequences;

    const suggestionMap = new Map(
      aiSuggestions.map((s) => [s.sequenceId, s])
    );

    return [...scoredSequences].sort((a, b) => {
      const aScore = suggestionMap.get(a.sequence.id)?.score ?? 0;
      const bScore = suggestionMap.get(b.sequence.id)?.score ?? 0;
      return bScore - aScore;
    });
  }, [scoredSequences, aiSuggestions]);

  // Fire AI suggestion when dialog opens with multiple sequences
  useEffect(() => {
    if (
      open &&
      sequences &&
      sequences.length > 1 &&
      !suggestSequence.data &&
      !suggestSequence.isPending
    ) {
      suggestSequence.mutate({
        treatmentDescriptions: selectedDescriptions,
        treatmentCodes: selectedCodes,
        sequences: sequences.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          treatment_type: s.treatment_type,
          conversion_rate: s.conversion_rate,
          patient_count: s.patient_count,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sequences?.length]);

  // Auto-select single sequence
  useEffect(() => {
    if (sequences?.length === 1 && !selectedSequenceId) {
      setSelectedSequenceId(sequences[0].id);
    }
  }, [sequences, selectedSequenceId]);

  // Auto-select top AI suggestion if score >= 80
  useEffect(() => {
    if (aiSuggestions?.length && aiSuggestions[0].score >= 80 && !selectedSequenceId) {
      setSelectedSequenceId(aiSuggestions[0].sequenceId);
    }
  }, [aiSuggestions, selectedSequenceId]);

  // Generate sequence when none exist
  useEffect(() => {
    if (
      open &&
      sequences &&
      sequences.length === 0 &&
      !generateSequence.data &&
      !generateSequence.isPending
    ) {
      generateSequence.mutate({
        treatmentDescriptions: selectedDescriptions,
        treatmentCodes: selectedCodes,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sequences?.length]);

  const handleEnroll = () => {
    if (!selectedSequenceId) return;
    bulkEnroll.mutate(
      { sequenceId: selectedSequenceId, patientIds },
      { onSuccess: onEnrolled }
    );
  };

  const handleUseGeneratedSequence = () => {
    if (!generateSequence.data) return;
    setAiSuggestedSequence({
      name: generateSequence.data.name,
      procedures: generateSequence.data.procedures,
      steps: generateSequence.data.steps,
    });
    onOpenChange(false);
    router.push("/sequences/new");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enroll in Sequence</DialogTitle>
          <DialogDescription>
            Assign {patientIds.length} patient
            {patientIds.length !== 1 ? "s" : ""} (
            {selectedRows.length} treatment plan
            {selectedRows.length !== 1 ? "s" : ""},{" "}
            ${totalValue.toLocaleString()}) to a follow-up sequence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[360px] overflow-y-auto">
          {!sequences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sequences.length === 0 ? (
            // No sequences — show AI-generated suggestion
            <div className="space-y-4">
              {generateSequence.isPending ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    AI is designing a sequence for these treatments...
                  </p>
                </div>
              ) : generateSequence.data ? (
                <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      AI Recommended Sequence
                    </span>
                  </div>
                  <p className="text-sm font-semibold">
                    {generateSequence.data.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {generateSequence.data.steps.length} steps &middot;{" "}
                    {generateSequence.data.steps
                      .map((s) => s.channel.toUpperCase())
                      .join(" → ")}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    {generateSequence.data.reasoning}
                  </p>
                  <Button onClick={handleUseGeneratedSequence} className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Use This Sequence
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    No active sequences found. Create one first.
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/sequences/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Sequence Manually
              </Button>
            </div>
          ) : (
            <>
              {sequences.length === 1 && (
                <p className="text-xs text-muted-foreground">
                  Only 1 active sequence -- auto-selected
                </p>
              )}
              {suggestSequence.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI analyzing best match...
                </div>
              )}
              {displaySequences.map(({ sequence, matchCount, seqCodes }) => {
                const aiSuggestion = aiSuggestions?.find(
                  (s) => s.sequenceId === sequence.id
                );
                const isTopAi =
                  aiSuggestions?.[0]?.sequenceId === sequence.id &&
                  aiSuggestions[0].score >= 70;

                return (
                  <SequenceOption
                    key={sequence.id}
                    sequence={sequence}
                    matchCount={matchCount}
                    totalCodes={selectedCodes.length}
                    seqCodes={seqCodes}
                    isSelected={selectedSequenceId === sequence.id}
                    onSelect={() => setSelectedSequenceId(sequence.id)}
                    aiReason={aiSuggestion?.reason}
                    isTopAi={isTopAi}
                  />
                );
              })}
            </>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            size="sm"
            className="sm:mr-auto"
            onClick={() => router.push("/sequences/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Sequence
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedSequenceId || bulkEnroll.isPending}
          >
            {bulkEnroll.isPending ? (
              "Enrolling..."
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Enroll Patients
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SequenceOption({
  sequence,
  matchCount,
  totalCodes,
  seqCodes,
  isSelected,
  onSelect,
  aiReason,
  isTopAi,
}: {
  sequence: Sequence;
  matchCount: number;
  totalCodes: number;
  seqCodes: string[];
  isSelected: boolean;
  onSelect: () => void;
  aiReason?: string;
  isTopAi?: boolean;
}) {
  const isMatch = matchCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/5"
          : isMatch || isTopAi
          ? "border-border hover:border-primary/50"
          : "border-border/50 hover:border-border opacity-75"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Radio indicator */}
        <div
          className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
            isSelected ? "border-primary" : "border-muted-foreground/30"
          }`}
        >
          {isSelected && (
            <div className="h-2 w-2 rounded-full bg-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{sequence.name}</p>
            {isTopAi && (
              <Badge
                variant="secondary"
                className="text-[10px] gap-1 bg-primary/10 text-primary"
              >
                <Sparkles className="h-3 w-3" />
                AI Recommended
              </Badge>
            )}
            {isMatch && !isTopAi && (
              <Badge
                variant="secondary"
                className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Sparkles className="h-3 w-3" />
                {matchCount}/{totalCodes} codes match
              </Badge>
            )}
          </div>
          {sequence.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {sequence.description}
            </p>
          )}
          {aiReason && (
            <p className="text-xs text-muted-foreground italic mt-0.5">
              {aiReason}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {seqCodes.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                Codes: {seqCodes.join(", ")}
              </span>
            )}
            {sequence.patient_count != null && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" />
                {sequence.patient_count} enrolled
              </span>
            )}
            {sequence.conversion_rate != null && (
              <span className="text-[10px] text-muted-foreground">
                {sequence.conversion_rate.toFixed(0)}% conversion
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
