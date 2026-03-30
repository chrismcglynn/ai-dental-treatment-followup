import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSandboxId } from "@/lib/sandbox/sandboxData";

const TIME_LABELS: Record<string, string> = {
  early_morning: "Early Morning (8–10 AM)",
  late_morning: "Late Morning (10 AM–12 PM)",
  early_afternoon: "Early Afternoon (12–2 PM)",
  late_afternoon: "Late Afternoon (2–5 PM)",
};

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function buildMessageBody(data: {
  mode?: string;
  preferredDate?: string;
  preferredTime?: string;
  availability?: {
    months: string[];
    daysOfWeek: string[];
    timesOfDay: string[];
  };
}): string {
  if (data.mode === "availability" && data.availability) {
    const months = data.availability.months
      .map((m) => {
        const [year, month] = m.split("-").map(Number);
        return new Date(year, month - 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      })
      .join(", ");
    const days = data.availability.daysOfWeek
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1) + "s")
      .join(", ");
    const times = data.availability.timesOfDay
      .map((t) => TIME_LABELS[t] ?? t)
      .join(", ");

    return `I'd like to schedule my appointment. Here's my availability:\n• Months: ${months}\n• Days: ${days}\n• Preferred times: ${times}`;
  }

  if (data.preferredDate && data.preferredTime) {
    const dateObj = new Date(data.preferredDate + "T00:00:00");
    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = formatTime12(data.preferredTime);
    return `I'd like to schedule my appointment. My preferred time is ${dateStr} at ${timeStr}.`;
  }

  return "Patient requested booking via portal.";
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

  const messageBody = buildMessageBody(body);

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
