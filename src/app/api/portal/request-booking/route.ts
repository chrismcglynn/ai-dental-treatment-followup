import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSandboxId } from "@/lib/sandbox/sandboxData";

export async function POST(request: NextRequest) {
  const { treatmentId } = await request.json();

  if (!treatmentId) {
    return NextResponse.json(
      { error: "Missing treatmentId", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Sandbox path: return success without DB writes
  if (isSandboxId(treatmentId)) {
    return NextResponse.json({ success: true });
  }

  const supabase = createAdminClient();

  // Look up treatment to get patient_id and practice_id
  const { data: treatment, error: treatmentError } = await supabase
    .from("treatments")
    .select("id, patient_id, practice_id")
    .eq("id", treatmentId)
    .single();

  if (treatmentError || !treatment) {
    return NextResponse.json(
      { error: "Treatment not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Update treatment status to 'accepted'
  const { error: updateError } = await supabase
    .from("treatments")
    .update({ status: "accepted" })
    .eq("id", treatmentId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update treatment", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  // Insert inbound message: patient requested booking via portal
  await supabase.from("messages").insert({
    practice_id: treatment.practice_id,
    patient_id: treatment.patient_id,
    channel: "sms",
    direction: "inbound",
    status: "received",
    body: "Patient requested booking via portal",
    sent_at: new Date().toISOString(),
  });

  // TODO: Send notification email to practice via Resend

  return NextResponse.json({ success: true });
}
