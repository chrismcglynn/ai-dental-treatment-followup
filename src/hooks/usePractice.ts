import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePracticeStore } from "@/stores/practice-store";
import { type Practice } from "@/types/app.types";
import { useSandbox } from "@/lib/sandbox";
import { simulateDelay } from "@/lib/sandbox/utils";

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
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: practiceKeys.list(userId),
    queryFn: async (): Promise<Practice[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        const practice = sandboxStore.getPractice() as Practice;
        if (!activePractice) {
          setActivePractice(practice);
        }
        return [practice];
      }
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
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: practiceKeys.detail(practiceId),
    queryFn: async (): Promise<Practice> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getPractice() as Practice;
      }
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
