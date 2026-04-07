# Key Metrics & KPIs

> What to track during the pilot and beyond. Organized by category with industry benchmarks, Retaine targets, and where to instrument each metric.

---

## Why This Matters

The pilot produces two things: a working product and a **dataset**. The dataset is what sells the next 109 practices. Every metric below should be tracked from day one so the case study writes itself.

---

## Tier 1: Revenue Metrics (What Sells the Product)

These are the numbers that go in the pitch deck, case study, and sales conversations.

| Metric | Industry Benchmark | Retaine Target | How to Measure |
|--------|-------------------|---------------|---------------|
| **Revenue recovered** | 10-25% of backlog in 90 days | 15%+ ($75K+ on a $500K backlog) | Sum of `treatments.amount` where status changed from pending -> accepted while patient was in a sequence |
| **Revenue recovered per practice/month** | $10K-$30K (RevenueWell case studies) | $12.5K+/mo | Monthly aggregate of above |
| **ROI multiple** | — | 42x ($150K recovered / $3,588 annual cost) | Revenue recovered / subscription cost |
| **Unscheduled backlog reduction** | — | 15-25% reduction in 90 days | Compare `SUM(treatments.amount) WHERE status='pending'` at start vs. 90 days |

---

## Tier 2: Sequence Performance (What Optimizes the Product)

These metrics drive prompt engineering, sequence design, and the conversion intelligence moat.

| Metric | Industry Benchmark | Retaine Target | How to Measure |
|--------|-------------------|---------------|---------------|
| **Sequence conversion rate** | — | 15-30% | Enrollments with status='converted' / total enrollments per sequence |
| **Conversion by procedure type** | — | Track per ADA code category | Segment conversion rate by `treatments.code` prefix (D2xxx = restorative, D6xxx = implant, etc.) |
| **Conversion by day offset** | 60% of recoverable treatment scheduled in first 30 days | Track per touchpoint | Which touchpoint step triggered the conversion |
| **Conversion by channel** | SMS > email > voicemail for response rate | Track per channel | Segment by touchpoint channel type |
| **Time to convert** | — | <14 days median | `enrollments.converted_at - enrollments.created_at` |
| **Sequence completion rate** | — | — | Enrollments that reached final touchpoint without converting (indicates sequence length may need adjustment) |

---

## Tier 3: Engagement Metrics (Channel Health)

| Metric | Industry Benchmark | Retaine Target | How to Measure |
|--------|-------------------|---------------|---------------|
| **SMS delivery rate** | >95% | >97% | Twilio delivery callbacks / messages sent |
| **SMS response rate** | 30-45% for healthcare | 35%+ | Inbound replies / outbound SMS sent |
| **Email open rate** | 20-25% (healthcare avg) | 25%+ (AI personalization should lift) | Resend tracking / emails delivered |
| **Email click-through rate** | 2-3% (healthcare avg) | 5%+ (portal link is the primary CTA) | Portal token page views / emails delivered |
| **Portal click-through rate** | — | 15-25% of messages | Portal page loads / messages containing portal links |
| **Portal booking rate** | — | 30-50% of portal views | "Yes, I'd like to schedule" clicks / portal page loads |
| **Opt-out rate** | 1-3% per campaign | <2% | STOP messages / total outbound messages |

---

## Tier 4: Practice Health Metrics (What Practices Care About)

Surface these in the dashboard — they're what practice owners check daily.

| Metric | Industry Benchmark | Source |
|--------|-------------------|--------|
| **Case acceptance rate** | 60-65% avg, 80-90% top performers | Levin Group, Dental Economics |
| **Treatment completion rate** | 50-60% of accepted plans | Dental Intelligence |
| **Active patient count** | Varies; attrition <15%/year is healthy | ADA HPI |
| **Production per visit** | $250-$300K/year per operatory | Dental Economics |
| **Collections ratio** | Target >98% of production | Industry standard |
| **No-show / cancellation rate** | 10-15% average | RevenueWell |
| **Hygiene reappointment rate** | Target 85-98% | Dental Intelligence |

**For the pilot,** focus on the delta: "Your case acceptance was 62% before Retaine, it's 74% now." The before/after story is what sells.

---

## Tier 5: Product & Operational Metrics (Internal Health)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| **PMS sync success rate** | >99% | `sync_log` table: successful / total sync runs |
| **Sync latency** | <30 seconds per run | `sync_log.completed_at - sync_log.started_at` |
| **Message delivery failures** | <1% | Twilio error callbacks |
| **AI classification accuracy** | >90% (once [[ai-features-plan|intent classification]] ships) | Manual review sample of intent labels vs. actual patient intent |
| **Onboarding time** | <10 minutes signup to first active sequence | Track timestamps from account creation to first sequence activation |
| **Support tickets per practice** | <2/month | Helpdesk tracking |
| **Churn rate** | <5% monthly | Practices cancelled / total practices |
| **NPS** | >50 | Quarterly survey |

---

## Instrumentation Plan

### What to Build for Pilot

| Data Point | Where It Lives | How to Calculate |
|-----------|---------------|-----------------|
| Revenue recovered | `treatments` table | `SUM(amount)` where `status` changed to `accepted` while patient had an active enrollment |
| Conversion events | `sequence_enrollments` table | `status = 'converted'`, `converted_at` timestamp |
| Message delivery | Twilio webhooks | Delivery status callbacks stored in `messages` table |
| Portal engagement | `portal_tokens` table | `used_at` not null = portal viewed. `/api/portal/request-booking` calls = booking intent expressed |
| Opt-outs | `messages` table + patient status | STOP messages trigger `patient.status = 'archived'` |
| PMS sync health | `sync_log` table | Already designed in [[pms-connector-architecture]] |

### Dashboard Views to Build

1. **Practice owner view:** Revenue recovered (cumulative + monthly), active sequences, patients in sequence, conversion rate. Big number: "You've recovered $X this month"
2. **Sequence performance view:** Conversion rate by sequence, by procedure type, by channel. Heatmap of which day offsets convert best
3. **Retaine internal view:** Aggregate metrics across all practices. Sync health, message delivery rates, opt-out trends, churn indicators

---

## Pilot Success Criteria

After 60-90 days, the pilot is a success if:

| Criteria | Threshold |
|----------|-----------|
| Revenue recovered | >$25K (conservative) or >$50K (strong) |
| Sequence conversion rate | >10% |
| SMS response rate | >25% |
| Opt-out rate | <3% |
| PMS sync reliability | >99% uptime |
| Practice staff satisfaction | Positive qualitative feedback, willing to continue |
| Zero HIPAA incidents | No PHI in SMS, no unauthorized access, no complaints |

Meeting these thresholds unlocks the 3-5 location expansion conversation with the practice group owners.

---

## Benchmark Sources

- ADA Health Policy Institute — practice income, patient volume, billing data
- Dental Economics / Levin Group — case acceptance benchmarks (63% avg, 85%+ top)
- Certify Health Dental Market Study 2025 — acceptance vs. completion gap (56% accepted, 46% completed)
- DrillDown Solution — $500K-$1M unscheduled per practice benchmark
- Mailchimp/Intuit — healthcare email open rates (21-23%)
- Podium / SimpleTexting — healthcare SMS response rates (30-45%)
- Dental Intelligence published metrics — production increase claims
- RevenueWell case studies — $47K average first-year recovery from automated recall

---

## Related

- [[pilot-launch-checklist]] — What to have ready before metrics start flowing
- [[origin-story-and-pilot-plan]] — Pilot timeline and expansion triggers
- [[investor-pitch-narrative]] — These metrics populate the "Traction" section
- [[go-to-market-playbook]] — Pilot data becomes the primary sales asset
- [[product-roadmap]] — Sequence analytics and reporting in Phase 2
- [[unit-economics-and-scaling-costs]] — Revenue metrics validate the margin model
- [[ai-features-plan]] — Intent classification accuracy as a product metric
- [[patient-statuses-and-lifecycle]] — Enrollment status transitions that generate conversion events
