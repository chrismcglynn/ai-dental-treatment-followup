# Sandbox Data Architecture

Two separate files provide sandbox/demo data at different layers.

## `src/lib/sandbox/sandboxData.ts` — Client-side (in-memory)

- Exports hardcoded constants (`SANDBOX_PRACTICE`, `SANDBOX_PATIENTS`, `SANDBOX_DASHBOARD_STATS`, etc.)
- All IDs use `sandbox-` prefix for safety guards (`isSandboxId()`)
- Used by `useSandbox` hook, simulation engine, and `/demo` page
- No Supabase calls — renders a fully functional UI purely in-memory
- Includes rich display data: conversations, messages, analytics, activity feed, funnel stages

## `src/lib/sandbox/seedSandboxData.ts` — Server-side (DB seeding)

- `seedSandboxData(practiceId)` — inserts real rows into Supabase during signup (`/api/auth/signup/route.ts`)
- `clearSandboxData(practiceId)` — deletes all seeded rows when exiting sandbox mode (`exitSandboxAction`)
- `flagPracticeAsSandbox(practiceId)` — sets `sandbox_mode = true` on the practice
- Creates: patients, treatments, sequences, touchpoints, enrollments
- Records are real DB rows with RLS, so the practice works like any other tenant

## Why both exist

| Concern | `sandboxData.ts` | `seedSandboxData.ts` |
|---|---|---|
| Layer | Client (React state) | Server (Supabase) |
| Auth required | No (demo page) | Yes (post-signup) |
| Data scope | Full UI mock (stats, conversations, messages) | Core entities only (patients, treatments, sequences) |
| ID format | `sandbox-*` hardcoded | Real UUIDs from Supabase |
| Used by | `useSandbox`, simulation engine, demo | Authenticated dashboard, API routes |

The client-side file enables an instant no-auth demo experience. The server-side file seeds real data so authenticated sandbox users get a working dashboard backed by actual DB queries and RLS policies.
