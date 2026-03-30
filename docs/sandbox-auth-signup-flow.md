# Sandbox Auth Signup Flow

## Overview

When a new user signs up, their practice is automatically seeded with realistic demo data so they see a pre-populated dashboard immediately — not an empty state. This is the "instant gratification" pattern for trial-to-paid conversion.

## Flow

```
/auth/signup
    |
    v
POST /api/auth/signup
    |
    |-- 1. Create auth user (Supabase Auth)
    |-- 2. Create practice record
    |-- 3. Create practice_members record (role: owner)
    |-- 4. seedSandboxData(practice.id)    <-- inserts demo data into Supabase
    |-- 5. flagPracticeAsSandbox(practice.id)  <-- sets sandbox_mode = true
    |
    v
/auth/login  (user logs in)
    |
    v
/(dashboard)/layout.tsx
    |
    |-- SandboxWrapper reads practice.sandbox_mode from practice store
    |-- sandbox_mode === true  -->  wraps children in <SandboxProvider>
    |
    v
Dashboard renders with sandbox banner, activity feed, tour, simulation
```

## What gets seeded (server-side)

The `seedSandboxData()` function in `src/lib/sandbox/seedSandboxData.ts` inserts into real Supabase tables:

| Table                 | Count | Description                              |
|-----------------------|-------|------------------------------------------|
| patients              | 10    | Realistic Colorado demographics          |
| treatments            | 8     | Crowns, implants, SRP, composites, etc.  |
| sequences             | 3     | Crown, Implant, Perio follow-up sequences|
| touchpoints           | 9     | SMS/email/voicemail steps across sequences|
| sequence_enrollments  | 5     | Active enrollments for first 5 patients  |

## Database columns

```sql
-- Added by migration 00002_add_sandbox_mode
alter table practices add column sandbox_mode boolean default false;
alter table practices add column sandbox_seeded_at timestamptz;
```

## Client-side activation

1. `usePractices()` fetches practice with `practices(*)` — includes `sandbox_mode`
2. Practice is stored in `usePracticeStore` (persisted to localStorage)
3. `SandboxWrapper` (`src/app/(dashboard)/sandbox-wrapper.tsx`) checks `practice.sandbox_mode`
4. If `true`, wraps the dashboard in `<SandboxProvider>` which activates:
   - Sandbox banner (top of page)
   - In-memory Zustand store intercepts all TanStack Query hooks
   - Simulation engine available
   - Activity feed (bottom-right)
   - Guided tour (bottom-left)

## Exiting sandbox

1. User clicks "Connect real PMS" in the sandbox banner
2. Confirmation dialog explains demo data will be cleared
3. On confirm, navigates to `/settings/integrations`
4. `clearSandboxData()` (`src/lib/sandbox/seedSandboxData.ts`) deletes all seeded records and sets `sandbox_mode = false`

## Key files

| File | Purpose |
|------|---------|
| `src/app/api/auth/signup/route.ts` | Signup route — seeds sandbox after practice creation |
| `src/lib/sandbox/seedSandboxData.ts` | Server-side seed, flag, and clear functions |
| `src/app/(dashboard)/sandbox-wrapper.tsx` | Reads `sandbox_mode` and wraps in SandboxProvider |
| `src/lib/sandbox/index.ts` | SandboxProvider + useSandbox hook |
| `src/stores/sandbox-store.ts` | In-memory Zustand store for client-side sandbox data |
| `supabase/migrations/00002_add_sandbox_mode.sql` | DB migration |

## Testing without Supabase

Use `/demo` instead — it bypasses auth entirely, sets a fake practice in the store via `DemoSessionProvider`, and runs the sandbox purely client-side with in-memory data.
