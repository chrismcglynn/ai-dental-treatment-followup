# Claude Code Prompt — Sandbox / Demo Environment
## Treatment Plan Follow-Up AI (FollowDent / working name)

---

## OBJECTIVE

Implement a fully self-contained **sandbox demo environment** that allows a prospective dental practice customer (or an investor) to experience the product as if it were a live, connected practice — with no real Supabase data, no real Twilio messages, no real PMS integration. The sandbox must feel indistinguishable from production at the UI level.

The sandbox serves two purposes:
1. **Sales demos** — practice managers can try the product before buying without touching real patient data
2. **Self-serve trial** — prospects sign up, land in sandbox mode automatically, and experience the full workflow in under 10 minutes

---

## ARCHITECTURE OVERVIEW

The sandbox works via a **Sandbox Context Provider** that intercepts all data fetching and mutations, returning realistic fake data instead of hitting Supabase. When `SANDBOX_MODE=true`, every TanStack Query hook resolves from the mock data layer instead of the real API layer. Real auth still works — the user signs in normally, but their practice is flagged as a sandbox tenant.

```
src/
  lib/
    sandbox/
      index.ts              ← SandboxProvider + useSandbox hook
      sandboxData.ts        ← All seed data (patients, plans, sequences, touchpoints)
      sandboxMutations.ts   ← Fake mutation handlers with realistic delays + state updates
      sandboxRouter.ts      ← Intercepts TanStack Query calls in sandbox mode
      simulationEngine.ts   ← Background simulation: sequences "running", replies coming in
  app/
    (dashboard)/
      sandbox-banner.tsx    ← Persistent top banner indicating sandbox mode
    demo/
      page.tsx              ← Public demo landing page (no auth required)
```

---

## PART 1 — SANDBOX DATA LAYER

### 1.1 — Seed data (`sandboxData.ts`)

Create a realistic dataset representing **"Riverside Family Dental"** — a 2-doctor general practice in Denver, CO. All data should feel authentic, not placeholder-like.

**Practice:**
```ts
export const SANDBOX_PRACTICE = {
  id: 'sandbox-practice-001',
  name: 'Riverside Family Dental',
  slug: 'riverside-family-dental',
  pms_type: 'open_dental',
  phone: '(720) 555-0142',
  email: 'front@riversidefamilydental.com',
  timezone: 'America/Denver',
  subscription_status: 'trial',
  trial_ends_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
}
```

**Patients (20 total)** — mix of demographics, contact preferences, and plan statuses. Create these as fully typed `Patient[]`. Use realistic Colorado names. Include:
- 8 patients with active treatment plans in sequence
- 4 patients with pending plans (detected, not yet in sequence)
- 3 patients who have booked after a sequence (success stories)
- 3 patients with no active plans
- 2 patients marked do-not-contact

Example patients to include:
```ts
{ first_name: 'Maria', last_name: 'Castellano', phone: '(720) 555-0198', email: 'maria.castellano@email.com', preferred_contact: 'sms' },
{ first_name: 'James', last_name: 'Whitfield', phone: '(303) 555-0271', email: 'j.whitfield@gmail.com', preferred_contact: 'email' },
{ first_name: 'Priya', last_name: 'Nair', phone: '(720) 555-0334', email: 'priya.n@outlook.com', preferred_contact: 'sms' },
{ first_name: 'David', last_name: 'Kowalski', phone: '(303) 555-0419', email: 'dkowalski@yahoo.com', preferred_contact: 'sms' },
{ first_name: 'Sarah', last_name: 'Okonkwo', phone: '(720) 555-0587', email: 'sokonkwo@email.com', preferred_contact: 'email' },
// ... 15 more
```

**Treatment Plans (15 total)** — realistic dental procedures with estimated values:
```ts
const PROCEDURE_TYPES = [
  { description: 'Crown — upper left molar (#14)', codes: ['D2740'], value: 1450 },
  { description: 'Root canal — lower right premolar (#28)', codes: ['D3330'], value: 1200 },
  { description: 'Two-surface composite — #19 mesial-occlusal', codes: ['D2392'], value: 285 },
  { description: 'Implant placement and crown — lower left (#19)', codes: ['D6010', 'D6065'], value: 3800 },
  { description: 'Full upper arch deep cleaning (SRP)', codes: ['D4341'], value: 480 },
  { description: 'Three-unit bridge — #28–30', codes: ['D6240', 'D6245'], value: 3200 },
  { description: 'Composite veneer — upper front four (#7–10)', codes: ['D2960'], value: 2400 },
  { description: 'Extraction and socket preservation — #17', codes: ['D7210', 'D7953'], value: 650 },
]
```

**Sequences (3 pre-built):**
```ts
export const SANDBOX_SEQUENCES = [
  {
    id: 'seq-001',
    name: 'Standard Crown & Restorative',
    description: 'For crown, bridge, and multi-surface composite plans',
    procedure_filter: ['D2740', 'D2392', 'D6240'],
    is_active: true,
    steps: [
      { step_number: 1, day_offset: 3, channel: 'sms', tone: 'friendly', template_override: null },
      { step_number: 2, day_offset: 10, channel: 'email', tone: 'clinical', template_override: null },
      { step_number: 3, day_offset: 21, channel: 'voicemail', tone: 'friendly', template_override: null },
    ],
  },
  {
    id: 'seq-002',
    name: 'High-Value Implant & Prosthetic',
    description: 'For implant, full arch, and cosmetic cases over $2,000',
    procedure_filter: ['D6010', 'D6065', 'D2960'],
    is_active: true,
    steps: [
      { step_number: 1, day_offset: 2, channel: 'sms', tone: 'friendly', template_override: null },
      { step_number: 2, day_offset: 7, channel: 'email', tone: 'clinical', template_override: null },
      { step_number: 3, day_offset: 14, channel: 'sms', tone: 'urgent', template_override: null },
      { step_number: 4, day_offset: 30, channel: 'voicemail', tone: 'friendly', template_override: null },
    ],
  },
  {
    id: 'seq-003',
    name: 'Perio & Preventive Follow-Up',
    description: 'For SRP, extraction, and hygiene treatment plans',
    procedure_filter: ['D4341', 'D7210', 'D7953'],
    is_active: true,
    steps: [
      { step_number: 1, day_offset: 5, channel: 'sms', tone: 'friendly', template_override: null },
      { step_number: 2, day_offset: 15, channel: 'email', tone: 'clinical', template_override: null },
    ],
  },
]
```

**Touchpoints (40+ entries)** — a realistic history of sent messages, deliveries, and replies. Include:
- Outbound SMS/email/voicemail in various states (sent, delivered, failed)
- 4–5 inbound SMS replies from patients (mix of "yes I'd like to book", "not ready yet", "please stop texting me")
- Timeline spanning the last 45 days

For inbound replies, use realistic dental patient language:
```ts
const INBOUND_REPLIES = [
  { patient: 'Maria Castellano', body: 'Hi yes I would like to schedule that crown, what times do you have?', replied_at: daysAgo(2) },
  { patient: 'James Whitfield', body: 'Can you call me instead? I prefer to talk on the phone.', replied_at: daysAgo(5) },
  { patient: 'Priya Nair', body: 'Yes! Book me in please 🙂', replied_at: daysAgo(1) },
  { patient: 'David Kowalski', body: 'Not right now, maybe next month', replied_at: daysAgo(8) },
  { patient: 'Sarah Okonkwo', body: 'I already scheduled this with you guys last week', replied_at: daysAgo(3) },
]
```

**Analytics seed data** — pre-compute 90 days of daily stats for charts:
```ts
export const SANDBOX_ANALYTICS = {
  daily_revenue_recovered: generateDailyRevenue(90),  // realistic ramp-up curve
  channel_breakdown: { sms: 58, email: 29, voicemail: 13 },  // percentages
  conversion_by_sequence: [
    { sequence_name: 'Standard Crown & Restorative', sent: 24, booked: 9, rate: 0.375 },
    { sequence_name: 'High-Value Implant & Prosthetic', sent: 11, booked: 5, rate: 0.454 },
    { sequence_name: 'Perio & Preventive Follow-Up', sent: 18, booked: 4, rate: 0.222 },
  ],
  funnel: { detected: 53, in_sequence: 38, replied: 19, booked: 14 },
  total_recovered: 28450,
  avg_days_to_book: 11.3,
}
```

The `generateDailyRevenue(days)` helper should produce a realistic S-curve — slow start, acceleration in the middle, plateau near the end — with small random daily variation. This makes the chart look like a real practice that's been using the product and seeing real growth.

### 1.2 — Sandbox mutation handlers (`sandboxMutations.ts`)

Every mutation that would normally hit Supabase instead updates an in-memory Zustand store. Mutations must:
- Return after a realistic delay (400–1200ms) to feel like a real API call
- Update the in-memory state so the UI re-renders correctly
- Log actions to a sandbox activity feed (used in the simulation engine)

Key mutations to mock:
```ts
export const sandboxMutations = {
  startSequence: async (treatmentPlanId: string) => { ... },    // moves plan to 'in_sequence'
  archivePlan: async (planId: string) => { ... },
  toggleSequenceActive: async (sequenceId: string) => { ... },
  markPatientDNC: async (patientId: string) => { ... },
  sendReply: async (touchpointId: string, body: string) => { ... },
  updateSequence: async (sequenceId: string, data: Partial<Sequence>) => { ... },
}
```

---

## PART 2 — SANDBOX CONTEXT & INTERCEPTOR

### 2.1 — SandboxProvider (`sandbox/index.ts`)

```ts
interface SandboxState {
  isSandbox: boolean
  sandboxStore: SandboxStore    // in-memory Zustand store
  simulationActive: boolean
  simulationSpeed: 'normal' | 'fast' | '10x'  // for demo purposes
  activityFeed: SandboxActivity[]
  setSimulationSpeed: (speed: SandboxState['simulationSpeed']) => void
}
```

Expose via `useSandbox()` hook. The sandbox store is a Zustand store initialized from `sandboxData.ts` and updated by mutations.

### 2.2 — Query interceptor (`sandboxRouter.ts`)

Wrap TanStack Query's `queryFn` calls at the hook level. In each hook file (`usePatients`, `useSequences`, etc.), check `useSandbox().isSandbox` at the top:

```ts
// Pattern for every TanStack Query hook
export function usePatients(filters?: PatientFilters) {
  const { isSandbox, sandboxStore } = useSandbox()
  const { activePracticeId } = usePracticeStore()

  return useQuery({
    queryKey: patientKeys.list(activePracticeId!, filters),
    queryFn: async () => {
      if (isSandbox) {
        await simulateDelay(300)
        return sandboxStore.getPatients(filters)
      }
      return fetchPatients(activePracticeId!, filters)
    },
    enabled: !!activePracticeId,
  })
}
```

Apply this same pattern to ALL hooks: `useSequences`, `useTouchpoints`, `useAnalytics`, `usePractice`, `useInbox`.

---

## PART 3 — SIMULATION ENGINE

This is what makes the sandbox feel alive. A background engine that simulates the product "working" in real time during a demo.

### 3.1 — `simulationEngine.ts`

The engine fires events on a configurable interval. At `normal` speed, events happen every 30–60 seconds. At `fast` (demo mode), every 8–15 seconds. At `10x`, every 2–4 seconds.

**Simulation events (weighted random selection):**
```ts
type SimulationEvent =
  | 'NEW_PLAN_DETECTED'        // a new treatment plan appears in Pending
  | 'SEQUENCE_STEP_SENT'       // an SMS/email/voicemail is dispatched for an active plan
  | 'MESSAGE_DELIVERED'        // a sent message gets delivery confirmation
  | 'PATIENT_REPLIED'          // an inbound SMS reply arrives in the inbox
  | 'PLAN_BOOKED'              // a patient books after receiving a follow-up (the money event)
  | 'SEQUENCE_ADVANCED'        // a plan moves to the next step in its sequence
```

Each event updates the sandbox Zustand store, which triggers TanStack Query cache invalidation, which updates the UI — so the dashboard stats, inbox, and activity feed all update in real time without any user action.

**The `PLAN_BOOKED` event is the most important.** When it fires:
1. A treatment plan's status changes from `in_sequence` to `booked`
2. The "Revenue Recovered" stat card animates upward
3. A green toast notification appears: "Maria Castellano just booked her crown appointment 🎉"
4. The analytics chart updates with the new recovered amount

Implement with a `useSimulationEngine` hook that starts/stops based on `simulationActive`:
```ts
export function useSimulationEngine() {
  const { isSandbox, simulationActive, simulationSpeed, sandboxStore } = useSandbox()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSandbox || !simulationActive) return

    const interval = getIntervalForSpeed(simulationSpeed)
    const timer = setInterval(() => {
      const event = pickWeightedEvent()
      const result = sandboxStore.applyEvent(event)
      // Invalidate relevant query keys based on event type
      invalidateForEvent(queryClient, event, result)
    }, interval)

    return () => clearInterval(timer)
  }, [isSandbox, simulationActive, simulationSpeed])
}
```

---

## PART 4 — SANDBOX UI COMPONENTS

### 4.1 — Sandbox banner (`sandbox-banner.tsx`)

A persistent amber banner at the very top of the dashboard (above the sidebar and topnav, full width):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🧪  Sandbox Mode — This is demo data. No real messages are being sent.         │
│  [▶ Start simulation]  [Speed: Normal ▾]  [Reset sandbox]  [Exit sandbox]       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Design: amber background (`--color-background-warning`), dark amber text. The banner should NOT be dismissible — it must always be visible in sandbox mode so users never confuse demo data with real patient data.

Controls on the banner:
- **Start/Stop simulation** toggle button — starts/stops the simulation engine
- **Speed selector** — dropdown: Normal (30s) / Fast (10s) / 10x (3s)
- **Reset sandbox** — resets all in-memory state back to initial seed data, invalidates all queries
- **Connect real PMS** button (CTA) — links to `/settings/integrations` with a tooltip: "Ready to connect your real practice? Your sequences and settings will carry over."

### 4.2 — Sandbox activity feed (`SandboxActivityFeed.tsx`)

A floating panel (bottom-right corner, collapsible) that shows a real-time log of simulation events as they fire. Like a Vercel deployment log, but for patient activity:

```
📩  SMS sent to Maria Castellano — Crown sequence Day 3       2s ago
✅  Delivered to James Whitfield — Implant sequence Day 7    15s ago
💬  New reply from Priya Nair: "Yes! Book me in please 🙂"  28s ago
🎉  David Kowalski booked crown appointment ($1,450)         45s ago
```

Each entry has a colored left border (blue = SMS, purple = email, amber = voicemail, green = booked, coral = reply).

This panel makes the sandbox feel like a live system and creates urgency/excitement during a demo.

### 4.3 — Sandbox toast notifications

When a `PLAN_BOOKED` simulation event fires, show a rich toast:

```
┌────────────────────────────────────────┐
│  🎉  Treatment plan booked!            │
│  Maria Castellano scheduled her crown  │
│  appointment — $1,450 recovered        │
└────────────────────────────────────────┘
```

Use the existing `uiStore.addToast()` with a custom `'success-revenue'` variant — green left border, slightly larger than normal toasts, auto-dismisses after 6 seconds.

---

## PART 5 — PUBLIC DEMO PAGE

### 5.1 — `/demo` page (no auth required)

A public-facing page that lets anyone start a sandbox demo without creating an account. This is for cold traffic from ads, dental conference QR codes, or email campaigns.

**Layout:**

Top section (above the fold):
- Headline: **"See exactly how FollowDent recovers unscheduled treatment revenue"**
- Subhead: "Watch a live demo of a real dental practice's follow-up sequences — no signup required"
- Two buttons: **"Start interactive demo →"** (primary) and **"Watch 2-min video"** (secondary, opens a modal — placeholder for now)

Below the fold — an embedded preview of the actual dashboard:
- Render the full `(dashboard)/layout.tsx` shell but pre-populated with sandbox data, no auth wall
- The sandbox banner is visible at the top
- Simulation starts automatically at `fast` speed after a 3-second delay
- The activity feed is open by default (not collapsed)

Implementation: create a `DemoSessionProvider` that wraps the demo page and provides a fake auth context + the sandbox context without requiring Supabase auth. This is purely client-side.

```tsx
// app/demo/page.tsx
export default function DemoPage() {
  return (
    <DemoSessionProvider>
      <SandboxProvider initialSpeed="fast" autoStart={true}>
        <DashboardShell>
          <DashboardPage />
        </DashboardShell>
      </SandboxProvider>
    </DemoSessionProvider>
  )
}
```

### 5.2 — Demo page SEO + OG

Add metadata to `/demo`:
```ts
export const metadata = {
  title: 'Live Demo — FollowDent | AI Treatment Plan Follow-Up',
  description: 'See how FollowDent automatically follows up with patients who have unscheduled treatment plans. Interactive demo — no signup required.',
  openGraph: {
    title: 'See FollowDent in action',
    description: 'Watch AI-powered treatment plan follow-up recover revenue for a real dental practice.',
    // Use a screenshot of the dashboard as the OG image
  },
}
```

---

## PART 6 — SANDBOX-AWARE ONBOARDING FLOW

### 6.1 — Trial signup → auto-sandbox

When a new user signs up (not via the `/demo` page but via normal `/signup`), after creating their practice, **automatically seed their account with sandbox data** before redirecting to onboarding.

In the signup Edge Function / API route, after practice creation:
```ts
// After creating the practice record:
if (isNewPractice) {
  await seedSandboxData(practice.id)  // inserts seed patients, plans, sequences into Supabase
  await flagPracticeAsSandbox(practice.id)  // sets a sandbox_mode boolean on the practice
}
```

This means new users see a pre-populated, realistic dashboard immediately — not an empty state. This is the "instant gratification" pattern that improves trial-to-paid conversion.

Add a `sandbox_mode` boolean column to the `practices` table:
```sql
alter table practices add column sandbox_mode boolean default false;
alter table practices add column sandbox_seeded_at timestamptz;
```

### 6.2 — Sandbox exit flow

When a user is ready to connect their real PMS and go live:

1. Click "Connect real PMS" in the sandbox banner
2. Modal appears: **"Ready to go live?"**
    - "Your 3 sequences are configured and ready to use with real patients"
    - "When you connect your PMS, we'll clear the demo data and start syncing real treatment plans"
    - [Cancel] [Connect my PMS →]
3. On confirm → navigate to `/settings/integrations`, set `sandbox_mode = false`, delete seeded data, trigger first PMS sync

---

## PART 7 — SANDBOX RESET & PERSISTENCE

### 7.1 — Reset function

The "Reset sandbox" button must:
1. Clear the Zustand sandbox store
2. Re-initialize it from `sandboxData.ts` seed data
3. Call `queryClient.resetQueries()` to force all queries to refetch from the reset store
4. Show a brief loading state (500ms)
5. Show a toast: "Sandbox reset — all demo data restored"

### 7.2 — Session persistence

Sandbox state should persist across browser refreshes during a demo session (embarrassing for the simulation to reset mid-demo). Use `sessionStorage` (not `localStorage`) to persist the sandbox Zustand store. Clear on tab close.

```ts
// In sandboxStore.ts, use zustand/middleware persist with sessionStorage
import { persist, createJSONStorage } from 'zustand/middleware'

const useSandboxStore = create(
  persist(
    (set, get) => ({ ...initialSandboxState }),
    {
      name: 'followdent-sandbox',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
```

---

## PART 8 — SANDBOX GUARD & SAFETY RAILS

These protect against sandbox data accidentally mixing with real operations.

### 8.1 — Mutation guard

In every real mutation function (before hitting Supabase), add a sandbox check:
```ts
// In src/lib/api/patients.ts
export async function updatePatient(id: string, data: Partial<Patient>) {
  if (isSandboxId(id)) {
    throw new Error('SANDBOX_MUTATION_BLOCKED: Cannot mutate sandbox data via real API')
  }
  // ... real Supabase call
}
```

`isSandboxId()` checks if the ID starts with `'sandbox-'` — all seeded sandbox records use this prefix.

### 8.2 — Twilio guard

In the Twilio SMS send function:
```ts
export async function sendSMS(to: string, body: string, practiceId: string) {
  const practice = await getPractice(practiceId)
  if (practice.sandbox_mode) {
    console.log(`[SANDBOX] Would have sent SMS to ${to}: "${body}"`)
    return { sid: `sandbox-sms-${Date.now()}`, status: 'sandbox_sent' }
  }
  // ... real Twilio call
}
```

Same pattern for Resend (email) and Twilio voicemail. No real messages ever leave the system in sandbox mode.

### 8.3 — Visual indicator on patient cards

In sandbox mode, every patient card and patient detail page shows a subtle `DEMO` badge in the top-right corner of the card. Small, gray, unobtrusive — but clearly marks the data as fake.

---

## PART 9 — DEMO SCRIPT HELPER (NICE TO HAVE)

A collapsible guided tour panel that appears on first load of the sandbox. Shows a 5-step checklist of things to try:

```
Welcome to Riverside Family Dental's sandbox! Here's what to explore:

☐ 1. Check the Dashboard — see $28,450 in recovered revenue this quarter
☐ 2. Open the Inbox — reply to Maria Castellano's message
☐ 3. View Patients → find a Pending plan and start a sequence
☐ 4. Open Sequences → preview an AI-generated follow-up message
☐ 5. Watch the simulation — click "Start simulation" and watch revenue tick up

[Start the tour] [Skip]
```

Each checklist item, when clicked, navigates the user to that section of the app. Check items off automatically when the user visits that route. Persist completion state in `sessionStorage`.

---

## IMPLEMENTATION ORDER

Complete in this sequence:

1. `sandboxData.ts` — all seed data typed and exported
2. `useSandboxStore` Zustand store with sessionStorage persistence
3. `SandboxProvider` + `useSandbox()` hook
4. Query interceptor pattern — update all 6 hooks to check `isSandbox`
5. `sandboxMutations.ts` — all fake mutations with delays
6. `simulationEngine.ts` + `useSimulationEngine` hook
7. `SandboxBanner` component
8. `SandboxActivityFeed` component + revenue toast variant
9. Signup flow → auto-seeding + `sandbox_mode` DB column
10. `/demo` public page with `DemoSessionProvider`
11. Sandbox reset function + session persistence
12. Safety rails (mutation guard, Twilio guard, DEMO badges)
13. Demo script helper / guided tour (nice to have, do last)

---

## QUALITY BAR

Before considering this complete, verify:

- [ ] Dashboard loads in sandbox mode in < 1.5 seconds (all data is in-memory)
- [ ] Simulation fires events and updates UI without any page refresh
- [ ] Revenue stat card animates upward when a `PLAN_BOOKED` event fires
- [ ] Inbox shows unread inbound replies from seed data on a first load
- [ ] `/demo` page is accessible without auth and shows full dashboard
- [ ] "Reset sandbox" returns all data to exact initial state
- [ ] No real Twilio/Resend/Supabase calls are made from any sandbox action
- [ ] DEMO badges visible on patient cards in sandbox mode
- [ ] Sandbox banner is visible on every dashboard route
- [ ] Session persists across browser refresh (via sessionStorage)
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)