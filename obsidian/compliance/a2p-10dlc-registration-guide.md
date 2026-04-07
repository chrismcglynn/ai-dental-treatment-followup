# A2P 10DLC Registration Guide

> Step-by-step guide for registering Retaine's SMS messaging with carriers via Twilio. Required before sending any production SMS to patients. Unregistered messages are silently dropped or blocked by T-Mobile, AT&T, and Verizon.

---

## Why This Matters

Since December 2024, US carriers block all unregistered A2P (Application-to-Person) messaging on 10-digit long codes (10DLC). Without registration:

- Messages are silently dropped (especially T-Mobile and AT&T)
- Carrier surcharges are 3-5x higher than registered rates
- Throughput is capped as low as 1 message/second
- Twilio may suspend your number or account
- No recourse for false-positive filtering

**This is a hard blocker for the pilot.** Start registration 4-6 weeks before you need to send production SMS.

---

## Registration Steps (All Done in Twilio Console)

Everything goes through Twilio — you never interact with The Campaign Registry (TCR) directly.

### Step 1: Create Business Profile

**Path:** Twilio Console > Messaging > Trust Hub > Business Profiles

Provide:
- Legal business name and DBA
- EIN (US Tax ID)
- Business address
- Website URL (retaine.io)
- Contact info
- Business type: "Technology / SaaS"
- Industry: "Healthcare"

**Timeline:** Same day (your effort)

### Step 2: Register Brand

**Path:** Twilio Console > Messaging > Trust Hub > Brands

Twilio submits your company as a "Brand" to TCR. Two vetting tiers:

| Tier | What | Cost | Throughput |
|------|------|------|-----------|
| **Standard** | Automated basic vetting | $4 (one-time) | Lower limits |
| **Secondary/Enhanced** | Deeper vetting via Aegis Mobile | $40 (one-time) | Higher limits — **recommended for healthcare** |

**Do enhanced vetting.** Healthcare campaigns with only standard vetting get low throughput caps that won't scale past the pilot.

**Timeline:** 1-7 business days

### Step 3: Register Campaign

**Path:** Twilio Console > Messaging > Trust Hub > Campaigns

A "Campaign" = a specific messaging use case tied to your Brand. You must provide:

| Field | What to Enter |
|-------|--------------|
| **Use case type** | "Healthcare" |
| **Sub-use case** | Treatment follow-up / appointment reminders |
| **Sample messages** (2-5) | See examples below |
| **Opt-in flow** | "Patients consent during treatment plan presentation at the practice. Consent is documented in the practice's PMS as part of standard intake." |
| **Opt-out flow** | "Every message includes 'Reply STOP to opt out.' STOP keyword is handled automatically by Twilio Advanced Opt-Out. Patient is immediately flagged as DNC in our system and never messaged again." |
| **Message volume** | Estimate: 15-50 messages/practice/month at launch |
| **Contains links?** | Yes (patient portal links) |
| **Contains phone numbers?** | Yes (practice phone number) |

**Sample messages for registration:**

```
"Hi Maria, Riverside Family Dental wanted to follow up about your treatment plan. View details and schedule here: https://app.retaine.io/portal/[token] Reply STOP to opt out."
```

```
"Hi James, Dr. Rodriguez's office has an opening this week for your upcoming procedure. Would you like to schedule? Reply YES or call us at (720) 555-0142. Reply STOP to opt out."
```

```
"Hi Susan, this is a friendly reminder from Bright Smile Dental about your treatment plan. We'd love to help you get scheduled — tap here to view: https://app.retaine.io/portal/[token] Reply STOP to opt out."
```

**Timeline:** 1-4 weeks (T-Mobile is the slowest carrier to approve). Rejections require resubmission.

### Step 4: Associate Phone Numbers

**Path:** Twilio Console > Phone Numbers

Link each practice's Twilio phone number to the approved Campaign. Only then will messages flow without carrier filtering.

**Tip:** Use a Twilio **Messaging Service** as a container for sender numbers + Campaign. This gives you sticky sender, fallback numbers, and compliance management in one place.

---

## Costs

| Fee | Amount | Frequency |
|-----|--------|-----------|
| Brand registration (TCR) | $4 | One-time |
| Enhanced vetting | $40 | One-time |
| Campaign registration (TCR) | $15 | One-time |
| Campaign fee | $10/month | Per campaign, recurring |
| Carrier surcharges | ~$0.003-$0.005/msg | Per message (T-Mobile, AT&T) |
| Twilio SMS pricing | ~$0.0079/outbound segment | Per message |

**Total one-time:** ~$59
**Total ongoing:** ~$10/month + per-message fees (trivial at pilot scale)

---

## Healthcare-Specific Considerations

### 10DLC ≠ HIPAA
10DLC registration is a carrier trust/spam-prevention mechanism. It does not make you HIPAA compliant. You still need:
- BAA with Twilio (Enterprise Edition) — see [[hipaa-baa-go-live-checklist]]
- No PHI in SMS body — use [[hipaa-patient-portal-reference|patient portal]] links

### Healthcare Campaigns Get Favorable Treatment
TCR has a specific "Healthcare" use case category. Carriers view healthcare SMS as high-value to recipients, so approval rates are generally good — but you must demonstrate:
- Clear patient opt-in consent
- Working STOP/HELP keyword handling
- Messages that are informational/transactional, not marketing

### Consent Requirements (TCPA)
- **Treatment follow-up messages** = transactional → require **express consent** (lower bar than marketing)
- **Promotional messages** (e.g., "we have a special on whitening") = marketing → require **express written consent** (higher bar)
- Retaine's messages are treatment follow-up → transactional. The practice's existing patient intake consent covers this
- Keep healthcare and marketing consent separate — two different opt-ins (see [[product-hurdles-and-mitigation#1 HIPAA SMS Compliance]])

---

## Timeline Summary

| Step | Duration | When to Start |
|------|----------|--------------|
| Business Profile | Same day | 6 weeks before pilot |
| Brand + Enhanced Vetting | 1-7 days | 5 weeks before pilot |
| Campaign Registration | 1-4 weeks | 4 weeks before pilot |
| Number Association | Same day | After campaign approval |
| **Total** | **2-6 weeks** | **Start ASAP** |

**T-Mobile is the bottleneck.** Their review is the slowest and strictest. If rejected, you must revise and resubmit, restarting the clock.

---

## Twilio Documentation Links

- 10DLC overview: https://www.twilio.com/docs/messaging/guides/10dlc
- Registration walkthrough: https://www.twilio.com/docs/messaging/guides/10dlc/10dlc-getting-started
- A2P 10DLC pricing: https://www.twilio.com/en-us/a2p-10dlc
- Trust Hub: https://www.twilio.com/docs/trust-hub
- HIPAA on Twilio: https://www.twilio.com/en-us/hipaa

---

## Checklist

- [ ] Twilio Enterprise account with BAA signed
- [ ] Business Profile created in Trust Hub
- [ ] Brand registered with enhanced vetting ($44)
- [ ] Healthcare campaign registered with sample messages ($15 + $10/mo)
- [ ] Campaign approved by all major carriers (T-Mobile, AT&T, Verizon)
- [ ] Pilot practice phone number associated with campaign
- [ ] STOP keyword handling tested end-to-end
- [ ] Test SMS sent and delivered to real phone on each carrier

---

## Related

- [[hipaa-baa-go-live-checklist]] — BAA requirements (separate from 10DLC)
- [[hipaa-patient-portal-reference]] — Why messages contain portal links, not PHI
- [[product-hurdles-and-mitigation]] — HIPAA/SMS compliance is Hurdle #1
- [[pilot-launch-checklist]] — 10DLC is a gate in the pilot checklist
- [[unit-economics-and-scaling-costs]] — Carrier surcharges are part of per-message costs
