# Competitive Landscape

## Core Positioning

**Weave is a general communication platform. Retaine is a revenue recovery engine.**

Weave, Dental Intelligence, and others do treatment follow-up as one feature among dozens. Retaine is purpose-built for it.

## Retaine's Differentiators

1. **AI-generated, procedure-aware messaging** — Claude generates messages tuned to procedure type, tone, and sequence step (see [[ai-features-plan]]). Competitors use static templates or `{first_name}` mail merge
2. **Autonomous multi-step sequences** — SMS day 3, email day 10, voicemail day 21 — zero staff intervention. Competitors generate manual call lists
3. **Revenue recovery as primary metric** — Dashboard shows dollars recovered per sequence, per procedure. Competitors show communication metrics
4. **Focused UX = faster adoption** — One job done well vs. a platform doing everything. Value visible in under 10 minutes via [[sandbox-auth-signup-flow|sandbox demo]]
5. **Modern UI** — NextJS + Shadcn. Competitors look like Windows 2003 apps because they're built on WinForms/.NET from the 80s-2000s

## Direct & Adjacent Competitors

| Company | Relationship | Notes |
|---------|-------------|-------|
| **Dental Intelligence** | Closest incumbent | Automated follow-up task lists + 2-way texting, but still requires staff to act manually |
| **Zuub** | Most direct competitor | Automated SMS/email for unscheduled treatment. No AI-generated content or multi-step sequences |
| **Weave** | Adjacent — broad platform | Treatment follow-up is one checkbox among dozens. Manual follow-up lists, no autonomous sequences |
| **BlueIQ** | Adjacent — analytics | KPI dashboard with texting. $149/mo. Different value prop (reporting vs. recovery automation) |
| **SmileData** | Adjacent — opportunity surfacing | $299/mo. Surfaces treatment opportunities but staff still does the outreach |
| **OS Dental** | Not a competitor | DSO financial operating system for CFOs. No patient communication |
| **Clarifi Health** | Not a threat | Minimal web presence. Likely defunct or very early stage |

## Oryx: The Modern PMS Threat

Oryx is the exception to ugly dental software — cloud-native, Google Cloud, modern UI, Inc. 5000 ranked. Currently a full PMS (not a competitor), but:

- Already has "automated workflows for follow-ups and personalized messaging"
- Just added AI call summaries and AI receptionist via Mango Voice integration
- **Estimated 18-36 months** before they could build a credible treatment follow-up feature

**Strategic implication:** Oryx practices are great early adopters (tech-forward, good testimonials), but the primary market is legacy PMS practices. Oryx is also a potential acquirer/partner if Retaine has traction.

## Why Legacy PMS is the Beachhead

- Open Dental: ~30K practices. Dentrix + Eaglesoft: ~60-80K. Oryx: ~2K
- Legacy PMS practices aren't switching — 15 years of billing history, staff muscle memory, insurance fee schedules lock them in
- Practices migrating to new PMS are in maximum disruption — worst time to pitch another tool
- **Start with [[open-dental-integration-architecture|Open Dental]] specifically** — most open API, active vendor marketplace, culture of add-on integrations

## Why Dental Software Looks Outdated

Buyers weren't users (sold at trade shows to dentists, not front desk). Codebases predate modern web. Switching costs kill design incentives. Healthcare cargo-culted "serious = ugly." This means the bar for "wow" is extremely low — Retaine's UI is an instant visceral sell.

---

## Related

- [[why-now-timing-analysis]] — Why incumbents haven't solved this and the convergence window
- [[market-size-and-opportunity]] — Market size and positioning context
- [[ai-features-plan]] — AI-powered features that differentiate from competitors
- [[pms-connector-architecture]] — PMS integration strategy across vendor ecosystems
- [[product-hurdles-and-mitigation]] — Competitor response is Hurdle #7; data moat as defense
