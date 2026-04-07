# Product Hurdles & Mitigation

## Summary Table

| Hurdle | Risk | Status | Priority |
|--------|------|--------|----------|
| HIPAA / SMS compliance | High — legal exposure | Portal architecture designed | BAAs before launch |
| PMS integration fragility | High — product stops working | Adapter layer + OD integration designed | OD production-ready |
| Front desk adoption | Medium — slow churn | Sandbox onboarding built | Polish + contextual guidance |
| AI message quality | Medium — core value prop | Preview built; 3 AI features spec'd | Ongoing prompt engineering |
| Patient data privacy | Medium — reputational | Portal keeps PHI out of messages | Launch-ready by design |
| Long dental sales cycles | Medium — slows growth | Sandbox + Brevo demo links live | Pilot data for case study |
| Competitor response | Low now, high at scale | — | Data moat + DSO relationships |

---

## 1. HIPAA & SMS Compliance

**Risk:** SMS containing PHI (procedure type + patient identity) creates compliance surface area. 10DLC registration required since Dec 2024 — unregistered messages get carrier-blocked.

**Status:** Core architecture designed. The [[hipaa-patient-portal-reference]] solves the PHI-in-SMS problem — messages contain only an opaque token URL, and the portal renders PHI behind single-use, 72-hour expiring tokens with full audit logging.

**Mitigation:**
- **Patient portal designed** — secure, stateless, single-use view keeps PHI out of SMS/email bodies entirely. Token-hash storage means even a DB dump yields no usable links
- Sign Twilio BAA (Enterprise Edition) before launch (see [[hipaa-baa-go-live-checklist]])
- Register A2P 10DLC before sending any messages
- Separate healthcare and marketing consent — two different opt-ins
- Build STOP/opt-out handling from day one (TCPA requirement)

## 2. PMS Integration Fragility

**Risk:** PMS updates (Dentrix G6 to G7, etc.) break third-party bridges. Eaglesoft requires formal vendor authorization through Patterson Dental.

**Status:** Largely mitigated by architecture already in place.

**Mitigation:**
- **Vendor-agnostic adapter layer built** — the [[pms-connector-architecture]] defines a `PmsConnector` interface with Zod validation at the boundary, so vendor quirks never reach the database. Each PMS gets its own adapter; the sync engine only consumes normalized data
- **OpenDental integration designed** — the [[open-dental-integration-architecture]] covers patient sync, treatment plan import, and automatic booking detection via appointment polling. OD is the launch target (most open API, ~30K practices)
- **Phased PMS rollout planned** — Phase 1: OpenDental (production-ready), Phase 2: Dentrix, Phase 3: Eaglesoft/CSV. Each phase adds a new adapter behind `ConnectorFactory` without touching the sync engine
- **CSV/manual upload fallback** — already supported for ~20% of practices without an easily connectable PMS
- **Validation catches breaks gracefully** — Zod `safeParse` on every record means a bad field from a PMS update logs a warning and skips the record instead of crashing the sync

## 3. Front Desk Adoption

**Risk:** Staff revert to legacy workflows. High turnover means whoever was trained is gone next month.

**Status:** Onboarding flow and sandbox demo already built. The [[sandbox-auth-signup-flow]] seeds realistic demo data on signup so users see a pre-populated dashboard immediately — not an empty state.

**Mitigation:**
- Zero front desk involvement as default — sequences fire autonomously, only the reply inbox needs attention
- Practice-level configuration (not user-level) — new hires see a running system, not a blank slate
- **Sandbox onboarding built** — signup seeds 10 patients, 8 treatments, 3 sequences, and 5 active enrollments. Users experience value before connecting their real PMS
- [[brevo-demo-link-setup|Demo link distribution]] via Brevo lets prospects enter the sandbox with their info pre-filled — no demo call needed
- In-app contextual guidance: tooltips, inline help, short video walkthroughs

## 4. AI Message Quality

**Risk:** Generic or robotic messages kill conversion rates and cause churn.

**Status:** Message preview already integrated (`/api/preview-message`). Three additional AI features are spec'd in the [[ai-features-plan]]: reply intent classification, smart sequence assignment, and reply drafting assist.

**Mitigation:**
- Robust system prompt: practice tone, procedure context, channel, sequence step, hard rules (no dollar amounts, no clinical anxiety, always CTA + STOP)
- Preview before sending — every sequence step shows a sample message (already built)
- **Intent classification planned** — Claude replaces brittle keyword matching to auto-detect booking intent, questions, opt-outs. Front desk sees a priority queue instead of raw messages
- **Reply drafting planned** — Claude drafts contextual SMS replies for staff to review and send, reducing response time
- Template override escape valve for skeptical practices
- Track which messages drive replies/bookings/STOPs — feed back into prompt refinement

## 5. Patient Data Privacy

**Risk:** Even compliant messages can damage reputation if poorly timed or worded. State laws (CCPA) layer on top of HIPAA.

**Status:** The [[hipaa-patient-portal-reference]] eliminates PHI from outbound messages by design — SMS/email contains only an opaque token link, and PHI renders only on the secure portal page.

**Mitigation:**
- **Portal architecture solves this structurally** — patients see "your treatment plan is ready" in the SMS, click through to the portal to see procedure details. No clinical info ever travels over SMS/email
- Frame as care follow-up, not marketing ("Dr. Rodriguez wanted to check in" not "we noticed your plan")
- No messages within 24 hours of visit. Default offsets: Day 3, 10, 21
- STOP cascades across all channels permanently. DNC status visible on patient cards (see [[patient-statuses-and-lifecycle#Patient Status Labels Patients List|"Do not contact" status]])

## 6. Long Sales Cycles

**Risk:** Solo dentists spend weeks evaluating. DSO owners need a proof-of-concept first.

**Status:** Sandbox demo and demo link distribution are both built and operational.

**Mitigation:**
- **[[sandbox-auth-signup-flow|Sandbox demo]] is live** — signup seeds a realistic dashboard with patients, sequences, and enrollments. Simulation engine shows revenue recovery in real time. 10 minutes to value, no demo call needed
- **[[brevo-demo-link-setup|Demo link pipeline]] built** — Brevo automation sends personalized demo links after `/request-demo` form submission. Prospects land in sandbox with their name and practice pre-filled
- Lead with ROI: "$500K unscheduled, recover $150K, costs $3,588/yr, 42x return"
- Use pilot practice as immediate case study (real numbers with permission)
- DSO expansion path: pilot data -> 5-location validation -> full rollout pitch

## 7. Competitor Response

**Risk:** Dental Intelligence, Weave, Adit have engineering teams and distribution. They'll build a version once traction is visible.

**Mitigation:**
- **Data moat** — conversion data by procedure, region, day offset, tone is not replicable by a late entrant
- **Depth over breadth** — focused product will always beat a bolted-on feature
- **Switching costs** — practices running sequences for 6 months with consent databases and trained staff won't switch for a slightly cheaper clone
- **DSO lock-in** — a 110-location agreement creates a reference competitors can't easily undercut

---

## Related

- [[hipaa-baa-go-live-checklist]] — Full go-live checklist for Hurdle #1 (HIPAA/SMS compliance)
- [[pms-connector-architecture]] — Vendor-agnostic adapter layer addressing Hurdle #2 (PMS fragility)
- [[open-dental-integration-architecture]] — First PMS integration target
- [[ai-features-plan]] — AI features addressing Hurdle #4 (message quality)
- [[sandbox-auth-signup-flow]] — 10-min onboarding and demo for Hurdles #3 and #6
- [[competitive-landscape]] — Detailed competitor analysis for Hurdle #7
- [[why-now-timing-analysis]] — Each hurdle maps to a timing reason why this wasn't solved before
- [[market-size-and-opportunity]] — ROI framing for sales pitch (Hurdle #6)
- [[patient-statuses-and-lifecycle]] — Front desk workflow context for Hurdle #3
- [[hipaa-patient-portal-reference]] — PHI-safe portal design for Hurdle #5
