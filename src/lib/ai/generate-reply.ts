/**
 * Shared AI reply generation logic.
 *
 * Used by both the draft-reply API route (staff-assisted drafting)
 * and the auto-reply orchestrator (fully automated replies).
 */

import { callClaude } from "@/lib/ai/claude";

const SYSTEM_PROMPT = `You are a friendly dental front desk assistant drafting an SMS reply on behalf of the practice.

Rules:
- Keep replies under 160 characters when possible (SMS limit), max 320 characters
- Be warm, professional, and helpful
- NEVER mention specific treatment names, procedure details, or clinical information in the message
- NEVER mention dollar amounts
- If the patient wants to book, offer specific next steps (call the office, reply with preferred time)
- If the patient has a question, acknowledge it and offer to help (suggest calling for detailed discussion)
- If the patient is not ready, be understanding and leave the door open
- Use the patient's first name naturally
- Sign off with the practice name
- Do NOT use emojis
- Do NOT use placeholder variables like {{first_name}} -- use the actual first name provided

Respond with ONLY a JSON object in this format:
{"draft": "<the message text>", "reasoning": "<brief 1-sentence explanation of approach>"}`;

export interface GenerateReplyParams {
  patientFirstName: string;
  recentMessages: { direction: string; body: string }[];
  latestIntent: string | null;
  treatmentDescription?: string | null;
  practiceName: string;
}

export interface GenerateReplyResult {
  draft: string;
  reasoning: string;
}

/**
 * Generate an AI reply draft for a patient conversation.
 * Returns null if AI generation fails.
 */
export async function generateReply(
  params: GenerateReplyParams
): Promise<GenerateReplyResult | null> {
  const {
    patientFirstName,
    recentMessages,
    latestIntent,
    treatmentDescription,
    practiceName,
  } = params;

  const messageHistory = recentMessages
    .slice(-10)
    .map(
      (m) =>
        `[${m.direction === "inbound" ? "Patient" : "Practice"}]: ${m.body}`
    )
    .join("\n");

  const userPrompt = `Patient: ${patientFirstName}
Practice: ${practiceName}
Patient's latest intent: ${latestIntent ?? "unknown"}
${treatmentDescription ? "Treatment context: Patient has a pending treatment plan" : ""}

Recent conversation:
${messageHistory}

Draft a reply from the practice.`;

  const result = await callClaude({
    system: SYSTEM_PROMPT,
    userMessage: userPrompt,
    maxTokens: 300,
  });

  if (!result) return null;

  try {
    const parsed = JSON.parse(result);
    return {
      draft: parsed.draft,
      reasoning: parsed.reasoning ?? "AI-generated reply suggestion",
    };
  } catch {
    return {
      draft: result.trim(),
      reasoning: "AI-generated reply suggestion",
    };
  }
}
