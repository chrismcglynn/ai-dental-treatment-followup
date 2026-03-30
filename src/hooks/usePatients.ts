import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPatients,
  getPatientsWithStats,
  getPatient,
  createPatient,
  updatePatient,
  getPatientTreatments,
  getPatientMessages,
  getPatientEnrollments,
  createEnrollment,
  getPendingTreatmentsWithPatients,
  markPatientBooked,
} from "@/lib/api/patients";
import { type InsertTables, type UpdateTables, type Tables } from "@/types/database.types";
import { type PatientFilters, type Patient, type Treatment, type Message, type EnrollmentWithSequence, type PaginatedResponse } from "@/types/app.types";
import { usePracticeStore } from "@/stores/practice-store";
import { useUiStore } from "@/stores/ui-store";
import { useSandbox } from "@/lib/sandbox";
import { simulateDelay } from "@/lib/sandbox/utils";

// Query keys factory
export const patientKeys = {
  all: (practiceId: string) => ["patients", practiceId] as const,
  list: (practiceId: string, filters?: PatientFilters) =>
    [...patientKeys.all(practiceId), "list", filters] as const,
  listWithStats: (practiceId: string, filters?: PatientFilters) =>
    [...patientKeys.all(practiceId), "listWithStats", filters] as const,
  detail: (practiceId: string, patientId: string) =>
    [...patientKeys.all(practiceId), "detail", patientId] as const,
  treatments: (practiceId: string, patientId: string) =>
    [...patientKeys.detail(practiceId, patientId), "treatments"] as const,
  messages: (practiceId: string, patientId: string) =>
    [...patientKeys.detail(practiceId, patientId), "messages"] as const,
  enrollments: (practiceId: string, patientId: string) =>
    [...patientKeys.detail(practiceId, patientId), "enrollments"] as const,
};

export function usePatients(filters?: PatientFilters) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: patientKeys.list(activePracticeId!, filters),
    queryFn: async (): Promise<PaginatedResponse<Patient>> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getPatients(filters) as PaginatedResponse<Patient>;
      }
      return getPatients(activePracticeId!, filters);
    },
    enabled: !!activePracticeId,
  });
}

export function usePatientsWithStats(filters?: PatientFilters) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  type PatientWithStats = Tables<"patients"> & { treatments: Tables<"treatments">[]; sequence_enrollments: { id: string; status: string }[] };
  return useQuery({
    queryKey: patientKeys.listWithStats(activePracticeId!, filters),
    queryFn: async (): Promise<PaginatedResponse<PatientWithStats>> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getPatientsWithStats(filters) as PaginatedResponse<PatientWithStats>;
      }
      return getPatientsWithStats(activePracticeId!, filters);
    },
    enabled: !!activePracticeId,
  });
}

export function usePatient(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: patientKeys.detail(activePracticeId!, patientId),
    queryFn: async (): Promise<Patient | undefined> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getPatient(patientId) as Patient | undefined;
      }
      return getPatient(patientId);
    },
    enabled: !!activePracticeId && !!patientId,
  });
}

export function usePatientTreatments(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: patientKeys.treatments(activePracticeId!, patientId),
    queryFn: async (): Promise<Treatment[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getPatientTreatments(patientId) as Treatment[];
      }
      return getPatientTreatments(patientId);
    },
    enabled: !!activePracticeId && !!patientId,
  });
}

export function usePatientMessages(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: patientKeys.messages(activePracticeId!, patientId),
    queryFn: async (): Promise<Message[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getPatientMessages(patientId) as Message[];
      }
      return getPatientMessages(patientId);
    },
    enabled: !!activePracticeId && !!patientId,
  });
}

export function usePatientEnrollments(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: patientKeys.enrollments(activePracticeId!, patientId),
    queryFn: async (): Promise<EnrollmentWithSequence[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getPatientEnrollments(patientId) as EnrollmentWithSequence[];
      }
      return getPatientEnrollments(patientId);
    },
    enabled: !!activePracticeId && !!patientId,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (patient: InsertTables<"patients">) => createPatient(patient),
    onSuccess: () => {
      addToast({ title: "Patient created", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: patientKeys.all(activePracticeId!),
      });
    },
    onError: () => {
      addToast({ title: "Failed to create patient", variant: "destructive" });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"patients">;
    }) => {
      if (isSandbox) {
        await simulateDelay(500);
        const updated = sandboxStore.updatePatient(id, data);
        if (!updated) throw new Error("Patient not found");
        return updated;
      }
      return updatePatient(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Optimistic update for status toggle (DNC)
      if (data.status) {
        await queryClient.cancelQueries({
          queryKey: patientKeys.detail(activePracticeId!, id),
        });
        const previous = queryClient.getQueryData(
          patientKeys.detail(activePracticeId!, id)
        );
        queryClient.setQueryData(
          patientKeys.detail(activePracticeId!, id),
          (old: Record<string, unknown> | undefined) =>
            old ? { ...old, ...data } : old
        );
        return { previous, id };
      }
    },
    onSuccess: (_, { id }) => {
      addToast({ title: "Patient updated", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: patientKeys.list(activePracticeId!),
      });
      queryClient.invalidateQueries({
        queryKey: patientKeys.listWithStats(activePracticeId!),
      });
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(activePracticeId!, id),
      });
    },
    onError: (_, __, context) => {
      addToast({ title: "Failed to update patient", variant: "destructive" });
      if (context?.previous) {
        queryClient.setQueryData(
          patientKeys.detail(activePracticeId!, context.id),
          context.previous
        );
      }
    },
  });
}

export interface PendingTreatmentRow {
  treatment: Treatment;
  patient: Patient;
}

export function usePendingTreatmentsWithPatients() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: [...patientKeys.all(activePracticeId!), "pending-treatments-with-patients"],
    queryFn: async (): Promise<PendingTreatmentRow[]> => {
      if (isSandbox) {
        await simulateDelay(300);
        const treatments = sandboxStore.treatments.filter(
          (t) => t.status === "pending"
        );
        const patients = sandboxStore.patients;
        // Exclude patients who already have an active enrollment
        const enrolledPatientIds = new Set(
          sandboxStore.enrollments
            .filter((e) => e.status === "active")
            .map((e) => e.patient_id)
        );
        return treatments
          .filter((t) => !enrolledPatientIds.has(t.patient_id))
          .map((t) => ({
            treatment: t,
            patient: patients.find((p) => p.id === t.patient_id)!,
          }))
          .filter((row) => row.patient);
      }
      const data = await getPendingTreatmentsWithPatients(activePracticeId!);
      return data.map((row) => ({
        treatment: {
          id: row.id,
          practice_id: row.practice_id,
          patient_id: row.patient_id,
          code: row.code,
          description: row.description,
          amount: row.amount,
          status: row.status,
          presented_at: row.presented_at,
          decided_at: row.decided_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
        } as Treatment,
        patient: row.patients,
      }));
    },
    enabled: !!activePracticeId,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({
      sequenceId,
      patientId,
    }: {
      sequenceId: string;
      patientId: string;
    }) => {
      const enrollment: InsertTables<"sequence_enrollments"> = {
        sequence_id: sequenceId,
        patient_id: patientId,
        practice_id: activePracticeId!,
        status: "active",
        current_touchpoint: 0,
      };

      if (isSandbox) {
        await simulateDelay(600);
        const now = new Date().toISOString();
        const sandboxEnrollment: Tables<"sequence_enrollments"> = {
          id: crypto.randomUUID(),
          ...enrollment,
          enrolled_at: now,
          completed_at: null,
          converted_at: null,
        };
        sandboxStore.addEnrollment(sandboxEnrollment);
        return sandboxEnrollment;
      }
      return createEnrollment(enrollment);
    },
    onSuccess: (_, { patientId }) => {
      addToast({ title: "Patient enrolled in sequence", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: patientKeys.enrollments(activePracticeId!, patientId),
      });
      queryClient.invalidateQueries({
        queryKey: patientKeys.listWithStats(activePracticeId!),
      });
    },
    onError: () => {
      addToast({ title: "Failed to enroll patient", variant: "destructive" });
    },
  });
}

export function useBulkEnroll() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({
      sequenceId,
      patientIds,
    }: {
      sequenceId: string;
      patientIds: string[];
    }) => {
      const results = [];
      for (const patientId of patientIds) {
        const enrollment: InsertTables<"sequence_enrollments"> = {
          sequence_id: sequenceId,
          patient_id: patientId,
          practice_id: activePracticeId!,
          status: "active",
          current_touchpoint: 0,
        };

        if (isSandbox) {
          await simulateDelay(200);
          const now = new Date().toISOString();
          const sandboxEnrollment: Tables<"sequence_enrollments"> = {
            id: crypto.randomUUID(),
            ...enrollment,
            enrolled_at: now,
            completed_at: null,
            converted_at: null,
          };
          sandboxStore.addEnrollment(sandboxEnrollment);
          results.push(sandboxEnrollment);
        } else {
          results.push(await createEnrollment(enrollment));
        }
      }
      return results;
    },
    onSuccess: (_, { patientIds }) => {
      const count = patientIds.length;
      addToast({
        title: `${count} patient${count !== 1 ? "s" : ""} enrolled in sequence`,
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: patientKeys.all(activePracticeId!),
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics", activePracticeId!],
      });
    },
    onError: () => {
      addToast({ title: "Failed to enroll patients", variant: "destructive" });
    },
  });
}

export function useMarkAsBooked() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({ patientId }: { patientId: string }) => {
      if (isSandbox) {
        await simulateDelay(400);
        const now = new Date().toISOString();

        // Mark all pending treatments as accepted
        sandboxStore.treatments
          .filter((t) => t.patient_id === patientId && t.status === "pending")
          .forEach((t) => {
            sandboxStore.updateTreatment(t.id, {
              status: "accepted",
              decided_at: now,
            });
          });

        // Convert all active enrollments
        sandboxStore.enrollments
          .filter((e) => e.patient_id === patientId && e.status === "active")
          .forEach((e) => {
            sandboxStore.updateEnrollment(e.id, {
              status: "converted",
              converted_at: now,
            });
          });

        return;
      }
      return markPatientBooked(patientId, activePracticeId!);
    },
    onSuccess: () => {
      addToast({
        title: "Patient marked as booked",
        description: "Treatment accepted and sequences stopped.",
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: patientKeys.all(activePracticeId!),
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics", activePracticeId!],
      });
    },
    onError: () => {
      addToast({
        title: "Failed to mark as booked",
        variant: "destructive",
      });
    },
  });
}
