import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePracticeStore } from "@/stores/practice-store";
import { type Practice } from "@/types/app.types";

// Query keys factory
export const practiceKeys = {
  all: () => ["practices"] as const,
  list: (userId: string) => [...practiceKeys.all(), "list", userId] as const,
  detail: (practiceId: string) =>
    [...practiceKeys.all(), "detail", practiceId] as const,
  members: (practiceId: string) =>
    [...practiceKeys.detail(practiceId), "members"] as const,
};

async function fetchUserPractices(userId: string): Promise<Practice[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("practice_members")
    .select("practice_id, role, practices(*)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map(
    (m) => (m as unknown as { practices: Practice }).practices
  );
}

export function usePractices(userId: string) {
  const setActivePractice = usePracticeStore((s) => s.setActivePractice);
  const activePractice = usePracticeStore((s) => s.activePractice);

  return useQuery({
    queryKey: practiceKeys.list(userId),
    queryFn: async () => {
      const practices = await fetchUserPractices(userId);
      if (practices.length > 0 && !activePractice) {
        setActivePractice(practices[0]);
      }
      return practices;
    },
    enabled: !!userId,
  });
}

export function usePractice(practiceId: string) {
  return useQuery({
    queryKey: practiceKeys.detail(practiceId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("practices")
        .select("*")
        .eq("id", practiceId)
        .single();

      if (error) throw error;
      return data as Practice;
    },
    enabled: !!practiceId,
  });
}
