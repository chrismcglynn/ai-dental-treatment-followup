# Product Hurdles & Mitigation

## Summary Table

| Hurdle | Risk | Priority |
|--------|------|----------|
| HIPAA / SMS compliance | High — legal exposure | Before launch |
| PMS integration fragility | High — product stops working | Before launch |
| Front desk adoption | Medium — slow churn | Launch via onboarding design |
| AI message quality | Medium — core value prop | Ongoing prompt engineering |
| Patient data privacy | Medium — reputational | Launch via message design |
| Long dental sales cycles | Medium — slows growth | Demo page + ROI framing |
| Competitor response | Low now, high at scale | Data moat + DSO relationships |

---

## 1. HIPAA & SMS Compliance

**Risk:** SMS containing PHI (procedure type + patient identity) creates compliance surface area. 10DLC registration required since Dec 2024 — unregistered messages get carrier-blocked.

**Mitigation:**
- Design messages as generic care nudges, link to secure portal for PHI details
- Sign Twilio BAA (Enterprise Edition) before launch
- Register A2P 10DLC before sending any messages
- Separate healthcare and marketing consent — two different opt-ins
- Build STOP/opt-out handling from day one (TCPA requirement)

## 2. PMS Integration Fragility

**Risk:** PMS updates (Dentrix G6 to G7, etc.) break third-party bridges. Eaglesoft requires formal vendor authorization through Patterson Dental.

**Mitigation:**
- Use PMS middleware (Kolla, DentalBridge, CRMBridge) — single API, they absorb version updates
- Start with Open Dental (most open API, lowest friction)
- Build CSV/manual upload fallback for ~20% of practices without easy integration
- Maintain version compatibility matrix with 30-day advance notice of breaking changes

## 3. Front Desk Adoption

**Risk:** Staff revert to legacy workflows. High turnover means whoever was trained is gone next month.

**Mitigation:**
- Zero front desk involvement as default — sequences fire autonomously, only the reply inbox needs attention
- Practice-level configuration (not user-level) — new hires see a running system, not a blank slate
- 10-minute onboarding target: signup to first active sequence
- In-app contextual guidance: tooltips, inline help, short video walkthroughs

## 4. AI Message Quality

**Risk:** Generic or robotic messages kill conversion rates and cause churn.

**Mitigation:**
- Robust system prompt: practice tone, procedure context, channel, sequence step, hard rules (no dollar amounts, no clinical anxiety, always CTA + STOP)
- Preview before sending — every sequence step shows a sample message
- Template override escape valve for skeptical practices
- Track which messages drive replies/bookings/STOPs — feed back into prompt refinement

## 5. Patient Data Privacy

**Risk:** Even compliant messages can damage reputation if poorly timed or worded. State laws (CCPA) layer on top of HIPAA.

**Mitigation:**
- Frame as care follow-up, not marketing ("Dr. Rodriguez wanted to check in" not "we noticed your plan")
- No messages within 24 hours of visit. Default offsets: Day 3, 10, 21
- Minimize PHI in outbound — reference "your treatment plan" not "your root canal on #28"
- STOP cascades across all channels permanently. DNC status visible on patient cards

## 6. Long Sales Cycles

**Risk:** Solo dentists spend weeks evaluating. DSO owners need a proof-of-concept first.

**Mitigation:**
- Sandbox demo is the fastest sales tool — 10 minutes, $28K simulated recovery, no demo call needed
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
