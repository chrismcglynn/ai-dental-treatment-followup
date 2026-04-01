"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ClipboardList,
  Zap,
  ArrowRight,
  ArrowUpDown,
  DollarSign,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { usePageHeader } from "@/hooks/usePageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  usePendingTreatmentsWithPatients,
  type PendingTreatmentRow,
} from "@/hooks/usePatients";
import { EnrollDialog } from "./EnrollDialog";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const columns: ColumnDef<PendingTreatmentRow, unknown>[] = [
  {
    id: "patient",
    accessorFn: (row) => `${row.patient.first_name} ${row.patient.last_name}`,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Patient
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const { patient } = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(patient.first_name, patient.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {patient.first_name} {patient.last_name}
            </p>
            {patient.phone && (
              <p className="text-xs text-muted-foreground truncate">
                {patient.phone}
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "code",
    accessorFn: (row) => row.treatment.code,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Code
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs font-mono">
        {row.original.treatment.code}
      </Badge>
    ),
  },
  {
    id: "description",
    accessorFn: (row) => row.treatment.description,
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate max-w-[250px] block">
        {row.original.treatment.description}
      </span>
    ),
  },
  {
    id: "amount",
    accessorFn: (row) => row.treatment.amount,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm font-medium">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        {row.original.treatment.amount.toLocaleString()}
      </div>
    ),
  },
  {
    id: "presented",
    accessorFn: (row) => row.treatment.presented_at,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Presented
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.treatment.presented_at);
      return (
        <div className="text-sm">
          <p>{format(date, "MMM d, yyyy")}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </p>
        </div>
      );
    },
  },
];

export default function PendingTreatmentsPage() {
  const router = useRouter();
  const { data: rows, isLoading } = usePendingTreatmentsWithPatients();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enrollOpen, setEnrollOpen] = useState(false);

  const toggleSelect = useCallback((treatmentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(treatmentId)) next.delete(treatmentId);
      else next.add(treatmentId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!rows) return;
    setSelected((prev) =>
      prev.size === rows.length
        ? new Set()
        : new Set(rows.map((r) => r.treatment.id))
    );
  }, [rows]);

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

  const hasRows = rows && rows.length > 0;

  usePageHeader({
    title: "Pending Treatments",
    portalToolbar: true,
  });

  // Prepend a checkbox column
  const columnsWithSelect: ColumnDef<PendingTreatmentRow, unknown>[] = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleAll();
            }}
            className="flex items-center justify-center"
          >
            <div
              className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                rows && selected.size === rows.length && rows.length > 0
                  ? "bg-primary border-primary"
                  : selected.size > 0
                  ? "bg-primary/50 border-primary"
                  : "border-muted-foreground/30"
              }`}
            >
              {selected.size > 0 && (
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
          </button>
        ),
        cell: ({ row }) => {
          const isChecked = selected.has(row.original.treatment.id);
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelect(row.original.treatment.id);
              }}
              className="flex items-center justify-center"
            >
              <div
                className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                  isChecked
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {isChecked && (
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
            </button>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
    ],
    [selected, rows, toggleAll, toggleSelect]
  );

  return (
    <div className="space-y-6">
      {!isLoading && !hasRows && rows !== undefined ? (
        <EmptyState
          icon={ClipboardList}
          title="No pending treatment plans"
          description="All treatment plans have been enrolled in follow-up sequences. Great job!"
        >
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </EmptyState>
      ) : (
        <>
          {/* Selection action bar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-primary/5 px-4 py-3">
              <span className="text-sm">
                <span className="font-medium">{selected.size}</span> selected
                {" \u00b7 "}
                <span className="text-muted-foreground">
                  {uniquePatientIds.size} patient
                  {uniquePatientIds.size !== 1 ? "s" : ""}
                  {" \u00b7 "}${totalValue.toLocaleString()}
                </span>
              </span>
              <Button onClick={() => setEnrollOpen(true)} size="sm">
                <Zap className="mr-2 h-4 w-4" />
                Enroll in Sequence
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          <DataTable
            data={rows ?? []}
            columns={columnsWithSelect}
            loading={isLoading}
            searchPlaceholder="Search patients, codes, descriptions..."
            stickyToolbar
            onRowClick={(row) => toggleSelect(row.treatment.id)}
            emptyState={
              <span className="text-sm text-muted-foreground">
                No matching treatment plans found.
              </span>
            }
          />

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
