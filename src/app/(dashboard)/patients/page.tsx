"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Play,
  Ban,
  ArrowUpDown,
} from "lucide-react";
import { usePageHeader } from "@/hooks/usePageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { usePatientsWithStats, patientKeys } from "@/hooks/usePatients";
import { type Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { usePracticeStore } from "@/stores/practice-store";
import { getPatient } from "@/lib/api/patients";
import { isSandboxId } from "@/lib/sandbox/sandboxData";

type PatientRow = Tables<"patients"> & {
  treatments: Tables<"treatments">[];
  sequence_enrollments: { id: string; status: string }[];
};

const avatarColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getPatientStatus(patient: PatientRow): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (patient.status === "archived") {
    return { label: "Do not contact", variant: "destructive" };
  }
  const hasActiveEnrollment = patient.sequence_enrollments?.some(
    (e) => e.status === "active"
  );
  if (hasActiveEnrollment) {
    return { label: "In sequence", variant: "default" };
  }
  const hasPendingTreatment = patient.treatments?.some(
    (t) => t.status === "pending"
  );
  if (hasPendingTreatment) {
    return { label: "Pending", variant: "outline" };
  }
  return { label: "No active plan", variant: "secondary" };
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return format(date, "MMM d");
}

const columns: ColumnDef<PatientRow, unknown>[] = [
  {
    id: "name",
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
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
      const patient = row.original;
      const fullName = `${patient.first_name} ${patient.last_name}`;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className={cn(
                "text-white text-xs font-medium",
                getAvatarColor(fullName)
              )}
            >
              {getInitials(patient.first_name, patient.last_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{fullName}</span>
          {isSandboxId(patient.id) && (
            <Badge variant="outline" className="ml-2 text-[9px] px-1 py-0 text-muted-foreground border-muted-foreground/30">
              DEMO
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "contact",
    accessorFn: (row) => row.phone || row.email || "",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Contact
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const patient = row.original;
      return (
        <div className="flex items-center gap-2">
          <Phone
            className={cn(
              "h-3.5 w-3.5",
              patient.phone ? "text-muted-foreground" : "text-muted-foreground/30"
            )}
          />
          <Mail
            className={cn(
              "h-3.5 w-3.5",
              patient.email ? "text-muted-foreground" : "text-muted-foreground/30"
            )}
          />
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {patient.phone || patient.email || "No contact"}
          </span>
        </div>
      );
    },
  },
  {
    id: "plans",
    accessorFn: (row) => row.treatments?.length ?? 0,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Plans
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const patient = row.original;
      const pending = patient.treatments?.filter((t) => t.status === "pending").length ?? 0;
      const active = patient.sequence_enrollments?.filter((e) => e.status === "active").length ?? 0;
      const completed = patient.treatments?.filter((t) => t.status === "completed").length ?? 0;
      const total = patient.treatments?.length ?? 0;

      if (total === 0) return <span className="text-xs text-muted-foreground">-</span>;

      return (
        <div className="flex items-center gap-1.5">
          {pending > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {pending} pending
            </Badge>
          )}
          {active > 0 && (
            <Badge className="text-[10px] px-1.5 py-0">
              {active} active
            </Badge>
          )}
          {completed > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {completed} done
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "last_contact",
    accessorFn: (row) => row.updated_at,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last Contact
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(row.original.updated_at)}
      </span>
    ),
  },
  {
    id: "status",
    accessorFn: (row) => getPatientStatus(row).label,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const { label, variant } = getPatientStatus(row.original);
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const patient = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Actions for ${patient.first_name} ${patient.last_name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem asChild>
              <a href={`/patients/${patient.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Play className="mr-2 h-4 w-4" />
              Start sequence
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Ban className="mr-2 h-4 w-4" />
              Mark DNC
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function PatientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const prefetchPatient = useCallback(
    (patientId: string) => {
      if (!activePracticeId) return;
      queryClient.prefetchQuery({
        queryKey: patientKeys.detail(activePracticeId, patientId),
        queryFn: () => getPatient(patientId),
        staleTime: 30_000,
      });
    },
    [queryClient, activePracticeId]
  );

  const filters = useMemo(
    () => ({
      status: statusFilter !== "all" ? (statusFilter as Tables<"patients">["status"]) : undefined,
    }),
    [statusFilter]
  );

  const { data, isLoading } = usePatientsWithStats(filters);
  const patients = (data?.data ?? []) as PatientRow[];
  const hasPatients = patients.length > 0 || isLoading;

  usePageHeader({
    title: "Patients",
    portalToolbar: true,
    search: (
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All patients</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="archived">Archived / DNC</SelectItem>
        </SelectContent>
      </Select>
    ),
    actions: <Button size="sm">Import Patients</Button>,
  });

  return (
    <div className="space-y-6">
      {!hasPatients && !isLoading ? (
        <EmptyState
          icon={Users}
          title="No patients yet"
          description="Import your patient list from your PMS or add patients manually to start creating follow-up sequences."
        >
          <Button>Import Patients</Button>
        </EmptyState>
      ) : (
        <>
          <DataTable
            data={patients}
            columns={columns}
            loading={isLoading}
            onRowClick={(row) => router.push(`/patients/${row.id}`)}
            onRowHover={(row) => prefetchPatient(row.id)}
            searchPlaceholder="Search by name, phone, or email..."
            stickyToolbar
            pagination
          />
        </>
      )}
    </div>
  );
}
