# SOC 2 Compliance Requirements

## What It Is

SOC 2 is a security audit framework (AICPA) certifying that a software company has controls to protect customer data across five criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy.

- **Type I** — snapshot: controls are designed correctly as of a date
- **Type II** — ongoing: controls operated effectively over 6-12 months (what enterprise buyers require)

Cost: $15K-$50K+ depending on automation. Timeline: 6-12 months for Type II.

## Do You Need It Now?

**No.** HIPAA compliance is the bar for Retaine's current stage, not SOC 2.

| Stage | SOC 2 Required? |
|-------|----------------|
| Pilot practice | No |
| Independent practices (1-10 locations) | No |
| Mid-market DSO (10-50 locations) | Sometimes — may accept a security questionnaire |
| Enterprise DSO / acquirer due diligence | Yes — almost certainly |

## HIPAA vs SOC 2

- **HIPAA** — legal requirement for handling PHI. Must comply.
- **SOC 2** — voluntary certification signaling security maturity to enterprise buyers.

They overlap significantly. Current HIPAA infrastructure (Supabase HIPAA add-on, Twilio Enterprise BAAs, magic-link tokens, RLS policies) is the right foundation — SOC 2 would formally audit those same controls.

## Practical Recommendation

1. **Now:** Track toward SOC 2 readiness without paying for the audit. Use Vanta (~$800/mo) or Drata for continuous control monitoring and a "readiness score"
2. **When pitching multi-location groups:** Credibly say "SOC 2 Type II in process" — often enough to pass procurement
3. **Trigger for actual audit:** When a 20+ location prospect requires it as a condition of signing. That's when it becomes a real cost of sales
