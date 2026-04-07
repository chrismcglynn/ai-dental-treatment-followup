# PMS Connector Architecture

> Design doc for a vendor-agnostic integration layer that normalizes data from any dental practice management system (OpenDental, Dentrix, Eaglesoft, etc.) into our unified data model. See [[open-dental-integration-architecture]] for the first concrete implementation. Goal: onboard real practices without the app breaking due to unexpected data shapes.

## Problem

Our [[sandbox-auth-signup-flow|sandbox]] demo uses hardcoded seed data that perfectly matches our internal types. Real PMS systems return data shaped differently from each other and from our model:

| Concept | Our Model | OpenDental | Dentrix | Eaglesoft |
|---|---|---|---|---|
| Patient ID | `id` (uuid) | `PatNum` (int) | `patient_id` (GUID) | Row-based CSV |
| Treatment plan | Single `treatments` row with code + fee | Separate `treatplans` (container) + `proctps` (line items with codes/fees) | `treatment_case` with nested `procedures` | Flat CSV with one row per procedure |
| Status values | "pending"/"accepted"/"declined"/"completed" | "Active"/"Inactive"/"Saved" | "Proposed"/"Accepted"/"Rejected" | "Open"/"Closed" |
| Fees | `amount` on treatment | `FeeAmt` on ProcTP (not on TreatPlan) | `fee` on procedure | `charge` column |
| Phone | `phone` (single) | `HmPhone`, `WkPhone`, `WirelessPhone` (three) | `home_phone`, `cell_phone` | `phone1`, `phone2` |
| Dates | ISO timestamps | `yyyy-MM-dd` or `yyyy-MM-dd HH:mm:ss` | ISO 8601 | `MM/DD/YYYY` |
| Auth | N/A | `Authorization: ODFHIR dev_key/customer_key` | OAuth 2.0 | API key header |

If we wire PMS responses directly into our DB, any vendor quirk becomes a production bug. The adapter pattern isolates vendor-specific logic so the rest of the app never sees raw PMS data.

## Architecture Overview

```
                        ┌─────────────────────────────────────────────┐
                        │              Our Application                │
                        │                                             │
                        │  Settings UI ─── test-pms route             │
                        │                       │                     │
                        │              ┌────────▼────────┐            │
                        │              │  ConnectorFactory │           │
                        │              │  (resolves PMS   │           │
                        │              │   type → adapter) │          │
                        │              └────────┬────────┘            │
                        │                       │                     │
                        │         ┌─────────────┼─────────────┐       │
                        │         ▼             ▼             ▼       │
                        │  ┌────────────┐ ┌──────────┐ ┌──────────┐  │
                        │  │ OpenDental │ │ Dentrix  │ │ Eaglesoft│  │
                        │  │ Adapter    │ │ Adapter  │ │ Adapter  │  │
                        │  └─────┬──────┘ └────┬─────┘ └────┬─────┘  │
                        │        │             │            │         │
                        │        ▼             ▼            ▼         │
                        │  ┌─────────────────────────────────────┐    │
                        │  │         Zod Validation Layer         │   │
                        │  │  (NormalizedPatient, NormalizedTx)   │   │
                        │  └──────────────────┬──────────────────┘    │
                        │                     │                       │
                        │                     ▼                       │
                        │  ┌─────────────────────────────────────┐    │
                        │  │          Sync Engine                 │   │
                        │  │  - Upsert patients                  │   │
                        │  │  - Import treatments                │   │
                        │  │  - Detect bookings                  │   │
                        │  │  - Auto-convert enrollments         │   │
                        │  └─────────────────────────────────────┘    │
                        └─────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
          ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
          │  OpenDental   │     │  Dentrix     │      │  Eaglesoft   │
          │  Server/Cloud │     │  Cloud API   │      │  CSV Export  │
          └──────────────┘     └──────────────┘      └──────────────┘
```

## Core Interface: `PmsConnector`

Every PMS adapter implements this interface. The sync engine only talks to `PmsConnector` — never to vendor APIs directly.

```typescript
// src/lib/integrations/types.ts

import { z } from "zod";

// ─── Normalized Schemas ───────────────────────────────────────────────────────
// These are what adapters MUST return. Zod validates at the boundary.

export const NormalizedPatientSchema = z.object({
  externalId: z.string(),                        // Vendor's patient ID (stringified)
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),                  // Best available phone, E.164 preferred
  dateOfBirth: z.string().nullable(),            // ISO date yyyy-MM-dd
  status: z.enum(["active", "inactive"]),
});

export const NormalizedTreatmentSchema = z.object({
  externalId: z.string(),                        // Vendor's treatment/procedure ID
  externalPatientId: z.string(),                 // Vendor's patient ID
  externalProviderId: z.string().nullable(),      // Vendor's provider ID (for personalization)
  code: z.string(),                              // ADA CDT code (e.g., "D2740")
  description: z.string(),
  amount: z.number().nonneg(),                   // Fee in dollars
  status: z.enum(["pending", "accepted", "declined", "completed"]),
  presentedAt: z.string(),                       // ISO date
});

export const NormalizedAppointmentSchema = z.object({
  externalId: z.string(),                        // Vendor's appointment ID
  externalPatientId: z.string(),                 // Vendor's patient ID
  dateTime: z.string(),                          // ISO datetime
  status: z.enum(["scheduled", "complete", "broken", "cancelled"]),
  procedureDescription: z.string().nullable(),
});

export const NormalizedProviderSchema = z.object({
  externalId: z.string(),                        // Vendor's provider ID
  firstName: z.string(),
  lastName: z.string().min(1),
  suffix: z.string(),                            // DDS, DMD, RDH, etc.
  status: z.enum(["active", "inactive"]),
});

export type NormalizedPatient = z.infer<typeof NormalizedPatientSchema>;
export type NormalizedTreatment = z.infer<typeof NormalizedTreatmentSchema>;
export type NormalizedAppointment = z.infer<typeof NormalizedAppointmentSchema>;
export type NormalizedProvider = z.infer<typeof NormalizedProviderSchema>;

// ─── Connector Interface ──────────────────────────────────────────────────────

export interface PmsCredentials {
  apiUrl: string;
  apiKey: string;
  /** Vendor-specific extras (e.g., OpenDental developer key) */
  extras?: Record<string, string>;
}

export interface SyncCursor {
  /** ISO timestamp — fetch records modified after this */
  lastSyncAt: string;
}

export interface SyncResult<T> {
  data: T[];
  /** Server timestamp to store as next cursor */
  serverTimestamp: string;
  /** True if more pages exist */
  hasMore: boolean;
  /** Errors that didn't halt the sync (e.g., 1 bad record out of 200) */
  warnings: string[];
}

export interface PmsConnector {
  readonly vendorName: string;

  /** Validate credentials — called on "Test Connection" */
  testConnection(creds: PmsCredentials): Promise<{ ok: boolean; error?: string }>;

  /** Fetch patients modified since cursor */
  fetchPatients(creds: PmsCredentials, cursor: SyncCursor): Promise<SyncResult<NormalizedPatient>>;

  /** Fetch treatments modified since cursor */
  fetchTreatments(creds: PmsCredentials, cursor: SyncCursor): Promise<SyncResult<NormalizedTreatment>>;

  /** Fetch appointments modified since cursor */
  fetchAppointments(creds: PmsCredentials, cursor: SyncCursor): Promise<SyncResult<NormalizedAppointment>>;

  /** Fetch all providers (small dataset — no cursor needed) */
  fetchProviders(creds: PmsCredentials): Promise<SyncResult<NormalizedProvider>>;
}
```

## OpenDental Adapter (Reference Implementation)

```typescript
// src/lib/integrations/open-dental.ts  (sketch — not production code)

export class OpenDentalConnector implements PmsConnector {
  readonly vendorName = "open_dental";

  async testConnection(creds: PmsCredentials) {
    // GET /patients?limit=1 — if 200, creds are valid
  }

  async fetchProviders(creds) {
    // GET /providers
    // Map: ProvNum → externalId, FName → firstName, LName → lastName
    // Suffix → suffix (DDS, DMD, RDH)
    // Filter out IsHidden = true
    // Validate each record through NormalizedProviderSchema
  }

  async fetchPatients(creds, cursor) {
    // GET /patients/Simple?DateTStamp={cursor.lastSyncAt}
    // Map: PatNum → externalId, FName → firstName, LName → lastName
    // Phone priority: WirelessPhone > HmPhone > WkPhone
    // PatStatus map: "Patient" → "active", everything else → "inactive"
    // Validate each record through NormalizedPatientSchema
  }

  async fetchTreatments(creds, cursor) {
    // Step 1: GET /treatplans?SecDateTEdit={cursor}
    // Step 2: For each plan, GET /proctps?TreatPlanNum={id}
    // Map: ProcTPNum → externalId, PatNum → externalPatientId
    //       ProcCode → code, FeeAmt → amount, Descript → description
    //       DateTP → presentedAt
    // Status map: "Active" → "pending", "Saved" → "pending", "Inactive" → "declined"
    // Validate each record through NormalizedTreatmentSchema
  }

  async fetchAppointments(creds, cursor) {
    // GET /appointments?DateTStamp={cursor.lastSyncAt}
    // Map: AptNum → externalId, PatNum → externalPatientId
    //       AptDateTime → dateTime, ProcDescript → procedureDescription
    // Status map: "Scheduled" → "scheduled", "Complete" → "complete",
    //             "Broken" → "broken", others → "cancelled"
    // Validate each record through NormalizedAppointmentSchema
  }
}
```

### Key OpenDental Data Mappings

**Providers** — `GET /providers`

| OpenDental Field | Our Field | Transform |
|---|---|---|
| `ProvNum` | `externalId` | `String(ProvNum)` |
| `FName` | `firstName` | Direct |
| `LName` | `lastName` | Direct |
| `Suffix` | `suffix` | Direct (DDS, DMD, RDH) |
| `IsHidden` + `ProvStatus` | `status` | Hidden or non-Active → "inactive" |

**Patients** — `GET /patients/Simple`

| OpenDental Field | Our Field | Transform |
|---|---|---|
| `PatNum` | `externalId` | `String(PatNum)` |
| `FName` | `firstName` | Direct |
| `LName` | `lastName` | Direct |
| `Email` | `email` | Trim, null if empty |
| `WirelessPhone` / `HmPhone` / `WkPhone` | `phone` | First non-empty, strip formatting |
| `Birthdate` | `dateOfBirth` | Already `yyyy-MM-dd` |
| `PatStatus` | `status` | "Patient" → "active", else "inactive" |
| `PriProv` | `externalPrimaryProviderId` | `String(PriProv)` — patient's primary doctor |

**Treatments** — `GET /treatplans` + `GET /proctps`

OpenDental splits treatment plans into two entities:
- **TreatPlan**: The container (heading, status, dates, signatures)
- **ProcTP**: Individual procedure line items (code, fee, tooth, description)

Our `treatments` table is flat (one row = one procedure with a code and fee), so each ProcTP becomes one treatment row:

| OpenDental Field | Our Field | Transform |
|---|---|---|
| `ProcTP.ProcTPNum` | `externalId` | `String(ProcTPNum)` |
| `ProcTP.PatNum` | `externalPatientId` | `String(PatNum)` |
| `ProcTP.ProcCode` | `code` | Direct — already ADA CDT |
| `ProcTP.Descript` | `description` | Direct |
| `ProcTP.FeeAmt` | `amount` | Direct (decimal dollars) |
| `TreatPlan.DateTP` | `presentedAt` | Append `T00:00:00Z` for ISO |
| `TreatPlan.TPStatus` | `status` | "Active"→"pending", "Inactive"→"declined", "Saved"→"pending" |
| `ProcTP.ProvNum` | `externalProviderId` | `String(ProvNum)` — links to provider for personalized messages |

**Appointments** — `GET /appointments`

| OpenDental Field | Our Field | Transform |
|---|---|---|
| `AptNum` | `externalId` | `String(AptNum)` |
| `PatNum` | `externalPatientId` | `String(PatNum)` |
| `AptDateTime` | `dateTime` | Reformat to ISO 8601 |
| `AptStatus` | `status` | "Scheduled"→"scheduled", "Complete"→"complete", "Broken"→"broken" |
| `ProcDescript` | `procedureDescription` | Direct |

## Sync Engine

The sync engine is vendor-agnostic. It only consumes `NormalizedPatient`, `NormalizedTreatment`, and `NormalizedAppointment`.

```
┌──────────────────────────────────────────────────────────┐
│  Cron: /api/cron/sync-pms (every 15 min)                │
│                                                          │
│  for each practice where pms_connected = true:           │
│    1. connector = ConnectorFactory.get(practice.pms_type)│
│    2. cursor = practice.metadata.last_sync_at            │
│    3. providers = connector.fetchProviders(creds)        │
│       → Zod validate each → upsert by external_id       │
│    4. patients = connector.fetchPatients(creds, cursor)  │
│       → Zod validate each → upsert by external_id       │
│       → Link primary_provider_id                         │
│    5. treatments = connector.fetchTreatments(creds, cur) │
│       → Zod validate each → upsert by external_id       │
│       → Link provider_id                                 │
│    6. appointments = connector.fetchAppointments(creds)  │
│       → For each "scheduled" appointment:                │
│         - Match patient by external_id                   │
│         - If patient has pending treatments → auto-book  │
│         - Call markPatientBooked() — see [[patient-statuses-and-lifecycle#Conversion Detection]]   │
│    6. Update practice.metadata.last_sync_at              │
│    7. Log sync results to sync_log table                 │
└──────────────────────────────────────────────────────────┘
```

### ConnectorFactory

```typescript
// src/lib/integrations/factory.ts

import { OpenDentalConnector } from "./open-dental";
import type { PmsConnector } from "./types";

const connectors: Record<string, PmsConnector> = {
  open_dental: new OpenDentalConnector(),
  // dentrix: new DentrixConnector(),     — Phase 2
  // eaglesoft: new EaglesoftConnector(),  — Phase 3
};

export function getConnector(pmsType: string): PmsConnector {
  const connector = connectors[pmsType];
  if (!connector) throw new Error(`Unsupported PMS type: ${pmsType}`);
  return connector;
}
```

## Validation Layer: Where Breaks Get Caught

The critical insight: **Zod validation at the adapter boundary is the single biggest thing you can do to prevent production breaks.** Every record passes through the normalized schema before touching the database.

```typescript
// Inside each adapter's fetch method:
const raw = await odApi.get("/patients/Simple", params);

const patients: NormalizedPatient[] = [];
const warnings: string[] = [];

for (const record of raw) {
  const mapped = mapOdPatient(record);
  const result = NormalizedPatientSchema.safeParse(mapped);

  if (result.success) {
    patients.push(result.data);
  } else {
    // Bad record doesn't crash the sync — log it, skip it, keep going
    warnings.push(`Patient ${record.PatNum}: ${result.error.message}`);
  }
}
```

This means:
- A missing email doesn't crash the sync (it's nullable)
- An unexpected status value gets caught before hitting the DB
- A vendor API change surfaces as a validation warning, not a 500 error

## Mock PMS Servers (Integration Testing)

Each vendor gets a fixture server that returns data shaped exactly like the real API. These serve two purposes:

1. **Automated tests** — CI runs adapter tests against fixtures
2. **Customer sandbox** — practices can test the connection flow before going live

### Structure

```
src/lib/integrations/
├── types.ts                    # PmsConnector interface + Zod schemas
├── factory.ts                  # ConnectorFactory
├── open-dental.ts              # OpenDental adapter
├── dentrix.ts                  # Dentrix adapter (Phase 2)
├── eaglesoft.ts                # Eaglesoft adapter (Phase 3)
└── __tests__/
    ├── open-dental.test.ts     # Adapter unit tests
    └── fixtures/
        └── open-dental/
            ├── providers.json      # Exact OD API response shape
            ├── patients.json       # Exact OD API response shape
            ├── treatplans.json     # Exact OD API response shape
            ├── proctps.json        # Exact OD API response shape
            └── appointments.json   # Exact OD API response shape
```

### Fixture Data Example

```json
// __tests__/fixtures/open-dental/patients.json
// Mirrors EXACT OpenDental response — including quirks
[
  {
    "PatNum": 10421,
    "LName": "Castellano",
    "FName": "Maria",
    "MiddleI": "",
    "Preferred": "",
    "PatStatus": "Patient",
    "Gender": "Female",
    "Birthdate": "1985-06-14",
    "Address": "742 Maple Dr",
    "City": "Denver",
    "State": "CO",
    "Zip": "80202",
    "HmPhone": "(720) 555-0198",
    "WkPhone": "",
    "WirelessPhone": "(720) 555-0199",
    "Email": "maria.castellano@email.com",
    "PriProv": 1,
    "ClinicNum": 0
  }
]
```

```json
// __tests__/fixtures/open-dental/treatplans.json
[
  {
    "TreatPlanNum": 5001,
    "PatNum": 10421,
    "DateTP": "2026-03-15",
    "Heading": "Crown — Upper Left Molar",
    "Note": "Patient presented with fractured cusp on #14",
    "TPStatus": "Active",
    "TPType": "Insurance",
    "isSigned": false,
    "isSignedPractice": false
  }
]
```

```json
// __tests__/fixtures/open-dental/proctps.json
[
  {
    "ProcTPNum": 8001,
    "TreatPlanNum": 5001,
    "PatNum": 10421,
    "ProcNumOrig": 20001,
    "ItemOrder": 0,
    "ToothNumTP": "14",
    "ProcCode": "D2740",
    "Descript": "Crown — porcelain/ceramic substrate",
    "FeeAmt": 1450.00,
    "PriInsAmt": 725.00,
    "SecInsAmt": 0.00,
    "PatAmt": 725.00,
    "Discount": 0.00,
    "DateTP": "2026-03-15",
    "ProvNum": 1,
    "ClinicNum": 0
  }
]
```

### Test Pattern

```typescript
// __tests__/open-dental.test.ts

import { OpenDentalConnector } from "../open-dental";
import patients from "./fixtures/open-dental/patients.json";
import treatplans from "./fixtures/open-dental/treatplans.json";
import proctps from "./fixtures/open-dental/proctps.json";

// Mock the HTTP layer, feed fixture data
// Assert: every record passes NormalizedPatientSchema
// Assert: ProcTP.ProcCode maps to treatment.code
// Assert: ProcTP.FeeAmt maps to treatment.amount
// Assert: TreatPlan.TPStatus maps to correct status enum
// Assert: Phone priority picks WirelessPhone over HmPhone
```

## Database Additions

### New: `sync_log` table

Tracks every sync run for debugging and the Settings sync status UI.

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | PK |
| `practice_id` | uuid | FK |
| `pms_type` | text | "open_dental", "dentrix", etc. |
| `started_at` | timestamptz | When sync began |
| `completed_at` | timestamptz | When sync finished |
| `status` | text | "success", "partial", "failed" |
| `patients_synced` | int | Count of upserted patients |
| `treatments_synced` | int | Count of upserted treatments |
| `appointments_synced` | int | Count of processed appointments |
| `auto_conversions` | int | Enrollments auto-converted this run |
| `warnings` | jsonb | Validation warnings (skipped records) |
| `error` | text | Fatal error message if status = "failed" |

### New: `external_id` on `treatments` table

Currently only `patients` has `external_id`. Treatments need it too for upsert-by-vendor-ID:

```sql
ALTER TABLE treatments ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_treatments_external_id
  ON treatments (practice_id, external_id) WHERE external_id IS NOT NULL;
```

### Updated: `practices.metadata` JSONB

Store sync state and encrypted credentials:

```json
{
  "pms_credentials": {
    "api_url": "https://api.opendental.com/api/v1",
    "api_key": "encrypted:...",
    "developer_key": "encrypted:..."
  },
  "last_sync_at": "2026-04-02T10:30:00Z",
  "sync_enabled": true
}
```

## Error Handling Strategy

The goal is **never crash the sync, always surface problems**.

| Failure Mode | Handling |
|---|---|
| Credentials expired/invalid | Mark `pms_connected = false`, email practice admin, stop syncing |
| Single record fails validation | Log warning, skip record, continue sync. Report in sync_log |
| API timeout / 5xx | Retry 3x with exponential backoff. If still failing, log as "failed" sync, try again next cron |
| Rate limited (429) | Respect `Retry-After` header, pause and resume |
| Unknown field in API response | Zod `.passthrough()` — ignore extra fields, don't break |
| Missing required field | Zod catches it → warning, skip record |
| Duplicate external_id | Upsert (ON CONFLICT UPDATE), not insert |

## Vendor-Specific Notes

### OpenDental
- **Auth**: `Authorization: ODFHIR {dev_key}/{customer_key}` header
- **Hosting**: Can be cloud (api.opendental.com) or on-premise (practice exposes their server). On-premise may have SSL issues or be behind a firewall — validate URL reachability during test connection
- **Rate limits**: Undocumented but reportedly ~200 req/min. Paginate large imports
- **Treatment plans are two entities**: Must join `treatplans` + `proctps` to get codes and fees
- **Date formats**: `yyyy-MM-dd` for dates, `yyyy-MM-dd HH:mm:ss` for timestamps (not ISO 8601)
- **Delta sync**: Use `DateTStamp` / `SecDateTEdit` params to fetch only modified records

### Dentrix (Phase 2)
- **Auth**: OAuth 2.0 — more complex setup, requires redirect flow
- **API**: Dentrix Developer Program (partner application required)
- **Data shape**: More modern JSON, closer to our model but different field names
- **Key difference**: Treatment cases nest procedures inline (no separate join needed)
- **Hosting**: Cloud-only API (Dentrix Ascend) or on-premise via Dentrix G7 API
- **Consideration**: Dentrix G7 (on-premise) has a different API than Dentrix Ascend (cloud). May need two sub-adapters

### Eaglesoft (Phase 3)
- **Auth**: API key
- **Data shape**: CSV-oriented — some practices will upload exports rather than live-sync
- **Key difference**: No real-time API for most installations. Consider a file upload flow as the primary path
- **Consideration**: Patterson (Eaglesoft's parent company) has been building a cloud API — evaluate if available by the time we reach Phase 3

### Manual / Other PMS (Already supported)
- CSV upload path already exists in the UI
- Webhook receiver for custom integrations
- No adapter needed — data comes in pre-mapped or via manual entry

## Implementation Phases

### Phase 1: OpenDental Production-Ready (Target: First Practices)
- [ ] Create `src/lib/integrations/types.ts` with `PmsConnector` interface and Zod schemas
- [ ] Create `src/lib/integrations/factory.ts` with ConnectorFactory
- [ ] Build `OpenDentalConnector` with real API calls
- [ ] Add `external_id` column to `treatments` table
- [ ] Create `sync_log` table
- [ ] Wire up `test-pms` route to use `connector.testConnection()`
- [ ] Implement initial import flow (on first connection)
- [ ] Implement delta sync in cron job
- [ ] Build fixture data from real OpenDental API responses
- [ ] Write adapter tests against fixtures
- [ ] Sync status UI in Settings (last sync time, record counts, errors)

### Phase 2: Harden & Add Dentrix
- [ ] Production monitoring: alert on failed syncs, track sync duration
- [ ] Retry logic with exponential backoff
- [ ] Credential encryption at rest
- [ ] Rate limit handling
- [ ] `DentrixConnector` implementation
- [ ] Dentrix fixture data and tests

### Phase 3: Eaglesoft & CSV Improvements
- [ ] `EaglesoftConnector` (API or CSV upload, depending on availability)
- [ ] Improved CSV upload with column mapping UI
- [ ] Bulk import progress indicator

### Phase 4: Outbound Sync & Advanced
- [ ] Write communication notes back to PMS
- [ ] Real-time sync via webhooks (OpenDental eConnector)
- [ ] Configurable sync frequency per practice
- [ ] Sync conflict resolution UI

## Security

- All PMS credentials encrypted at rest in `practices.metadata` JSONB (app-layer AES-256-GCM)
- Credentials never sent to the client — server-side only (cron, API routes)
- All sync operations scoped by `practice_id` via RLS
- PMS API calls made server-side only
- Audit trail via `sync_log` table
- On-premise OD servers: validate SSL, enforce HTTPS, timeout after 30s

---

## Related

- [[open-dental-integration-architecture]] — OpenDental adapter: the reference implementation of `PmsConnector`
- [[ada-dental-codes]] — ADA CDT codes used in the `NormalizedTreatmentSchema.code` field
- [[patient-statuses-and-lifecycle]] — Status values that normalized data maps into
- [[why-now-timing-analysis]] — PMS middleware APIs (Kolla, DentalBridge) as a key timing enabler
- [[product-hurdles-and-mitigation]] — PMS integration fragility is Hurdle #2
- [[competitive-landscape]] — Legacy PMS targeting strategy (Open Dental as beachhead)
