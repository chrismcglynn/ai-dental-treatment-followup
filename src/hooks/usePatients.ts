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
} from "@/lib/api/patients";
import { type InsertTables, type UpdateTables } from "@/types/database.types";
import { type PatientFilters } from "@/types/app.types";
import { usePracticeStore } from "@/stores/practice-store";
import { useUiStore } from "@/stores/ui-store";

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

  return useQuery({
    queryKey: patientKeys.list(activePracticeId!, filters),
    queryFn: () => getPatients(activePracticeId!, filters),
    enabled: !!activePracticeId,
  });
}

export function usePatientsWithStats(filters?: PatientFilters) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);

  return useQuery({
    queryKey: patientKeys.listWithStats(activePracticeId!, filters),
    queryFn: () => getPatientsWithStats(activePracticeId!, filters),
    enabled: !!activePracticeId,
  });
}

export function usePatient(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);

  return useQuery({
    queryKey: patientKeys.detail(activePracticeId!, patientId),
    queryFn: () => getPatient(patientId),
    enabled: !!activePracticeId && !!patientId,
  });
}

export function usePatientTreatments(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);

  return useQuery({
    queryKey: patientKeys.treatments(activePracticeId!, patientId),
    queryFn: () => getPatientTreatments(patientId),
    enabled: !!activePracticeId && !!patientId,
  });
}

export function usePatientMessages(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);

  return useQuery({
    queryKey: patientKeys.messages(activePracticeId!, patientId),
    queryFn: () => getPatientMessages(patientId),
    enabled: !!activePracticeId && !!patientId,
  });
}

export function usePatientEnrollments(patientId: string) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);

  return useQuery({
    queryKey: patientKeys.enrollments(activePracticeId!, patientId),
    queryFn: () => getPatientEnrollments(patientId),
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

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTables<"patients">;
    }) => updatePatient(id, data),
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
