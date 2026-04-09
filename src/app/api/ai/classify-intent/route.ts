import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callClaude } from "@/lib/ai/claude";
import { checkEscalation } from "@/lib/ai/escalation";
import { triggerAutoReply } from "@/lib/ai/auto-reply";

export type IntentType =
  | "wants_to_book"
  | "has_question"
  | "not_ready"
  | "wrong_number"
  | "stop"
  | "other";

const STOP_KEYWORDS = ["stop", "unsubscribe", "cancel", "opt out", "optout"];

const BOOKING_INTENT_KEYWORDS = [
  "book",
  "schedule",
  "appointment",
  "yes",
  "ready",
  "interested",
  "sign me up",
  "when can",
  "available",
  "call me",
  "come in",
];

const SYSTEM_PROMPT = `You are a dental practice message classifier. Classify the patient's SMS reply into exactly one category. Respond with ONLY a JSON object, no other text.

Categories:
- "wants_to_book": Patient wants to schedule, book, or confirm an appointment. Includes affirmative responses like "yes", "sounds good", "let's do it", "when can I come in"
- "has_question": Patient is asking about cost, insurance, the procedure, timing, or has any question
- "not_ready": Patient is declining, delaying, or saying they need more time. "Not right now", "maybe later", "I'll think about it"
- "wrong_number": Patient says wrong number, doesn't know what this is about, or is not the intended recipient
- "stop": Patient wants to unsubscribe, stop messages, or opt out. "STOP", "unsubscribe", "don't text me"
- "other": Anything that doesn't fit the above

Output format: {"intent": "<category>", "confidence": <0.0-1.0>}`;

function keywordFallback(body: string): { intent: IntentType; confidence: number } {
  const lower = body.toLowerCase().trim();

  if (STOP_KEYWORDS.some((kw) => lower === kw || lower.includes(kw))) {
    return { intent: "stop", confidence: 0 };
  }

  if (BOOKING_INTENT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { intent: "wants_to_book", confidence: 0 };
  }

  return { intent: "other", confidence: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const { messageId, body, practiceId, patientId, conversationId } =
      await request.json();

    if (!messageId || !body) {
      return NextResponse.json(
        { error: "Missing messageId or body" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const lower = body.toLowerCase().trim();

    // TCPA compliance: hard-coded STOP check — skip AI
    if (lower === "stop") {
      await applyClassification(supabase, {
        messageId,
        conversationId,
        patientId,
        practiceId,
        intent: "stop",
        confidence: 1,
      });
      return NextResponse.json({ intent: "stop", confidence: 1 });
    }

    // Try Claude classification
    const result = await callClaude({
      system: SYSTEM_PROMPT,
      userMessage: `Patient SMS: "${body}"`,
      maxTokens: 100,
    });

    let intent: IntentType;
    let confidence: number;

    if (result) {
      try {
        const parsed = JSON.parse(result);
        intent = parsed.intent as IntentType;
        confidence = parsed.confidence ?? 0.5;
      } catch {
        // Claude returned non-JSON — fall back to keywords
        const fallback = keywordFallback(body);
        intent = fallback.intent;
        confidence = fallback.confidence;
      }
    } else {
      // Claude unavailable — fall back to keywords
      const fallback = keywordFallback(body);
      intent = fallback.intent;
      confidence = fallback.confidence;
    }

    await applyClassification(supabase, {
      messageId,
      conversationId,
      patientId,
      practiceId,
      intent,
      confidence,
    });

    // Check escalation for auto-reply-enabled sequences
    if (conversationId && patientId && practiceId && intent !== "stop") {
      await checkAndEscalate(supabase, {
        conversationId,
        patientId,
        practiceId,
        intent,
        confidence,
        body,
      });
    }

    return NextResponse.json({ intent, confidence });
  } catch (error) {
    console.error("classify-intent error:", error);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}

async function applyClassification(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    messageId: string;
    conversationId?: string;
    patientId?: string;
    practiceId?: string;
    intent: IntentType;
    confidence: number;
  }
) {
  const { messageId, conversationId, patientId, practiceId, intent, confidence } =
    params;

  // Update the message with classification
  await supabase
    .from("messages")
    .update({ intent, intent_confidence: confidence })
    .eq("id", messageId);

  // Update conversation's latest intent
  if (conversationId) {
    await supabase
      .from("conversations")
      .update({ latest_intent: intent })
      .eq("id", conversationId);
  }

  // Auto-convert active enrollments on booking intent
  if (intent === "wants_to_book" && patientId && practiceId) {
    await supabase
      .from("sequence_enrollments")
      .update({ status: "converted", converted_at: new Date().toISOString() })
      .eq("patient_id", patientId)
      .eq("practice_id", practiceId)
      .eq("status", "active");
  }

  // Opt out on stop intent
  if (intent === "stop" && patientId && practiceId) {
    await supabase
      .from("sequence_enrollments")
      .update({ status: "opted_out" })
      .eq("patient_id", patientId)
      .eq("practice_id", practiceId)
      .eq("status", "active");
  }
}

/**
 * Check if a conversation should be escalated based on the classified intent.
 * Only runs for patients enrolled in auto-reply-enabled sequences.
 */
async function checkAndEscalate(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    conversationId: string;
    patientId: string;
    practiceId: string;
    intent: IntentType;
    confidence: number;
    body: string;
  }
) {
  const { conversationId, patientId, practiceId, intent, confidence, body } = params;

  try {
    // Find active enrollment for this patient
    const { data: enrollment } = await supabase
      .from("sequence_enrollments")
      .select("sequence_id")
      .eq("patient_id", patientId)
      .eq("practice_id", practiceId)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!enrollment) return;

    // Check if the sequence has auto-reply enabled
    const [sequenceResult, practiceResult] = await Promise.all([
      supabase
        .from("sequences")
        .select("auto_reply_enabled")
        .eq("id", enrollment.sequence_id)
        .single(),
      supabase
        .from("practices")
        .select("auto_reply_enabled, max_auto_replies")
        .eq("id", practiceId)
        .single(),
    ]);

    const sequence = sequenceResult.data;
    const practice = practiceResult.data;

    // Both practice-level AND sequence-level must be enabled
    if (!practice?.auto_reply_enabled || !sequence?.auto_reply_enabled) return;

    // Get current conversation state
    const { data: conversation } = await supabase
      .from("conversations")
      .select("auto_reply_count, conversation_mode")
      .eq("id", conversationId)
      .single();

    if (!conversation) return;

    // Already escalated or staff-handled — don't re-evaluate
    if (
      conversation.conversation_mode === "escalated" ||
      conversation.conversation_mode === "staff_handling"
    ) {
      return;
    }

    const maxAutoReplies = practice.max_auto_replies ?? 3;

    const result = checkEscalation({
      intent,
      confidence,
      body,
      autoReplyCount: conversation.auto_reply_count,
      maxAutoReplies,
    });

    if (result.shouldEscalate) {
      await supabase
        .from("conversations")
        .update({
          conversation_mode: "escalated",
          escalation_reason: result.reason,
          escalated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } else {
      // No escalation — trigger auto-reply for safe intents
      triggerAutoReply({
        conversationId,
        patientId,
        practiceId,
        intent,
        body,
      });
    }
  } catch (err) {
    // Escalation check is non-critical — log and continue
    console.error("Escalation check failed:", err);
  }
}
