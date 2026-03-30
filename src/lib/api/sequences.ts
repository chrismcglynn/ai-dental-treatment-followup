import { createClient } from "@/lib/supabase/client";
import { type Tables, type InsertTables, type UpdateTables } from "@/types/database.types";
import { type SequenceWithTouchpoints } from "@/types/app.types";
import { isSandboxId } from "@/lib/sandbox/sandboxData";

export async function getSequences(
  practiceId: string,
  status?: Tables<"sequences">["status"]
): Promise<Tables<"sequences">[]> {
  const supabase = createClient();
  let query = supabase
    .from("sequences")
    .select("*")
    .eq("practice_id", practiceId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getSequence(
  sequenceId: string
): Promise<SequenceWithTouchpoints> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sequences")
    .select("*, touchpoints(*)")
    .eq("id", sequenceId)
    .single();

  if (error) throw error;

  return {
    ...data,
    touchpoints: (data.touchpoints ?? []).sort(
      (a: Tables<"touchpoints">, b: Tables<"touchpoints">) =>
        a.position - b.position
    ),
  };
}

export async function createSequence(
  sequence: InsertTables<"sequences">
): Promise<Tables<"sequences">> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sequences")
    .insert(sequence)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSequence(
  sequenceId: string,
  updates: UpdateTables<"sequences">
): Promise<Tables<"sequences">> {
  if (isSandboxId(sequenceId)) {
    throw new Error("SANDBOX_MUTATION_BLOCKED: Cannot mutate sandbox data via real API");
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sequences")
    .update(updates)
    .eq("id", sequenceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSequence(sequenceId: string): Promise<void> {
  if (isSandboxId(sequenceId)) {
    throw new Error("SANDBOX_MUTATION_BLOCKED: Cannot mutate sandbox data via real API");
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("sequences")
    .delete()
    .eq("id", sequenceId);

  if (error) throw error;
}
