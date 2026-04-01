import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      const { data: message } = await supabase
        .from("messages")
        .insert({
          practice_id: patient.practice_id,
          patient_id: patient.id,
          channel: "sms",
          direction: "inbound",
          status: "received",
          body,
          external_id: messageSid,
        })
        .select("id")
        .single();

      // Update or create conversation
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id, unread_count")
        .eq("patient_id", patient.id)
        .eq("practice_id", patient.practice_id)
        .single();

      let conversationId: string | undefined;

      if (conversation) {
        conversationId = conversation.id;
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
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            practice_id: patient.practice_id,
            patient_id: patient.id,
            last_message_at: new Date().toISOString(),
            last_message_preview: body.substring(0, 100),
            unread_count: 1,
            status: "open",
          })
          .select("id")
          .single();
        conversationId = newConv?.id;
      }

      // Fire async AI intent classification (non-blocking)
      if (message?.id) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        fetch(`${appUrl}/api/ai/classify-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: message.id,
            body,
            practiceId: patient.practice_id,
            patientId: patient.id,
            conversationId,
          }),
        }).catch((err) => console.error("Async intent classification failed:", err));
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
