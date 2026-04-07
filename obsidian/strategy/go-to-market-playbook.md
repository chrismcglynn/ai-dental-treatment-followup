# Go-to-Market Playbook

> Sales motion, target personas, channels, and objection handling for Retaine. Starts with the pilot, scales to self-serve. Updated as real conversion data comes in.

---

## GTM Phases

| Phase | Practices | Motion | Timeline |
|-------|-----------|--------|----------|
| **Pilot** | 1 | White-glove, founder-led | Now |
| **Warm expansion** | 3-5 | Referral from pilot group | After 60-90 days of pilot data |
| **Portfolio rollout** | 110 | DSO conversation with VC owners | After multi-site validation |
| **Outbound** | 25-100 | Targeted outreach to Open Dental practices | Concurrent with portfolio talks |
| **Self-serve** | 100+ | PLG via sandbox demo, OpenDental marketplace, content | After onboarding is repeatable |

---

## Target Personas

### Primary: Practice Manager / Office Manager
- **Who:** Runs daily operations. Manages front desk staff, scheduling, billing
- **Pain:** Owns the "call patients about unscheduled treatment" task. Knows the call list doesn't get worked. Feels the revenue leak but doesn't have a solution
- **What they care about:** Time savings, staff workload reduction, revenue recovery they can show the dentist
- **Where they are:** Dental office manager Facebook groups, DentalTown forums, state dental association events
- **Demo hook:** "See $28K in simulated recovered revenue in 10 minutes — no demo call needed"

### Secondary: Practice Owner / Dentist
- **Who:** Signs the check. Often also the clinical lead
- **Pain:** Knows production numbers are lower than they should be. Sees the unscheduled backlog in their PMS reports
- **What they care about:** ROI, compliance, not adding work for staff
- **Where they are:** ADA conferences, dental economics publications, Henry Schein/Patterson rep relationships
- **Demo hook:** "Your practice has $500K in unscheduled treatment. This product recovers $150K of it for $299/month. That's a 42x return"

### Tertiary: DSO Operations / VP of Growth
- **Who:** Manages growth across 10-100+ locations. Evaluates vendors for portfolio-wide deployment
- **Pain:** Knows the aggregate unscheduled backlog across all locations. Needs scalable solutions, not per-practice band-aids
- **What they care about:** Portfolio-wide metrics, vendor compliance (BAAs, SOC 2), implementation speed, per-location economics
- **Demo hook:** "110 locations × $150K recovered = $16.5M in annual revenue recovery. Total cost: $395K/year"

---

## Sales Motion by Phase

### Phase 1: Pilot (Founder-Led)
- Chris sets up the practice personally
- Wife provides insider feedback loop
- Weekly check-ins with practice manager
- Instrument everything (see [[key-metrics-and-kpis]])
- Goal: clean before/after story with real revenue numbers

### Phase 2: Warm Expansion (Referral)
- Pilot practice manager tells other managers in the 110-location group
- Present pilot data to group operations team
- Ask for 3-5 more locations, not 110
- Offer to set up each one personally (still white-glove)
- Goal: multi-site validation data

### Phase 3: Portfolio Rollout (DSO Sale)
- Present to VC owners with: pilot data + multi-site data + ROI at scale
- Propose phased rollout (10 locations -> 50 -> 110)
- Annual contract with volume pricing (see [[pricing-rationale]])
- Goal: signed agreement for portfolio-wide deployment

### Phase 4: Outbound (Targeted)
- **Channel: OpenDental Vendor Marketplace** — list Retaine as a supplemental service. OD practices are already accustomed to add-on integrations
- **Channel: Dental Facebook Groups** — practice managers share tools. One testimonial with real numbers spreads fast
- **Channel: Cold email to practices with Open Dental** — OD's community forums and user lists identify practices. Lead with the sandbox link, not a demo call
- **Channel: Dental conferences** — ADA SmileCon, state dental associations. Booth or just networking with sandbox on a tablet
- **Channel: Content** — Blog posts on treatment plan recovery, SEO for "unscheduled treatment follow-up software"

### Phase 5: Self-Serve (PLG)
- Sandbox demo is the primary conversion tool
- [[brevo-demo-link-setup|Brevo automation]] sends personalized demo links after form submission
- 10-minute onboarding: signup -> sandbox -> connect PMS -> first sequence active
- Free trial period (14 or 30 days) with real PMS connection
- In-app upgrade prompt when real revenue recovery begins

---

## Objection Handling

### "We already have Weave / Dental Intelligence for this"
"Weave touches treatment follow-up; Retaine owns it. Weave generates a call list your staff has to work manually. Retaine fires sequences automatically — no front desk action required. It sits alongside Weave, not instead of it."

### "We don't want to add another tool"
"Retaine replaces a task, not adds one. Right now someone on your team is supposed to call patients about unscheduled treatment. That's the task this eliminates. The only touchpoint is the inbox when a patient replies."

### "Is this HIPAA compliant?"
"Yes. SMS messages contain no patient health information — just a secure link to a [[hipaa-patient-portal-reference|HIPAA-compliant portal]] where the patient views their plan. We have BAAs with Twilio, AWS Bedrock, and Supabase. We'll sign a BAA with your practice as part of onboarding." (See [[hipaa-baa-go-live-checklist]])

### "How does it connect to our PMS?"
"We have a direct integration with [[open-dental-integration-architecture|Open Dental]] — you enter your API URL and key, we test the connection, and patient data syncs automatically every 15 minutes. For Dentrix and Eaglesoft, we have a [[pms-connector-architecture|vendor-agnostic adapter]] and CSV upload as a fallback."

### "$299/month is expensive"
"Your practice has roughly $500K in unscheduled treatment plans right now. If we recover even 10% of that — $50K — the product paid for itself 14 times over. Most practices see 30% recovery, which is $150K against a $3,588 annual cost. That's a 42x return."

### "What if patients don't like getting these messages?"
"Every message includes STOP opt-out. Patients who opt out are flagged immediately and never contacted again across any channel. The messages are framed as care follow-up from the practice, not marketing — 'Dr. Rodriguez wanted to check in about your treatment plan.' Tone is warm, not salesy."

### "Can we see it work first?"
"Absolutely — that's what the sandbox is for. [Share demo link]. You'll see a realistic practice dashboard with simulated patients, sequences running, and revenue being recovered in real time. Takes 10 minutes, no commitment."

---

## Key Sales Assets

| Asset | Status | Purpose |
|-------|--------|---------|
| Sandbox demo | Live | Primary conversion tool — lets prospects experience value in 10 min |
| Brevo demo link pipeline | Live | Automated personalized demo distribution |
| ROI calculator | Not built | Input practice size + unscheduled backlog -> projected recovery |
| Case study (pilot) | Pending pilot data | Real revenue numbers from first practice |
| One-pager PDF | Not built | Leave-behind for conferences and in-person meetings |
| Video walkthrough | Not built | 3-minute product overview for email outreach |

---

## Related

- [[origin-story-and-pilot-plan]] — Pilot strategy and the 110-practice opportunity
- [[market-size-and-opportunity]] — ROI numbers and market sizing for sales conversations
- [[competitive-landscape]] — Positioning against Weave, Dental Intelligence, Oryx
- [[pricing-rationale]] — Why $299, volume pricing, annual discounts
- [[sandbox-auth-signup-flow]] — How the sandbox demo works technically
- [[brevo-demo-link-setup]] — Demo link generation and Brevo automation
- [[investor-pitch-narrative]] — The pitch arc for VC/investor conversations
- [[key-metrics-and-kpis]] — Metrics that become the case study post-pilot
- [[product-hurdles-and-mitigation]] — Objections map to hurdles #1, #3, #6
