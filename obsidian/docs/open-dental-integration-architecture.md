# Open Dental Integration Architecture

> Design doc for integrating with Open Dental's REST API as our first PMS integration target. Open Dental is open-source with well-documented APIs, making it ideal for initial launch. See [[pms-connector-architecture]] for the vendor-agnostic adapter layer this plugs into.

## Overview

The integration syncs data between Open Dental (the practice's source of truth for appointments, patients, and procedures) and our follow-up system. The primary goal is **automatic detection of appointment bookings** so sequences stop when a patient schedules, without manual "Mark as Booked" intervention.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Our App                               │
│                                                           │
│  ┌────────────┐   ┌───────────────┐   ┌────────────────┐ │
│  │ Settings    │   │ Cron: Sync    │   │ Webhook:       │ │
│  │ Connect OD  │──▶│ Every 15min   │   │ /api/webhooks  │ │
│  │ (API URL +  │   │ Poll OD API   │   │ /open-dental   │ │
│  │  API Key)   │   └───────┬───────┘   └───────┬────────┘ │
│  └────────────┘           │                    │          │
│                           ▼                    ▼          │
│               ┌────────────────────────────────┐          │
│               │   Sync Engine                  │          │
│               │   - Match patients by ID       │          │
│               │   - Detect new appointments    │          │
│               │   - Auto-convert enrollments   │          │
│               │   - Import new treatment plans │          │
│               └────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │    Open Dental Server          │
            │    (Practice's local or cloud) │
            │                                │
            │  GET /patients                 │
            │  GET /appointments             │
            │  GET /procedurelogs            │
            │  GET /treatplans               │
            └───────────────────────────────┘
```

## Two Sync Directions

### 1. Inbound Sync (Open Dental → Our App) — Critical Path

This is where automatic booking detection lives.

**Patients**
- Import new patients, match by `patients.external_id` ↔ OD `PatNum`
- Update demographics (name, phone, email) on changes
- Initial connection triggers a bulk import of active patients

**Treatment Plans**
- Import presented treatment plans via `treatplans` + `procedurelogs` endpoints
- Creates `treatments` records with `status: "pending"`
- Maps OD procedure codes ([[ada-dental-codes|ADA codes]] like D2740) directly to our `treatments.code`

**Appointments (The Booking Signal)**
- Poll for new/modified appointments since last sync
- Match `appointment.PatNum` → our `patients.external_id`
- If that patient has pending treatments + active enrollments → auto-convert:
  - `treatment.status` → `"accepted"`, set `decided_at`
  - `enrollment.status` → `"converted"`, set `converted_at`
  - This is the same logic as `markPatientBooked()` but triggered automatically

### 2. Outbound Sync (Our App → Open Dental) — Future / Nice-to-Have

- Write communication notes back to OD patient record
- Log follow-up activity in OD's commlog
- Not required for initial launch

## Open Dental API Endpoints

Open Dental's API is REST-based with API key authentication.

| OD Endpoint | What It Provides | Maps To |
|---|---|---|
| `GET /patients` | Patient demographics | `patients` table (via `external_id`) |
| `GET /treatplans` | Presented treatment plans | `treatments` with `status="pending"` |
| `GET /procedurelogs` | Completed/scheduled procedures | Treatment acceptance detection |
| `GET /appointments` | Scheduled appointments | **Booking signal** — triggers auto-convert |
| `GET /recalls` | Hygiene recall status | Future: recall follow-up sequences |

### Authentication

Open Dental uses a developer key + customer key model:
- **Developer Key**: Assigned to our application (one-time registration)
- **Customer Key**: Generated per-practice in their Open Dental installation
- Both sent as headers: `Authorization: ODFHIR <developer_key>/<customer_key>`

### Key OD Data Fields

**Appointment**
- `AptNum` — Unique appointment ID
- `PatNum` — Patient ID (our `external_id`)
- `AptStatus` — 1=Scheduled, 2=Complete, 3=UnschedList, 5=Broken, 6=Planned
- `AptDateTime` — Scheduled date/time
- `ProcDescript` — Procedure description
- `DateTStamp` — Last modified (use for delta sync)

**Treatment Plan**
- `TreatPlanNum` — Unique plan ID
- `PatNum` — Patient ID
- `DateTP` — Date presented
- `TPStatus` — 0=Active, 1=Inactive, 2=Saved (inactive or saved plans were declined/deferred)

## Sync Engine Design

### Cron Job Flow (Every 15 Minutes)

```
for each practice where pms_type = 'open_dental' AND pms_connected = true:
  1. Get last_sync_timestamp from practice metadata
  2. Fetch OD appointments modified since last_sync
  3. For each new/modified appointment with AptStatus = Scheduled:
     a. Look up patient by external_id = appointment.PatNum
     b. If patient has pending treatments OR active enrollments:
        - Mark treatments as accepted
        - Convert active enrollments
        - Log activity
  4. Fetch OD patients modified since last_sync
     a. Upsert into patients table (match on external_id)
  5. Fetch OD treatment plans modified since last_sync
     a. Import new plans as treatments with status = "pending"
     b. Update existing plans if status changed in OD
  6. Update last_sync_timestamp
```

### Initial Import (On First Connection)

When a practice clicks "Save & Connect" in Settings:

1. Validate credentials via test endpoint
2. Set `pms_type = 'open_dental'`, `pms_connected = true`
3. Trigger async initial import job:
   - Import all active patients (paginated, may be thousands)
   - Import all active treatment plans
   - Import upcoming appointments
   - Set `last_sync_timestamp` to now
4. Show progress in UI (optional: use SSE or polling)

### Conflict Resolution

| Scenario | Resolution |
|---|---|
| Patient exists in both systems | Match by `external_id`; OD wins for demographics |
| Treatment in OD marked complete, ours still pending | Auto-accept treatment, convert enrollment |
| Treatment in our system but not in OD | Keep (may have been manually created) |
| Patient in OD but not in our system | Create new patient record |
| Appointment cancelled in OD after we converted | Re-open enrollment (edge case, manual review) |

## Existing Infrastructure

These files already exist and are scaffolded for this work:

| File | Status | Purpose |
|---|---|---|
| `src/components/features/settings/IntegrationsTab.tsx` | UI complete | OD config form with API URL, key, test connection |
| `src/app/api/settings/test-pms/route.ts` | Stub | Validates OD credentials — needs real API call |
| `src/app/api/cron/sync-pms/route.ts` | Framework | Loops connected practices — needs sync logic |
| `src/hooks/useSettings.ts` | `useTestPmsConnection()` | Client hook for test connection |
| `practices` table | `pms_type`, `pms_connected` | Stores connection state |
| `patients` table | `external_id` | Maps to OD `PatNum` |
| `src/lib/api/patients.ts` | `markPatientBooked()` | Reusable for [[patient-statuses-and-lifecycle#Conversion Detection|auto-conversion]] |

## Implementation Plan

### Phase 1: Connection & Patient Sync
- [ ] Build OD API client class (`src/lib/integrations/open-dental.ts`)
- [ ] Implement real credential validation in test-pms route
- [ ] Initial patient import on connection
- [ ] Store encrypted credentials in practice JSONB
- [ ] Delta patient sync in cron

### Phase 2: Treatment Plan Import
- [ ] Map OD treatment plans → our treatments table
- [ ] ADA code mapping (OD uses same codes)
- [ ] Handle plan status changes from OD

### Phase 3: Appointment Booking Detection (The Big Win)
- [ ] Poll appointments endpoint in cron
- [ ] Match appointments to patients with active enrollments
- [ ] Auto-convert enrollments when appointment detected
- [ ] Activity feed entry for auto-conversions
- [ ] Dashboard notification for auto-detected bookings

### Phase 4: Polish
- [ ] Sync status dashboard in Settings (last sync time, record counts, errors)
- [ ] Manual re-sync button
- [ ] Error handling & retry logic for OD API failures
- [ ] Rate limiting (OD has per-minute limits)
- [ ] Outbound sync: write commlogs back to OD

## Security Considerations

- OD API keys stored encrypted at rest (JSONB with app-layer encryption)
- All OD API calls server-side only (cron jobs, API routes)
- Practice data isolation via RLS — sync scoped to `practice_id`
- OD servers may be on-premise; validate SSL, handle timeouts
- Audit log for all sync operations

## Open Questions

- [ ] Do we register as an OD developer partner (free, gives us a developer key)?
- [ ] Do we support OD Cloud vs on-premise vs both? (Cloud is easier — single API endpoint; on-premise requires the practice to expose their server)
- [ ] Sync frequency: 15 min? 5 min? Configurable per practice?
- [ ] Do we need real-time via OD's eConnector webhooks, or is polling sufficient for MVP?

---

## Related

- [[pms-connector-architecture]] — Vendor-agnostic adapter layer; OpenDental is the reference implementation
- [[ada-dental-codes]] — ADA CDT codes that OD `ProcCode` fields map to
- [[patient-statuses-and-lifecycle]] — Auto-conversion of enrollments when bookings are detected
- [[why-now-timing-analysis]] — PMS middleware reducing integration barriers (Reason #1)
- [[product-hurdles-and-mitigation]] — PMS integration fragility is Hurdle #2
- [[competitive-landscape]] — Open Dental as the beachhead PMS target
