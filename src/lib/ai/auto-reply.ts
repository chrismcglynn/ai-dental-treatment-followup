/**
 * Auto-Reply Orchestrator
 *
 * After classify-intent runs and escalation check passes, this module
 * generates and sends an AI reply for safe intents.
 *
 * Constraints:
 * - Replies to `not_ready`, `other`, and safe `has_question` intents
 * - Max auto-replies per conversation configurable per practice (default 3)
 * - 30s delay before sending (feel human)
 * - Every reply tagged sent_by: 'ai_auto' for audit trail
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateReply } from "@/lib/ai/generate-reply";
import type { IntentType } from "@/app/api/ai/classify-intent/route";
import { classifyQuestion } from "@/lib/ai/escalation";
import { isWithinBusinessHours } from "@/lib/ai/business-hours";
import type { BusinessHours } from "@/types/app.types";

const AUTO_REPLY_SAFE_INTENTS: IntentType[] = ["not_ready", "other"];
const DEFAULT_MAX_AUTO_REPLIES = 3;
const AUTO_REPLY_DELAY_MS = 30_000; // 30 seconds

interface AutoReplyParams {
  conversationId: string;
  patientId: string;
  practiceId: string;
  intent: IntentType;
  body: string;
}

/**
 * Attempt to auto-reply to a patient message.
 *
 * This function is non-blocking — it schedules the reply after a delay.
 * Handles `not_ready`, `other`, and safe `has_question` intents.
 */
export function triggerAutoReply(params: AutoReplyParams): void {
  // Direct safe intents — auto-reply immediately
  if (AUTO_REPLY_SAFE_INTENTS.includes(params.intent)) {
    scheduleAutoReply(params);
    return;
  }

  // has_question — only auto-reply if the question is safe (not clinical/financial/scheduling)
  if (params.intent === "has_question" && classifyQuestion(params.body) === "safe") {
    scheduleAutoReply(params);
    return;
  }
}

function scheduleAutoReply(params: AutoReplyParams): void {
  setTimeout(() => {
    handleAutoReply(params).catch((err) => {
      console.error("Auto-reply failed:", err);
    });
  }, AUTO_REPLY_DELAY_MS);
}

async function handleAutoReply(params: AutoReplyParams): Promise<void> {
  const { conversationId, patientId, practiceId, intent } = params;
  const supabase = createAdminClient();

  // Re-check conversation state (may have changed during the delay)
  const { data: conversation } = await supabase
    .from("conversations")
    .select("auto_reply_count, conversation_mode")
    .eq("id", conversationId)
    .single();

  if (!conversation) return;

  // Get patient and practice info for reply generation
  const [patientResult, practiceResult] = await Promise.all([
    supabase
      .from("patients")
      .select("first_name, phone")
      .eq("id", patientId)
      .single(),
    supabase
      .from("practices")
      .select("name, phone, timezone, sandbox_mode, max_auto_replies, business_hours")
      .eq("id", practiceId)
      .single(),
  ]);

  const maxAutoReplies = practiceResult.data?.max_auto_replies ?? DEFAULT_MAX_AUTO_REPLIES;

  // Don't auto-reply if escalated, staff took over, or cap reached
  if (
    conversation.conversation_mode === "escalated" ||
    conversation.conversation_mode === "staff_handling" ||
    conversation.auto_reply_count >= maxAutoReplies
  ) {
    return;
  }

  if (!patientResult.data || !practiceResult.data) return;

  // Check business hours — escalate if outside hours
  const businessHours = practiceResult.data.business_hours as BusinessHours | null;
  const practiceTimezone = practiceResult.data.timezone;
  if (!isWithinBusinessHours(businessHours, practiceTimezone)) {
    await supabase
      .from("conversations")
      .update({
        conversation_mode: "escalated",
        escalation_reason: "Outside business hours — queued for next open",
        escalated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    console.log(
      `Auto-reply skipped for ${conversationId}: outside business hours`
    );
    return;
  }

  const patient = patientResult.data;
  const practice = practiceResult.data;

  if (!patient.first_name || !practice.name) return;

  // Get recent messages for context
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("direction, body")
    .eq("patient_id", patientId)
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false })
    .limit(10);

  const messages = (recentMessages ?? []).reverse();

  // Generate the reply
  const result = await generateReply({
    patientFirstName: patient.first_name,
    recentMessages: messages.map((m) => ({
      direction: m.direction,
      body: m.body ?? "",
    })),
    latestIntent: intent,
    practiceName: practice.name,
  });

  if (!result) {
    console.error("Auto-reply generation failed — skipping");
    return;
  }

  // Send the message
  const replyBody = result.draft;

  if (practice.sandbox_mode) {
    // Sandbox: just insert a fake delivered message
    console.log(
      `[SANDBOX AUTO-REPLY] Would send to ${patient.phone}: "${replyBody}"`
    );
    await supabase.from("messages").insert({
      practice_id: practiceId,
      patient_id: patientId,
      channel: "sms",
      direction: "outbound",
      status: "delivered",
      body: replyBody,
      external_id: `sandbox-auto-${Date.now()}`,
      sent_by: "ai_auto",
      sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    });
  } else {
    // Real: send via Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioSid || !twilioToken || !patient.phone || !practice.phone) {
      console.error("Auto-reply: missing Twilio credentials or phone numbers");
      return;
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: patient.phone.startsWith("+")
          ? patient.phone
          : `+1${patient.phone}`,
        From: practice.phone,
        Body: replyBody,
        StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
      }),
    });

    if (!twilioResponse.ok) {
      const err = await twilioResponse.json().catch(() => ({}));
      console.error("Auto-reply Twilio send failed:", err);
      return;
    }

    const twilioData = await twilioResponse.json();

    await supabase.from("messages").insert({
      practice_id: practiceId,
      patient_id: patientId,
      channel: "sms",
      direction: "outbound",
      status: "sent",
      body: replyBody,
      external_id: twilioData.sid,
      sent_by: "ai_auto",
      sent_at: new Date().toISOString(),
    });
  }

  // Update conversation state
  await supabase
    .from("conversations")
    .update({
      conversation_mode: "auto_replying",
      auto_reply_count: conversation.auto_reply_count + 1,
      last_message_at: new Date().toISOString(),
      last_message_preview: replyBody.substring(0, 100),
    })
    .eq("id", conversationId);

  console.log(
    `Auto-reply sent for conversation ${conversationId} (intent: ${intent})`
  );
}
