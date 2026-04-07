# Unit Economics & Scaling Costs

## Viability Summary

The three things that would kill this business — problem isn't real, market can't pay, margins get crushed — are all false. $500K-$1M unscheduled per practice (ADA), $299/mo is <0.5% of revenue, and margins hit 90%+ at 100 practices.

## Cost Assumptions Per Practice/Month

~15 outbound SMS sequences, ~10 emails, ~5 AI message generations (Claude pre-generates on setup, not per-send).

## Cost Breakdown by Stage

### Launch — 10 Practices ($3K MRR)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase (Team + HIPAA) | $558 | $208 Team + $350 HIPAA add-on (required for BAA) |
| Twilio Enterprise (BAA min) | ~$500 | Enterprise Edition required for BAA |
| Twilio SMS (150 msgs) | $1.25 | $0.0083/msg |
| Twilio phone numbers (10) | $12 | $1.15/number/mo |
| Resend email | $0 | Free tier |
| Claude API (Sonnet) | ~$1 | Trivial at this scale |
| Vercel Pro | $20 | |
| Stripe fees | $162 | 2.9% + $0.30 + 0.7% recurring |
| Misc | $30 | Sentry free + domain |
| **Total** | **~$1,284/mo** | **~57% gross margin** |

Twilio Enterprise ($500) and Supabase HIPAA ($350) are fixed costs that dominate at low scale. Higher price point means profitability comes faster than at $199.

### Growth — 100 Practices ($29.9K MRR)

| Service | Cost |
|---------|------|
| Supabase | $558 |
| Twilio Enterprise | ~$500 |
| Twilio SMS (1,500) | $12.45 |
| Twilio numbers (100) | $115 |
| Resend Pro | $20 |
| Claude API | ~$10 |
| Vercel Pro | $20 |
| Stripe fees | $1,615 |
| Misc | $80 |
| **Total** | **~$2,930/mo — 90% gross margin** |

### Scale — 500 Practices ($149.5K MRR)

| Service | Cost |
|---------|------|
| Supabase (upgraded) | $908 |
| Twilio Enterprise | ~$500 |
| Twilio SMS (7,500) | $62 |
| Twilio numbers (500) | $575 |
| Resend Scale | $90 |
| Claude API | ~$45 |
| Vercel Pro (2 seats) | $40 |
| Stripe fees | $8,073 |
| Misc | $150 |
| **Total** | **~$10,443/mo — 93% gross margin** |

## The Margin Curve

| Stage | Practices | MRR | Cost | Gross Margin |
|-------|-----------|-----|------|-------------|
| Launch | 10 | $2,990 | $1,284 | **57%** |
| Early | 25 | $7,475 | $1,557 | **79%** |
| Growth | 100 | $29,900 | $2,930 | **90%** |
| Scale | 500 | $149,500 | $10,443 | **93%** |

Business is already margin-positive at launch. Every practice beyond 10 is near-pure margin improvement.

## Key Insight: Stripe is the Largest Cost at Scale

At $149.5K MRR, Stripe takes ~$8,073/mo — more than all infrastructure combined. Mitigation options: encourage ACH (0.8% vs 2.9%), negotiate custom rates at $80K+ volume, or explore Paddle.

## Negotiation Leverage at Scale

- Twilio: 50% HIPAA fee reduction for 2-year commitment (saves $3K/yr)
- Stripe: Custom rates ~2.4% + $0.30 at $100K+ volume (saves ~$750/mo)
