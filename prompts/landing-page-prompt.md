# Claude Code Prompt — FollowDent Landing Page + Demo Request Flow

---

## OBJECTIVE

Build a production-ready **marketing landing page** for **FollowDent** — an AI-powered treatment plan follow-up SaaS for dental practices. The site must communicate professional credibility, quantify the revenue opportunity clearly, and convert visitors to demo requests. No dark mode. No startup flash. Think: the feel of a trusted clinical software tool — the kind a practice manager would trust with patient data.

This is a **Next.js 14 App Router** project using the existing stack (TypeScript, Tailwind CSS, shadcn/ui). All landing page routes are public (no auth required).

---

## DESIGN DIRECTION

**Aesthetic:** Refined clinical utility. Think Athenahealth or DrChrono landing pages, not Stripe or Linear. The visual language should signal: trustworthy, established, compliant, and ROI-focused.

**Color palette (light mode only — no dark mode toggle on the marketing site):**
```css
:root {
  --navy:        #1B2E4B;   /* primary text, headings, nav */
  --navy-deep:   #0F1E33;   /* darkest backgrounds, footer */
  --teal:        #2A7B6F;   /* primary action color, CTAs, accents */
  --teal-light:  #EAF4F2;   /* section backgrounds, card fills */
  --teal-mid:    #3A9E8F;   /* hover states */
  --slate:       #4A5C6E;   /* body text */
  --slate-light: #7A8FA3;   /* captions, secondary text */
  --border:      #D8E2EC;   /* dividers, card borders */
  --off-white:   #F7F9FB;   /* page background */
  --white:       #FFFFFF;   /* cards, nav */
  --amber:       #D4860A;   /* highlight stat numbers, revenue figures */
  --amber-light: #FEF5E4;   /* amber stat card backgrounds */
  --red-soft:    #C0392B;   /* "problem" framing, cautionary stats */
}
```

**Typography (marketing pages only — dashboard keeps Geist Sans/Mono + Lora):**
- Headings: `Playfair Display` (serif, Google Fonts) — conveys expertise and authority
- Body / UI: `DM Sans` (Google Fonts) — clean, modern, readable at small sizes
- Monospace / stat callouts: `DM Mono` — for dollar figures and data points
- Add these fonts in `src/lib/fonts.ts` alongside the existing Geist/Lora fonts. Apply via CSS variables scoped to the `(marketing)` layout.

**What makes this UNFORGETTABLE:** A full-bleed "Revenue Calculator" section where the visitor inputs their practice's monthly new treatment plans and estimated average plan value, and FollowDent instantly shows them how much revenue they're leaving on the table — with an animated counter. This makes the value proposition viscerally personal.

---

## FILE STRUCTURE

Create the following within the existing Next.js project:

```
src/
  app/
    (marketing)/
      layout.tsx              ← marketing layout (nav + footer, no sidebar)
      page.tsx                ← landing page (home)
      request-demo/
        page.tsx              ← demo request / waitlist form page
      privacy/
        page.tsx              ← privacy policy (boilerplate)
      hipaa/
        page.tsx              ← HIPAA compliance statement (boilerplate)
  components/
    marketing/
      MarketingNav.tsx
      MarketingFooter.tsx
      HeroSection.tsx
      ProblemSection.tsx
      SolutionSection.tsx
      RevenueCalculator.tsx
      HowItWorksSection.tsx
      PmsIntegrationsSection.tsx
      ComplianceSection.tsx
      TestimonialSection.tsx   ← placeholder / coming soon
      PricingSection.tsx
      FinalCtaSection.tsx
      DemoRequestForm.tsx
  lib/
    brevo.ts                  ← Brevo (Sendinblue) API client for contact capture
```

> **⚠️ Route note:** `/demo` is already used by the interactive sandbox demo (`src/app/demo/`). The demo request form lives at `/request-demo` to avoid collision. All "Request a Demo" CTAs link to `/request-demo`. The sandbox demo at `/demo` is referenced as a secondary CTA ("Try the Interactive Demo") throughout the site.


---

## ENVIRONMENT VARIABLES

Update `.env.local.example` with the following additions for Brevo integration:

```env
# ─── Brevo (Email / Contact Capture) ─────────────────────────────────────────
BREVO_API_KEY=your_brevo_api_key_here
BREVO_WAITLIST_LIST_ID=3          # Brevo contact list ID for the demo waitlist
BREVO_FROM_EMAIL=hello@followdent.com
BREVO_FROM_NAME=FollowDent
BREVO_CONFIRMATION_TEMPLATE_ID=1  # Optional: Brevo transactional template ID for confirmation email

# ─── Site ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://followdent.com
```

---

## PART 1 — MARKETING LAYOUT

### `(marketing)/layout.tsx`

A clean layout wrapper with no sidebar. Includes `<MarketingNav />` and `<MarketingFooter />`. Does NOT import any dashboard providers (no TanStack Query, no Zustand practice store). Can share the same `ThemeProvider` from the root layout but lock theme to `light` forcibly on all marketing routes using `<html className="light">`.

```tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F9FB]">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
```

### `MarketingNav.tsx`

Sticky top navigation. White background, 1px bottom border in `--border`. Max-width 1200px centered.

Left: `FollowDent` wordmark in `Playfair Display`, navy color, plus a small tooth icon (Lucide `Smile` or custom SVG).

Right links: `How it Works` | `Integrations` | `Pricing` | `HIPAA Compliance` — all scroll to page anchors.

Far right: Two buttons:
1. `Try Demo` — outlined teal button, links to `/demo` (the interactive sandbox demo, no signup required)
2. `Request a Demo` — teal filled, medium weight. Links to `/request-demo`.

Mobile: hamburger menu (shadcn Sheet) with same links stacked vertically.

### `MarketingFooter.tsx`

Navy-deep background (`#0F1E33`). Three columns:
- Left: FollowDent logo + tagline "AI-powered treatment plan follow-up for dental practices." + small print: "HIPAA Compliant · SOC 2 In Progress"
- Center: Links — How it Works, Integrations, Pricing, Privacy Policy, HIPAA Statement
- Right: "Ready to recover lost revenue?" + `Request a Demo` button (teal outlined, white text on dark bg) + `Try the Interactive Demo →` text link below

Bottom bar: © 2026 FollowDent · All rights reserved · Denver, CO

---

## PART 2 — LANDING PAGE SECTIONS

### 2.1 — Hero Section (`HeroSection.tsx`)

**Goal:** Immediately communicate what the product does and the size of the opportunity.

Layout: Two-column on desktop (text left, visual right). Single column on mobile.

**Left column:**

Eyebrow label (small caps, teal): `AI-Powered Treatment Plan Follow-Up`

Headline (Playfair Display, 52px desktop / 36px mobile, navy):
```
Your patients said yes.
Then life got in the way.
We bring them back.
```

Sub-headline (DM Sans, 18px, slate):
```
FollowDent automatically follows up with patients who have unscheduled 
treatment plans — via SMS, email, and voicemail — and turns accepted 
plans into booked appointments. Average practices recover $150,000+ 
in unscheduled revenue per year.
```

Two CTA buttons side by side (stack on mobile):
```
[ Request a Demo → ]     [ Try Interactive Demo — Free ]
   (teal filled)              (teal outlined)
```
The "Try Interactive Demo" button links to `/demo` (the existing sandbox demo — no signup required). This is a major differentiator: prospects can experience the full product immediately.

Below the buttons, small trust signals in a single row:
`🔒 HIPAA Compliant  ·  No credit card required  ·  Launching soon — join the waitlist`

**Right column:**

A **dashboard mockup card** — a clean, static illustration that mirrors the structure of the real FollowDent dashboard. Render as styled HTML/CSS (NOT a screenshot). This matters: when prospects click "Try Interactive Demo" and see the real sandbox, the UI should feel familiar.

```
┌─────────────────────────────────────────────┐
│  📊 Revenue Recovered          ↑ 34%        │
│  $12,450                    vs last month   │
│  ─────────────────────────────────────────  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 12       │ │ 34%      │ │ 847      │    │
│  │ Plans in │ │ Convert  │ │ Messages │    │
│  │ sequence │ │ rate     │ │ sent     │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  Recent Activity                            │
│  ● Maria C.    Crown #14   $1,450  ✓ Booked│
│  ● James W.    Implant     $3,800  💬 Reply │
│  ● Priya N.    Bridge #28  $3,200  📤 Sent  │
│                                             │
│  ⚡ 3 sequences running · 8 plans in queue  │
└─────────────────────────────────────────────┘
```

Style this card with a subtle drop shadow, `--white` background, `--border` outline, and the teal accent for the stat number. Add a subtle floating animation (CSS keyframe, slow 4s ease-in-out infinite up/down) to make it feel alive.

### 2.2 — Problem Section (`ProblemSection.tsx`)

**ID:** `#problem`

Background: `--off-white`. Full-width section.

Section label: `THE PROBLEM`
Headline: `Every dental practice has the same silent revenue leak`

Three stat cards in a row (amber-light background, amber stat numbers, DM Mono for numbers):

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    $500,000      │  │      46%         │  │      10%         │
│ Average annual   │  │ Treatment plan   │  │ Drop-off rate    │
│ unscheduled      │  │ completion rate  │  │ after patient    │
│ treatment        │  │ (down from 56%)  │  │ acceptance       │
│ backlog per      │  │                  │  │                  │
│ practice (ADA)   │  │  Planet DDS 2025 │  │  Planet DDS 2025 │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

Below the cards, a narrative paragraph (DM Sans, 16px, slate):
```
Patients accept treatment plans with good intentions — then forget, 
get busy, or feel overwhelmed by cost. Your front desk team is too 
stretched to personally follow up with every one of them. The result: 
hundreds of thousands of dollars in already-accepted treatment sitting 
unscheduled every single year.

This isn't a patient problem. It's a systems problem. And it's solvable.
```

### 2.3 — Solution Section (`SolutionSection.tsx`)

**ID:** `#solution`

Background: `--teal-light`. Full-width.

Section label: `HOW FOLLOWDENT WORKS`
Headline: `Intelligent follow-up that works while your team focuses on patients`

Three-step horizontal flow with connecting arrows (desktop) / vertical stack (mobile):

**Step 1 — Detect**
Icon: clipboard with checkmark
Title: `Treatment plan detected`
Body: `FollowDent syncs with your PMS and instantly identifies every accepted treatment plan that hasn't been scheduled yet.`

**Step 2 — Follow Up**
Icon: message/phone/mail trio
Title: `AI-powered multi-channel outreach`
Body: `Personalized SMS, email, and voicemail messages go out on your configured schedule — sounding like they came from your front desk, not a robot.`

**Step 3 — Book**
Icon: calendar with checkmark
Title: `Patient books. Revenue recovered.`
Body: `Patients reply, click a secure booking link, or call in. You track every outcome in one dashboard. Average conversion: 34%.`

Connecting arrows between steps: `→` in teal, 2px solid line.

Below the steps, a single-line callout in a teal-outlined box:
```
💡 Average practices recover $150,000 – $300,000 per year. At $199/month, that's a 75–125× ROI.
```

### 2.4 — Revenue Calculator (`RevenueCalculator.tsx`)

**ID:** `#calculator`

**This is the centerpiece section. Build it exceptionally.**

Background: `--navy`. White text. Full-width.

Headline (Playfair Display, white): `How much is your practice leaving on the table?`
Sub: `Enter two numbers. See your opportunity in seconds.`

Two inputs side by side (styled inputs with white borders on dark bg):
```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  New treatment plans / mo   │  │  Avg. treatment plan value  │
│  [ 15           ]           │  │  [ $ 1,200        ]         │
└─────────────────────────────┘  └─────────────────────────────┘
```

Default values: 15 plans/month, $1,200 avg value.

Below the inputs, **live animated output** (updates as user types, no submit button):

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Without FollowDent          With FollowDent                     │
│  ─────────────────           ───────────────────                 │
│  $108,000 / year             $144,000 recovered / year           │
│  accepted but never booked   (at 34% avg conversion rate)        │
│                                                                  │
│  ════════════════════════════════════════════════════════════    │
│  Your estimated annual recovery:  $144,000                       │
│  FollowDent annual cost:          $2,388                         │
│  Net gain:                        $141,612 / year                │
│  ROI:                             ×60                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Math logic:**
```ts
// Assumptions baked in:
const DROP_OFF_RATE = 0.10              // 10% of accepted plans never book (Planet DDS)
const CONVERSION_WITH_AI = 0.34        // 34% of unscheduled plans recovered with FollowDent
const ANNUAL_COST = 199 * 12           // $2,388/year

function calculate(plansPerMonth: number, avgValue: number) {
  const annualPlans = plansPerMonth * 12
  const unscheduled = annualPlans * DROP_OFF_RATE   // plans lost without follow-up
  // More conservatively: total plans sitting idle (not just dropout)
  // For demo purposes, assume 30% of monthly plans are sitting unscheduled at any time
  const unscheduledRevenue = plansPerMonth * 0.30 * 12 * avgValue
  const recovered = unscheduledRevenue * CONVERSION_WITH_AI
  const roi = Math.round(recovered / ANNUAL_COST)
  return { unscheduledRevenue, recovered, roi, netGain: recovered - ANNUAL_COST }
}
```

The "Your estimated annual recovery" number should animate with a counting-up effect when the value changes (use a `useCountUp` hook or simple `requestAnimationFrame` counter). Display in DM Mono, amber color, large size (40px).

Below the calculator: `Request a Demo to see FollowDent working on your actual treatment plan data →` (teal button, full-width on mobile).

### 2.5 — How It Works Deep Dive (`HowItWorksSection.tsx`)

**ID:** `#how-it-works`

Background: `--white`.

Headline: `From detected to booked — without lifting a finger`

Four feature rows alternating (image/visual left + text right, then text left + visual right):

**Row 1 — Sequence Automation:**
Visual: A static mockup of the sequence builder timeline showing: Day 3 SMS → Day 10 Email → Day 21 Voicemail, with tone selector (friendly/clinical/urgent) and AI message preview badge. Mirror the real sequence builder UI layout.
Text:
- Title: `Build your follow-up sequences once. Run them forever.`
- Body: `Configure exactly how you want to reach each type of patient. Crown follow-ups, implant consults, and SRP reminders can all have their own cadence, tone, and timing. AI writes the messages using Claude — you review, tweak the tone, and approve. Drag steps to reorder. Set delays in days or hours.`

**Row 2 — Two-Way Inbox:**
Visual: A static mockup of the unified inbox — conversation list on the left, message thread on the right with a patient reply: "Hi yes I'd like to schedule that crown 😊" and a compose bar at the bottom. Show real-time delivery status badges (Sent → Delivered → Read).
Text:
- Title: `Never miss a patient reply again.`
- Body: `When patients respond via SMS, your team sees every conversation in a unified inbox with real-time updates. Reply directly from FollowDent. See delivery status for every message. No more digging through texting apps or shared phones.`

**Row 3 — Analytics:**
Visual: A static mockup of the analytics dashboard showing: revenue recovered area chart trending upward, a channel breakdown pie chart (SMS 60%, Email 30%, Voicemail 10%), and a conversion funnel (Sent → Delivered → Replied → Booked). Use SVG or styled HTML.
Text:
- Title: `Know exactly what's working.`
- Body: `Track conversion rates by sequence, channel, and procedure type. See a full conversion funnel from message sent to appointment booked. Identify your best-performing sequences and channels. Prove ROI to your partners in one report.`

**Row 4 — Patient Portal:**
Visual: A phone mockup showing the HIPAA-compliant patient portal: treatment details at top (description, code, amount), practice info and hours, then the preference-based booking UI with month selector, day-of-week checkboxes, and time-of-day options (Early Morning, Late Morning, etc.).
Text:
- Title: `Secure booking — no app download required.`
- Body: `Patients receive a secure, single-use link to view their treatment plan details and request an appointment based on their preferred days and times. The link expires after 72 hours. HIPAA-compliant by design — token-based access with SHA-256 hashing. Works on any phone.`

### 2.6 — PMS Integrations (`PmsIntegrationsSection.tsx`)

**ID:** `#integrations`

Background: `--off-white`.

Section label: `INTEGRATIONS`
Headline: `Works with the PMS your practice already uses`

Four large integration cards in a 2×2 grid (desktop) / single column (mobile):

```
┌──────────────────────┐  ┌──────────────────────┐
│  🦷 Open Dental      │  │  📋 Dentrix           │
│  Native API sync     │  │  Connector setup      │
│  Real-time           │  │  (Dentrix G)          │
│  ✓ Supported         │  │  ✓ Supported          │
└──────────────────────┘  └──────────────────────┘
┌──────────────────────┐  ┌──────────────────────┐
│  📁 Eaglesoft        │  │  📤 Manual / CSV      │
│  Scheduled sync      │  │  Any PMS via CSV      │
│  + webhook           │  │  import               │
│  ✓ Supported         │  │  ✓ Supported          │
└──────────────────────┘  └──────────────────────┘
```

Each card: white background, navy border-left 3px solid, teal checkmark badge.

Below the grid, a note:
`Don't see your PMS? We're adding new integrations monthly. Tell us what you use →` (link to `/request-demo` with pre-filled PMS field note)

### 2.7 — Compliance Section (`ComplianceSection.tsx`)

**ID:** `#compliance`

Background: `--teal-light`.

Section label: `SECURITY & COMPLIANCE`
Headline: `Built for healthcare from day one`

Three compliance cards side by side:

**Card 1 — HIPAA:**
Icon: Shield with checkmark (Lucide `ShieldCheck`, teal)
Title: `HIPAA Compliant`
Body: `All patient data is encrypted at rest and in transit. We sign a Business Associate Agreement (BAA) with every practice. PHI is never included in outbound messages — patients access treatment details only through secure, token-based portal links that expire after 72 hours.`
Badge: `BAA Provided`

**Card 2 — SMS / TCPA:**
Icon: MessageSquare with lock
Title: `TCPA-Safe Messaging`
Body: `Every SMS includes opt-out instructions per TCPA requirements. Our platform manages do-not-contact (DNC) lists automatically — patients can be flagged as DNC from the patient detail page or inbox. Patient consent is tracked and auditable.`
Badge: `Compliant Opt-Out`

**Card 3 — Data Security:**
Icon: Lock
Title: `Enterprise-Grade Security`
Body: `Hosted on Supabase with row-level security (RLS) ensuring practices only ever see their own data. Portal tokens use SHA-256 hashing and single-use enforcement. All API routes are server-side only — no patient data exposed to the browser.`
Badge: `SOC 2 In Progress`

Below the cards, a link: `Read our full HIPAA Compliance Statement →` (links to `/hipaa`)

### 2.8 — Social Proof / Testimonials (`TestimonialSection.tsx`)

Since the product is pre-launch, use a **"What our pilot practice is saying"** framing with a placeholder quote:

Background: `--white`. Clean, centered layout.

```
"We've been in the pilot for 8 weeks. The sequences run themselves — 
 our front desk doesn't think about it. We've already recovered two 
 implant cases we would have lost."

— Lead RDH, Pilot Practice (Denver, CO)
   Currently in private beta
```

Style: large quotation mark in teal, italic Playfair Display for the quote, DM Sans for attribution. Below: "Join them on the waitlist" + CTA.

### 2.9 — Pricing Section (`PricingSection.tsx`)

**ID:** `#pricing`

Background: `--off-white`.

Headline: `Simple, transparent pricing`
Sub: `One practice. One price. No per-message fees, no seat limits.`

Single pricing card (centered, max-width 480px, white, bordered):

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Pro Practice                                      │
│   $199 / month per practice                        │
│                                                     │
│   ✓  Unlimited treatment plan sequences             │
│   ✓  SMS, email + voicemail outreach               │
│   ✓  Unified patient inbox                         │
│   ✓  PMS integration (Open Dental, Dentrix,        │
│      Eaglesoft, CSV)                               │
│   ✓  HIPAA-compliant patient portal                │
│   ✓  BAA provided                                  │
│   ✓  Analytics & revenue tracking                  │
│   ✓  Unlimited team seats                          │
│                                                     │
│   [  Request a Demo — Launching Soon  ]             │
│                                                     │
│   Pilot practices: first 2 months free             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Below the card: `Questions about pricing? Email us at hello@followdent.com`

### 2.10 — Final CTA Section (`FinalCtaSection.tsx`)

Background: `--navy`. Full-width.

Headline (Playfair Display, white, 40px): `Stop leaving $150,000 on the table every year.`
Sub (DM Sans, slate-light): `Join the waitlist. Get early access. Or try the interactive demo right now.`

Two CTA buttons side by side:
1. `Request a Demo →` (large teal filled)
2. `Try the Interactive Demo` (teal outlined, white text) — links to `/demo`

Below: Trust row — `🔒 HIPAA Compliant · No credit card required · Cancel anytime`

---

## PART 3 — DEMO REQUEST PAGE (`/request-demo`)

### `request-demo/page.tsx`

This page is the conversion endpoint. Someone clicks "Request a Demo" anywhere on the site and lands here.

**Layout:** Two-column on desktop.

**Left column (40% width) — value reinforcement:**

Teal background (`--teal`), white text. Vertical content:

```
FollowDent is launching soon.

Join the waitlist and get:
✓  Priority access when we launch
✓  A personalized interactive demo
✓  Pilot pricing (first 2 months free)

"We've already recovered two implant 
cases we would have lost."
— Lead RDH, Denver CO pilot practice

──────────────────────────────────
178,000 dental practices leave
$89.1 billion in unscheduled
treatment revenue every year.

Your practice doesn't have to be
one of them.
──────────────────────────────────
```

Logos / badges at the bottom: HIPAA Compliant shield, Open Dental compatible, Dentrix compatible.

**Right column (60% width) — the form:**

White card, generous padding.

Headline: `See FollowDent in action`
Sub: `We're in private beta. Fill out the form below and we'll be in touch within 1 business day to schedule your personalized interactive demo.`

**Form fields (`DemoRequestForm.tsx`):**

```
Full Name *
[                                    ]

Role / Title *
[ Dropdown: Practice Owner / Office Manager / Lead RDH / Associate Dentist / Other ]

Practice Name *
[                                    ]

Best Email Address *
[                                    ]

Practice Phone (optional)
[                                    ]

Current Practice Management Software *
[ Dropdown: Open Dental / Dentrix / Eaglesoft / Carestream Dental / Curve Dental /
            Patterson Dental (other) / None / Other ]

How many treatment plans does your practice present per month? (optional)
[ Dropdown: Under 20 / 20–50 / 50–100 / 100+ / Not sure ]

Anything you'd like us to know? (optional)
[ Textarea, 3 rows ]
```

Submit button (full-width, teal, large): `Join the Waitlist & Request Demo →`

On submit:
1. Validate with Zod (name, email, practice name, role, PMS required)
2. POST to `/api/demo-request` (server action or API route)
3. API route calls Brevo to add contact to the waitlist list with all custom attributes
4. Show success state (no page navigation — inline success):

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ✓  You're on the waitlist!                      │
│                                                  │
│  We'll be in touch at [email] within             │
│  1 business day to schedule your demo.           │
│                                                  │
│  In the meantime, explore our interactive        │
│  sandbox demo — no signup required:              │
│                                                  │
│  [  Try the Interactive Demo →  ]                │
│                                                  │
└──────────────────────────────────────────────────┘
```

The "Try the Interactive Demo" button links to `/demo` (the existing interactive sandbox demo — already built, no signup required).

---

## PART 4 — BREVO API INTEGRATION

### `src/lib/brevo.ts`

```ts
interface DemoRequestPayload {
  fullName: string
  email: string
  role: string
  practiceName: string
  phone?: string
  currentPms: string
  plansPerMonth?: string
  notes?: string
}

export async function addToBrevoWaitlist(data: DemoRequestPayload): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const listId = parseInt(process.env.BREVO_WAITLIST_LIST_ID || '3')

  if (!apiKey) throw new Error('BREVO_API_KEY not configured')

  const [firstName, ...lastParts] = data.fullName.trim().split(' ')
  const lastName = lastParts.join(' ') || ''

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      email: data.email,
      firstName,
      lastName,
      listIds: [listId],
      updateEnabled: true,   // update if contact already exists
      attributes: {
        PRACTICE_NAME:    data.practiceName,
        ROLE:             data.role,
        PHONE:            data.phone || '',
        CURRENT_PMS:      data.currentPms,
        PLANS_PER_MONTH:  data.plansPerMonth || '',
        NOTES:            data.notes || '',
        SOURCE:           'landing_page_demo_request',
        SUBMITTED_AT:     new Date().toISOString(),
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    // If contact already exists (409), that's fine — updateEnabled handles it
    if (response.status !== 409) {
      throw new Error(`Brevo API error: ${response.status} — ${JSON.stringify(error)}`)
    }
  }
}
```

### `src/app/api/demo-request/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addToBrevoWaitlist } from '@/lib/brevo'

const demoRequestSchema = z.object({
  fullName:      z.string().min(2, 'Full name is required'),
  email:         z.string().email('Valid email required'),
  role:          z.string().min(1, 'Role is required'),
  practiceName:  z.string().min(1, 'Practice name is required'),
  phone:         z.string().optional(),
  currentPms:    z.string().min(1, 'PMS selection is required'),
  plansPerMonth: z.string().optional(),
  notes:         z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = demoRequestSchema.parse(body)

    await addToBrevoWaitlist(data)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Demo request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

## PART 5 — COMPLIANCE PAGES (BOILERPLATE)

### `privacy/page.tsx`

A clean, readable privacy policy page. Use the marketing layout. Standard sections: Data We Collect, How We Use It, HIPAA Compliance, Third-Party Services, Contact. Use DM Sans for body, Playfair Display for section headings. Date: "Last updated: January 2026."

### `hipaa/page.tsx`

HIPAA compliance statement covering:
- Business Associate Agreements (we provide a BAA to every customer)
- PHI handling practices
- Encryption (AES-256 at rest, TLS 1.2+ in transit)
- Access controls (row-level security, audit logging)
- Data retention and deletion policies
- How to request a BAA (email: privacy@followdent.com)

---

## PART 6 — SEO & METADATA

### Root metadata (`app/(marketing)/layout.tsx`):
```ts
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://followdent.com'),
  title: {
    default: 'FollowDent — AI Treatment Plan Follow-Up for Dental Practices',
    template: '%s | FollowDent',
  },
  description:
    'FollowDent automatically follows up with patients who have unscheduled treatment plans via SMS, email, and voicemail. Average practices recover $150,000+ per year. HIPAA compliant.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'FollowDent',
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

### Request Demo page metadata:
```ts
export const metadata = {
  title: 'Request a Demo — See FollowDent in Action',
  description:
    'Join the FollowDent waitlist and get a personalized demo. See how AI-powered treatment plan follow-up recovers unscheduled revenue for dental practices.',
}
```

---

## PART 7 — ANIMATIONS & INTERACTIONS

Keep animations purposeful and professional — no excessive motion.

1. **Hero section**: On page load, the headline words fade+slide up with 100ms stagger between lines. The dashboard mockup card slides in from the right with a 200ms delay.

2. **Stat cards (Problem section)**: Numbers count up from 0 to their target value on scroll-into-view (use `IntersectionObserver`). Duration: 1.2 seconds.

3. **Revenue Calculator**: The output numbers animate using a `useCountUp` hook whenever the input values change. Debounce the calculation by 300ms to avoid flickering while typing.

4. **How It Works rows**: Each row fades in on scroll-into-view with a gentle translate-up (20px → 0, 0.4s ease-out).

5. **CTA buttons**: Gentle scale transform on hover (`scale(1.02)`), 150ms transition.

6. **No parallax, no scroll-jacking, no fullscreen takeovers.** This is a professional tool for busy practice managers, not a portfolio site.

---

## PART 8 — RESPONSIVE DESIGN

All sections must be fully responsive. Key breakpoints:
- Mobile: < 640px
- Tablet: 640px – 1024px
- Desktop: > 1024px

Mobile-specific adjustments:
- Hero: single column, dashboard mockup below text, smaller font sizes
- Problem stats: single column stack
- Calculator: stacked inputs, smaller output display
- PMS integrations: 2×2 grid → single column
- How It Works rows: all single column, visual above text
- Demo form: single column, full-width inputs

---

## IMPLEMENTATION ORDER

Complete in this sequence:

1. Add marketing fonts (Playfair Display, DM Sans, DM Mono) to `src/lib/fonts.ts` via `next/font/google`
2. Add marketing CSS variables (navy, teal, amber, etc.) to `globals.css`
3. `(marketing)/layout.tsx` + `MarketingNav.tsx` + `MarketingFooter.tsx`
4. `HeroSection.tsx` — dual CTA (Request Demo + Try Interactive Demo)
5. `ProblemSection.tsx` — static stats with count-up animation
6. `SolutionSection.tsx` — static
7. `RevenueCalculator.tsx` — interactive, client component
8. `HowItWorksSection.tsx` — mockups reflecting real UI, scroll animations
9. `PmsIntegrationsSection.tsx` — static
10. `ComplianceSection.tsx` — static, references real security features
11. `TestimonialSection.tsx` — static placeholder
12. `PricingSection.tsx` — static
13. `FinalCtaSection.tsx` — static
14. `app/(marketing)/page.tsx` — assemble all sections in order
15. `src/lib/brevo.ts` — Brevo client
16. `src/app/api/demo-request/route.ts` — API route
17. `DemoRequestForm.tsx` — form with validation + API call
18. `app/(marketing)/request-demo/page.tsx` — two-column layout + form
19. `privacy/page.tsx` + `hipaa/page.tsx` — boilerplate pages
20. Update `.env.local.example` with Brevo vars
21. Final pass: SEO metadata on all pages, mobile responsiveness audit

---

## QUALITY BAR

Before considering complete, verify:

- [ ] All "Request a Demo" buttons link to `/request-demo`
- [ ] All "Try Interactive Demo" buttons link to `/demo` (the existing sandbox)
- [ ] Demo request form submits, calls Brevo API, and shows inline success state
- [ ] Revenue calculator updates live as user types, with animated counter
- [ ] Stat numbers in Problem section animate on scroll into view
- [ ] No dark mode — all pages render correctly in forced light mode
- [ ] Fonts load via `next/font` (no layout shift)
- [ ] All sections have proper `id` attributes for anchor links
- [ ] Nav links scroll smoothly to sections (use `scroll-behavior: smooth` on `html`)
- [ ] Mobile layout tested at 390px — no horizontal overflow
- [ ] HIPAA and Privacy pages are linked in footer
- [ ] `.env.local.example` updated with all Brevo variables
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] No hardcoded colors — all use CSS variable tokens
- [ ] Brevo API errors are caught and surface a user-friendly message on the form
- [ ] Form validation errors display inline below each field (not alert dialogs)