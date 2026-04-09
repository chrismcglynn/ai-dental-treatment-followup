# AI Automated Conversations Plan

> Enable fully automated AI-driven patient conversations where the chatbot handles routine follow-up replies and escalates booking questions, clinical concerns, and insurance inquiries to the front desk team.

## Problem

Today's follow-up flow is linear and staff-dependent: touchpoints fire on a schedule, patient replies get classified by intent, and staff must manually review and reply in the inbox. The AI can draft replies, but a human must approve and send every one. This creates response delays (especially after hours) and puts repetitive work on front desk staff who could focus on higher-value tasks.

## What Already Exists

The current architecture is ~80% of the way there:

| Capability | File | Status |
|---|---|---|
| Intent classification (6 types) | `src/app/api/ai/classify-intent/route.ts` | Working — classifies into `wants_to_book`, `has_question`, `not_ready`, `wrong_number`, `stop`, `other` |
| AI reply drafting (HIPAA-safe) | `src/app/api/ai/draft-reply/route.ts` | Working — generates contextual replies using conversation history, patient name, intent |
| Twilio inbound webhook | `src/app/api/webhooks/twilio/route.ts` | Working — receives SMS, creates message, fires classify-intent async |
| Twilio outbound send | `src/app/api/inbox/reply/route.ts` | Working — sends via Twilio, creates outbound message record |
| STOP/opt-out | classify-intent route | Working — hard-coded STOP check runs before AI, auto-opts-out enrollments |
| Auto-conversion | classify-intent route | Working — `wants_to_book` auto-marks enrollment as converted |
| Queue processor | `src/app/api/cron/process-queue/route.ts` | Working — processes queued outbound messages |
| Conversation tracking | `conversations` table | Working — tracks last_message, unread_count, latest_intent |

**The gap is not generating replies — it's the decision layer around when to auto-send vs. escalate.**

## Architecture: Conversation Mode State Machine

```
manual          — Current behavior. Staff handles everything. (default for all existing conversations)
auto_idle       — Auto-reply enabled, no active patient reply. Scheduled touchpoints proceed normally.
auto_replying   — Patient replied, AI is actively handling. Touchpoints paused.
escalated       — AI determined it cannot handle this. Surfaced to front desk with reason.
staff_handling  — Staff manually took over (from escalation or by clicking "Take Over").
```

Transitions:
- `auto_idle → auto_replying`: Inbound message received on auto-enabled sequence
- `auto_replying → auto_idle`: Conversation goes quiet (no reply within timeout window)
- `auto_replying → escalated`: Escalation trigger fires
- `auto_replying → staff_handling`: Staff clicks "Take Over"
- `escalated → staff_handling`: Staff opens and responds to escalated conversation
- `staff_handling → auto_idle`: Staff clicks "Return to Auto"

## Escalation Triggers

Any single trigger fires → escalate to human:

1. **Intent `wrong_number`** — always escalate
2. **Low confidence** — `intent_confidence < 0.6` (classifier unsure)
3. **Clinical keywords** — pain, emergency, swelling, bleeding, infection, abscess, fever, broken tooth → "I'll have the team reach out right away"
4. **Financial keywords** — insurance, cost, price, payment, copay, covered, how much, deductible
5. **Scheduling specifics** — "what times", "next available", "do you have" (needs calendar access the bot doesn't have)
6. **Volume cap** — `auto_reply_count >= max_auto_replies` (default 3)
7. **Outside business hours** (Phase 5) — escalate for next morning

## Guard Rails

- Identical HIPAA system prompt as existing draft-reply (no PHI, no treatment names, portal_link only)
- `max_auto_replies` per conversation (default: 3) — prevents loops and patient frustration
- `auto_reply_delay_seconds` (default: 30s) — don't reply faster than a human would text
- Bot scope enforced in prompt: "You are a scheduling assistant, not a medical professional"
- Every auto-reply tagged `sent_by: 'ai_auto'` for full audit trail
- STOP/opt-out handling unchanged (hard-coded, runs before any AI processing)
- TCPA: auto-replies count toward the same sequence cadence, not additional unsolicited messages

---

## Phase 1 — Foundation

> DB schema changes and type updates. No behavioral changes — everything defaults to `manual`.

### Database Migration (`supabase/migrations/00007_auto_reply_foundation.sql`)

```sql
-- Conversation automation fields
ALTER TABLE conversations ADD COLUMN conversation_mode text DEFAULT 'manual'
  CHECK (conversation_mode IN ('manual','auto_idle','auto_replying','escalated','staff_handling'));
ALTER TABLE conversations ADD COLUMN auto_reply_count integer DEFAULT 0;
ALTER TABLE conversations ADD COLUMN escalation_reason text;
ALTER TABLE conversations ADD COLUMN escalated_at timestamptz;

-- Message sender tracking (audit trail)
ALTER TABLE messages ADD COLUMN sent_by text DEFAULT 'staff'
  CHECK (sent_by IN ('staff','ai_auto','system'));

-- Sequence automation opt-in
ALTER TABLE sequences ADD COLUMN auto_reply_enabled boolean DEFAULT false;

-- Fast lookup for escalated/active conversations
CREATE INDEX idx_conversations_mode ON conversations(practice_id, conversation_mode)
  WHERE conversation_mode IN ('escalated','auto_replying');
```

### TypeScript Types

Update `src/types/database.types.ts`:
- Add `conversation_mode`, `auto_reply_count`, `escalation_reason`, `escalated_at` to conversations Row/Insert/Update
- Add `sent_by` to messages Row/Insert/Update
- Add `auto_reply_enabled` to sequences Row/Insert/Update
- Add `conversation_mode` and `sent_by` to Enums

Update `src/types/app.types.ts`:
- Add `ConversationMode` type alias

### Files

| Action | File |
|---|---|
| Create | `supabase/migrations/00007_auto_reply_foundation.sql` |
| Modify | `src/types/database.types.ts` |
| Modify | `src/types/app.types.ts` |

---

## Phase 2 — Escalation Engine

> Smart triage — classify inbound messages and automatically escalate conversations that need human attention. Staff sees "AI flagged this" with the reason. No auto-sending.

### Escalation Logic (`src/lib/ai/escalation.ts`)

```ts
export interface EscalationResult {
  shouldEscalate: boolean;
  reason: string | null;
}

export function checkEscalation(params: {
  intent: IntentType;
  confidence: number;
  body: string;
  autoReplyCount: number;
  maxAutoReplies?: number; // default 3
}): EscalationResult
```

Keyword arrays for clinical, financial, and scheduling detection. Returns `{ shouldEscalate: true, reason: "Patient mentioned clinical concern" }` or `{ shouldEscalate: false, reason: null }`.

### Integration Point

Wire into `src/app/api/ai/classify-intent/route.ts` after `applyClassification()`:
1. Look up the patient's active enrollment → get the sequence
2. Check if `sequence.auto_reply_enabled === true`
3. If yes, fetch the conversation's `auto_reply_count`
4. Call `checkEscalation()`
5. If escalation triggered → update conversation: `conversation_mode = 'escalated'`, `escalation_reason`, `escalated_at`

No changes needed to the Twilio webhook — it already fires classify-intent asynchronously.

### Touchpoint Pausing

Modify `src/app/api/cron/process-queue/route.ts`:
- Before processing each queued message, check if the patient's conversation is in an active state (`auto_replying`, `escalated`, `staff_handling`)
- If so, skip that message (leave it queued) — touchpoints pause during active conversations

### Inbox UI Updates

**ConversationList** (`src/components/features/inbox/ConversationList.tsx`):
- Add "Escalated" tab to the filter tabs
- Show amber badge on escalated conversations

**ConversationThread** (`src/components/features/inbox/ConversationThread.tsx`):
- Show amber banner below header: "AI escalated: {reason}"

**Inbox Store** (`src/stores/inbox-store.ts`):
- Add `"escalated"` to `InboxFilter` type

**Inbox API** (`src/lib/api/inbox.ts`):
- Handle `"escalated"` filter — query where `conversation_mode = 'escalated'`

### Sandbox Updates

Add `conversation_mode`, `auto_reply_count`, `escalation_reason`, `escalated_at` to sandbox conversation objects in `src/lib/sandbox/sandboxData.ts`. Include one pre-escalated conversation for the demo.

### Files

| Action | File |
|---|---|
| Create | `src/lib/ai/escalation.ts` |
| Modify | `src/app/api/ai/classify-intent/route.ts` |
| Modify | `src/app/api/cron/process-queue/route.ts` |
| Modify | `src/stores/inbox-store.ts` |
| Modify | `src/lib/api/inbox.ts` |
| Modify | `src/components/features/inbox/ConversationList.tsx` |
| Modify | `src/components/features/inbox/ConversationThread.tsx` |
| Modify | `src/lib/sandbox/sandboxData.ts` |

---

## Phase 3 — Auto-Reply MVP

> The bot starts sending replies — but only for the safest intents, with a 1-reply cap, default OFF.

### Auto-Reply Orchestrator (`src/lib/ai/auto-reply.ts`)

Core function: `handleAutoReply(params)`:
1. After classify-intent runs and escalation check passes (no escalation)
2. Verify `auto_reply_count < 1` (ultra-conservative for MVP)
3. Generate reply using existing `draft-reply` logic (extract from the API route into a shared function)
4. Wait `auto_reply_delay_seconds` (30s default)
5. Send via Twilio (reuse send logic from `inbox/reply`)
6. Create message record with `sent_by: 'ai_auto'`, `direction: 'outbound'`
7. Update conversation: `auto_reply_count++`, `conversation_mode = 'auto_replying'`

### Allowed Intents (MVP)

Only auto-reply to:
- `not_ready` — "No problem! The offer stays open whenever you're ready. Feel free to reach out anytime."
- `other` — Generic re-engagement, point to portal link

Do NOT auto-reply to:
- `wants_to_book` — already auto-converts enrollment; staff should confirm and schedule
- `has_question` — too risky without knowing the question type
- `stop` — handled by existing opt-out logic
- `wrong_number` — escalated

### Practice Toggle

Add to practice settings (or `practices` table metadata):
- `auto_reply_enabled: boolean` (default: false)
- UI toggle in settings page

### Auto-Reply Indicator in Inbox

- Show "AI replied" badge on messages sent by `ai_auto`
- MessageBubble component shows subtle "AI" indicator on auto-sent messages

### Files

| Action | File |
|---|---|
| Create | `src/lib/ai/auto-reply.ts` |
| Modify | `src/app/api/ai/classify-intent/route.ts` (call auto-reply after escalation check) |
| Modify | `src/app/api/ai/draft-reply/route.ts` (extract generation logic into shared function) |
| Modify | `src/components/features/inbox/MessageBubble.tsx` (AI sent indicator) |
| Modify | `src/components/features/settings/` (auto-reply toggle) |
| Modify | `src/lib/sandbox/simulationEngine.ts` (simulate auto-replies in demo) |

---

## Phase 4 — Expand and Configure

> Increase reply limits, handle more intents, add sequence-level control and analytics.

### Increased Auto-Reply Limit

- Raise `max_auto_replies` from 1 to 3
- Configurable per practice in settings

### Handle Safe `has_question` Cases

Extend the classifier or add a secondary Claude call to sub-classify `has_question`:
- **Safe to auto-reply**: "When should I come in?" → "Give us a call at [practice phone] and we'll find a time that works!"
- **Safe to auto-reply**: "How long does it take?" → "Great question! Your doctor can walk you through the details — check your treatment info at [portal_link]"
- **Escalate**: Insurance, cost, specific availability, clinical questions

### Sequence-Level Toggle

- `sequences.auto_reply_enabled` column already exists from Phase 1
- Add toggle to sequence editor UI
- Sequence setting overrides practice default (per-sequence opt-in/out)

### Analytics Dashboard

New analytics cards:
- Auto-reply rate: % of conversations handled fully by AI vs. escalated vs. manual
- Auto-reply conversion rate vs. manual reply conversion rate
- Average response time (auto vs. manual)
- Escalation reasons breakdown (pie chart)

### "Take Over" Button

Add to ConversationThread header when `conversation_mode` is `auto_replying`:
- Staff clicks "Take Over" → sets `conversation_mode = 'staff_handling'`
- Pauses all auto-replies for this conversation

### Files

| Action | File |
|---|---|
| Modify | `src/lib/ai/escalation.ts` (sub-classify has_question) |
| Modify | `src/lib/ai/auto-reply.ts` (handle has_question safe cases, configurable max) |
| Modify | `src/components/features/sequences/SequenceEditor.tsx` (auto-reply toggle) |
| Modify | `src/components/features/inbox/ConversationThread.tsx` ("Take Over" button) |
| Create | `src/components/features/analytics/AutoReplyAnalytics.tsx` |
| Modify | `src/components/features/settings/` (max_auto_replies config) |

---

## Phase 5 — Business Hours, Polish, and Learning

> Production hardening based on real conversation data from Phases 3-4.

### Business Hours Enforcement

- Add `auto_reply_hours` to practice settings: `{ start: "08:00", end: "17:00", timezone: "America/Denver" }`
- Outside hours: don't auto-reply, set `conversation_mode = 'escalated'` with reason "Outside business hours — queued for morning"
- Staff sees these in the "Escalated" tab first thing in the morning

### "Return to Auto" Button

When staff is done handling a conversation (`staff_handling` mode):
- "Return to Auto" button → resets `conversation_mode = 'auto_idle'`, `auto_reply_count = 0`
- AI resumes handling future replies for this conversation

### Prompt Refinement

Analyze real auto-reply conversations from Phases 3-4:
- Which auto-replies led to bookings? Reinforce those patterns
- Which caused escalations? Adjust the system prompt
- A/B test different reply tones/lengths

### Conversation Timeout

- If patient doesn't reply within a configurable window (e.g., 60 minutes) after an auto-reply, transition `auto_replying → auto_idle`
- Scheduled touchpoints resume
- Implementation: cron job or Supabase function that checks `auto_replying` conversations older than timeout

### Multi-Channel Auto-Reply

Extend auto-reply beyond SMS:
- Email auto-replies (longer, more detailed, still HIPAA-compliant)
- Different system prompts per channel
- Email can include more context than 160-char SMS limit

### Files

| Action | File |
|---|---|
| Modify | `src/lib/ai/auto-reply.ts` (business hours check, timeout logic) |
| Modify | `src/components/features/inbox/ConversationThread.tsx` ("Return to Auto" button) |
| Modify | `src/components/features/settings/` (business hours config) |
| Create | `src/app/api/cron/conversation-timeout/route.ts` (timeout cron) |
| Modify | `src/lib/ai/escalation.ts` (business hours escalation) |

---

## Risk Matrix

| Risk | Mitigation | Phase |
|---|---|---|
| Clinically inappropriate response | System prompt prohibits medical advice; clinical keyword escalation | 2 |
| Patient annoyance / rapid-fire | 30s delay, reply cap (1 then 3), business hours | 3, 5 |
| Bot-to-bot infinite loop | max_auto_replies cap; only reply to inbound, never status callbacks | 3 |
| HIPAA violation | Same constraints as existing draft-reply; no PHI in any message; portal_link pattern | 3 |
| Claude API downtime | Escalate (don't auto-reply) when generation fails; keyword fallback for classification | 2, 3 |
| Practice loses trust | Default OFF everywhere; tagged audit trail (`sent_by: 'ai_auto'`); "Take Over" always available | 3, 4 |
| TCPA compliance | STOP handling hard-coded before AI; auto-replies are part of consented sequence, not unsolicited | All |
| Stale conversations | Timeout cron resets `auto_replying` → `auto_idle` after inactivity window | 5 |

## Verification Plan

- **Phase 1**: Run migration, verify columns exist, TypeScript compiles
- **Phase 2**: Unit tests for `checkEscalation()` with all trigger types; manual test escalated badge in sandbox inbox
- **Phase 3**: Integration test — simulate inbound SMS → verify auto-reply sent with `sent_by: 'ai_auto'`; verify max_auto_replies cap works
- **Phase 4**: Verify sequence-level toggle overrides practice default; verify analytics cards render
- **Phase 5**: Verify business hours block auto-replies outside window; verify timeout transitions conversation back to auto_idle
