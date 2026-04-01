import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      patientFirstName,
      recentMessages,
      latestIntent,
      treatmentDescription,
      practiceName,
    } = await request.json();

    if (!patientFirstName || !recentMessages || !practiceName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build conversation context (last 10 messages)
    const messageHistory = recentMessages
      .slice(-10)
      .map(
        (m: { direction: string; body: string }) =>
          `[${m.direction === "inbound" ? "Patient" : "Practice"}]: ${m.body}`
      )
      .join("\n");

    const userPrompt = `Patient: ${patientFirstName}
Practice: ${practiceName}
Patient's latest intent: ${latestIntent ?? "unknown"}
${treatmentDescription ? `Treatment context: Patient has a pending treatment plan` : ""}

Recent conversation:
${messageHistory}

Draft a reply from the practice.`;

    const result = await callClaude({
      system: SYSTEM_PROMPT,
      userMessage: userPrompt,
      maxTokens: 300,
    });

    if (!result) {
      return NextResponse.json(
        { error: "AI drafting unavailable" },
        { status: 503 }
      );
    }

    try {
      const parsed = JSON.parse(result);
      return NextResponse.json({
        draft: parsed.draft,
        reasoning: parsed.reasoning ?? "AI-generated reply suggestion",
      });
    } catch {
      // Claude returned plain text instead of JSON — use it as the draft
      return NextResponse.json({
        draft: result.trim(),
        reasoning: "AI-generated reply suggestion",
      });
    }
  } catch (error) {
    console.error("draft-reply error:", error);
    return NextResponse.json(
      { error: "Failed to generate draft" },
      { status: 500 }
    );
  }
}
