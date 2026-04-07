# Pilot Launch Checklist

> Consolidated pre-launch gates for the first practice pilot. Organized by category with clear owners and dependencies. Nothing ships to a real practice until every "Before Launch" item is checked.

---

## Legal & Compliance

- [ ] BAA signed with AWS Bedrock or Anthropic direct (see [[hipaa-baa-go-live-checklist]])
- [ ] BAA signed with Twilio (Enterprise Edition — ~$500/mo minimum)
- [ ] BAA template for practices reviewed by healthcare attorney
- [ ] BAA clause added to standard customer contract (practice <-> Retaine)
- [ ] Terms of Service and Privacy Policy published
- [ ] A2P 10DLC brand registration completed (see [[a2p-10dlc-registration-guide]])
- [ ] A2P 10DLC campaign registration completed for healthcare use case
- [ ] Pilot practice has confirmed patient consent to contact is covered in their intake forms

## Infrastructure & Services

- [ ] Supabase Team Plan + HIPAA add-on ($350/mo) activated
- [ ] Supabase MFA, Point in Time Recovery, SSL enforcement, Network Restrictions configured
- [ ] Twilio Enterprise account provisioned with BAA
- [ ] Twilio phone number provisioned for pilot practice
- [ ] Resend account set up (free tier sufficient at launch)
- [ ] Vercel Pro deployment configured for production
- [ ] Environment variables set for production (Twilio, Resend, Supabase, Anthropic/Bedrock, Stripe)
- [ ] Stripe account connected with subscription product ($299/mo)
- [ ] Domain and SSL configured (app.retaine.io)
- [ ] Sentry error monitoring connected

## PMS Integration

- [ ] Confirm pilot practice's PMS system (expected: Open Dental)
- [ ] [[open-dental-integration-architecture|OpenDental]] API credentials obtained from practice
- [ ] `test-pms` connection validation working against real OD instance
- [ ] Initial patient import tested (bulk import of active patients)
- [ ] Treatment plan import tested (active plans map correctly to `treatments` table)
- [ ] Appointment polling tested (booking detection auto-converts enrollments)
- [ ] Delta sync cron job running reliably (15-min intervals)
- [ ] Fallback: CSV upload path tested in case of integration issues

## Product Readiness

- [ ] Sequence builder creates and saves sequences correctly
- [ ] Outbound SMS sends via Twilio and delivers to real phones
- [ ] Outbound email sends via Resend and delivers to real inboxes
- [ ] STOP/opt-out handling works — patient flagged as DNC immediately, never messaged again
- [ ] [[hipaa-patient-portal-reference|Patient portal]] renders treatment plan via token URL
- [ ] Portal tokens expire after 72 hours, single-use enforcement works
- [ ] Inbox displays inbound patient replies correctly
- [ ] Reply compose and send works from inbox
- [ ] Dashboard metrics (revenue recovered, active sequences, response rates) render correctly
- [ ] Onboarding wizard: practice can go from signup to first active sequence in <10 minutes
- [ ] All [[patient-statuses-and-lifecycle|patient statuses]] display correctly and transitions work

## Sandbox & Demo

- [ ] [[sandbox-auth-signup-flow|Sandbox]] signup seeds demo data correctly
- [ ] Simulation engine runs and shows realistic activity
- [ ] [[brevo-demo-link-setup|Brevo demo link]] pipeline sends personalized links
- [ ] `/demo` route works for unauthenticated demo access (expos, cold outreach)

## Staging Validation

- [ ] Full end-to-end test in staging: patient imported from OD -> treatment plan created -> sequence fires -> SMS delivered -> patient replies -> intent detected -> enrollment converted
- [ ] Wife has walked through every workflow as front desk staff and signed off
- [ ] Load tested with realistic data volume (practice-scale: ~2000 patients, ~500 treatments)
- [ ] Error handling tested: what happens when Twilio is down? When OD API times out? When Claude is unavailable?

## Go-Live Day

- [ ] Practice admin account created
- [ ] Practice BAA signed
- [ ] PMS connected and initial sync completed
- [ ] First sequence configured and activated
- [ ] Practice staff shown the inbox and how to respond to patient replies
- [ ] Monitoring dashboard checked — no errors in Sentry, sync running, messages delivering
- [ ] Chris available for white-glove support for first 2 weeks

---

## Related

- [[hipaa-baa-go-live-checklist]] — Detailed HIPAA/BAA requirements
- [[a2p-10dlc-registration-guide]] — Step-by-step carrier registration
- [[origin-story-and-pilot-plan]] — 90-day pilot strategy and expansion path
- [[open-dental-integration-architecture]] — OD integration details for PMS setup
- [[pms-connector-architecture]] — Adapter layer architecture
- [[unit-economics-and-scaling-costs]] — Service costs at launch stage
- [[key-metrics-and-kpis]] — What to instrument and track during the pilot
- [[product-hurdles-and-mitigation]] — Risks to monitor during pilot
