import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

function hasBookingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return BOOKING_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const messageSid = formData.get("MessageSid") as string;
  const from = formData.get("From") as string;
  const body = formData.get("Body") as string;
  const status = formData.get("MessageStatus") as string;

  const supabase = createAdminClient();

  if (body) {
    // Inbound SMS — find patient by phone and create inbound message
    const phone = from.replace(/^\+1/, "");
    const { data: patient } = await supabase
      .from("patients")
      .select("id, practice_id")
      .ilike("phone", `%${phone}%`)
      .single();

    if (patient) {
      await supabase.from("messages").insert({
        practice_id: patient.practice_id,
        patient_id: patient.id,
        channel: "sms",
        direction: "inbound",
        status: "received",
        body,
        external_id: messageSid,
      });

      // Detect booking intent for urgent flagging
      const urgent = hasBookingIntent(body);

      // Update or create conversation
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id, unread_count")
        .eq("patient_id", patient.id)
        .eq("practice_id", patient.practice_id)
        .single();

      if (conversation) {
        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: body.substring(0, 100),
            unread_count: (conversation.unread_count ?? 0) + 1,
            status: "open",
          })
          .eq("id", conversation.id);
      } else {
        await supabase.from("conversations").insert({
          practice_id: patient.practice_id,
          patient_id: patient.id,
          last_message_at: new Date().toISOString(),
          last_message_preview: body.substring(0, 100),
          unread_count: 1,
          status: "open",
        });
      }

      // If patient is in an active sequence and replied, update enrollment status
      if (urgent) {
        await supabase
          .from("sequence_enrollments")
          .update({ status: "converted" })
          .eq("patient_id", patient.id)
          .eq("practice_id", patient.practice_id)
          .eq("status", "active");
      }
    }
  } else if (status) {
    // Status callback — update message delivery status
    const statusMap: Record<string, string> = {
      queued: "queued",
      sent: "sent",
      delivered: "delivered",
      failed: "failed",
      undelivered: "failed",
    };

    const mappedStatus = statusMap[status] ?? status;

    await supabase
      .from("messages")
      .update({
        status: mappedStatus as "queued" | "sent" | "delivered" | "failed",
        ...(mappedStatus === "delivered"
          ? { delivered_at: new Date().toISOString() }
          : {}),
        ...(mappedStatus === "sent"
          ? { sent_at: new Date().toISOString() }
          : {}),
      })
      .eq("external_id", messageSid);
  }

  return new NextResponse("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
