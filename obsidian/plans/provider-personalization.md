# Provider Personalization Plan

> Enable personalized follow-up messages like *"Hello Sherry, Dr. Johnson wanted to follow up on your crown treatment plan..."* by syncing provider/doctor data from Open Dental.

## Problem

Follow-up messages are currently generic — they reference the practice name but not the specific doctor who presented the treatment plan. Patients have a relationship with their doctor, not the practice. Personalization with the doctor's name increases trust and response rates.

## Data Available in Open Dental

Open Dental already exposes provider info at multiple levels:

| OD Entity | Field | Meaning |
|---|---|---|
| `ProcTP` (procedure) | `ProvNum` | Doctor performing/presenting this procedure |
| `Patient` | `PriProv` | Patient's primary provider |
| `Patient` | `SecProv` | Patient's secondary provider |
| `Appointment` | `ProvNum` | Doctor for this appointment |
| `TreatPlan` | `UserNumPresenter` | User who created/presented the plan |

**Best field for patient-facing messages**: `Patient.PriProv` — this is the patient's primary doctor, the one they know and trust. This is the industry standard used by competitors (RevenueWell, Weave, Dental Intelligence). `ProcTP.ProvNum` can differ from PriProv in multi-specialty practices (e.g., a referred oral surgeon the patient has never met), which would feel impersonal. `UserNumPresenter` is often a treatment coordinator or front desk staff, not a doctor — never use for patient-facing messages.

**`ProcTP.ProvNum`** is still worth syncing for internal use (provider-level dashboards, analytics by performing doctor).

**Provider lookup**: Open Dental exposes `GET /providers` which returns:
```json
{
  "ProvNum": 1,
  "Abbr": "DOC1",
  "FName": "Sarah",
  "LName": "Johnson",
  "Suffix": "DDS",
  "IsHidden": false,
  "ProvStatus": "Active"
}
```

## Implementation Steps

### Step 1: Database — `providers` table + treatment FK

Create migration `00006_providers.sql`:

```sql
-- Providers table (synced from PMS)
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  external_id text NOT NULL,          -- OD ProvNum (stringified)
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  suffix text DEFAULT '',             -- DDS, DMD, RDH, etc.
  display_name text GENERATED ALWAYS AS (
    CASE
      WHEN suffix != '' THEN 'Dr. ' || last_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, external_id)
);

-- RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Practice members can view providers"
  ON providers FOR SELECT
  USING (practice_id IN (
    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
  ));

-- Add provider reference to treatments
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);
CREATE INDEX IF NOT EXISTS idx_treatments_provider ON treatments (provider_id);

-- Add primary provider reference to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS primary_provider_id uuid REFERENCES providers(id);
```

**Why a separate `providers` table instead of just a name string on treatments:**
- Provider names are shared across many treatments — normalize to avoid stale data
- Practices may want to see provider-level dashboards (acceptance rate per doctor)
- Provider list is small (2–10 per practice) — minimal storage/sync cost

### Step 2: Normalized Schema — Add provider fields

Update `src/lib/integrations/types.ts`:

```typescript
// New schema
export const NormalizedProviderSchema = z.object({
  externalId: z.string().min(1),       // ProvNum
  firstName: z.string(),
  lastName: z.string().min(1),
  suffix: z.string(),                  // DDS, DMD, etc.
  status: z.enum(["active", "inactive"]),
});

// Update NormalizedTreatmentSchema — add:
  externalProviderId: z.string().nullable(),  // ProvNum from ProcTP

// Update NormalizedPatientSchema — add:
  externalPrimaryProviderId: z.string().nullable(), // PriProv
```

### Step 3: PmsConnector Interface — Add `fetchProviders`

Update `src/lib/integrations/types.ts`:

```typescript
export interface PmsConnector {
  // ... existing methods ...

  /** Fetch all providers (small dataset, no cursor needed) */
  fetchProviders(creds: PmsCredentials): Promise<SyncResult<NormalizedProvider>>;
}
```

### Step 4: OpenDental Adapter — Implement provider fetch + mapping

Update `src/lib/integrations/open-dental.ts`:

```typescript
interface OdProvider {
  ProvNum: number;
  Abbr: string;
  FName: string;
  LName: string;
  Suffix: string;   // "DDS", "DMD", "RDH"
  IsHidden: boolean;
  ProvStatus: string;
  [key: string]: unknown;
}

// Add to OpenDentalConnector:
async fetchProviders(creds: PmsCredentials): Promise<SyncResult<NormalizedProvider>> {
  const raw = await odFetch<OdProvider[]>(creds, "/providers");
  // Map: ProvNum → externalId, FName → firstName, LName → lastName
  // Filter: IsHidden = false
  // Status: ProvStatus mapping
}

// Update fetchTreatments mapping to include:
  externalProviderId: proc.ProvNum ? String(proc.ProvNum) : null

// Update fetchPatients mapping to include:
  externalPrimaryProviderId: patient.PriProv ? String(patient.PriProv) : null
```

### Step 5: OD Interface Types — Add ProvNum to existing types

Update the `OdProcTP` interface to formally include `ProvNum`:
```typescript
interface OdProcTP {
  // ... existing fields ...
  ProvNum: number;  // Already in mock data, just not typed
}
```

Update `OdPatient` to include `PriProv`:
```typescript
interface OdPatient {
  // ... existing fields ...
  PriProv: number;
  SecProv: number;
}
```

### Step 6: Sync Engine — Sync providers first, then link

Update `src/lib/integrations/sync-engine.ts`:

The sync order becomes:
1. **Providers** (new — small dataset, synced in full each time)
2. Patients (updated to link `primary_provider_id`)
3. Treatments (updated to link `provider_id`)
4. Appointments (unchanged)

```typescript
// New upsertProviders function
// Providers are a small set (2-10), so full-sync each time (no cursor)

// Updated upsertTreatments: after upserting, resolve externalProviderId → provider_id
// Updated upsertPatients: after upserting, resolve externalPrimaryProviderId → primary_provider_id
```

Add `providers_synced` to `SyncLogEntry`.

### Step 7: Mock Server — Add `/providers` endpoint + data

Create `mock-servers/open-dental/data/providers.json`:
```json
[
  {
    "ProvNum": 1,
    "Abbr": "DOC1",
    "FName": "Sarah",
    "LName": "Johnson",
    "Suffix": "DDS",
    "IsHidden": false,
    "ProvStatus": "Active",
    "IsSecondary": false
  },
  {
    "ProvNum": 2,
    "Abbr": "DOC2",
    "FName": "Michael",
    "LName": "Chen",
    "Suffix": "DMD",
    "IsHidden": false,
    "ProvStatus": "Active",
    "IsSecondary": false
  }
]
```

Add `GET /providers` route to `mock-servers/open-dental/server.js`.

### Step 8: Message Templates — Use provider name

When generating follow-up messages, the template system can now resolve:

```
"Hello {{patient.firstName}}, Dr. {{patient.primaryProvider.lastName}} wanted to follow up
on your {{treatment.description}} treatment plan..."
```

**Fallback chain**:
1. `patient.primary_provider_id` → provider display_name (primary — the patient's doctor, industry standard)
2. `treatment.provider_id` → provider display_name (fallback — only if patient has no PriProv assigned)
3. Practice name (last resort — no provider data at all)

### Step 9: Update fixture/test data

- Add provider fixture to `src/lib/integrations/__tests__/fixtures/open-dental/providers.json`
- Update adapter tests to verify provider mapping
- Update sync engine tests to verify provider linking

## Files to Modify

| File | Change |
|---|---|
| `supabase/migrations/00006_providers.sql` | **New** — providers table, treatments.provider_id, patients.primary_provider_id |
| `src/lib/integrations/types.ts` | Add `NormalizedProviderSchema`, update treatment/patient schemas, add `fetchProviders` to interface |
| `src/lib/integrations/open-dental.ts` | Add `OdProvider` type, implement `fetchProviders`, map `ProvNum` on treatments, `PriProv` on patients |
| `src/lib/integrations/sync-engine.ts` | Add `upsertProviders`, update sync order, link provider_id on treatments/patients |
| `src/lib/integrations/factory.ts` | No changes needed (adapter already registered) |
| `mock-servers/open-dental/server.js` | Add `/providers` endpoint |
| `mock-servers/open-dental/data/providers.json` | **New** — mock provider data |
| Message template system | Use `provider.display_name` in follow-up messages |

## Doc Updates Needed

- `obsidian/docs/pms-connector-architecture.md` — Add `NormalizedProviderSchema` to schemas, add `fetchProviders` to interface, update OpenDental data mappings table, update fixture structure
- `obsidian/docs/open-dental-integration-architecture.md` — Add `/providers` to endpoint table, add provider fields to Key OD Data Fields section, note provider sync in cron flow

## Design Decisions

1. **Separate `providers` table vs. denormalized name on treatment** — Chose a table because providers are shared, small, and useful for future dashboards (e.g., acceptance rate by doctor).

2. **`display_name` as a generated column** — Doctors get "Dr. LastName", hygienists get "FirstName LastName". Computed from suffix field automatically.

3. **Sync providers without a cursor** — Provider lists are tiny (2–10 records). Fetching all each sync is simpler and more reliable than delta-syncing.

4. **`PriProv` on Patient as primary source for messages** — This is the patient's primary doctor and the industry standard for patient communications. Competitors (RevenueWell, Weave, Dental Intelligence) all use PriProv. `ProvNum` on ProcTP can be a specialist the patient has never met (oral surgeon, endodontist), which undermines trust. `ProvNum` is still synced on treatments for internal analytics (acceptance rate by performing doctor) but is not used in outbound messages.

## Out of Scope

- Provider photos/avatars
- Provider schedules or availability
- Multi-provider attribution on a single treatment plan (each procedure already has its own ProvNum)
- Provider-level dashboard analytics (future feature, but the data model supports it)
