# HIPAA & BAA Go-Live Checklist

## Key Clarification

HIPAA does not ban AI for messaging. It requires any AI vendor handling PHI to sign a Business Associate Agreement (BAA). Claude API can be used with PHI via:
- **Anthropic direct** — BAAs available after use-case review, under zero data retention
- **AWS Bedrock** — Signs BAAs, offers most Claude models for healthcare, near-instant approval
- **Google Vertex AI / Azure** — Also sign BAAs

Pricing is comparable across providers. Switching from direct API to Bedrock is essentially a credential change — existing prompts work identically.

## Required BAAs Before Launch

| Agreement | Parties | Purpose |
|-----------|---------|---------|
| AI Provider BAA | Retaine <-> AWS Bedrock (or Anthropic) | Claude API processing PHI |
| Messaging BAA | Retaine <-> Twilio | SMS/voice containing or referencing PHI |
| Practice BAA | Each practice <-> Retaine | Retaine handles their patients' PHI |

The practice BAA is a clause in the standard customer contract — have a healthcare attorney draft it.

## Patient Consent

The **practice** collects patient consent, not Retaine. It's already part of standard patient intake paperwork ("we may contact you about your treatment"). During onboarding, confirm the practice has consent covered and document that confirmation.

## SMS-Specific HIPAA Considerations

SMS is unencrypted in transit, creating a grey area. Industry-standard approach:
1. Get patient opt-in consent at treatment planning
2. Keep messages **minimally identifying** — "You have a treatment plan ready to schedule" rather than spelling out the diagnosis
3. Link to a secure patient portal for PHI details
4. Document consent in the PMS

## What Stays Off-Limits

The standard Claude.ai chat interface **cannot** be used with PHI — BAAs only cover API and Enterprise products. Team members must never paste patient data into Claude.ai for testing.

## Go-Live Checklist

- [ ] BAA signed with AWS Bedrock (or Anthropic direct)
- [ ] BAA signed with Twilio (Enterprise Edition)
- [ ] BAA template for practices reviewed by healthcare attorney
- [ ] BAA clause added to standard customer contract
- [ ] Onboarding flow confirms practice has patient consent to contact
- [ ] A2P 10DLC registration completed for each practice's phone number
- [ ] STOP/opt-out handling implemented and tested
- [ ] Outbound messages minimize PHI (link to [[hipaa-patient-portal-reference|patient portal]] for details — architecture spec'd)
- [ ] Healthcare and marketing consent are separated (two opt-ins)

## Important Disclaimer

This is a reference document, not legal advice. Consult a healthcare attorney before launch to review BAA templates, customer contracts, and messaging compliance.

---

## Related

- [[hipaa-patient-portal-reference]] — Portal architecture that keeps PHI out of SMS/email bodies
- [[unit-economics-and-scaling-costs]] — Supabase HIPAA ($350/mo) and Twilio Enterprise ($500/mo) as fixed costs
- [[product-hurdles-and-mitigation]] — HIPAA/SMS compliance is Hurdle #1
- [[why-now-timing-analysis]] — HIPAA-compliant SMS maturity as a key timing enabler (Reason #2)
- [[soc2-requirements]] — SOC 2 overlaps with HIPAA controls but is voluntary
- [[ai-features-plan]] — Reply drafting must follow "no PHI in message body" constraint
