# Product Roadmap

> What's built, what ships for the pilot, and what comes after. Organized by phase with clear dependencies.

---

## Current State (~90% Complete)

### Core Product — Built
- Dashboard with revenue recovery metrics, active sequences, response rates
- Sequence builder with multi-step touchpoints (SMS, email, voicemail)
- Message preview via Claude API (`/api/preview-message`)
- Patient list with computed [[patient-statuses-and-lifecycle|status labels]] (In sequence, Pending, Do not contact, No active plan)
- Inbox for inbound patient replies with conversation threads
- Reply compose and send
- Treatment plan management with status lifecycle (pending -> accepted/declined -> completed)
- Manual and automatic sequence enrollment (on treatment declined)
- Booking intent detection via keyword matching
- Settings page with PMS connection UI
- Practice-level multi-tenancy with RLS

### Sandbox & Demo — Built
- [[sandbox-auth-signup-flow|Sandbox signup]] seeds realistic demo data (10 patients, 8 treatments, 3 sequences, 5 enrollments)
- Simulation engine with real-time activity feed
- [[brevo-demo-link-setup|Brevo demo link]] pipeline for personalized demo distribution
- `/demo` route for unauthenticated access

### Architecture — Designed (Docs Complete)
- [[pms-connector-architecture|PMS connector]] with vendor-agnostic `PmsConnector` interface, Zod validation, `ConnectorFactory`
- [[open-dental-integration-architecture|OpenDental adapter]] with patient sync, treatment import, appointment booking detection
- [[hipaa-patient-portal-reference|Patient portal]] with token-based PHI-safe architecture
- [[ai-features-plan|Three AI features]] spec'd: intent classification, smart sequence assignment, reply drafting

---

## Phase 1: Pilot Ready

> Goal: One practice running real sequences with real patients.

### Must Ship
- [ ] OpenDental adapter — production implementation of the designed architecture
- [ ] Cron-based delta sync (patients, treatments, appointments every 15 min)
- [ ] Auto-conversion when appointment booking detected in OD
- [ ] Twilio integration — real SMS send/receive
- [ ] Resend integration — real email delivery
- [ ] STOP/opt-out handling (TCPA compliance)
- [ ] Patient portal — token generation, portal page, booking request flow
- [ ] A2P 10DLC registration for pilot practice phone number

### Nice to Have for Pilot
- [ ] Sync status UI in Settings (last sync time, record counts, errors)
- [ ] Manual re-sync button
- [ ] Activity log for auto-conversions ("Patient Maria booked — sequence stopped automatically")

---

## Phase 2: Post-Pilot (After 60-90 Days of Data)

> Goal: Prove ROI with real numbers. Expand to 3-5 locations.

### AI Features (from [[ai-features-plan]])
- [ ] Shared AI service layer (`src/lib/ai/claude.ts`)
- [ ] **Reply intent classification** — Claude replaces keyword matching. Intent badges in inbox. Priority queue for front desk
- [ ] **Reply drafting assist** — "Suggest Reply" button in composer. Claude drafts contextual SMS for staff to review
- [ ] **Smart sequence assignment** — Claude recommends best sequence for a treatment based on procedure type, not just ADA code overlap

### PMS Expansion
- [ ] Dentrix adapter (Phase 2 of [[pms-connector-architecture]])
- [ ] Credential encryption at rest
- [ ] Production monitoring: alert on failed syncs, track sync duration

### Product Polish
- [ ] Sequence analytics — conversion rate, revenue recovered per sequence, per procedure type
- [ ] Practice-level reporting — monthly summary email to practice owner
- [ ] Onboarding wizard improvements based on pilot feedback
- [ ] In-app contextual guidance (tooltips, inline help)

---

## Phase 3: Scale (25+ Practices)

> Goal: Repeatable self-serve onboarding. Multi-practice support.

### PMS & Integration
- [ ] Eaglesoft adapter or CSV import improvements (Phase 3 of [[pms-connector-architecture]])
- [ ] Outbound PMS sync — write communication notes back to OD commlogs
- [ ] Webhook-based real-time sync via OD eConnector (replace polling)

### Platform
- [ ] Multi-practice dashboard for DSO operators
- [ ] Annual billing option in Stripe
- [ ] Practice-to-practice anonymized benchmarking ("Your crown sequence converts 12% higher than average")
- [ ] Voicemail drop integration (Twilio or third-party)

### Growth
- [ ] Self-serve signup to production (no white-glove required)
- [ ] OpenDental vendor marketplace listing
- [ ] [[soc2-requirements|SOC 2]] Type II readiness tracking via Vanta/Drata

---

## Phase 4: Moat (100+ Practices)

> Goal: Build the conversion intelligence data asset.

- [ ] Aggregate conversion data: which messages convert for which procedures, regions, day offsets, tones
- [ ] AI-optimized sequence generation — Claude designs sequences from conversion data, not just templates
- [ ] Procedure-specific playbooks generated from aggregate data
- [ ] API for integration partners
- [ ] Enterprise DSO features (SSO, audit logs, custom BAA workflows)
- [ ] SOC 2 Type II certification

---

## Dependencies Map

```
Phase 1 (Pilot)
  ├── OD Adapter ──── requires: OD API credentials from practice
  ├── Twilio SMS ──── requires: Twilio Enterprise BAA, 10DLC registration
  ├── Patient Portal ── requires: Supabase HIPAA add-on
  └── STOP Handling ── requires: Twilio webhook setup

Phase 2 (Post-Pilot)
  ├── AI Features ──── requires: Phase 1 running (real message data)
  ├── Dentrix ──────── requires: Dentrix Developer Program approval
  └── Analytics ────── requires: 60-90 days of pilot data

Phase 3 (Scale)
  ├── Eaglesoft ────── requires: Patterson vendor authorization OR CSV path
  ├── Self-Serve ───── requires: Onboarding wizard polished from pilot feedback
  └── SOC 2 ─────────── requires: 6-12 month observation window

Phase 4 (Moat)
  └── Conversion Data ── requires: 100+ practices, 6+ months of sequence data
```

---

## Related

- [[origin-story-and-pilot-plan]] — Pilot strategy and 90-day timeline
- [[pilot-launch-checklist]] — Consolidated go/no-go gates for Phase 1
- [[ai-features-plan]] — Detailed specs for Phase 2 AI features
- [[pms-connector-architecture]] — Phased PMS adapter rollout (OD -> Dentrix -> Eaglesoft)
- [[open-dental-integration-architecture]] — Phase 1 PMS integration target
- [[key-metrics-and-kpis]] — What to track across all phases
- [[competitive-landscape]] — Moat-building context for Phase 4
