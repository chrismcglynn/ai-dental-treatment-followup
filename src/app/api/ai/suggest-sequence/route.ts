import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/claude";

const SYSTEM_PROMPT = `You are a dental practice workflow assistant. Given dental treatments (ADA procedure codes and descriptions) and a list of follow-up sequences, rank which sequences are the best fit.

Consider:
1. Direct ADA code matches (highest weight)
2. Semantic similarity between treatment descriptions and sequence names/descriptions
3. Treatment category grouping (e.g., a "Major Restorative" sequence should match crowns, bridges, implants even if specific codes differ)
4. Sequence performance data (prefer sequences with higher conversion rates when matches are close)

Respond with ONLY a JSON array, sorted by best match first. Include all sequences.
Format: [{"sequenceId": "...", "score": 85, "reason": "Direct code match for D2740; strong fit for restorative procedures"}]`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { treatmentDescriptions, treatmentCodes, sequences } =
      await request.json();

    if (!treatmentCodes?.length || !sequences?.length) {
      return NextResponse.json(
        { error: "Missing treatment codes or sequences" },
        { status: 400 }
      );
    }

    // Truncate to 20 unique treatments if more
    const uniqueTreatments = Array.from(
      new Map(
        treatmentCodes.map((code: string, i: number) => [
          code,
          treatmentDescriptions[i],
        ])
      )
    ).slice(0, 20);

    const treatmentLines = uniqueTreatments
      .map(([code, desc]) => `- ${code}: ${desc}`)
      .join("\n");

    const sequenceLines = sequences
      .map(
        (s: {
          id: string;
          name: string;
          description: string | null;
          treatment_type: string | null;
          conversion_rate: number;
          patient_count: number;
        }) =>
          `- ID: ${s.id}, Name: "${s.name}", Description: "${s.description ?? "none"}", Codes: "${s.treatment_type ?? "none"}", Conversion: ${s.conversion_rate?.toFixed(0) ?? 0}%, Enrolled: ${s.patient_count ?? 0}`
      )
      .join("\n");

    const userPrompt = `Treatments:\n${treatmentLines}\n\nAvailable sequences:\n${sequenceLines}`;

    const result = await callClaude({
      system: SYSTEM_PROMPT,
      userMessage: userPrompt,
      maxTokens: 500,
    });

    if (!result) {
      return NextResponse.json(
        { error: "AI suggestions unavailable" },
        { status: 503 }
      );
    }

    try {
      const suggestions = JSON.parse(result);
      return NextResponse.json({ suggestions });
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid response" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("suggest-sequence error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
