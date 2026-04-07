/**
 * OpenDental Adapter Tests
 *
 * Tests that the adapter correctly maps raw OpenDental API responses
 * to our normalized schemas. Uses fixture data that mirrors exact OD shapes.
 *
 * To run: install vitest (`npm i -D vitest`) and run `npx vitest run`
 * Or use with any test runner that supports TypeScript.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenDentalConnector } from "../open-dental";
import {
  NormalizedProviderSchema,
  NormalizedPatientSchema,
  NormalizedTreatmentSchema,
  NormalizedAppointmentSchema,
  type PmsCredentials,
  type SyncCursor,
} from "../types";

import providersFixture from "./fixtures/open-dental/providers.json";
import patientsFixture from "./fixtures/open-dental/patients.json";
import treatplansFixture from "./fixtures/open-dental/treatplans.json";
import proctpsFixture from "./fixtures/open-dental/proctps.json";
import appointmentsFixture from "./fixtures/open-dental/appointments.json";

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

const TEST_CREDS: PmsCredentials = {
  apiUrl: "https://api.opendental.com/api/v1",
  apiKey: "test-customer-key",
  extras: { developerKey: "test-dev-key" },
};

const TEST_CURSOR: SyncCursor = {
  lastSyncAt: "2026-01-01T00:00:00Z",
};

function mockResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function mockErrorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    statusText: "Error",
    json: () => Promise.resolve({ error: body }),
    text: () => Promise.resolve(body),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("OpenDentalConnector", () => {
  const connector = new OpenDentalConnector();

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("testConnection", () => {
    it("returns ok:true when API responds 200", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([patientsFixture[0]]));
      const result = await connector.testConnection(TEST_CREDS);
      expect(result.ok).toBe(true);
    });

    it("returns ok:false with error message on API failure", async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse(401, "Invalid credentials")
      );
      const result = await connector.testConnection(TEST_CREDS);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("401");
    });

    it("sends correct Authorization header", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([]));
      await connector.testConnection(TEST_CREDS);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.Authorization).toBe(
        "ODFHIR test-dev-key/test-customer-key"
      );
    });
  });

  describe("fetchPatients", () => {
    it("maps all fixture patients through NormalizedPatientSchema", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(patientsFixture));
      const result = await connector.fetchPatients(TEST_CREDS, TEST_CURSOR);

      // All 5 patients should parse (including the inactive one)
      expect(result.data.length).toBe(5);
      expect(result.warnings.length).toBe(0);

      // Every record passes Zod validation
      for (const patient of result.data) {
        const parsed = NormalizedPatientSchema.safeParse(patient);
        expect(parsed.success).toBe(true);
      }
    });

    it("maps PatNum to externalId as string", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(patientsFixture));
      const result = await connector.fetchPatients(TEST_CREDS, TEST_CURSOR);

      expect(result.data[0].externalId).toBe("10421");
      expect(result.data[1].externalId).toBe("10422");
    });

    it("prefers WirelessPhone over HmPhone", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(patientsFixture));
      const result = await connector.fetchPatients(TEST_CREDS, TEST_CURSOR);

      // Maria has both WirelessPhone and HmPhone — should pick wireless
      const maria = result.data.find((p) => p.externalId === "10421")!;
      expect(maria.phone).toBe("(720) 555-0199");

      // James has HmPhone and WkPhone but no WirelessPhone — should pick home
      const james = result.data.find((p) => p.externalId === "10422")!;
      expect(james.phone).toBe("(303) 555-0142");
    });

    it("maps PatStatus=Inactive to status=inactive", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(patientsFixture));
      const result = await connector.fetchPatients(TEST_CREDS, TEST_CURSOR);

      const david = result.data.find((p) => p.externalId === "10424")!;
      expect(david.status).toBe("inactive");
    });

    it("handles 0001-01-01 birthdate as null", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(patientsFixture));
      const result = await connector.fetchPatients(TEST_CREDS, TEST_CURSOR);

      const sarah = result.data.find((p) => p.externalId === "10425")!;
      expect(sarah.dateOfBirth).toBeNull();
    });

    it("handles empty email as null", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(patientsFixture));
      const result = await connector.fetchPatients(TEST_CREDS, TEST_CURSOR);

      const david = result.data.find((p) => p.externalId === "10424")!;
      expect(david.email).toBeNull();
    });
  });

  describe("fetchTreatments", () => {
    beforeEach(() => {
      // First call returns treatplans, subsequent calls return proctps
      mockFetch.mockResolvedValueOnce(mockResponse(treatplansFixture));
    });

    function mockProctps() {
      for (const plan of treatplansFixture) {
        const planProcs =
          proctpsFixture[String(plan.TreatPlanNum) as keyof typeof proctpsFixture] ?? [];
        mockFetch.mockResolvedValueOnce(mockResponse(planProcs));
      }
    }

    it("joins treatplans + proctps into flat treatment rows", async () => {
      mockProctps();
      const result = await connector.fetchTreatments(TEST_CREDS, TEST_CURSOR);

      // 4 plans × their procs: 1 + 2 + 1 + 1 = 5 treatment rows
      expect(result.data.length).toBe(5);

      for (const treatment of result.data) {
        const parsed = NormalizedTreatmentSchema.safeParse(treatment);
        expect(parsed.success).toBe(true);
      }
    });

    it("maps ProcCode to code (ADA CDT)", async () => {
      mockProctps();
      const result = await connector.fetchTreatments(TEST_CREDS, TEST_CURSOR);

      const crown = result.data.find((t) => t.externalId === "8001")!;
      expect(crown.code).toBe("D2740");
      expect(crown.amount).toBe(1450.0);
    });

    it("maps TPStatus=Inactive to status=declined", async () => {
      mockProctps();
      const result = await connector.fetchTreatments(TEST_CREDS, TEST_CURSOR);

      // Plan 5004 is Inactive — its proc (8005) should be declined
      const extraction = result.data.find((t) => t.externalId === "8005")!;
      expect(extraction.status).toBe("declined");
    });

    it("maps TPStatus=Active to status=pending", async () => {
      mockProctps();
      const result = await connector.fetchTreatments(TEST_CREDS, TEST_CURSOR);

      const crown = result.data.find((t) => t.externalId === "8001")!;
      expect(crown.status).toBe("pending");
    });

    it("adds warning when proctps fetch fails for a plan", async () => {
      // Return error for first plan's proctps
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse(500, "Internal server error")
      );
      // Return success for remaining plans
      for (let i = 1; i < treatplansFixture.length; i++) {
        const planProcs =
          proctpsFixture[
            String(treatplansFixture[i].TreatPlanNum) as keyof typeof proctpsFixture
          ] ?? [];
        mockFetch.mockResolvedValueOnce(mockResponse(planProcs));
      }

      const result = await connector.fetchTreatments(TEST_CREDS, TEST_CURSOR);

      // Should have warnings for failed plan but still process others
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("5001");
      // Other plans' procs should still be present
      expect(result.data.length).toBe(4); // 5 total minus 1 from failed plan
    });
  });

  describe("fetchAppointments", () => {
    it("maps all fixture appointments through NormalizedAppointmentSchema", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(appointmentsFixture));
      const result = await connector.fetchAppointments(TEST_CREDS, TEST_CURSOR);

      expect(result.data.length).toBe(5);

      for (const apt of result.data) {
        const parsed = NormalizedAppointmentSchema.safeParse(apt);
        expect(parsed.success).toBe(true);
      }
    });

    it("maps AptStatus correctly", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(appointmentsFixture));
      const result = await connector.fetchAppointments(TEST_CREDS, TEST_CURSOR);

      const scheduled = result.data.find((a) => a.externalId === "30001")!;
      expect(scheduled.status).toBe("scheduled");

      const broken = result.data.find((a) => a.externalId === "30003")!;
      expect(broken.status).toBe("broken");

      const complete = result.data.find((a) => a.externalId === "30005")!;
      expect(complete.status).toBe("complete");

      // "Planned" maps to "cancelled" (not yet confirmed/scheduled)
      const planned = result.data.find((a) => a.externalId === "30004")!;
      expect(planned.status).toBe("cancelled");
    });

    it("converts OD datetime format to ISO", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(appointmentsFixture));
      const result = await connector.fetchAppointments(TEST_CREDS, TEST_CURSOR);

      const apt = result.data.find((a) => a.externalId === "30001")!;
      expect(apt.dateTime).toBe("2026-04-10T09:00:00Z");
    });

    it("maps ProcDescript to procedureDescription", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(appointmentsFixture));
      const result = await connector.fetchAppointments(TEST_CREDS, TEST_CURSOR);

      const apt = result.data.find((a) => a.externalId === "30001")!;
      expect(apt.procedureDescription).toBe("D2740 Crown - porcelain/ceramic");
    });
  });

  describe("fetchProviders", () => {
    it("maps all fixture providers through NormalizedProviderSchema", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(providersFixture));
      const result = await connector.fetchProviders(TEST_CREDS);

      expect(result.data.length).toBe(4);
      expect(result.warnings.length).toBe(0);

      for (const provider of result.data) {
        const parsed = NormalizedProviderSchema.safeParse(provider);
        expect(parsed.success).toBe(true);
      }
    });

    it("maps ProvNum to externalId as string", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(providersFixture));
      const result = await connector.fetchProviders(TEST_CREDS);

      expect(result.data[0].externalId).toBe("1");
      expect(result.data[1].externalId).toBe("2");
    });

    it("maps name and suffix fields", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(providersFixture));
      const result = await connector.fetchProviders(TEST_CREDS);

      const doc1 = result.data.find((p) => p.externalId === "1")!;
      expect(doc1.firstName).toBe("Sarah");
      expect(doc1.lastName).toBe("Johnson");
      expect(doc1.suffix).toBe("DDS");
    });

    it("maps hygienist with empty suffix", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(providersFixture));
      const result = await connector.fetchProviders(TEST_CREDS);

      const hyg = result.data.find((p) => p.externalId === "3")!;
      expect(hyg.firstName).toBe("Rachel");
      expect(hyg.lastName).toBe("Torres");
      expect(hyg.suffix).toBe("");
    });

    it("maps IsHidden=true to status=inactive", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(providersFixture));
      const result = await connector.fetchProviders(TEST_CREDS);

      const hidden = result.data.find((p) => p.externalId === "4")!;
      expect(hidden.status).toBe("inactive");
    });

    it("maps active provider to status=active", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(providersFixture));
      const result = await connector.fetchProviders(TEST_CREDS);

      const active = result.data.find((p) => p.externalId === "1")!;
      expect(active.status).toBe("active");
    });
  });

  describe("provider fields on patients and treatments", () => {
    it("maps PriProv to externalPrimaryProviderId on patients", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(patientsFixture));
      const result = await connector.fetchPatients(TEST_CREDS, TEST_CURSOR);

      const maria = result.data.find((p) => p.externalId === "10421")!;
      expect(maria.externalPrimaryProviderId).toBe("1");

      const priya = result.data.find((p) => p.externalId === "10423")!;
      expect(priya.externalPrimaryProviderId).toBe("2");
    });

    it("maps ProvNum to externalProviderId on treatments", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(treatplansFixture));
      for (const plan of treatplansFixture) {
        const planProcs =
          proctpsFixture[String(plan.TreatPlanNum) as keyof typeof proctpsFixture] ?? [];
        mockFetch.mockResolvedValueOnce(mockResponse(planProcs));
      }

      const result = await connector.fetchTreatments(TEST_CREDS, TEST_CURSOR);

      // Crown (ProcTPNum 8001) has ProvNum 1
      const crown = result.data.find((t) => t.externalId === "8001")!;
      expect(crown.externalProviderId).toBe("1");

      // Implant (ProcTPNum 8002) has ProvNum 2
      const implant = result.data.find((t) => t.externalId === "8002")!;
      expect(implant.externalProviderId).toBe("2");
    });
  });
});
