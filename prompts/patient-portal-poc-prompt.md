# Claude Code Prompt — Patient Portal POC + Sandbox Integration
## Followdent | Treatment Plan Follow-Up AI

---

## CONTEXT & ROLE

You are acting as **Senior Full-Stack Engineer** on the Followdent codebase. Read the reference document `hipaa-patient-portal-reference.md` in full before writing any code.

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
- Token generated and stored in Zustand sandbox store (`sandboxStore.portalTokens`)
- `/portal/[token]` reads from sandbox store when token starts with `sandbox-token-`
- Sandbox patient + plan data renders in the portal UI
- A "Simulate patient click" button on the dashboard opens the portal in a new tab

**Mode B — Production (future):**
- Real token generated via Edge Function → SHA-256 hashed → stored in `portal_tokens` table
- `/portal/[token]` validates against Supabase → marks used → renders real patient + plan data
- Full HIPAA compliance path (requires BAA + HIPAA Supabase plan)

Use the `isSandboxId()` utility (already in the codebase) as the routing mechanism. If the token starts with `sandbox-token-`, use the sandbox store. Otherwise, use the real Supabase path.

---

## IMPLEMENTATION INSTRUCTIONS

Complete in this exact order. Do not skip ahead.

---

### STEP 1 — Database migration

Create `supabase/migrations/[timestamp]_portal_tokens.sql`:

```sql
create table portal_tokens (
  id uuid primary key default uuid_generate_v4(),
  token_hash text unique not null,
  patient_id uuid references patients(id) on delete cascade not null,
  treatment_plan_id uuid references treatment_plans(id) on delete cascade,
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

---

### STEP 2 — Token generation Edge Function

Create `supabase/functions/generate-portal-token/index.ts`.

Implement `generatePortalToken(patientId, treatmentPlanId, practiceId)`:
- Generate raw token: `crypto.randomUUID() + '-' + Date.now()`
- SHA-256 hash it using `crypto.subtle.digest`
- Invalidate any existing unused tokens for this patient+plan
- Insert `{ token_hash, patient_id, treatment_plan_id, practice_id, expires_at }` into `portal_tokens`
- Return the raw token (not the hash)

Expiry: 72 hours from creation.

---

### STEP 3 — Sandbox store extension

Extend `src/lib/sandbox/sandboxData.ts` and the Zustand sandbox store to support portal tokens:

```typescript
// Add to SandboxStore interface
portalTokens: SandboxPortalToken[]
addPortalToken: (token: SandboxPortalToken) => void
getPortalToken: (rawToken: string) => SandboxPortalToken | null
markPortalTokenUsed: (rawToken: string) => void

// Type
interface SandboxPortalToken {
  rawToken: string          // prefixed with 'sandbox-token-'
  patientId: string
  treatmentPlanId: string
  practiceId: string
  expiresAt: number         // Date.now() + 72hr in ms
  usedAt: number | null
}
```

Add a sandbox-aware token generator to `sandboxMutations.ts`:

```typescript
export async function generateSandboxPortalToken(
  patientId: string,
  treatmentPlanId: string
): Promise<string> {
  await simulateDelay(400)
  const rawToken = `sandbox-token-${patientId}-${Date.now()}`
  sandboxStore.addPortalToken({
    rawToken,
    patientId,
    treatmentPlanId,
    practiceId: SANDBOX_PRACTICE.id,
    expiresAt: Date.now() + 72 * 60 * 60 * 1000,
    usedAt: null,
  })
  return rawToken
}
```

---

### STEP 4 — Portal page route

Create `src/app/portal/[token]/page.tsx` as a **server component**.

Logic:
1. If token starts with `sandbox-token-` → read from a temporary server-side sandbox token store (use cookies or a module-level Map for the POC — this is dev-only). In the POC, you can make sandbox portal pages readable without marking used, so demo users can visit the link multiple times.
2. If token is a real token → hash it → query `portal_tokens` table → validate expiry + used_at → mark used → fetch patient + plan with joins.
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
- No Followdent branding visible to the patient — only the practice name
- Light mode only (patients may be on any device — don't force dark mode)
- Typography: use `Lora` (serif) for the procedure description block — this is patient-facing copy
- Color: use the amber accent only for the primary CTA button

**Sections:**

1. **Practice header** — practice name centered, small subtitle: "Treatment plan follow-up"

2. **Greeting card** — "Hi [first_name], your treatment plan is ready to schedule"

3. **Procedure block** — gray card showing `procedure_description`. Do not show `estimated_value` — price creates anxiety and is not required in the HIPAA minimum-necessary standard.

4. **Primary CTA** — "Yes, I'd like to schedule this" → amber button, full width. On click:
    - POST to `/api/portal/request-booking` with `{ planId }`
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
- No Followdent logo or product mention

Create `src/app/portal/already-used/page.tsx`:
- Message: "You've already viewed this treatment plan"
- Subtext: "If you'd like to schedule your appointment, call the office or reply to any of our messages."

---

### STEP 7 — Booking API route

Create `src/app/api/portal/request-booking/route.ts`:

```typescript
// POST { planId: string }
// 1. Look up treatment plan by planId
// 2. Update treatment_plan status to 'booked' (or a new 'booking_requested' status)
// 3. Insert a touchpoint row: direction='inbound', status='replied', channel='sms', 
//    message_body='Patient requested booking via portal'
// 4. TODO (future): Send notification email to practice via Resend
// 5. Return { success: true }

// Sandbox path: if planId starts with 'sandbox-', update sandboxStore instead
// Use the sandbox guard pattern already in the codebase
```

---

### STEP 8 — Dashboard integration (sandbox only)

On the treatment plan card component (`src/components/features/patients/TreatmentPlanCard.tsx` or equivalent), add a **"Simulate patient view →"** button that:

1. Is only visible when `isSandbox === true`
2. On click → calls `generateSandboxPortalToken(patientId, planId)` → opens `/portal/[token]` in a new tab
3. Button style: small, ghost variant, text "Simulate patient view →" with an external link icon
4. Shown inline with the existing plan action buttons

This is the **primary demo trigger** — a prospect watching a demo can click this button on any treatment plan card to see exactly what their patient would experience.

---

### STEP 9 — SandboxActivityFeed integration

When `generateSandboxPortalToken` is called (Step 8), emit a simulation event to the activity feed:

```typescript
sandboxStore.addActivity({
  type: 'PORTAL_LINK_OPENED',
  icon: '🔗',
  message: `Portal link generated for ${patient.first_name} ${patient.last_name} — ${plan.procedure_description}`,
  timestamp: Date.now(),
  color: 'blue',
})
```

When the patient "books" (POSTs to `/api/portal/request-booking`), also emit a `PLAN_BOOKED` simulation event — so the revenue counter in the dashboard updates, the green toast fires, and the analytics chart animates. This completes the end-to-end demo loop.

---

## QUALITY BAR

Before considering this complete, verify:

- [ ] `/portal/[token]` renders correctly in sandbox mode without any Supabase auth
- [ ] `/portal/[token]` renders correctly with sandbox patient + plan data (name, procedure)
- [ ] Expired and already-used error pages render without crashing
- [ ] "Simulate patient view →" button appears on treatment plan cards in sandbox mode only
- [ ] Clicking the button opens a new tab with the portal pre-populated with correct patient data
- [ ] Tapping "Yes, I'd like to schedule this" → triggers `PLAN_BOOKED` event → revenue counter animates → green toast fires
- [ ] Portal page is mobile-responsive at 390px width
- [ ] No Followdent product branding visible on the portal page (practice-branded only)
- [ ] `estimated_value` is NOT shown on the portal (price creates patient anxiety)
- [ ] Production token path (real Supabase) compiles and type-checks even if not yet functional
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] Sandbox guard: no real Supabase writes triggered from sandbox portal actions

---

## FILES TO CREATE

```
supabase/
  migrations/
    [timestamp]_portal_tokens.sql
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
src/lib/sandbox/sandboxData.ts          ← Add SandboxPortalToken type + initial empty array
src/lib/sandbox/index.ts                ← Add portalTokens to SandboxStore interface
src/lib/sandbox/sandboxMutations.ts     ← Add generateSandboxPortalToken()
src/components/features/patients/
  TreatmentPlanCard.tsx (or equivalent) ← Add "Simulate patient view →" button
```

---

## REFERENCE FILES

Read these before writing any code:

- `hipaa-patient-portal-reference.md` — full architecture, HIPAA checklist, token flow
- `src/lib/sandbox/index.ts` — existing SandboxProvider + useSandbox hook
- `src/lib/sandbox/sandboxData.ts` — existing seed data patterns
- `src/lib/sandbox/sandboxMutations.ts` — existing mutation patterns + simulateDelay usage
- `src/lib/sandbox/simulationEngine.ts` — how PLAN_BOOKED events are emitted

---

## NOTES FOR THE DEMO SCRIPT

After this is built, the sandbox demo flow is:

1. Prospect opens the demo → sees Riverside Family Dental dashboard
2. Navigates to Patients → clicks Maria Castellano
3. Sees her crown treatment plan card → clicks "Simulate patient view →"
4. New tab opens with the patient portal, showing: "Hi Maria, your treatment plan is ready to schedule" + the procedure description
5. Prospect clicks "Yes, I'd like to schedule this"
6. Portal shows booking confirmation
7. Back on the dashboard tab: green toast fires ("Maria Castellano just booked her crown appointment 🎉"), revenue counter animates up by $1,450

This is the **money moment** of the demo. Every implementation decision should optimize for making this sequence feel fast, realistic, and impressive.