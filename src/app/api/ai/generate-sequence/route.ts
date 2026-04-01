import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";

const SYSTEM_PROMPT = `You are a dental practice follow-up workflow designer. Given a set of dental treatments (ADA procedure codes and descriptions), design an optimal follow-up sequence to encourage patients to schedule their treatment.

Design a 3-4 step sequence with:
1. A descriptive name for the sequence
2. The ADA procedure codes it targets
3. Steps with staggered timing and mixed channels (SMS, email, voicemail)
4. Appropriate tone progression (start friendly, increase urgency gently)

Follow-up best practices:
- First touchpoint: SMS within 2-3 days (highest engagement)
- Second touchpoint: Email at 7-10 days (more detail)
- Third touchpoint: SMS at 14-21 days (gentle reminder)
- Optional fourth: Voicemail at 28-30 days (personal touch)
- Never be pushy or create anxiety about dental health

Respond with ONLY a JSON object:
{
  "name": "Sequence Name",
  "procedures": ["D2740", "D2392"],
  "steps": [
    {"dayOffset": 3, "channel": "sms", "tone": "friendly"},
    {"dayOffset": 10, "channel": "email", "tone": "friendly"},
    {"dayOffset": 21, "channel": "sms", "tone": "clinical"},
    {"dayOffset": 30, "channel": "voicemail", "tone": "urgent"}
  ],
  "reasoning": "One sentence explaining why this structure fits"
}`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { treatmentDescriptions, treatmentCodes } = await request.json();

    if (!treatmentCodes?.length) {
      return NextResponse.json(
        { error: "Missing treatment codes" },
        { status: 400 }
      );
    }

    const treatmentLines = treatmentCodes
      .map((code: string, i: number) => `- ${code}: ${treatmentDescriptions?.[i] ?? "Unknown procedure"}`)
      .slice(0, 20)
      .join("\n");

    const result = await callClaude({
      system: SYSTEM_PROMPT,
      userMessage: `Design a follow-up sequence for these dental treatments:\n${treatmentLines}`,
      maxTokens: 500,
    });

    if (!result) {
      return NextResponse.json(
        { error: "AI generation unavailable" },
        { status: 503 }
      );
    }

    try {
      const sequence = JSON.parse(result);
      return NextResponse.json(sequence);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid response" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("generate-sequence error:", error);
    return NextResponse.json(
      { error: "Failed to generate sequence" },
      { status: 500 }
    );
  }
}
