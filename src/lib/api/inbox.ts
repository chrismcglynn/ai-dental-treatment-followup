import { createClient } from "@/lib/supabase/client";
import { type Tables } from "@/types/database.types";
import { type ConversationWithPatient } from "@/types/app.types";

export type InboxFilter = "all" | "urgent" | "unread" | "needs_reply" | "replied";

export async function getConversations(
  practiceId: string,
  filter: InboxFilter = "all"
): Promise<ConversationWithPatient[]> {
  const supabase = createClient();

  let query = supabase
    .from("conversations")
    .select("*, patient:patients(*)")
    .eq("practice_id", practiceId)
    .neq("status", "archived")
    .order("last_message_at", { ascending: false });

  switch (filter) {
    case "urgent":
      query = query.in("latest_intent", ["wants_to_book", "has_question"]);
      break;
    case "unread":
      query = query.gt("unread_count", 0);
      break;
    case "needs_reply":
      // Conversations where the last message was inbound (patient replied, staff hasn't)
      query = query.eq("status", "open").gt("unread_count", 0);
      break;
    case "replied":
      query = query.eq("unread_count", 0).eq("status", "open");
      break;
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as ConversationWithPatient[]) ?? [];
}

export async function getConversationMessages(
  conversationId: string,
  patientId: string
): Promise<Tables<"messages">[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function markConversationRead(
  conversationId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", conversationId);

  if (error) throw error;
}

export async function sendReply(
  practiceId: string,
  patientId: string,
  body: string
): Promise<Tables<"messages">> {
  const response = await fetch("/api/inbox/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ practiceId, patientId, body }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Failed to send reply");
  }

  return response.json();
}
