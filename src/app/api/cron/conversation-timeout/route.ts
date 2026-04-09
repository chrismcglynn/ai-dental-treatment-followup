import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TIMEOUT_MINUTES = 60;

/**
 * Conversation Timeout Cron
 *
 * Runs periodically to transition `auto_replying` conversations back to
 * `auto_idle` if the patient hasn't replied within the timeout window.
 * This allows scheduled touchpoints to resume.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  const cutoff = new Date(
    Date.now() - TIMEOUT_MINUTES * 60 * 1000
  ).toISOString();

  // Find auto_replying conversations that have been idle past the timeout
  const { data: staleConversations, error: fetchError } = await supabase
    .from("conversations")
    .select("id")
    .eq("conversation_mode", "auto_replying")
    .lt("last_message_at", cutoff);

  if (fetchError) {
    console.error("Conversation timeout fetch error:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }

  if (!staleConversations?.length) {
    return NextResponse.json({ timedOut: 0 });
  }

  const ids = staleConversations.map((c) => c.id);

  const { error: updateError } = await supabase
    .from("conversations")
    .update({
      conversation_mode: "auto_idle",
      auto_reply_count: 0,
    })
    .in("id", ids);

  if (updateError) {
    console.error("Conversation timeout update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update conversations" },
      { status: 500 }
    );
  }

  console.log(
    `Conversation timeout: transitioned ${ids.length} conversations from auto_replying → auto_idle`
  );

  return NextResponse.json({ timedOut: ids.length });
}
