/**
 * Escalation Engine
 *
 * Determines whether an inbound patient message should be escalated
 * to the front desk team instead of being handled by auto-reply.
 *
 * Any single trigger fires → escalate to human.
 */

import type { IntentType } from "@/app/api/ai/classify-intent/route";

export interface EscalationResult {
  shouldEscalate: boolean;
  reason: string | null;
}

const CLINICAL_KEYWORDS = [
  "pain",
  "hurts",
  "hurt",
  "ache",
  "aching",
  "swelling",
  "swollen",
  "bleeding",
  "infection",
  "abscess",
  "fever",
  "broken tooth",
  "cracked",
  "emergency",
  "urgent",
  "sensitive",
  "sensitivity",
  "numb",
  "numbness",
  "throbbing",
];

const FINANCIAL_KEYWORDS = [
  "insurance",
  "cost",
  "price",
  "pricing",
  "payment",
  "copay",
  "co-pay",
  "covered",
  "coverage",
  "how much",
  "deductible",
  "out of pocket",
  "afford",
  "financing",
  "payment plan",
];

const SCHEDULING_KEYWORDS = [
  "what times",
  "what time",
  "next available",
  "do you have",
  "are you open",
  "hours",
  "saturday",
  "sunday",
  "weekend",
  "evening",
  "morning",
  "earliest",
  "soonest",
];

const DEFAULT_MAX_AUTO_REPLIES = 3;

/**
 * Check whether an inbound message should be escalated to staff.
 *
 * Returns `{ shouldEscalate: true, reason }` if any trigger fires.
 * Triggers are checked in priority order — the first match wins.
 */
export function checkEscalation(params: {
  intent: IntentType;
  confidence: number;
  body: string;
  autoReplyCount: number;
  maxAutoReplies?: number;
}): EscalationResult {
  const {
    intent,
    confidence,
    body,
    autoReplyCount,
    maxAutoReplies = DEFAULT_MAX_AUTO_REPLIES,
  } = params;

  const lower = body.toLowerCase();

  // 1. Wrong number — always escalate
  if (intent === "wrong_number") {
    return { shouldEscalate: true, reason: "Wrong number reported" };
  }

  // 2. Low confidence — classifier unsure
  if (confidence > 0 && confidence < 0.6) {
    return {
      shouldEscalate: true,
      reason: "Low confidence on intent classification",
    };
  }

  // 3. Clinical concerns — needs human/clinical triage
  if (CLINICAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      shouldEscalate: true,
      reason: "Patient mentioned clinical concern",
    };
  }

  // 4. Financial questions — bot can't answer without practice data
  if (FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      shouldEscalate: true,
      reason: "Patient asking about cost/insurance",
    };
  }

  // 5. Scheduling specifics — bot doesn't have calendar access
  if (SCHEDULING_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      shouldEscalate: true,
      reason: "Patient asking about specific availability",
    };
  }

  // 6. Volume cap — too many auto-replies without staff review
  if (autoReplyCount >= maxAutoReplies) {
    return { shouldEscalate: true, reason: "Maximum auto-replies reached" };
  }

  return { shouldEscalate: false, reason: null };
}

/**
 * Sub-classify a `has_question` message body to determine if it's safe
 * for auto-reply or needs escalation to staff.
 *
 * "safe" = general procedure/timing questions the bot can redirect to portal
 * "unsafe" = clinical, financial, or scheduling-specific questions
 */
export function classifyQuestion(body: string): "safe" | "unsafe" {
  const lower = body.toLowerCase();

  if (CLINICAL_KEYWORDS.some((kw) => lower.includes(kw))) return "unsafe";
  if (FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw))) return "unsafe";
  if (SCHEDULING_KEYWORDS.some((kw) => lower.includes(kw))) return "unsafe";

  return "safe";
}
