import { createClient } from "@/lib/supabase/client";
import { type Tables, type InsertTables, type UpdateTables } from "@/types/database.types";

export async function getTouchpoints(
  sequenceId: string
): Promise<Tables<"touchpoints">[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("touchpoints")
    .select("*")
    .eq("sequence_id", sequenceId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createTouchpoint(
  touchpoint: InsertTables<"touchpoints">
): Promise<Tables<"touchpoints">> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("touchpoints")
    .insert(touchpoint)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTouchpoint(
  touchpointId: string,
  updates: UpdateTables<"touchpoints">
): Promise<Tables<"touchpoints">> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("touchpoints")
    .update(updates)
    .eq("id", touchpointId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTouchpoint(touchpointId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("touchpoints")
    .delete()
    .eq("id", touchpointId);

  if (error) throw error;
}

export async function reorderTouchpoints(
  sequenceId: string,
  orderedIds: string[]
): Promise<void> {
  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("touchpoints")
      .update({ position: index })
      .eq("id", id)
      .eq("sequence_id", sequenceId)
  );

  await Promise.all(updates);
}
