import { createClient } from "@/lib/supabase/client";
import { type Tables, type InsertTables, type UpdateTables } from "@/types/database.types";
import { type PaginatedResponse } from "@/types/app.types";
import { isSandboxId } from "@/lib/sandbox/sandboxData";

export async function getPatients(
  practiceId: string,
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: Tables<"patients">["status"];
  } = {}
): Promise<PaginatedResponse<Tables<"patients">>> {
  const supabase = createClient();
  const { page = 1, pageSize = 20, search, status } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .eq("practice_id", practiceId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getPatientsWithStats(
  practiceId: string,
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: Tables<"patients">["status"];
  } = {}
): Promise<PaginatedResponse<Tables<"patients"> & {
  treatments: Tables<"treatments">[];
  sequence_enrollments: { id: string; status: string }[];
}>> {
  const supabase = createClient();
  const { page = 1, pageSize = 20, search, status } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("patients")
    .select("*, treatments(*), sequence_enrollments(id, status)", { count: "exact" })
    .eq("practice_id", practiceId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    // Supabase join types don't perfectly match our return type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: (data as unknown as (Tables<"patients"> & { treatments: Tables<"treatments">[]; sequence_enrollments: { id: string; status: string }[] })[]) ?? [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getPatient(
  patientId: string
): Promise<Tables<"patients">> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPatient(
  patient: InsertTables<"patients">
): Promise<Tables<"patients">> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert(patient)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePatient(
  patientId: string,
  updates: UpdateTables<"patients">
): Promise<Tables<"patients">> {
  if (isSandboxId(patientId)) {
    throw new Error("SANDBOX_MUTATION_BLOCKED: Cannot mutate sandbox data via real API");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", patientId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPatientTreatments(
  patientId: string
): Promise<Tables<"treatments">[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("patient_id", patientId)
    .order("presented_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPatientMessages(
  patientId: string
): Promise<Tables<"messages">[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPatientEnrollments(
  patientId: string
): Promise<(Tables<"sequence_enrollments"> & { sequences: Tables<"sequences"> })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sequence_enrollments")
    .select("*, sequences(*)")
    .eq("patient_id", patientId)
    .order("enrolled_at", { ascending: false });

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as unknown as (Tables<"sequence_enrollments"> & { sequences: Tables<"sequences"> })[]) ?? [];
}
