import { z } from "zod";

// ─── Normalized Schemas ───────────────────────────────────────────────────────
// Every PMS adapter must return data conforming to these schemas.
// Zod validates at the adapter boundary — bad records get logged, not crashed on.

export const NormalizedProviderSchema = z.object({
  externalId: z.string().min(1),
  firstName: z.string(),
  lastName: z.string().min(1),
  suffix: z.string(),
  status: z.enum(["active", "inactive"]),
});

export const NormalizedPatientSchema = z.object({
  externalId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(), // yyyy-MM-dd
  status: z.enum(["active", "inactive"]),
  externalPrimaryProviderId: z.string().nullable(),
});

export const NormalizedTreatmentSchema = z.object({
  externalId: z.string().min(1),
  externalPatientId: z.string().min(1),
  externalPlanId: z.string().min(1),
  code: z.string().min(1), // ADA CDT code
  description: z.string(),
  amount: z.number().nonnegative(),
  status: z.enum(["pending", "accepted", "declined", "completed"]),
  presentedAt: z.string(), // ISO date
  externalProviderId: z.string().nullable(),
});

export const NormalizedAppointmentSchema = z.object({
  externalId: z.string().min(1),
  externalPatientId: z.string().min(1),
  dateTime: z.string(), // ISO datetime
  status: z.enum(["scheduled", "complete", "broken", "cancelled"]),
  procedureDescription: z.string().nullable(),
});

export type NormalizedProvider = z.infer<typeof NormalizedProviderSchema>;
export type NormalizedPatient = z.infer<typeof NormalizedPatientSchema>;
export type NormalizedTreatment = z.infer<typeof NormalizedTreatmentSchema>;
export type NormalizedAppointment = z.infer<typeof NormalizedAppointmentSchema>;

// ─── Credentials ──────────────────────────────────────────────────────────────

export interface PmsCredentials {
  apiUrl: string;
  apiKey: string;
  /** Vendor-specific extras (e.g., OpenDental developer key) */
  extras?: Record<string, string>;
}

// ─── Sync Types ───────────────────────────────────────────────────────────────

export interface SyncCursor {
  /** ISO timestamp — fetch records modified after this */
  lastSyncAt: string;
}

export interface SyncResult<T> {
  data: T[];
  /** Server timestamp to store as next sync cursor */
  serverTimestamp: string;
  /** Errors that didn't halt the sync (e.g., 1 bad record out of 200) */
  warnings: string[];
}

// ─── Connector Interface ──────────────────────────────────────────────────────

export interface PmsConnector {
  readonly vendorName: string;

  /** Validate credentials — called on "Test Connection" */
  testConnection(
    creds: PmsCredentials
  ): Promise<{ ok: boolean; error?: string }>;

  /** Fetch patients modified since cursor */
  fetchPatients(
    creds: PmsCredentials,
    cursor: SyncCursor
  ): Promise<SyncResult<NormalizedPatient>>;

  /** Fetch treatment plan procedures modified since cursor */
  fetchTreatments(
    creds: PmsCredentials,
    cursor: SyncCursor
  ): Promise<SyncResult<NormalizedTreatment>>;

  /** Fetch appointments modified since cursor */
  fetchAppointments(
    creds: PmsCredentials,
    cursor: SyncCursor
  ): Promise<SyncResult<NormalizedAppointment>>;

  /** Fetch all providers (small dataset, no cursor needed) */
  fetchProviders(
    creds: PmsCredentials
  ): Promise<SyncResult<NormalizedProvider>>;
}

// ─── Sync Log ─────────────────────────────────────────────────────────────────

export interface SyncLogEntry {
  practice_id: string;
  pms_type: string;
  started_at: string;
  completed_at: string;
  status: "success" | "partial" | "failed";
  providers_synced: number;
  patients_synced: number;
  treatments_synced: number;
  appointments_synced: number;
  auto_conversions: number;
  warnings: string[];
  error: string | null;
}
