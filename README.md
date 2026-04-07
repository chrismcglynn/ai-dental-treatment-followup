# AI Treatment Follow-Up

Automated patient follow-up system for dental practices. Syncs patient data from practice management systems (OpenDental, Dentrix, Eaglesoft), then runs intelligent follow-up sequences to recover unscheduled treatment.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase project (local or hosted)

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/                    # Next.js app router (pages, API routes)
    api/
      cron/sync-pms/      # Cron endpoint — syncs all connected practices
      settings/test-pms/  # Test PMS connection from settings UI
  lib/
    integrations/         # PMS connector layer
      types.ts            # PmsConnector interface, Zod schemas, shared types
      open-dental.ts      # OpenDental adapter
      factory.ts          # ConnectorFactory — resolves pms_type → adapter
      sync-engine.ts      # Vendor-agnostic sync orchestrator
      __tests__/          # Unit + integration tests
    sandbox/              # Demo mode data & simulation engine
  types/
    database.types.ts     # Supabase-generated DB types

mock-servers/
  open-dental/            # Mock OpenDental API server for local development

docs/
  pms-connector-architecture.md   # Full design doc for the integration layer

supabase/
  migrations/             # SQL migrations (run in order)
```

## PMS Integration Architecture

The app uses an **adapter pattern** to normalize data from different dental PMS systems into a unified schema. Each PMS gets its own connector that implements the `PmsConnector` interface. Raw vendor data is validated through Zod schemas at the boundary — bad records are logged as warnings and skipped, never crashing the sync.

See [`docs/pms-connector-architecture.md`](obsidian/docs/pms-connector-architecture.md) for the full design doc.

### How It Works

```
PMS API (OpenDental, Dentrix, etc.)
  ↓
PMS Adapter (vendor-specific field mapping, date conversion, status mapping)
  ↓
Zod Validation (NormalizedPatient, NormalizedTreatment, NormalizedAppointment)
  ↓
Sync Engine (upserts to Supabase by external_id, detects bookings, auto-converts enrollments)
```

### Supported PMS Systems

| System | Status | Adapter |
|--------|--------|---------|
| OpenDental | Implemented | `src/lib/integrations/open-dental.ts` |
| Dentrix | Planned | — |
| Eaglesoft | Planned | — |

### Key Files

- **`src/lib/integrations/types.ts`** — `PmsConnector` interface that all adapters implement, plus `NormalizedPatientSchema`, `NormalizedTreatmentSchema`, and `NormalizedAppointmentSchema` (Zod)
- **`src/lib/integrations/open-dental.ts`** — OpenDental adapter handling their specific quirks: `PatNum` (int) → string ID, three phone fields → one (wireless > home > work), `treatplans` + `proctps` join → flat treatment rows, `yyyy-MM-dd` dates → ISO, status enum mapping
- **`src/lib/integrations/factory.ts`** — `getConnector(pmsType)` resolves a PMS type string to the correct adapter instance
- **`src/lib/integrations/sync-engine.ts`** — `syncPractice()` orchestrates a full sync: fetch patients → fetch treatments → fetch appointments → detect bookings → update cursor

### Adding a New PMS Adapter

1. Create `src/lib/integrations/<vendor>.ts`
2. Implement the `PmsConnector` interface (see `types.ts`)
3. Map vendor-specific fields to the normalized Zod schemas
4. Register the adapter in `src/lib/integrations/factory.ts`
5. Add a mock server in `mock-servers/<vendor>/` with realistic test data
6. Write unit tests (mocked fetch) and integration tests (against mock server)

## Mock OpenDental Server

A standalone Express server that mimics the OpenDental REST API with realistic fake data. Use it for local development and integration testing without needing real practice credentials.

### Data

| Entity | Count | Notes |
|--------|-------|-------|
| Patients | 25 | Diverse statuses (Patient, Inactive, Archived, NonPatient, Prospective, Deceased), varied phone combos, sentinel birthdates, empty emails, child patients |
| Treatment Plans | 14 | Active + Inactive (declined), single and multi-procedure plans |
| Procedures | 27 | Real ADA CDT codes (D2740 crown, D3330 RCT, D6010 implant, D4341 SRP, D8090 ortho, D5110 denture, etc.) |
| Appointments | 18 | Scheduled, Complete, Broken, Planned, ASAP statuses |

### Running the Mock Server

```bash
npm run mock:opendental
```

The server starts on `http://localhost:4100` and prints its credentials and available endpoints:

```
Mock OpenDental API running on http://localhost:4100/api/v1

  Auth credentials:
    Developer Key: mock-dev-key
    Customer Key:  mock-customer-key
    Header:        Authorization: ODFHIR mock-dev-key/mock-customer-key

  Endpoints:
    GET /api/v1/health              (no auth)
    GET /api/v1/patients             ?limit=N&DateTStamp=...
    GET /api/v1/patients/Simple      ?DateTStamp=...
    GET /api/v1/treatplans           ?SecDateTEdit=...
    GET /api/v1/proctps              ?TreatPlanNum=...
    GET /api/v1/appointments         ?DateTStamp=...
```

### Authentication

The server validates the `Authorization: ODFHIR {developerKey}/{customerKey}` header format, matching the real OpenDental API. Requests with missing or invalid auth get a `401`.

### Cursor Filtering

All endpoints support the same timestamp-based cursor params as the real API (`DateTStamp`, `SecDateTEdit`). Pass a cursor to simulate delta sync — only records modified after the cursor are returned.

### Using with the Connector

Point the OpenDental connector at the mock server by setting these credentials in your practice's PMS settings:

| Field | Value |
|-------|-------|
| API URL | `http://localhost:4100/api/v1` |
| Customer Key | `mock-customer-key` |
| Developer Key | `mock-dev-key` |

Or use it directly in code:

```ts
import { OpenDentalConnector } from "@/lib/integrations/open-dental";
import type { PmsCredentials } from "@/lib/integrations/types";

const creds: PmsCredentials = {
  apiUrl: "http://localhost:4100/api/v1",
  apiKey: "mock-customer-key",
  extras: { developerKey: "mock-dev-key" },
};

const connector = new OpenDentalConnector();
const result = await connector.fetchPatients(creds, {
  lastSyncAt: "1970-01-01T00:00:00Z",
});
console.log(result.data); // 25 normalized patients
```

## Testing

### Unit Tests

Unit tests mock `fetch` and test the adapter logic (field mapping, status conversion, phone priority, date handling) against static fixture data.

```bash
npx vitest run src/lib/integrations/__tests__/open-dental.test.ts
```

### Integration Tests

Integration tests run the real connector against the mock OpenDental server over HTTP. This validates the full path: auth headers, query param construction, JSON parsing, and Zod schema validation against a realistic dataset.

```bash
# Terminal 1 — start the mock server
npm run mock:opendental

# Terminal 2 — run integration tests
npx vitest run src/lib/integrations/__tests__/open-dental.integration.test.ts
```

**39 integration test cases** covering:

- **Connection** — valid creds, invalid creds (401), customer-key-only auth
- **Patients** (12 tests) — full sync count, Zod validation, delta sync filtering, ID mapping, phone priority logic (wireless > home > work > null), sentinel birthdate handling, empty email, all PatStatus variants
- **Treatments** (11 tests) — plan + procedure join, multi-proc plans (bridge=3, perio=4 quads), status mapping, high/low value plans, referential integrity
- **Appointments** (9 tests) — all status mappings (Scheduled, ASAP, Broken, Complete, Planned), datetime conversion, delta sync
- **Full pipeline** (3 tests) — sequential sync of all entities, every treatment/appointment references a valid patient

### Run All Tests

```bash
# Unit tests only (no server needed)
npx vitest run src/lib/integrations/__tests__/open-dental.test.ts

# All tests (start mock server first)
npm run mock:opendental &
npx vitest run src/lib/integrations/__tests__/
```

## Database Migrations

Run migrations against your Supabase instance in order:

```bash
supabase db push
```

Key migration: `00005_pms_sync_infrastructure.sql` adds `external_id` to treatments, `metadata` to practices, and creates the `sync_log` table.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run mock:opendental` | Start mock OpenDental API on port 4100 |
