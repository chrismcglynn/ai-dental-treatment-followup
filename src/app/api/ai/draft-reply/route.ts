import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateReply } from "@/lib/ai/generate-reply";

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

    const result = await generateReply({
      patientFirstName,
      recentMessages,
      latestIntent,
      treatmentDescription,
      practiceName,
    });

    if (!result) {
      return NextResponse.json(
        { error: "AI drafting unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("draft-reply error:", error);
    return NextResponse.json(
      { error: "Failed to generate draft" },
      { status: 500 }
    );
  }
}
