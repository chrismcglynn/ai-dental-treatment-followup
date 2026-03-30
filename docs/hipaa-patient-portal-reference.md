# HIPAA-Compliant Patient Portal — Reference Document
## Followdent | Treatment Plan Follow-Up AI

---

## Overview

The patient portal is a **secure, stateless, single-use view** that patients reach after clicking a link in an SMS or email follow-up. It allows them to view their treatment plan and express intent to book — without ever requiring a login, password, or account.

This is the architectural solution to a core HIPAA constraint: **PHI cannot live in an SMS or email body.** The message contains only an opaque token URL. The portal page, accessed via that token, renders the PHI.

---

## The Core Patient Flow

```
Sequence fires
     ↓
Twilio sends SMS: "Hi Maria, your treatment plan is ready — view it here: https://app.followdent.com/portal/[TOKEN]"
     ↓
Patient clicks link
     ↓
Server hashes incoming token → looks up in portal_tokens table
     ↓
Valid & unused? → Mark as used → Render TreatmentPlanView
     ↓
Patient taps "Yes, I'd like to schedule this" → Practice notified → Booking flow begins
     ↓
Token expired or already used? → Redirect to /portal/expired or /portal/already-used
```

---

## HIPAA Infrastructure Requirements

### Supabase
- Must sign a **Business Associate Agreement (BAA)** with Supabase — requires Team Plan minimum
- HIPAA add-on: **$350/month** on top of Team Plan
- Required configuration:
    - MFA enabled on all Supabase accounts
    - Point in Time Recovery enabled
    - SSL enforcement on
    - Network Restrictions configured
    - Project flagged as HIPAA project in Supabase dashboard

### Twilio
- Must sign a **BAA with Twilio** — requires Enterprise Edition
- No PHI in SMS body — token link only

### Resend (Email)
- Must sign a **BAA with Resend** before sending any PHI-adjacent emails
- Same rule: no PHI in email body

### Upcoming Rule Change
- HIPAA Security Rule modifications (proposed Dec 27, 2024) expected to be finalized **May 2026**
- Eliminates the "addressable" vs "required" distinction — all safeguards become mandatory
- **Build to the stricter standard now** to avoid retrofitting

---

## Database Schema

```sql
-- supabase/migrations/00003_portal_tokens.sql

create table portal_tokens (
  id uuid primary key default uuid_generate_v4(),
  token_hash text unique not null,          -- SHA-256 hash of raw token; never store raw
  patient_id uuid references patients(id) on delete cascade not null,
  treatment_id uuid references treatments(id) on delete cascade,
  practice_id uuid references practices(id) on delete cascade not null,
  purpose text default 'view_plan'
    check (purpose in ('view_plan', 'book')),
  expires_at timestamptz not null,          -- 72 hours from creation
  used_at timestamptz,                      -- null = not yet used; set on first access
  ip_address text,                          -- audit log: who used it
  user_agent text,                          -- audit log
  created_at timestamptz default now()
);

create index portal_tokens_hash_idx on portal_tokens(token_hash);
create index portal_tokens_patient_idx on portal_tokens(patient_id);
create index portal_tokens_expires_idx on portal_tokens(expires_at);
```

**Key design decisions:**
- `treatment_id` references the `treatments` table (not `treatment_plans` — the codebase uses `treatments` as the table name)
- `token_hash` stores the SHA-256 hash of the raw token — the raw token only ever exists in memory and in the SMS link
- `used_at` enforces single-use: once set, the token is invalid
- `ip_address` + `user_agent` provide the audit trail required for HIPAA access logging
- Index on `expires_at` supports a nightly cleanup job to purge stale tokens

---

## Token Generation (Supabase Edge Function)

```typescript
// supabase/functions/generate-portal-token/index.ts

export async function generatePortalToken(
  patientId: string,
  treatmentId: string,
  practiceId: string
): Promise<string> {
  // Cryptographically secure random token
  const rawToken = crypto.randomUUID() + '-' + Date.now()
  const tokenBytes = new TextEncoder().encode(rawToken)

  // Hash — never store the raw token
  const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBytes)
  const tokenHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Invalidate any existing unused tokens for this patient+treatment (idempotency)
  await supabase
    .from('portal_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('patient_id', patientId)
    .eq('treatment_id', treatmentId)
    .is('used_at', null)

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours

  await supabase.from('portal_tokens').insert({
    token_hash: tokenHash,
    patient_id: patientId,
    treatment_id: treatmentId,
    practice_id: practiceId,
    expires_at: expiresAt.toISOString(),
  })

  // Return raw token — this goes in the SMS/email link
  return rawToken
}
```

---

## Portal Page Route

```typescript
// src/app/portal/[token]/page.tsx

export default async function PortalPage({ params }: { params: { token: string } }) {
  const supabase = createServerSupabaseClient()  // from @/lib/supabase/server
  const headersList = headers()

  // Hash the incoming token for lookup
  const tokenBytes = new TextEncoder().encode(params.token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBytes)
  const tokenHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const { data: portalToken, error } = await supabase
    .from('portal_tokens')
    .select(`
      *,
      patient:patients(id, first_name, last_name),
      treatment:treatments(
        id, description, amount, status, code, presented_at,
        practice:practices(name, phone, email)
      )
    `)
    .eq('token_hash', tokenHash)
    .single()

  if (error || !portalToken) return notFound()
  if (new Date(portalToken.expires_at) < new Date()) return redirect('/portal/expired')
  if (portalToken.used_at) return redirect('/portal/already-used')

  // Mark token as used — single-use enforcement
  await supabase
    .from('portal_tokens')
    .update({
      used_at: new Date().toISOString(),
      ip_address: headersList.get('x-forwarded-for') ?? 'unknown',
      user_agent: headersList.get('user-agent') ?? 'unknown',
    })
    .eq('token_hash', tokenHash)

  return (
    <TreatmentPlanView
      patient={portalToken.patient}
      plan={portalToken.treatment}
    />
  )
}
```

---

## Portal UI Component

```typescript
// components/portal/TreatmentPlanView.tsx
'use client'

export function TreatmentPlanView({ patient, plan }) {
  const [booked, setBooked] = useState(false)

  if (booked) {
    return <BookingConfirmationScreen practice={plan.practice} />
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-6">
        <PracticeHeader name={plan.practice.name} />
        <Card>
          <CardHeader>
            <CardTitle>Hi {patient.first_name}, your treatment plan is ready to schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProcedureBlock description={plan.procedure_description} />

            {/* Primary CTA: notifies practice, does not show calendar directly */}
            <Button className="w-full" size="lg" onClick={async () => {
              await fetch('/api/portal/request-booking', {
                method: 'POST',
                body: JSON.stringify({ planId: plan.id }),
              })
              setBooked(true)
            }}>
              <Calendar className="w-4 h-4 mr-2" />
              Yes, I'd like to schedule this
            </Button>

            {/* Secondary CTA: call the practice */}
            <Button variant="outline" className="w-full" size="lg" asChild>
              <a href={`tel:${plan.practice.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call us to schedule
              </a>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              To stop receiving these reminders, reply STOP to any of our messages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## HIPAA Compliance Checklist

| Requirement | How it's met |
|---|---|
| No PHI in SMS body | Link contains opaque token only — no name, procedure, or health data |
| Encryption in transit (TLS) | Vercel enforces HTTPS; Supabase SSL enforcement enabled |
| Encryption at rest | Supabase AES-256 encryption at rest (all customer data) |
| Access control | Token is single-use; invalidated immediately on first access |
| Minimum necessary PHI | Portal shows only first name + procedure description |
| Audit logging | `used_at`, `ip_address`, `user_agent` logged on every token use |
| No persistent session | Portal is stateless; token is the only auth mechanism |
| Automatic token expiry | 72-hour hard expiry; expired tokens redirect to error page |
| BAA with Supabase | Required before storing any PHI — Team Plan + HIPAA add-on |
| BAA with Twilio | Required for SMS delivery |
| BAA with Resend | Required for email delivery |
| 2025/2026 rule changes | MFA, SSL enforced, network restrictions — covers new mandatory specs |

---

## Security Design Decisions

### Single-use token (most critical)
Once a patient clicks the link, the token is immediately marked `used_at`. They cannot revisit the page. If they need to see it again, they request a new link by texting the practice. This eliminates replay attacks entirely.

### Session-less architecture
There is no session to manage, no "remember me" risk, no browser cookie that could leak PHI. The portal is a one-time secure render, not an account.

### Hash-only storage
The raw token exists only in memory (during generation) and in the SMS/email link body. The database stores only its SHA-256 hash. Even a full database dump yields no usable tokens.

### Idempotent token generation
Before issuing a new token for a patient+plan pair, all existing unused tokens for that pair are invalidated. Prevents accumulation of valid tokens that could widen the attack surface.

---

## Sandbox / Demo Behavior

In sandbox mode, portal token generation must be mocked. The sandbox store lives in `src/stores/sandbox-store.ts` (Zustand with sessionStorage persistence). Portal token methods should be added directly to the store interface following the existing mutation pattern:

```typescript
// In stores/sandbox-store.ts — add to SandboxStoreActions interface
addPortalToken: (token: SandboxPortalToken) => void
getPortalToken: (rawToken: string) => SandboxPortalToken | null
markPortalTokenUsed: (rawToken: string) => void

// SandboxPortalToken type (add to sandbox-store.ts)
interface SandboxPortalToken {
  rawToken: string          // prefixed with 'sandbox-token-'
  patientId: string
  treatmentId: string
  practiceId: string
  expiresAt: number         // Date.now() + 72hr in ms
  usedAt: number | null
}
```

Token generation helper (called from the TreatmentPlansList component):

```typescript
// Inline in the component or a small util — NOT a separate sandboxMutations file
async function generateSandboxPortalToken(
  store: SandboxStore,
  patientId: string,
  treatmentId: string
): Promise<string> {
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

The `/portal/[token]` route must detect sandbox tokens (prefix `sandbox-token-`). For the POC, sandbox portal pages use URL search params to pass patient/treatment data (since the Zustand store is client-side only and unavailable in server components). No real Supabase queries. No real token generation. The demo patient portal must render with sandbox patient + plan data.

---

## API Routes Required

| Route | Method | Purpose |
|---|---|---|
| `/api/portal/request-booking` | POST | Patient taps "Yes" → creates a touchpoint record + notifies practice via email |
| `/api/portal/resend-link` | POST | Patient requests a fresh token (from expired/used error page) |
| `/api/webhooks/twilio` | POST | Inbound SMS handler — creates touchpoints for replies |

---

## File Structure

```
src/
  app/
    portal/
      [token]/
        page.tsx          ← Server component: token validation + render
      expired/
        page.tsx          ← Token expired error page
      already-used/
        page.tsx          ← Token already used error page
    api/
      portal/
        request-booking/
          route.ts        ← Handles booking intent from portal
        resend-link/
          route.ts        ← Issues a fresh token on request (future)
  components/
    portal/
      TreatmentPlanView.tsx
      BookingConfirmationScreen.tsx
  stores/
    sandbox-store.ts      ← Extend with portalTokens state + actions
supabase/
  functions/
    generate-portal-token/
      index.ts
  migrations/
    00003_portal_tokens.sql
```

**Codebase conventions:**
- Supabase server client: `createServerSupabaseClient()` from `@/lib/supabase/server`
- Supabase browser client: `createClient()` from `@/lib/supabase/client`
- Sandbox store: `useSandboxStore` from `@/stores/sandbox-store`
- Sandbox context: `useSandbox()` from `@/lib/sandbox`
- Toast system: `useUiStore((s) => s.addToast)` from `@/stores/ui-store`
- Treatment plans component: `TreatmentPlansList` in `src/components/shared/TreatmentPlansList/`
- DB table is `treatments` (not `treatment_plans`), FK is `treatment_id`
- Migration naming: `00NNN_description.sql` (zero-padded sequential numbers)
- Sandbox IDs: all prefixed with `sandbox-` — detected by `isSandboxId()` from `@/lib/sandbox/sandboxData`