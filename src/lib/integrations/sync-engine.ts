import { type SupabaseClient } from "@supabase/supabase-js";
import { getConnector } from "./factory";
import type {
  PmsCredentials,
  SyncCursor,
  SyncLogEntry,
  NormalizedPatient,
  NormalizedTreatment,
  NormalizedAppointment,
} from "./types";

interface PracticeRow {
  id: string;
  pms_type: string;
  metadata: Record<string, unknown> | null;
}

/** Extract PMS credentials from practice metadata. */
function getCredentials(practice: PracticeRow): PmsCredentials | null {
  const meta = practice.metadata;
  if (!meta) return null;

  const creds = meta.pms_credentials as Record<string, string> | undefined;
  if (!creds?.api_url || !creds?.api_key) return null;

  return {
    apiUrl: creds.api_url,
    apiKey: creds.api_key,
    extras: creds.developer_key
      ? { developerKey: creds.developer_key }
      : undefined,
  };
}

/** Get the sync cursor from practice metadata. */
function getCursor(practice: PracticeRow): SyncCursor {
  const lastSync =
    (practice.metadata?.last_sync_at as string) ??
    new Date(0).toISOString();
  return { lastSyncAt: lastSync };
}

// ─── Upsert Helpers ───────────────────────────────────────────────────────────

async function upsertPatients(
  supabase: SupabaseClient,
  practiceId: string,
  patients: NormalizedPatient[]
): Promise<number> {
  if (patients.length === 0) return 0;

  let count = 0;
  for (const patient of patients) {
    // Check if patient exists by external_id
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("external_id", patient.externalId)
      .maybeSingle();

    if (existing) {
      // Update existing patient
      const { error } = await supabase
        .from("patients")
        .update({
          first_name: patient.firstName,
          last_name: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          date_of_birth: patient.dateOfBirth,
          status: patient.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (!error) count++;
    } else {
      // Insert new patient
      const { error } = await supabase.from("patients").insert({
        practice_id: practiceId,
        external_id: patient.externalId,
        first_name: patient.firstName,
        last_name: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.dateOfBirth,
        status: patient.status,
        tags: [],
        metadata: {},
      });

      if (!error) count++;
    }
  }
  return count;
}

async function upsertTreatments(
  supabase: SupabaseClient,
  practiceId: string,
  treatments: NormalizedTreatment[]
): Promise<number> {
  if (treatments.length === 0) return 0;

  // Build a lookup of external patient IDs → internal patient IDs
  const externalPatientIds = Array.from(
    new Set(treatments.map((t) => t.externalPatientId))
  );
  const { data: patientRows } = await supabase
    .from("patients")
    .select("id, external_id")
    .eq("practice_id", practiceId)
    .in("external_id", externalPatientIds);

  const patientMap = new Map(
    (patientRows ?? []).map((p) => [p.external_id, p.id])
  );

  let count = 0;
  for (const treatment of treatments) {
    const patientId = patientMap.get(treatment.externalPatientId);
    if (!patientId) continue; // Patient not synced yet — skip

    // Check if treatment exists by external_id
    const { data: existing } = await supabase
      .from("treatments")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("external_id", treatment.externalId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("treatments")
        .update({
          code: treatment.code,
          description: treatment.description,
          amount: treatment.amount,
          status: treatment.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (!error) count++;
    } else {
      const { error } = await supabase.from("treatments").insert({
        practice_id: practiceId,
        patient_id: patientId,
        external_id: treatment.externalId,
        code: treatment.code,
        description: treatment.description,
        amount: treatment.amount,
        status: treatment.status,
        presented_at: treatment.presentedAt,
      });

      if (!error) count++;
    }
  }
  return count;
}

async function detectBookings(
  supabase: SupabaseClient,
  practiceId: string,
  appointments: NormalizedAppointment[]
): Promise<number> {
  const scheduled = appointments.filter((a) => a.status === "scheduled");
  if (scheduled.length === 0) return 0;

  // Get external patient IDs with scheduled appointments
  const externalPatientIds = Array.from(
    new Set(scheduled.map((a) => a.externalPatientId))
  );

  // Look up internal patient IDs
  const { data: patientRows } = await supabase
    .from("patients")
    .select("id, external_id")
    .eq("practice_id", practiceId)
    .in("external_id", externalPatientIds);

  if (!patientRows || patientRows.length === 0) return 0;

  let conversions = 0;

  for (const patient of patientRows) {
    // Check if this patient has pending treatments
    const { data: pendingTreatments } = await supabase
      .from("treatments")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("practice_id", practiceId)
      .eq("status", "pending")
      .limit(1);

    if (!pendingTreatments || pendingTreatments.length === 0) continue;

    // Check if this patient has active enrollments
    const { data: activeEnrollments } = await supabase
      .from("sequence_enrollments")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("practice_id", practiceId)
      .eq("status", "active")
      .limit(1);

    if (!activeEnrollments || activeEnrollments.length === 0) continue;

    // Auto-convert: mark treatments as accepted
    const now = new Date().toISOString();

    await supabase
      .from("treatments")
      .update({ status: "accepted" as const, decided_at: now })
      .eq("patient_id", patient.id)
      .eq("practice_id", practiceId)
      .eq("status", "pending");

    // Auto-convert: mark enrollments as converted
    await supabase
      .from("sequence_enrollments")
      .update({ status: "converted" as const, converted_at: now })
      .eq("patient_id", patient.id)
      .eq("practice_id", practiceId)
      .eq("status", "active");

    conversions++;
  }

  return conversions;
}

// ─── Main Sync ────────────────────────────────────────────────────────────────

export async function syncPractice(
  supabase: SupabaseClient,
  practice: PracticeRow
): Promise<SyncLogEntry> {
  const startedAt = new Date().toISOString();
  const allWarnings: string[] = [];

  const creds = getCredentials(practice);
  if (!creds) {
    return {
      practice_id: practice.id,
      pms_type: practice.pms_type,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      status: "failed",
      patients_synced: 0,
      treatments_synced: 0,
      appointments_synced: 0,
      auto_conversions: 0,
      warnings: [],
      error: "Missing PMS credentials in practice metadata",
    };
  }

  const connector = getConnector(practice.pms_type);
  const cursor = getCursor(practice);

  let patientsSynced = 0;
  let treatmentsSynced = 0;
  let appointmentsSynced = 0;
  let autoConversions = 0;
  let fatalError: string | null = null;

  try {
    // 1. Sync patients first (treatments reference them)
    const patientResult = await connector.fetchPatients(creds, cursor);
    allWarnings.push(...patientResult.warnings);
    patientsSynced = await upsertPatients(
      supabase,
      practice.id,
      patientResult.data
    );

    // 2. Sync treatments
    const treatmentResult = await connector.fetchTreatments(creds, cursor);
    allWarnings.push(...treatmentResult.warnings);
    treatmentsSynced = await upsertTreatments(
      supabase,
      practice.id,
      treatmentResult.data
    );

    // 3. Sync appointments and detect bookings
    const appointmentResult = await connector.fetchAppointments(creds, cursor);
    allWarnings.push(...appointmentResult.warnings);
    appointmentsSynced = appointmentResult.data.length;
    autoConversions = await detectBookings(
      supabase,
      practice.id,
      appointmentResult.data
    );

    // 4. Update the sync cursor
    const latestTimestamp = [
      patientResult.serverTimestamp,
      treatmentResult.serverTimestamp,
      appointmentResult.serverTimestamp,
    ].sort().pop()!;

    await supabase
      .from("practices")
      .update({
        metadata: {
          ...(practice.metadata ?? {}),
          last_sync_at: latestTimestamp,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", practice.id);
  } catch (err) {
    fatalError = err instanceof Error ? err.message : "Unknown sync error";

    // If creds are invalid, disconnect the practice
    if (
      fatalError.includes("401") ||
      fatalError.includes("403") ||
      fatalError.includes("Unauthorized")
    ) {
      await supabase
        .from("practices")
        .update({ pms_connected: false })
        .eq("id", practice.id);
    }
  }

  const status = fatalError
    ? "failed"
    : allWarnings.length > 0
      ? "partial"
      : "success";

  const logEntry: SyncLogEntry = {
    practice_id: practice.id,
    pms_type: practice.pms_type,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    status,
    patients_synced: patientsSynced,
    treatments_synced: treatmentsSynced,
    appointments_synced: appointmentsSynced,
    auto_conversions: autoConversions,
    warnings: allWarnings,
    error: fatalError,
  };

  // Write to sync_log table
  try {
    await supabase.from("sync_log").insert(logEntry);
  } catch {
    // sync_log write failure shouldn't crash the sync
  }

  return logEntry;
}
