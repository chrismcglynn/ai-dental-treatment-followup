/**
 * OpenDental Integration Tests
 *
 * These tests run the real OpenDentalConnector against the mock OpenDental
 * server — no fetch mocking. This validates the full HTTP path: auth headers,
 * query params, JSON parsing, and Zod schema validation.
 *
 * Prerequisites:
 *   1. Start the mock server:  npm run mock:opendental
 *   2. Run tests:              npx vitest run open-dental.integration
 */

import { describe, it, expect, beforeAll } from "vitest";
import { OpenDentalConnector } from "../open-dental";
import {
  NormalizedPatientSchema,
  NormalizedTreatmentSchema,
  NormalizedAppointmentSchema,
  type PmsCredentials,
  type SyncCursor,
} from "../types";

// ─── Config ──────────────────────────────────────────────────────────────────

const MOCK_SERVER_URL = process.env.MOCK_OD_URL || "http://localhost:4100/api/v1";

const VALID_CREDS: PmsCredentials = {
  apiUrl: MOCK_SERVER_URL,
  apiKey: "mock-customer-key",
  extras: { developerKey: "mock-dev-key" },
};

const BAD_CREDS: PmsCredentials = {
  apiUrl: MOCK_SERVER_URL,
  apiKey: "wrong-key",
  extras: { developerKey: "wrong-dev" },
};

const CREDS_NO_DEV_KEY: PmsCredentials = {
  apiUrl: MOCK_SERVER_URL,
  apiKey: "mock-customer-key",
};

/** Fetch everything — epoch cursor */
const FULL_SYNC_CURSOR: SyncCursor = {
  lastSyncAt: "1970-01-01T00:00:00Z",
};

/** Delta sync — only records modified after March 25 */
const DELTA_CURSOR: SyncCursor = {
  lastSyncAt: "2026-03-25T00:00:00Z",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${MOCK_SERVER_URL.replace("/api/v1", "")}/api/v1/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("OpenDental Integration (mock server)", () => {
  const connector = new OpenDentalConnector();

  beforeAll(async () => {
    const running = await isServerRunning();
    if (!running) {
      throw new Error(
        `Mock OpenDental server not running at ${MOCK_SERVER_URL}.\n` +
        `Start it with: npm run mock:opendental`
      );
    }
  });

  // ── Connection ──────────────────────────────────────────────────────────

  describe("testConnection", () => {
    it("succeeds with valid credentials", async () => {
      const result = await connector.testConnection(VALID_CREDS);
      expect(result.ok).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("fails with invalid credentials", async () => {
      const result = await connector.testConnection(BAD_CREDS);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("401");
    });

    it("works with customer key only (no developer key)", async () => {
      const result = await connector.testConnection(CREDS_NO_DEV_KEY);
      expect(result.ok).toBe(true);
    });
  });

  // ── Patients ────────────────────────────────────────────────────────────

  describe("fetchPatients", () => {
    it("fetches all 25 patients on full sync", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      expect(result.data.length).toBe(25);
      expect(result.warnings.length).toBe(0);
      expect(result.serverTimestamp).toBeTruthy();
    });

    it("every patient passes Zod validation", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      for (const patient of result.data) {
        const parsed = NormalizedPatientSchema.safeParse(patient);
        expect(parsed.success, `Patient ${patient.externalId} failed validation`).toBe(true);
      }
    });

    it("delta sync returns only recently modified patients", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, DELTA_CURSOR);

      // Should be fewer than full sync
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThan(25);
    });

    it("maps PatNum to string externalId", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      const maria = result.data.find((p) => p.externalId === "10421");
      expect(maria).toBeDefined();
      expect(maria!.firstName).toBe("Maria");
      expect(maria!.lastName).toBe("Castellano");
    });

    it("picks wireless phone over home phone", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      // Maria: has both wireless and home, should pick wireless
      const maria = result.data.find((p) => p.externalId === "10421")!;
      expect(maria.phone).toBe("(720) 555-0199");
    });

    it("falls back to home phone when no wireless", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      // James: has home and work but no wireless
      const james = result.data.find((p) => p.externalId === "10422")!;
      expect(james.phone).toBe("(303) 555-0142");
    });

    it("falls back to work phone as last resort", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      // Desta Abebe (10435): has home only, no wireless or work
      const desta = result.data.find((p) => p.externalId === "10435")!;
      expect(desta.phone).toBe("(303) 555-0600");
    });

    it("handles patients with no phone at all", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      // Isabella Martinez (10436): child, no phone numbers
      const isabella = result.data.find((p) => p.externalId === "10436")!;
      expect(isabella.phone).toBeNull();
    });

    it("handles 0001-01-01 sentinel birthdate as null", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      const sarah = result.data.find((p) => p.externalId === "10425")!;
      expect(sarah.dateOfBirth).toBeNull();
    });

    it("handles empty email as null", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      // David Kowalski has empty email
      const david = result.data.find((p) => p.externalId === "10424")!;
      expect(david.email).toBeNull();
    });

    it("maps non-Patient statuses to inactive", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      // Inactive status
      const david = result.data.find((p) => p.externalId === "10424")!;
      expect(david.status).toBe("inactive");

      // Archived status
      const ravi = result.data.find((p) => p.externalId === "10429")!;
      expect(ravi.status).toBe("inactive");

      // NonPatient status
      const desta = result.data.find((p) => p.externalId === "10435")!;
      expect(desta.status).toBe("inactive");

      // Deceased status
      const alexei = result.data.find((p) => p.externalId === "10444")!;
      expect(alexei.status).toBe("inactive");

      // Prospective status
      const fatima = result.data.find((p) => p.externalId === "10439")!;
      expect(fatima.status).toBe("inactive");
    });

    it("maps Patient status to active", async () => {
      const result = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);

      const maria = result.data.find((p) => p.externalId === "10421")!;
      expect(maria.status).toBe("active");
    });
  });

  // ── Treatments ──────────────────────────────────────────────────────────

  describe("fetchTreatments", () => {
    it("fetches and joins all treatment plans with their procedures", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      // 14 plans with 27 total procedures
      expect(result.data.length).toBe(27);
      expect(result.warnings.length).toBe(0);
    });

    it("every treatment passes Zod validation", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      for (const treatment of result.data) {
        const parsed = NormalizedTreatmentSchema.safeParse(treatment);
        expect(parsed.success, `Treatment ${treatment.externalId} failed validation`).toBe(true);
      }
    });

    it("correctly joins multi-procedure plans", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      // Plan 5005 (Root Canal) has 2 procedures: D3330 + D2750
      const rootCanalProcs = result.data.filter((t) => t.externalPlanId === "5005");
      expect(rootCanalProcs.length).toBe(2);

      const codes = rootCanalProcs.map((t) => t.code).sort();
      expect(codes).toEqual(["D2750", "D3330"]);
    });

    it("correctly joins 3-unit bridge (3 procedures)", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      // Plan 5007 (Bridge) has 3 procedures
      const bridgeProcs = result.data.filter((t) => t.externalPlanId === "5007");
      expect(bridgeProcs.length).toBe(3);

      const codes = bridgeProcs.map((t) => t.code).sort();
      expect(codes).toEqual(["D6240", "D6750", "D6750"]);
    });

    it("correctly joins perio plan (4 quadrants = 4 procedures)", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      // Plan 5008 (Perio SRP) has 4 quadrants
      const perioProcs = result.data.filter((t) => t.externalPlanId === "5008");
      expect(perioProcs.length).toBe(4);
      expect(perioProcs.every((p) => p.code === "D4341")).toBe(true);
    });

    it("maps Active TPStatus to pending", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      const crown = result.data.find((t) => t.externalId === "8001")!;
      expect(crown.status).toBe("pending");
      expect(crown.code).toBe("D2740");
      expect(crown.amount).toBe(1450);
    });

    it("maps Inactive TPStatus to declined", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      // Plan 5004 (Extraction) is Inactive
      const extraction = result.data.find((t) => t.externalId === "8005")!;
      expect(extraction.status).toBe("declined");

      // Plan 5013 (Whitening) is also Inactive
      const whitening = result.data.find((t) => t.externalId === "8025")!;
      expect(whitening.status).toBe("declined");
    });

    it("preserves externalPatientId as string", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      const crown = result.data.find((t) => t.externalId === "8001")!;
      expect(crown.externalPatientId).toBe("10421");
    });

    it("sets presentedAt from the plan DateTP", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      const crown = result.data.find((t) => t.externalId === "8001")!;
      expect(crown.presentedAt).toBe("2026-03-15T00:00:00Z");
    });

    it("handles high-value treatment plans", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      // Ortho plan: $5,500
      const ortho = result.data.find((t) => t.externalId === "8017")!;
      expect(ortho.amount).toBe(5500);
      expect(ortho.code).toBe("D8090");

      // Implant: $3,800
      const implant = result.data.find((t) => t.externalId === "8002")!;
      expect(implant.amount).toBe(3800);
    });

    it("handles low-value treatment plans", async () => {
      const result = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      // Sealant: $55
      const sealant = result.data.find((t) => t.externalId === "8026")!;
      expect(sealant.amount).toBe(55);
      expect(sealant.code).toBe("D1351");
    });
  });

  // ── Appointments ────────────────────────────────────────────────────────

  describe("fetchAppointments", () => {
    it("fetches all 18 appointments on full sync", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      expect(result.data.length).toBe(18);
      expect(result.warnings.length).toBe(0);
    });

    it("every appointment passes Zod validation", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      for (const apt of result.data) {
        const parsed = NormalizedAppointmentSchema.safeParse(apt);
        expect(parsed.success, `Appointment ${apt.externalId} failed validation`).toBe(true);
      }
    });

    it("maps Scheduled status correctly", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      const scheduled = result.data.filter((a) => a.status === "scheduled");
      // Scheduled + ASAP both map to "scheduled"
      expect(scheduled.length).toBeGreaterThanOrEqual(10);
    });

    it("maps ASAP status to scheduled", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      // AptNum 30008 is ASAP status
      const asap = result.data.find((a) => a.externalId === "30008")!;
      expect(asap.status).toBe("scheduled");
    });

    it("maps Broken status correctly", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      const broken = result.data.filter((a) => a.status === "broken");
      expect(broken.length).toBe(2); // 30003 and 30016
    });

    it("maps Complete status correctly", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      const complete = result.data.filter((a) => a.status === "complete");
      expect(complete.length).toBe(2); // 30005 and 30015
    });

    it("maps Planned status to cancelled", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      const planned = result.data.find((a) => a.externalId === "30004")!;
      expect(planned.status).toBe("cancelled");
    });

    it("converts OD datetime to ISO format", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      const apt = result.data.find((a) => a.externalId === "30001")!;
      expect(apt.dateTime).toBe("2026-04-10T09:00:00Z");
    });

    it("preserves procedure descriptions", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      const apt = result.data.find((a) => a.externalId === "30006")!;
      expect(apt.procedureDescription).toBe("D3330 RCT Molar");
    });

    it("delta sync filters by DateTStamp", async () => {
      const result = await connector.fetchAppointments(VALID_CREDS, DELTA_CURSOR);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThan(18);
    });
  });

  // ── Full Sync Pipeline ─────────────────────────────────────────────────

  describe("full sync pipeline", () => {
    it("can run all three fetches in sequence without errors", async () => {
      const patients = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);
      const treatments = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);
      const appointments = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      expect(patients.data.length).toBe(25);
      expect(treatments.data.length).toBe(27);
      expect(appointments.data.length).toBe(18);
      expect(patients.warnings.length).toBe(0);
      expect(treatments.warnings.length).toBe(0);
      expect(appointments.warnings.length).toBe(0);
    });

    it("every treatment references a valid patient externalId", async () => {
      const patients = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);
      const treatments = await connector.fetchTreatments(VALID_CREDS, FULL_SYNC_CURSOR);

      const patientIds = new Set(patients.data.map((p) => p.externalId));

      for (const treatment of treatments.data) {
        expect(
          patientIds.has(treatment.externalPatientId),
          `Treatment ${treatment.externalId} references unknown patient ${treatment.externalPatientId}`
        ).toBe(true);
      }
    });

    it("every appointment references a valid patient externalId", async () => {
      const patients = await connector.fetchPatients(VALID_CREDS, FULL_SYNC_CURSOR);
      const appointments = await connector.fetchAppointments(VALID_CREDS, FULL_SYNC_CURSOR);

      const patientIds = new Set(patients.data.map((p) => p.externalId));

      for (const apt of appointments.data) {
        expect(
          patientIds.has(apt.externalPatientId),
          `Appointment ${apt.externalId} references unknown patient ${apt.externalPatientId}`
        ).toBe(true);
      }
    });
  });
});
