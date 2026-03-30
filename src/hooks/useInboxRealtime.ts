import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePracticeStore } from "@/stores/practice-store";
import { inboxKeys } from "@/hooks/useInbox";

export function useInboxRealtime() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);

  useEffect(() => {
    if (!activePracticeId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`inbox:${activePracticeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `practice_id=eq.${activePracticeId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: inboxKeys.all(activePracticeId),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `practice_id=eq.${activePracticeId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: inboxKeys.all(activePracticeId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePracticeId, queryClient]);
}
