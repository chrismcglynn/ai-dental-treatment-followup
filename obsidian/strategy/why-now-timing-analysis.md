# Why Now: Timing Analysis

## Summary

The unscheduled treatment problem is 20 years old. The tools to solve it properly converged in the last ~24 months. This is a timing play — not a new problem, a newly solvable one.

## The 7 Reasons This Hasn't Been Done Well

### 1. PMS Integration Was Too Hard
Dentrix, Eaglesoft, Open Dental each had closed ecosystems. Vendor authorization took months of legal work. **Now:** Middleware like Kolla, DentalBridge, CRMBridge provide a single API across PMS systems at ~$19/location (down from ~$65).

### 2. HIPAA-Compliant SMS Was a Legal Minefield
Standard SMS lacks encryption and audit trails. Founders avoided SMS-first healthcare products. **Now:** Twilio offers HIPAA-eligible messaging with BAAs built in. Get consent, use encrypted platform, sign BAA — solved.

### 3. Incumbents Solve a Different Problem
Dental Intelligence, Weave, RevenueWell started as appointment reminder tools. Treatment follow-up was bolted on later — always requiring manual staff action. Rebuilding for autonomy would mean starting over.

### 4. AI Personalization Didn't Exist
Before 2022-2023, "personalization" meant `{first_name}` in a template. Static templates feel like spam and have poor conversion. LLM-generated, procedure-specific, tone-adjusted messages are genuinely new.

### 5. Dental Market Resisted SaaS
Most of the 2010s: on-premise Windows servers, no cloud, distrust of anything touching patient data. **Now:** 80%+ of practices use cloud systems (10%+ CAGR). Post-COVID dentists expect self-serve SaaS.

### 6. Everyone Went Broad, Nobody Focused
Every company that touched treatment follow-up immediately expanded into scheduling, payments, reviews, forms. The specific problem got deprioritized. Practices now juggle 5-7 tools yet completion still drops 10%.

### 7. Business Model Needed the AI Layer
Per-seat/per-feature pricing made ROI murky and sales cycles long. The "$299/mo flat, see recovered revenue in week one" model only works if AI-generated messages actually convert — which they now can.

## The Convergence Window

| Prerequisite | Before 2023 | Now |
|---|---|---|
| Reliable LLMs for personalization | Not viable | Claude API available |
| HIPAA-compliant SMS BAA | Complex / expensive | Twilio BAA — standard |
| PMS middleware APIs | Build-it-yourself | Kolla, DentalBridge, CRMBridge |
| Cloud-native dental practices | Minority | 80%+ of practices |
| Dental SaaS buying behavior | Phone-first, contract-heavy | Self-serve expected |
| Competitor awareness of the gap | Low | Still low — window open |

## Strategic Implication

The window is real but not permanent. As LLMs commoditize, the advantage shifts from "can you build this" to "do you have the data." The moat to build is **conversion intelligence** — aggregate data on which timing, tone, channel, and procedure combinations convert best. That data asset is what makes this defensible and attractive to acquirers (Henry Schein, Patterson, Dentsply Sirona, Weave).

---

## Related

- [[competitive-landscape]] — Incumbent blindspots and Oryx as the modern PMS threat
- [[market-size-and-opportunity]] — The $89B problem and market readiness
- [[pms-connector-architecture]] — PMS middleware APIs that removed the integration barrier
- [[hipaa-baa-go-live-checklist]] — HIPAA compliance maturity that makes SMS follow-up viable
- [[ai-features-plan]] — The AI personalization layer (Reason #4) in practice
- [[product-hurdles-and-mitigation]] — Each hurdle maps to a "why now" timing reason
