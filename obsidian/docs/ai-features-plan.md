# AI Features Plan

## Context

The app currently uses simple keyword matching to detect booking intent in patient replies, manual sequence-to-treatment matching via [[ada-dental-codes|ADA code]] overlap, and no reply assistance for staff. These three features add Claude-powered intelligence to replace brittle heuristics and reduce front desk workload.

All three features call Claude server-side via the Anthropic API (already integrated at `/src/app/api/preview-message/route.ts`). Anthropic API inputs are not used for model training, and prompts will contain only first names and procedure descriptions (no SSNs, DOBs, insurance IDs) -- consistent with the existing integration pattern.

---

## Shared Infrastructure: AI Service Layer

**New file:** `src/lib/ai/claude.ts`

Extract a reusable helper from the existing inline `fetch` in `preview-message/route.ts`:

```ts
export async function callClaude(params: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string | null>
```

- Reads `ANTHROPIC_API_KEY` from env, returns `null` if missing or on error
- Uses `claude-sonnet-4-20250514`, 10s timeout via `AbortController`
- Centralized error logging

**Refactor:** `src/app/api/preview-message/route.ts` to use `callClaude` instead of inline fetch.

---

## Feature 1: Reply Intent Classification

### What it does
When a patient texts back, Claude classifies the reply into: `wants_to_book`, `has_question`, `not_ready`, `wrong_number`, `stop`, `other`. The inbox shows intent badges so front desk sees a priority queue instead of raw messages.

### Database changes

New Supabase migration `00004_add_intent_classification.sql`:

```sql
ALTER TABLE messages ADD COLUMN intent text DEFAULT NULL;
ALTER TABLE messages ADD COLUMN intent_confidence real DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN latest_intent text DEFAULT NULL;
```

Regenerate `src/types/database.types.ts`.

### API changes

**New route:** `src/app/api/ai/classify-intent/route.ts`
- Accepts `{ messageId, body }`
- Calls Claude with classification prompt (see below)
- Updates `messages.intent` + `messages.intent_confidence`
- Updates `conversations.latest_intent`
- If `wants_to_book` -> auto-converts active enrollments (see [[patient-statuses-and-lifecycle#Conversion Detection]])
- If `stop` -> marks enrollments as `opted_out` (see [[patient-statuses-and-lifecycle#Sequence Enrollment Statuses]])

**Modify:** `src/app/api/webhooks/twilio/route.ts`
- Keep existing `hasBookingIntent()` keyword check as synchronous fast path for immediate enrollment conversion
- After returning TwiML response, fire async classification via `fetch` to `/api/ai/classify-intent` (fire-and-forget with `waitUntil` or detached fetch)
- Hard-coded `STOP` keyword check stays for TCPA compliance -- skip AI, immediately opt out

### Claude prompt

```
System: You are a dental practice message classifier. Classify the patient's
SMS reply into exactly one category. Respond with ONLY a JSON object.

Categories:
- "wants_to_book": Patient wants to schedule/book/confirm. Includes "yes", "sounds good", "let's do it"
- "has_question": Asking about cost, insurance, procedure, timing
- "not_ready": Declining, delaying. "Not right now", "maybe later"
- "wrong_number": Says wrong number or doesn't know what this is about
- "stop": Wants to unsubscribe, opt out. "STOP", "unsubscribe"
- "other": Anything else

Output: {"intent": "<category>", "confidence": <0.0-1.0>}

User: Patient SMS: "{messageBody}"
```

### Frontend changes

**Modify:** `src/components/features/inbox/ConversationList.tsx`
- Remove `BOOKING_KEYWORDS` array and `hasBookingIntent()` function
- Read `conversation.latest_intent` from data
- Show intent-specific badges:
  - `wants_to_book` -> green `CalendarCheck` icon
  - `has_question` -> blue `HelpCircle` icon
  - `stop` -> red `Ban` icon
  - `not_ready` -> gray `Clock` icon (subtle)
  - `wrong_number` -> orange `AlertTriangle` icon

**Modify:** `src/stores/inbox-store.ts`
- Add `"urgent"` filter option (conversations where `latest_intent` is `wants_to_book` or `has_question`)

**Modify:** `src/lib/api/inbox.ts`
- Update `getConversations` to support the `urgent` filter

**Modify:** `src/components/features/inbox/ConversationThread.tsx`
- Show intent badge in thread header next to patient name

### Sandbox/demo mode
- No real Claude calls in [[sandbox-auth-signup-flow|sandbox]] mode. Add `latest_intent` values to seeded conversations in `src/lib/sandbox/sandboxData.ts`
- Weight toward `wants_to_book` for demo impact

### Fallback
- If Claude unavailable, fall back to keyword matching. Set `intent_confidence = 0` to indicate keyword-based.

---

## Feature 2: Smart Sequence Assignment

### What it does
When staff opens the EnrollDialog, Claude analyzes treatment descriptions + available sequences and suggests the best match -- going beyond simple ADA code overlap to include semantic understanding of procedure types.

### Database changes
None. AI suggestion is ephemeral (runs at dialog-open time).

### API changes

**New route:** `src/app/api/ai/suggest-sequence/route.ts`

Request:
```ts
{
  treatmentDescriptions: string[];   // ["Crown - Porcelain/Ceramic"]
  treatmentCodes: string[];          // ["D2740"]
  sequences: Array<{
    id: string;
    name: string;
    description: string | null;
    treatment_type: string | null;
    conversion_rate: number;
    patient_count: number;
  }>;
}
```

Response:
```ts
{
  suggestions: Array<{
    sequenceId: string;
    score: number;       // 0-100
    reason: string;      // 1-sentence explanation
  }>;
}
```

### Claude prompt

```
System: You are a dental practice workflow assistant. Given dental treatments
(ADA codes + descriptions) and available follow-up sequences, rank which
sequences best fit.

Consider:
1. Direct ADA code matches (highest weight)
2. Semantic similarity (e.g. "Major Restorative" sequence fits crowns/bridges)
3. Sequence performance (prefer higher conversion rates when matches are close)

Respond with ONLY a JSON array sorted by best match:
[{"sequenceId": "...", "score": 85, "reason": "Direct code match for D2740"}]
```

### Frontend changes

**Modify:** `src/app/(dashboard)/treatments/pending/EnrollDialog.tsx`
- When dialog opens with sequences loaded, fire `useSuggestSequence` mutation
- While loading: show existing code-based sort with "AI analyzing..." shimmer on top card
- When AI response arrives: re-sort by AI score, show "AI Recommended" badge (sparkle icon) on top result, show `reason` as italic subtext
- Auto-select top suggestion if score >= 80
- Existing `scoredSequences` useMemo stays as initial/fallback sort

**New hook in** `src/hooks/useSequences.ts`:
```ts
export function useSuggestSequence() {
  return useMutation({ mutationFn: ... });
}
```

### Sandbox/demo mode
- In [[sandbox-auth-signup-flow|sandbox]] mode, skip API call. Return hardcoded suggestion matching the first sequence with highest code overlap after 800ms simulated delay.

### Fallback
- If AI unavailable, silently fall back to existing code-matching sort. Show subtle "AI suggestions unavailable" note.

### Edge case: No sequences exist -- AI generates one

When no active sequences exist, instead of just showing "Create Sequence", Claude generates a recommended sequence based on the selected treatments.

**New API route:** `src/app/api/ai/generate-sequence/route.ts`

Request:
```ts
{
  treatmentDescriptions: string[];   // ["Crown - Porcelain/Ceramic"]
  treatmentCodes: string[];          // ["D2740"]
}
```

Response:
```ts
{
  name: string;                    // e.g. "Crown & Restorative Follow-Up"
  procedures: string[];            // ADA codes to target
  steps: Array<{
    dayOffset: number;
    channel: "sms" | "email" | "voicemail";
    tone: "friendly" | "clinical" | "urgent";
  }>;
  reasoning: string;               // Why this sequence structure
}
```

Claude prompt asks it to design a 3-4 step follow-up sequence with staggered timing and mixed channels, based on typical dental practice follow-up patterns for the given procedure types.

**UI flow in EnrollDialog:**
1. When `scoredSequences.length === 0`, show an "AI Recommended" card with a loading shimmer while Claude generates
2. When response arrives, show the suggested sequence as a special card:
   - Sparkle icon + "AI Recommended" badge
   - Sequence name, step count, channel mix summary
   - Claude's reasoning as italic subtext
   - "Use This Sequence" button
3. Clicking "Use This Sequence" navigates to `/sequences/new` with the AI-generated data pre-populated in the SequenceBuilder
4. The `SequenceBuilder` already accepts `initialName`, `initialProcedures`, and `initialSteps` props -- pass the AI data via URL search params (encoded JSON) or a Zustand store
5. User reviews/edits the pre-populated builder, saves, then returns to enroll

**Zustand approach (preferred over URL params to avoid URL length limits):**
- Add `aiSuggestedSequence` field to a new or existing store
- EnrollDialog sets it before navigating
- `NewSequencePage` reads it as initial values, then clears it

### Edge case: Single sequence

When only one active sequence exists, skip the AI ranking call entirely:
- Auto-select the single sequence (radio pre-filled)
- Show a subtle note: "Only 1 active sequence -- auto-selected"
- Still show the sequence card with its code match count (existing logic)
- User can proceed directly to "Enroll Patients" without extra clicks

### Edge case: 50+ treatments selected

When the user selects a large batch of treatments (50+), the AI prompt would become too large and slow:
- **Deduplicate by ADA code first** -- many patients may share the same procedure. Extract unique `(code, description)` pairs
- **If >20 unique codes remain**, truncate to the 20 most common (by frequency in the selection)
- Show a note in the dialog: "AI analyzed your top 20 treatment types (out of {n} total)"
- Pass only the truncated list to `/api/ai/suggest-sequence`
- The existing code-matching sort (`scoredSequences` useMemo) still runs against ALL selected codes -- only the AI ranking is truncated
- This keeps the prompt under ~2000 tokens and response time under 3 seconds

---

## Feature 3: Reply Drafting Assist

### What it does
A "Suggest Reply" button in the ReplyComposer. When clicked, Claude drafts an SMS response based on conversation history and treatment context. Staff edits and sends.

### Database changes
None. Drafts are ephemeral (component state).

### API changes

**New route:** `src/app/api/ai/draft-reply/route.ts`

Request:
```ts
{
  patientFirstName: string;
  recentMessages: Array<{
    direction: "inbound" | "outbound";
    body: string;
  }>;                                    // Last 10 messages
  latestIntent: string | null;           // From Feature 1
  treatmentDescription: string | null;   // Most recent pending treatment
  practiceName: string;
}
```

Response:
```ts
{
  draft: string;       // Suggested reply text (<320 chars)
  reasoning: string;   // Brief explanation (tooltip)
}
```

### Claude prompt

```
System: You are a friendly dental front desk assistant drafting an SMS reply.

Rules:
- Keep under 160 characters when possible (SMS limit), max 320
- Warm, professional, helpful
- NEVER mention treatment names, procedure details, or clinical info
- NEVER mention dollar amounts
- If patient wants to book: offer next steps (call office, reply with preferred time)
- If patient has a question: acknowledge and suggest calling for details
- If patient not ready: be understanding, leave the door open
- Use patient's first name naturally
- Sign off with practice name
- No emojis, no placeholder variables

User: Patient: {firstName}
Practice: {practiceName}
Patient's intent: {latestIntent}
Recent conversation:
[Patient]: ...
[Practice]: ...

Draft a reply. Output ONLY the message text.
```

### Frontend changes

**Modify:** `src/components/features/inbox/ReplyComposer.tsx`
- Add new props: `patientFirstName`, `patientId`, `conversationId`, `latestIntent`
- Add "Suggest Reply" button (sparkle icon) next to Send button
- On click: show loading state (pulsing sparkle), call `useDraftReply` hook
- On response: populate textarea with draft, show "AI draft -- review before sending" banner
- Banner disappears on any keystroke
- If textarea already has content, show inline "Replace draft?" confirmation
- Disable suggest button while request in flight

**Modify:** `src/components/features/inbox/ConversationThread.tsx`
- Pass new props to `ReplyComposer`:
  ```tsx
  <ReplyComposer
    onSend={...}
    isSending={...}
    patientFirstName={patient.first_name}
    patientId={patient.id}
    conversationId={conversation.id}
    latestIntent={conversation.latest_intent}
  />
  ```

**New hook:** `src/hooks/useAiDraft.ts`
```ts
export function useDraftReply() {
  return useMutation({ mutationFn: ... });
}
```

The hook accepts recent messages as a parameter (from parent's `useConversationMessages` query) to avoid double-fetching.

### Sandbox/demo mode
- In [[sandbox-auth-signup-flow|sandbox]] mode, return hardcoded contextual replies based on `latestIntent` after 1s simulated delay
- `wants_to_book` -> "Hi {name}! We'd love to get you scheduled. Would mornings or afternoons work better? - {practice}"
- `has_question` -> "Hi {name}, great question! Give us a call at [number] and we can go over everything. - {practice}"
- Default -> "Hi {name}, thanks for your message! How can we help? - {practice}"

### Fallback
- If AI unavailable, show error toast: "AI drafting unavailable." Textarea stays empty for manual composition.

---

## Implementation Order

1. **Shared infra** -- `src/lib/ai/claude.ts` + refactor `preview-message`. Prerequisite for all 3.
2. **Feature 1 (Intent Classification)** -- Highest daily impact. Replaces fragile keywords, unlocks data for Feature 3.
3. **Feature 3 (Reply Drafting)** -- Most user-visible for front desk. Benefits from Feature 1's `latest_intent`.
4. **Feature 2 (Smart Sequence Assignment)** -- Independent, lowest risk. Enhances existing UI only.

## Files to modify

| File | Features |
|------|----------|
| `src/lib/ai/claude.ts` (new) | All |
| `src/app/api/preview-message/route.ts` | Shared infra refactor |
| `src/app/api/ai/classify-intent/route.ts` (new) | 1 |
| `src/app/api/ai/suggest-sequence/route.ts` (new) | 2 |
| `src/app/api/ai/generate-sequence/route.ts` (new) | 2 (no-sequences edge case) |
| `src/app/api/ai/draft-reply/route.ts` (new) | 3 |
| `src/app/api/webhooks/twilio/route.ts` | 1 |
| `src/components/features/inbox/ConversationList.tsx` | 1 |
| `src/components/features/inbox/ConversationThread.tsx` | 1, 3 |
| `src/components/features/inbox/ReplyComposer.tsx` | 3 |
| `src/stores/inbox-store.ts` | 1 |
| `src/lib/api/inbox.ts` | 1 |
| `src/app/(dashboard)/treatments/pending/EnrollDialog.tsx` | 2 |
| `src/hooks/useSequences.ts` | 2 |
| `src/hooks/useAiDraft.ts` (new) | 3 |
| `src/lib/sandbox/sandboxData.ts` | 1 |
| `src/types/database.types.ts` | 1 (regenerate) |
| Supabase migration (new) | 1 |

## Verification

- **Feature 1:** Send inbound SMS via Twilio test tool -> verify `messages.intent` column populated -> verify conversation list shows correct badge -> verify `stop` intent opts out enrollment
- **Feature 2:** Select pending treatments -> open EnrollDialog -> verify AI suggestion appears with reason text -> verify fallback to code matching when API key missing
- **Feature 3:** Open conversation -> click "Suggest Reply" -> verify draft populates textarea -> verify draft respects HIPAA rules (no clinical details) -> edit and send -> verify message delivers normally

---

## Related

- [[ada-dental-codes]] — ADA CDT codes used for sequence-to-treatment matching in Feature 2
- [[patient-statuses-and-lifecycle]] — Enrollment statuses and conversion detection that Feature 1 automates
- [[hipaa-patient-portal-reference]] — HIPAA constraints on message content (no PHI in SMS body)
- [[hipaa-baa-go-live-checklist]] — BAA requirements for Claude API when processing PHI
- [[sandbox-auth-signup-flow]] — Sandbox mode handling for all three features
- [[product-hurdles-and-mitigation]] — AI message quality is Hurdle #4
