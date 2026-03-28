import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface QueuedMessage {
  id: string;
  channel: string;
  patient_id: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("status", "queued")
    .eq("direction", "outbound")
    .limit(50);

  const queuedMessages = (data ?? []) as QueuedMessage[];

  if (queuedMessages.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processedCount = 0;

  for (const message of queuedMessages) {
    try {
      console.log(
        `Processing ${message.channel} message ${message.id} for patient ${message.patient_id}`
      );

      await supabase
        .from("messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", message.id);

      processedCount++;
    } catch (err) {
      console.error(`Failed to process message ${message.id}:`, err);

      await supabase
        .from("messages")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", message.id);
    }
  }

  return NextResponse.json({
    processed: processedCount,
    total: queuedMessages.length,
  });
}
