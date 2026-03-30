"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Copy,
  Check,
  Play,
  ShieldAlert,
  MessageSquare,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TreatmentPlansList } from "@/components/shared/TreatmentPlansList";
import { ContactTimeline } from "@/components/shared/ContactTimeline";
import {
  usePatient,
  usePatientTreatments,
  usePatientMessages,
  usePatientEnrollments,
  useUpdatePatient,
  useCreateEnrollment,
  useMarkAsBooked,
} from "@/hooks/usePatients";
import { useSequences } from "@/hooks/useSequences";
import { cn } from "@/lib/utils";
import { isSandboxId } from "@/lib/sandbox/sandboxData";

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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
      aria-label={`Copy ${value}`}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function getPreferredContactBadge(patient: { phone: string | null; email: string | null }) {
  if (patient.phone && patient.email) return "SMS & Email";
  if (patient.phone) return "SMS";
  if (patient.email) return "Email";
  return "None";
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dncDialogOpen, setDncDialogOpen] = useState(false);
  const [sequenceDialogOpen, setSequenceDialogOpen] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);

  const { data: patient, isLoading: patientLoading } = usePatient(id);
  const { data: treatments, isLoading: treatmentsLoading } = usePatientTreatments(id);
  const { data: messages, isLoading: messagesLoading } = usePatientMessages(id);
  const { data: enrollments } = usePatientEnrollments(id);
  const { data: sequences, isLoading: sequencesLoading } = useSequences({ status: "active" });
  const updatePatient = useUpdatePatient();
  const createEnrollment = useCreateEnrollment();
  const markAsBooked = useMarkAsBooked();

  const isDnc = patient?.status === "archived";
  const fullName = patient ? `${patient.first_name} ${patient.last_name}` : "";

  const handleStartSequence = () => {
    if (!patient || !selectedSequenceId) return;
    createEnrollment.mutate(
      { sequenceId: selectedSequenceId, patientId: patient.id },
      {
        onSuccess: () => {
          setSequenceDialogOpen(false);
          setSelectedSequenceId(null);
        },
      }
    );
  };

  const handleToggleDnc = () => {
    if (!patient) return;
    updatePatient.mutate(
      {
        id: patient.id,
        data: { status: isDnc ? "active" : "archived" },
      },
      { onSuccess: () => setDncDialogOpen(false) }
    );
  };

  if (patientLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Skeleton className="h-[400px] rounded-lg" />
          <Skeleton className="h-[600px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/patients">
            <Button variant="ghost" size="icon" aria-label="Back to patients">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader title="Patient not found" />
        </div>
      </div>
    );
  }

  const activeEnrollments = enrollments?.filter((e) => e.status === "active") ?? [];
  const hasPendingTreatment = treatments?.some((t) => t.status === "pending");
  const showMarkBooked = hasPendingTreatment || activeEnrollments.length > 0;
  const availableSequences = sequences?.filter(
    (seq) => !activeEnrollments.some((e) => e.sequence_id === seq.id)
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="icon" aria-label="Back to patients">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={fullName}
          description={`Patient ID: ${patient.id.slice(0, 8)}...`}
          breadcrumbs={[
            { label: "Patients", href: "/patients" },
            { label: fullName },
          ]}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left Panel (sticky) */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center mb-4">
                <Avatar className="h-16 w-16 mb-3">
                  <AvatarFallback
                    className={cn(
                      "text-white text-lg font-semibold",
                      getAvatarColor(fullName)
                    )}
                  >
                    {getInitials(patient.first_name, patient.last_name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="font-semibold text-lg">{fullName}</h2>
                {isSandboxId(patient.id) && (
                  <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30">
                    DEMO
                  </Badge>
                )}
                <Badge variant="outline" className="mt-1">
                  {getPreferredContactBadge(patient)}
                </Badge>
                {isDnc && (
                  <Badge variant="destructive" className="mt-2">
                    Do Not Contact
                  </Badge>
                )}
              </div>

              <Separator className="my-4" />

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">
                      {patient.phone || "No phone"}
                    </span>
                  </div>
                  {patient.phone && <CopyButton value={patient.phone} />}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">
                      {patient.email || "No email"}
                    </span>
                  </div>
                  {patient.email && <CopyButton value={patient.email} />}
                </div>
              </div>

              <Separator className="my-4" />

              {/* DNC Toggle */}
              <Button
                variant={isDnc ? "outline" : "destructive"}
                size="sm"
                className="w-full"
                onClick={() => setDncDialogOpen(true)}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                {isDnc ? "Remove Do Not Contact" : "Mark Do Not Contact"}
              </Button>

              {/* Start Sequence */}
              <Button
                variant="default"
                size="sm"
                className="w-full mt-2"
                disabled={isDnc}
                onClick={() => {
                  setSelectedSequenceId(null);
                  setSequenceDialogOpen(true);
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Manual Sequence
              </Button>

              {/* Mark as Booked */}
              {showMarkBooked && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 border-green-500/50 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  onClick={() => markAsBooked.mutate({ patientId: patient.id })}
                  disabled={markAsBooked.isPending}
                >
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  {markAsBooked.isPending ? "Updating..." : "Mark as Booked"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Active Enrollments */}
          {activeEnrollments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Sequences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      {enrollment.sequences?.name ?? "Unknown"}
                    </span>
                    <Badge variant="default" className="text-[10px] shrink-0">
                      Step {enrollment.current_touchpoint}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel (scrollable) */}
        <div className="space-y-6">
          {/* Treatment Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Treatment Plans
                {treatments && treatments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {treatments.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TreatmentPlansList
                treatments={treatments ?? []}
                loading={treatmentsLoading}
                patientFirstName={patient?.first_name}
              />
            </CardContent>
          </Card>

          {/* Contact Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Contact Timeline
                {messages && messages.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {messages.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactTimeline
                messages={messages ?? []}
                loading={messagesLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DNC Confirm Dialog */}
      <Dialog open={dncDialogOpen} onOpenChange={setDncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isDnc ? "Remove Do Not Contact" : "Mark as Do Not Contact"}
            </DialogTitle>
            <DialogDescription>
              {isDnc
                ? `This will allow ${fullName} to be contacted again through sequences and messages.`
                : `This will stop all active sequences and prevent any future messages from being sent to ${fullName}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDncDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isDnc ? "default" : "destructive"}
              onClick={handleToggleDnc}
              disabled={updatePatient.isPending}
            >
              {updatePatient.isPending
                ? "Updating..."
                : isDnc
                  ? "Allow Contact"
                  : "Mark DNC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Sequence Dialog */}
      <Dialog open={sequenceDialogOpen} onOpenChange={setSequenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Manual Sequence</DialogTitle>
            <DialogDescription>
              Select a sequence to enroll {fullName} in. Only active sequences not already assigned are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto py-2">
            {sequencesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            ) : availableSequences.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No available sequences. All active sequences are already assigned to this patient.
              </p>
            ) : (
              availableSequences.map((seq) => (
                <button
                  key={seq.id}
                  onClick={() => setSelectedSequenceId(seq.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    selectedSequenceId === seq.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className="font-medium text-sm">{seq.name}</div>
                  {seq.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {seq.description}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSequenceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartSequence}
              disabled={!selectedSequenceId || createEnrollment.isPending}
            >
              {createEnrollment.isPending ? "Enrolling..." : "Start Sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
