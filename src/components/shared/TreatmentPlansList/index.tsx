"use client";

import { format } from "date-fns";
import { type Tables } from "@/types/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { useSandbox } from "@/lib/sandbox";
import { DEFAULT_PRACTICE_HOURS } from "@/components/portal/TreatmentPlanView";

interface TreatmentPlansListProps {
  treatments: Tables<"treatments">[];
  loading?: boolean;
  patientFirstName?: string;
}

const statusColors: Record<Tables<"treatments">["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy");
}

function generateSandboxPortalToken(
  patientId: string,
  treatmentId: string
): string {
  return `sandbox-token-${patientId}-${Date.now()}`;
}

export function TreatmentPlansList({ treatments, loading, patientFirstName }: TreatmentPlansListProps) {
  const { isSandbox, sandboxStore } = useSandbox();
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No treatment plans found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {treatments.map((treatment) => (
        <Card key={treatment.id} className="hover:bg-muted/30 transition-colors">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {treatment.description}
                  </span>
                  <Badge
                    className={`${statusColors[treatment.status]} border-0 text-[11px] shrink-0`}
                  >
                    {treatment.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Code: {treatment.code}</span>
                  <span>Presented: {formatDate(treatment.presented_at)}</span>
                  {treatment.decided_at && (
                    <span>Decided: {formatDate(treatment.decided_at)}</span>
                  )}
                </div>
              </div>
              <span className="font-semibold text-sm shrink-0">
                {formatCurrency(treatment.amount)}
              </span>
            </div>
            {isSandbox && (
              <Button
                size="sm"
                className="mt-2 h-7 px-3 text-xs"
                onClick={() => {
                  const rawToken = generateSandboxPortalToken(
                    treatment.patient_id,
                    treatment.id
                  );
                  sandboxStore.addPortalToken({
                    rawToken,
                    patientId: treatment.patient_id,
                    treatmentId: treatment.id,
                    practiceId: "sandbox-practice-001",
                    expiresAt: Date.now() + 72 * 60 * 60 * 1000,
                    usedAt: null,
                  });
                  sandboxStore.addActivityFeedItem({
                    id: `portal-${Date.now()}`,
                    type: "sms_sent",
                    description: `Portal link generated for ${treatment.description}`,
                    patientName: patientFirstName || "Patient",
                    timestamp: new Date().toISOString(),
                  });
                  const params = new URLSearchParams({
                    patientFirstName: patientFirstName || "Patient",
                    treatmentDescription: treatment.description,
                    treatmentId: treatment.id,
                    treatmentCode: treatment.code,
                    practiceName: "Riverside Family Dental",
                    practicePhone: "(555) 123-4567",
                    practiceEmail: "front-desk@riverside.demo",
                    treatmentAmount: String(treatment.amount),
                    practiceHours: JSON.stringify(DEFAULT_PRACTICE_HOURS),
                  });
                  window.open(
                    `/portal/${rawToken}?${params.toString()}`,
                    "_blank"
                  );
                }}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Simulate patient booking view →
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
