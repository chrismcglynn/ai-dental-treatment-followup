"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Zap, Plus, Users, Sparkles } from "lucide-react";
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
import { useSequences } from "@/hooks/useSequences";
import { useBulkEnroll, type PendingTreatmentRow } from "@/hooks/usePatients";
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
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(
    null
  );

  // Get unique treatment codes from selection
  const selectedCodes = useMemo(
    () => Array.from(new Set(selectedRows.map((r) => r.treatment.code))),
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

  // Score sequences by how many selected treatment codes they cover
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

  const handleEnroll = () => {
    if (!selectedSequenceId) return;
    bulkEnroll.mutate(
      { sequenceId: selectedSequenceId, patientIds },
      { onSuccess: onEnrolled }
    );
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
          {scoredSequences.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                No active sequences found. Create one first.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/sequences/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Sequence
              </Button>
            </div>
          ) : (
            scoredSequences.map(({ sequence, matchCount, seqCodes }) => (
              <SequenceOption
                key={sequence.id}
                sequence={sequence}
                matchCount={matchCount}
                totalCodes={selectedCodes.length}
                seqCodes={seqCodes}
                isSelected={selectedSequenceId === sequence.id}
                onSelect={() => setSelectedSequenceId(sequence.id)}
              />
            ))
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
}: {
  sequence: Sequence;
  matchCount: number;
  totalCodes: number;
  seqCodes: string[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isMatch = matchCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/5"
          : isMatch
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
            {isMatch && (
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
