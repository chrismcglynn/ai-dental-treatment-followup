# Claude Code Prompt — Patient Portal POC + Sandbox Integration
## FollowDent | Treatment Plan Follow-Up AI

---

## CONTEXT & ROLE

You are acting as **Senior Full-Stack Engineer** on the FollowDent codebase. Read the reference document `hipaa-patient-portal-reference.md` in full before writing any code.

The goal of this session is to:
1. Build a **proof-of-concepts (POC) patient portal** — the secure page a patient lands on after clicking a treatment plan follow-up link
2. Wire the portal into the **existing sandbox demo environment** so it works end-to-end during a demo without real Supabase auth, Twilio, or PHI

The sandbox environment already exists (see `src/lib/sandbox/`). The portal POC must be demoed from within sandbox mode — a simulated "patient click" should open a working portal page populated with sandbox patient and treatment plan data.

---

## SCOPE — What to build this session

### In scope (build now):
- `portal_tokens` table migration
- `generatePortalToken` Edge Function
- `/portal/[token]` server route with full token validation
- `TreatmentPlanView` client component
- `/portal/expired` and `/portal/already-used` error pages
- `/api/portal/request-booking` API route
- Sandbox mock for portal token generation and portal page rendering
- "View patient portal →" button on treatment plan cards in the dashboard (sandbox only, opens a simulated portal link)
- `SandboxPortalPreview` component that simulates what the patient sees

### Out of scope (production wiring, do later):
- Real Twilio SMS delivery with portal URLs
- Real BAA setup or Supabase HIPAA project configuration
- Real email delivery via Resend
- Production token generation in the sequence send pipeline
- `/api/portal/resend-link` route

---

## ARCHITECTURE DECISION

The portal POC must work in **two modes**:

**Mode A — Sandbox (for demo):**
- No real Supabase calls
- Token generated and stored in Zustand sandbox store (`useSandboxStore` in `src/stores/sandbox-store.ts`, persisted to sessionStorage)
- `/portal/[token]` detects sandbox tokens by `sandbox-token-` prefix → reads patient/treatment data from URL search params (since the Zustand store is client-side only and not accessible in server components)
- Sandbox patient + plan data renders in the portal UI
- A "Simulate patient view →" button on treatment plan cards opens the portal in a new tab

**Mode B — Production (future):**
- Real token generated via Edge Function → SHA-256 hashed → stored in `portal_tokens` table
- `/portal/[token]` uses `createServerSupabaseClient()` → validates against Supabase → marks used → renders real patient + plan data
- Full HIPAA compliance path (requires BAA + HIPAA Supabase plan)

Use the `sandbox-token-` prefix as the routing mechanism in the portal page. Use `isSandboxId()` from `@/lib/sandbox/sandboxData` for sandbox detection in API routes and components.

---

## IMPLEMENTATION INSTRUCTIONS

Complete in this exact order. Do not skip ahead.

---

### STEP 1 — Database migration

Create `supabase/migrations/00003_portal_tokens.sql`:

> **Convention:** Existing migrations are `00001_initial_schema.sql` and `00002_add_sandbox_mode.sql`. Use sequential zero-padded numbering.

```sql
create table portal_tokens (
  id uuid primary key default uuid_generate_v4(),
  token_hash text unique not null,
  patient_id uuid references patients(id) on delete cascade not null,
  treatment_id uuid references treatments(id) on delete cascade,
  practice_id uuid references practices(id) on delete cascade not null,
  purpose text default 'view_plan'
    check (purpose in ('view_plan', 'book')),
  expires_at timestamptz not null,
  used_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index portal_tokens_hash_idx on portal_tokens(token_hash);
create index portal_tokens_patient_idx on portal_tokens(patient_id);
create index portal_tokens_expires_idx on portal_tokens(expires_at);

alter table portal_tokens enable row level security;

-- Service role only — portal tokens are never read by the browser client
create policy "service_role_only" on portal_tokens
  using (false);
```

> **Note:** The FK is `treatment_id` referencing the `treatments` table (not `treatment_plans` — the codebase uses `treatments`).

---

### STEP 2 — Token generation Edge Function

Create `supabase/functions/generate-portal-token/index.ts`.

Implement `generatePortalToken(patientId, treatmentId, practiceId)`:
- Generate raw token: `crypto.randomUUID() + '-' + Date.now()`
- SHA-256 hash it using `crypto.subtle.digest`
- Invalidate any existing unused tokens for this patient+treatment
- Insert `{ token_hash, patient_id, treatment_id, practice_id, expires_at }` into `portal_tokens`
- Return the raw token (not the hash)

Expiry: 72 hours from creation.

---

### STEP 3 — Sandbox store extension

Extend the Zustand sandbox store at `src/stores/sandbox-store.ts` to support portal tokens. Follow the existing store patterns (state + actions, `set()` for immutable updates, `get()` for reads).

> **Important:** There is no `sandboxMutations.ts` file. All sandbox state and mutations live in `src/stores/sandbox-store.ts`. The sandbox context provider is in `src/lib/sandbox/index.ts`.

```typescript
// Add to SandboxStoreState interface
portalTokens: SandboxPortalToken[]

// Add to SandboxStoreActions interface
addPortalToken: (token: SandboxPortalToken) => void
getPortalToken: (rawToken: string) => SandboxPortalToken | null
markPortalTokenUsed: (rawToken: string) => void

// Add type (in same file, near SandboxActivity)
export interface SandboxPortalToken {
  rawToken: string          // prefixed with 'sandbox-token-'
  patientId: string
  treatmentId: string       // references sandbox treatment ID
  practiceId: string
  expiresAt: number         // Date.now() + 72hr in ms
  usedAt: number | null
}
```

Initialize `portalTokens: []` in `getInitialState()`.

The token generation helper should be called inline from the component that triggers it (the TreatmentPlansList), using the store instance from `useSandbox().sandboxStore`:

```typescript
// Called from component — no separate mutations file needed
function generateSandboxPortalToken(
  store: SandboxStore,
  patientId: string,
  treatmentId: string
): string {
  const rawToken = `sandbox-token-${patientId}-${Date.now()}`
  store.addPortalToken({
    rawToken,
    patientId,
    treatmentId,
    practiceId: 'sandbox-practice-001',
    expiresAt: Date.now() + 72 * 60 * 60 * 1000,
    usedAt: null,
  })
  return rawToken
}
```

---

### STEP 4 — Portal page route

Create `src/app/portal/[token]/page.tsx`.

> **Architecture note:** The Zustand sandbox store is client-side only (sessionStorage). Server components cannot read it. For sandbox tokens, pass patient/treatment data via URL search params when opening the portal from the dashboard. The portal page detects sandbox tokens by the `sandbox-token-` prefix and reads data from search params instead of querying Supabase.

Logic:
1. If token starts with `sandbox-token-` → read patient name, treatment description, and practice info from URL search params (passed when the link is generated in Step 8). Render directly — no Supabase query needed.
2. If token is a real token → use `createServerSupabaseClient()` from `@/lib/supabase/server` → hash it → query `portal_tokens` table with joins on `patients`, `treatments`, and `practices` → validate expiry + used_at → mark used → render.
3. If not found → `notFound()`
4. If expired → `redirect('/portal/expired')`
5. If already used → `redirect('/portal/already-used')`
6. Render `<TreatmentPlanView patient={...} plan={...} />`

**Note for sandbox POC:** The sandbox portal page should NOT mark the token as used — this lets demo users click the link repeatedly during a demo. Add a comment: `// TODO: enforce single-use in production path only`.

---

### STEP 5 — Portal UI

Create `src/components/portal/TreatmentPlanView.tsx`.

**Design requirements:**
- Mobile-first, max-width 420px, centered
- No FollowDent branding visible to the patient — only the practice name
- Light mode only (patients may be on any device — don't force dark mode)
- Typography: use `Lora` (serif) for the procedure description block — this is patient-facing copy
- Color: use the amber accent only for the primary CTA button

**Sections:**

1. **Practice header** — practice name centered, small subtitle: "Treatment plan follow-up"

2. **Greeting card** — "Hi [first_name], your treatment plan is ready to schedule"

3. **Procedure block** — gray card showing `procedure_description`. Do not show `estimated_value` — price creates anxiety and is not required in the HIPAA minimum-necessary standard.

4. **Primary CTA** — "Yes, I'd like to schedule this" → amber button, full width. On click:
    - POST to `/api/portal/request-booking` with `{ treatmentId }`
    - Show loading spinner on button
    - On success → render `<BookingConfirmationScreen />`

5. **Secondary CTA** — "Call us to schedule" → outline button, `tel:` link to practice phone

6. **Footer** — "To stop receiving these reminders, reply STOP to any of our messages." (12px, muted, centered)

**Booking confirmation screen** (shown after primary CTA):
- Large green checkmark icon (Lucide `CheckCircle2`)
- "You're all set!"
- "Riverside Family Dental will be in touch shortly to confirm your appointment time."
- "Questions? Call us at [phone]" with `tel:` link

---

### STEP 6 — Error pages

Create `src/app/portal/expired/page.tsx`:
- Centered card, no practice branding
- Message: "This link has expired"
- Subtext: "Treatment plan links are valid for 72 hours. Text us at [number] to request a new link, or call the office directly."
- No FollowDent logo or product mention

Create `src/app/portal/already-used/page.tsx`:
- Message: "You've already viewed this treatment plan"
- Subtext: "If you'd like to schedule your appointment, call the office or reply to any of our messages."

---

### STEP 7 — Booking API route

Create `src/app/api/portal/request-booking/route.ts`:

```typescript
// POST { treatmentId: string }
// 1. Look up treatment by treatmentId in `treatments` table
// 2. Update treatment status to 'accepted' (matching the existing status enum: pending/accepted/declined/completed)
// 3. Insert a message row: direction='inbound', status='received', channel='sms',
//    body='Patient requested booking via portal'
// 4. TODO (future): Send notification email to practice via Resend
// 5. Return { success: true }

// Sandbox path: if treatmentId starts with 'sandbox-', return success without DB writes.
// The sandbox booking flow is handled client-side — the TreatmentPlanView component
// updates the sandbox store directly via useSandboxStore when isSandboxId(treatmentId).
// Use isSandboxId() from @/lib/sandbox/sandboxData for detection.
```

---

### STEP 8 — Dashboard integration (sandbox only)

On the treatment plan list component (`src/components/shared/TreatmentPlansList/index.tsx`), add a **"Simulate patient view →"** button to each treatment card that:

1. Is only visible when `isSandbox === true` (from `useSandbox()` hook in `@/lib/sandbox`)
2. On click → generates a sandbox token → opens `/portal/[token]?patient=...&treatment=...&practice=...` in a new tab (search params carry the data since the Zustand store isn't accessible from server components)
3. Button style: small, ghost variant, text "Simulate patient view →" with an external link icon (`ExternalLink` from lucide-react)
4. Shown below each treatment card's existing content

> **Note:** The component needs the patient's first name to construct the portal URL. Add an optional `patientFirstName` prop to `TreatmentPlansListProps`. The patient detail page already has the patient object and can pass it down.

This is the **primary demo trigger** — a prospect watching a demo can click this button on any treatment plan card to see exactly what their patient would experience.

---

### STEP 9 — SandboxActivityFeed + Toast integration

When the "Simulate patient view" button is clicked (Step 8), emit an activity feed item using the existing `SandboxActivity` type and `addActivityFeedItem()` method:

```typescript
// Uses the existing SandboxActivity interface from stores/sandbox-store.ts
// Valid types: "sms_sent" | "email_sent" | "voicemail_sent" | "delivered" | "replied" | "booked" | "plan_detected"
sandboxStore.addActivityFeedItem({
  id: `portal-${Date.now()}`,
  type: 'sms_sent',  // closest existing type — portal link sent via SMS
  description: `Portal link generated for ${treatment.description}`,
  patientName: `${patient.first_name} ${patient.last_name}`,
  timestamp: new Date().toISOString(),
})
```

When the patient "books" from the portal, the `TreatmentPlanView` component should (for sandbox tokens only):

1. Update the sandbox store directly: `store.updateTreatment(treatmentId, { status: 'accepted', decided_at: now })`
2. Update dashboard stats: `store.updateDashboardStats({ revenue_recovered: current + amount })`
3. Emit a "booked" activity feed item via `store.addActivityFeedItem()`
4. Fire a success toast via `useUiStore.getState().addToast({ title: "Treatment plan booked!", description: "...", variant: "success" })`

> **Note:** The toast system uses `useUiStore` from `@/stores/ui-store`, not a custom event. The simulation engine's `handlePlanBooked()` in `simulationEngine.ts` shows the exact pattern. Query invalidation uses `useQueryClient().invalidateQueries()` with keys from the hook modules (`patientKeys`, `analyticsKeys`, etc.).

---

## QUALITY BAR

Before considering this complete, verify:

- [ ] `/portal/[token]` renders correctly in sandbox mode without any Supabase auth
- [ ] `/portal/[token]` renders correctly with sandbox patient + plan data (name, procedure)
- [ ] Expired and already-used error pages render without crashing
- [ ] "Simulate patient view →" button appears on treatment plan cards in sandbox mode only
- [ ] Clicking the button opens a new tab with the portal pre-populated with correct patient data
- [ ] Tapping "Yes, I'd like to schedule this" → updates sandbox store (treatment accepted, revenue updated) → `addActivityFeedItem()` with type `"booked"` → `addToast()` fires green success toast
- [ ] Portal page is mobile-responsive at 390px width
- [ ] No FollowDent product branding visible on the portal page (practice-branded only)
- [ ] `estimated_value` is NOT shown on the portal (price creates patient anxiety)
- [ ] Production token path (real Supabase) compiles and type-checks even if not yet functional
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] Sandbox guard: no real Supabase writes triggered from sandbox portal actions

---

## FILES TO CREATE

```
supabase/
  migrations/
    00003_portal_tokens.sql
  functions/
    generate-portal-token/
      index.ts

src/
  app/
    portal/
      [token]/
        page.tsx
      expired/
        page.tsx
      already-used/
        page.tsx
    api/
      portal/
        request-booking/
          route.ts
  components/
    portal/
      TreatmentPlanView.tsx
      BookingConfirmationScreen.tsx
```

---

## FILES TO MODIFY

```
src/stores/sandbox-store.ts                        ← Add SandboxPortalToken type, portalTokens state,
                                                      addPortalToken/getPortalToken/markPortalTokenUsed actions
src/components/shared/TreatmentPlansList/index.tsx  ← Add "Simulate patient view →" button (sandbox only),
                                                      add optional patientFirstName prop
src/app/(dashboard)/patients/[id]/page.tsx          ← Pass patient.first_name to TreatmentPlansList
```

---

## REFERENCE FILES

Read these before writing any code:

- `docs/hipaa-patient-portal-reference.md` — full architecture, HIPAA checklist, token flow
- `src/lib/sandbox/index.ts` — SandboxProvider + useSandbox hook + SandboxContextValue interface
- `src/lib/sandbox/sandboxData.ts` — seed data patterns + isSandboxId() utility + SANDBOX_PRACTICE constant
- `src/lib/sandbox/simulationEngine.ts` — how "booked" events are emitted, toast firing pattern, query invalidation
- `src/stores/sandbox-store.ts` — SandboxStore type, all state/actions, mutation patterns (this is where portal token support goes)
- `src/stores/ui-store.ts` — Toast system: addToast({ title, description, variant })
- `src/lib/supabase/server.ts` — createServerSupabaseClient() for server components
- `src/components/shared/TreatmentPlansList/index.tsx` — existing treatment card component to extend
- `src/app/(dashboard)/patients/[id]/page.tsx` — patient detail page that renders TreatmentPlansList

---

## NOTES FOR THE DEMO SCRIPT

After this is built, the sandbox demo flow is:

1. Prospect opens the demo → sees Riverside Family Dental dashboard
2. Navigates to Patients → clicks Maria Castellano (`sandbox-patient-001`)
3. Sees her crown treatment plan card (D2740 — Crown — upper left molar, `sandbox-treatment-001`, $1,450) → clicks "Simulate patient view →"
4. New tab opens with the patient portal, showing: "Hi Maria, your treatment plan is ready to schedule" + the procedure description
5. Prospect clicks "Yes, I'd like to schedule this"
6. Portal shows booking confirmation with Riverside Family Dental branding
7. Back on the dashboard tab: green toast fires via `addToast()` ("Treatment plan booked! — Maria Castellano — $1,450 recovered"), revenue counter animates up, activity feed shows "booked" event

This is the **money moment** of the demo. Every implementation decision should optimize for making this sequence feel fast, realistic, and impressive.