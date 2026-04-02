import {
  type PmsConnector,
  type PmsCredentials,
  type SyncCursor,
  type SyncResult,
  type NormalizedPatient,
  type NormalizedTreatment,
  type NormalizedAppointment,
  NormalizedPatientSchema,
  NormalizedTreatmentSchema,
  NormalizedAppointmentSchema,
} from "./types";

// ─── OpenDental API Types ─────────────────────────────────────────────────────
// Mirrors the exact shapes returned by the OD REST API.

interface OdPatient {
  PatNum: number;
  LName: string;
  FName: string;
  Email: string;
  HmPhone: string;
  WkPhone: string;
  WirelessPhone: string;
  Birthdate: string; // yyyy-MM-dd
  PatStatus: string; // "Patient", "NonPatient", "Inactive", "Archived", "Deceased", "Prospective"
  [key: string]: unknown; // passthrough for extra fields
}

interface OdTreatPlan {
  TreatPlanNum: number;
  PatNum: number;
  DateTP: string; // yyyy-MM-dd
  Heading: string;
  TPStatus: string; // "Active", "Inactive", "Saved"
  SecDateTEdit: string;
  [key: string]: unknown;
}

interface OdProcTP {
  ProcTPNum: number;
  TreatPlanNum: number;
  PatNum: number;
  ProcCode: string;
  Descript: string;
  FeeAmt: number;
  DateTP: string;
  [key: string]: unknown;
}

interface OdAppointment {
  AptNum: number;
  PatNum: number;
  AptStatus: string; // "Scheduled", "Complete", "UnschedList", "ASAP", "Broken", "Planned", "PtNote", "PtNoteCompleted"
  AptDateTime: string; // yyyy-MM-dd HH:mm:ss
  ProcDescript: string;
  DateTStamp: string;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pick the best available phone number. Prefer wireless > home > work. */
function pickPhone(patient: OdPatient): string | null {
  const wireless = patient.WirelessPhone?.trim();
  if (wireless) return wireless;
  const home = patient.HmPhone?.trim();
  if (home) return home;
  const work = patient.WkPhone?.trim();
  if (work) return work;
  return null;
}

/** Convert OD date (yyyy-MM-dd) to ISO datetime string. */
function odDateToIso(date: string): string {
  if (!date || date === "0001-01-01") return new Date(0).toISOString();
  return `${date}T00:00:00Z`;
}

/** Convert OD datetime (yyyy-MM-dd HH:mm:ss) to ISO string. */
function odDateTimeToIso(dt: string): string {
  if (!dt) return new Date(0).toISOString();
  // OD format: "yyyy-MM-dd HH:mm:ss" → replace space with T, append Z
  return dt.replace(" ", "T") + "Z";
}

function mapPatientStatus(odStatus: string): "active" | "inactive" {
  return odStatus === "Patient" ? "active" : "inactive";
}

function mapTreatmentStatus(
  tpStatus: string
): "pending" | "accepted" | "declined" | "completed" {
  switch (tpStatus) {
    case "Active":
      return "pending";
    case "Saved":
      return "pending";
    case "Inactive":
      return "declined";
    default:
      return "pending";
  }
}

function mapAppointmentStatus(
  aptStatus: string
): "scheduled" | "complete" | "broken" | "cancelled" {
  switch (aptStatus) {
    case "Scheduled":
      return "scheduled";
    case "Complete":
      return "complete";
    case "Broken":
      return "broken";
    case "ASAP":
      return "scheduled";
    default:
      return "cancelled";
  }
}

/** Build the Authorization header for OpenDental API. */
function buildAuthHeader(creds: PmsCredentials): string {
  const developerKey = creds.extras?.developerKey ?? "";
  if (developerKey) {
    return `ODFHIR ${developerKey}/${creds.apiKey}`;
  }
  // If no developer key, use just the customer key
  return `ODFHIR ${creds.apiKey}`;
}

/** Make an authenticated GET request to the OpenDental API. */
async function odFetch<T>(
  creds: PmsCredentials,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(path, creds.apiUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: buildAuthHeader(creds),
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `OpenDental API ${response.status}: ${response.statusText} — ${body}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── Connector ────────────────────────────────────────────────────────────────

export class OpenDentalConnector implements PmsConnector {
  readonly vendorName = "open_dental";

  async testConnection(
    creds: PmsCredentials
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      // Fetch a single patient to validate credentials
      await odFetch<OdPatient[]>(creds, "/patients", {
        limit: "1",
      });
      return { ok: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown connection error";
      return { ok: false, error: message };
    }
  }

  async fetchPatients(
    creds: PmsCredentials,
    cursor: SyncCursor
  ): Promise<SyncResult<NormalizedPatient>> {
    const raw = await odFetch<OdPatient[]>(creds, "/patients/Simple", {
      DateTStamp: cursor.lastSyncAt,
    });

    const data: NormalizedPatient[] = [];
    const warnings: string[] = [];

    for (const record of raw) {
      const mapped = {
        externalId: String(record.PatNum),
        firstName: record.FName?.trim() ?? "",
        lastName: record.LName?.trim() ?? "",
        email: record.Email?.trim() || null,
        phone: pickPhone(record),
        dateOfBirth:
          record.Birthdate && record.Birthdate !== "0001-01-01"
            ? record.Birthdate
            : null,
        status: mapPatientStatus(record.PatStatus),
      };

      const result = NormalizedPatientSchema.safeParse(mapped);
      if (result.success) {
        data.push(result.data);
      } else {
        warnings.push(
          `Patient ${record.PatNum}: ${result.error.issues.map((i) => i.message).join(", ")}`
        );
      }
    }

    return {
      data,
      serverTimestamp: new Date().toISOString(),
      warnings,
    };
  }

  async fetchTreatments(
    creds: PmsCredentials,
    cursor: SyncCursor
  ): Promise<SyncResult<NormalizedTreatment>> {
    // Step 1: Fetch treatment plans modified since cursor
    const plans = await odFetch<OdTreatPlan[]>(creds, "/treatplans", {
      SecDateTEdit: cursor.lastSyncAt,
    });

    const data: NormalizedTreatment[] = [];
    const warnings: string[] = [];

    // Step 2: For each plan, fetch its procedure line items
    for (const plan of plans) {
      let procs: OdProcTP[] = [];
      try {
        procs = await odFetch<OdProcTP[]>(creds, "/proctps", {
          TreatPlanNum: String(plan.TreatPlanNum),
        });
      } catch (err) {
        warnings.push(
          `TreatPlan ${plan.TreatPlanNum}: failed to fetch proctps — ${err instanceof Error ? err.message : "unknown"}`
        );
        continue;
      }

      const status = mapTreatmentStatus(plan.TPStatus);

      for (const proc of procs) {
        const mapped = {
          externalId: String(proc.ProcTPNum),
          externalPatientId: String(proc.PatNum),
          externalPlanId: String(plan.TreatPlanNum),
          code: proc.ProcCode?.trim() ?? "",
          description: proc.Descript?.trim() ?? "",
          amount: proc.FeeAmt ?? 0,
          status,
          presentedAt: odDateToIso(plan.DateTP),
        };

        const result = NormalizedTreatmentSchema.safeParse(mapped);
        if (result.success) {
          data.push(result.data);
        } else {
          warnings.push(
            `ProcTP ${proc.ProcTPNum}: ${result.error.issues.map((i) => i.message).join(", ")}`
          );
        }
      }
    }

    return {
      data,
      serverTimestamp: new Date().toISOString(),
      warnings,
    };
  }

  async fetchAppointments(
    creds: PmsCredentials,
    cursor: SyncCursor
  ): Promise<SyncResult<NormalizedAppointment>> {
    const raw = await odFetch<OdAppointment[]>(creds, "/appointments", {
      DateTStamp: cursor.lastSyncAt,
    });

    const data: NormalizedAppointment[] = [];
    const warnings: string[] = [];

    for (const record of raw) {
      const mapped = {
        externalId: String(record.AptNum),
        externalPatientId: String(record.PatNum),
        dateTime: odDateTimeToIso(record.AptDateTime),
        status: mapAppointmentStatus(record.AptStatus),
        procedureDescription: record.ProcDescript?.trim() || null,
      };

      const result = NormalizedAppointmentSchema.safeParse(mapped);
      if (result.success) {
        data.push(result.data);
      } else {
        warnings.push(
          `Appointment ${record.AptNum}: ${result.error.issues.map((i) => i.message).join(", ")}`
        );
      }
    }

    return {
      data,
      serverTimestamp: new Date().toISOString(),
      warnings,
    };
  }
}
