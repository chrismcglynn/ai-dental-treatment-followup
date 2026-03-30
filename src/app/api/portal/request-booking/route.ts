import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSandboxId } from "@/lib/sandbox/sandboxData";

const TIME_LABELS: Record<string, string> = {
  early_morning: "Early Morning (8–10 AM)",
  late_morning: "Late Morning (10 AM–12 PM)",
  early_afternoon: "Early Afternoon (12–2 PM)",
  late_afternoon: "Late Afternoon (2–5 PM)",
};

function buildMessageBody(availability?: {
  months: string[];
  daysOfWeek: string[];
  timesOfDay: string[];
}): string {
  if (!availability) {
    return "Patient requested booking via portal.";
  }

  const months = availability.months
    .map((m) => {
      const [year, month] = m.split("-").map(Number);
      return new Date(year, month - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    })
    .join(", ");
  const days = availability.daysOfWeek
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1) + "s")
    .join(", ");
  const times = availability.timesOfDay
    .map((t) => TIME_LABELS[t] ?? t)
    .join(", ");

  return `I'd like to schedule my appointment. Here's my availability:\n• Months: ${months}\n• Days: ${days}\n• Preferred times: ${times}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { treatmentId } = body;

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

  const messageBody = buildMessageBody(body.availability);

  // Insert inbound message: patient requested booking via portal
  await supabase.from("messages").insert({
    practice_id: treatment.practice_id,
    patient_id: treatment.patient_id,
    channel: "sms",
    direction: "inbound",
    status: "received",
    body: messageBody,
    sent_at: new Date().toISOString(),
  });

  // TODO: Send notification email to practice via Resend

  return NextResponse.json({ success: true });
}
