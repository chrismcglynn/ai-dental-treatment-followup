"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  CheckSquare,
  Zap,
  ArrowRight,
  Calendar,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  usePendingTreatmentsWithPatients,
  type PendingTreatmentRow,
} from "@/hooks/usePatients";
import { EnrollDialog } from "./EnrollDialog";

export default function PendingTreatmentsPage() {
  const router = useRouter();
  const { data: rows, isLoading } = usePendingTreatmentsWithPatients();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enrollOpen, setEnrollOpen] = useState(false);

  const toggleSelect = (treatmentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(treatmentId)) next.delete(treatmentId);
      else next.add(treatmentId);
      return next;
    });
  };

  const toggleAll = () => {
    if (!rows) return;
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.treatment.id)));
    }
  };

  const selectedRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => selected.has(r.treatment.id));
  }, [rows, selected]);

  const totalValue = useMemo(
    () => selectedRows.reduce((sum, r) => sum + r.treatment.amount, 0),
    [selectedRows]
  );

  const uniquePatientIds = useMemo(
    () => new Set(selectedRows.map((r) => r.patient.id)),
    [selectedRows]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pending Treatment Plans"
          description="Review and enroll patients into follow-up sequences"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Pending Treatments" },
          ]}
        />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasRows = rows && rows.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Treatment Plans"
        description={
          hasRows
            ? `${rows.length} treatment plan${rows.length !== 1 ? "s" : ""} awaiting follow-up`
            : "Review and enroll patients into follow-up sequences"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pending Treatments" },
        ]}
      />

      {!hasRows ? (
        <EmptyState
          icon={ClipboardList}
          title="No pending treatment plans"
          description="All treatment plans have been enrolled in follow-up sequences. Great job!"
        >
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </EmptyState>
      ) : (
        <>
          {/* Selection toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                    selected.size === rows.length
                      ? "bg-primary border-primary"
                      : selected.size > 0
                      ? "bg-primary/50 border-primary"
                      : "border-input"
                  }`}
                >
                  {selected.size > 0 && (
                    <CheckSquare className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {selected.size === 0
                  ? "Select all"
                  : selected.size === rows.length
                  ? "Deselect all"
                  : `${selected.size} selected`}
              </button>
              {selected.size > 0 && (
                <span className="text-xs text-muted-foreground">
                  {uniquePatientIds.size} patient{uniquePatientIds.size !== 1 ? "s" : ""}
                  {" \u00b7 "}
                  ${totalValue.toLocaleString()} total value
                </span>
              )}
            </div>
            {selected.size > 0 && (
              <Button onClick={() => setEnrollOpen(true)}>
                <Zap className="mr-2 h-4 w-4" />
                Enroll in Sequence
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Treatment list */}
          <Card>
            <CardContent className="p-0">
              {rows.map((row, idx) => (
                <TreatmentRow
                  key={row.treatment.id}
                  row={row}
                  isSelected={selected.has(row.treatment.id)}
                  onToggle={() => toggleSelect(row.treatment.id)}
                  showSeparator={idx > 0}
                />
              ))}
            </CardContent>
          </Card>

          {/* Enroll dialog */}
          <EnrollDialog
            open={enrollOpen}
            onOpenChange={setEnrollOpen}
            selectedRows={selectedRows}
            onEnrolled={() => {
              setSelected(new Set());
              setEnrollOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}

function TreatmentRow({
  row,
  isSelected,
  onToggle,
  showSeparator,
}: {
  row: PendingTreatmentRow;
  isSelected: boolean;
  onToggle: () => void;
  showSeparator: boolean;
}) {
  const { treatment, patient } = row;
  const patientName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const daysAgo = formatDistanceToNow(new Date(treatment.presented_at), {
    addSuffix: true,
  });

  return (
    <>
      {showSeparator && <Separator />}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
          isSelected ? "bg-primary/5" : ""
        }`}
      >
        {/* Checkbox */}
        <div
          className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? "bg-primary border-primary"
              : "border-muted-foreground/30"
          }`}
        >
          {isSelected && (
            <svg
              className="h-3 w-3 text-primary-foreground"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Patient avatar */}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        {/* Patient + treatment info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{patientName}</p>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {treatment.code}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {treatment.description}
          </p>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1 text-sm font-medium shrink-0">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          {treatment.amount.toLocaleString()}
        </div>

        {/* Presented date */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0 w-28 justify-end">
          <Calendar className="h-3 w-3" />
          {daysAgo}
        </div>
      </button>
    </>
  );
}
