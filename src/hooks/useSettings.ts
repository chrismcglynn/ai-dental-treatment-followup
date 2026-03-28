import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePracticeStore } from "@/stores/practice-store";
import { useUiStore } from "@/stores/ui-store";
import { practiceKeys } from "./usePractice";
import { type Practice, type PracticeMember } from "@/types/app.types";

// ---------- Practice update ----------

export function useUpdatePractice() {
  const queryClient = useQueryClient();
  const activePractice = usePracticeStore((s) => s.activePractice);
  const setActivePractice = usePracticeStore((s) => s.setActivePractice);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (
      updates: Partial<Pick<Practice, "name" | "phone" | "email" | "timezone">>
    ) => {
      if (!activePractice) throw new Error("No active practice");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("practices")
        .update(updates)
        .eq("id", activePractice.id)
        .select()
        .single();
      if (error) throw error;
      return data as Practice;
    },
    onSuccess: (data) => {
      addToast({ title: "Settings saved", variant: "success" });
      setActivePractice(data);
      queryClient.invalidateQueries({
        queryKey: practiceKeys.detail(data.id),
      });
    },
    onError: () => {
      addToast({ title: "Failed to save settings", variant: "destructive" });
    },
  });
}

// ---------- Practice members ----------

export interface PracticeMemberWithUser extends PracticeMember {
  email: string;
  full_name: string | null;
}

export function usePracticeMembers() {
  const practiceId = usePracticeStore((s) => s.activePracticeId);

  return useQuery({
    queryKey: practiceKeys.members(practiceId!),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("practice_members")
        .select("*")
        .eq("practice_id", practiceId!);

      if (error) throw error;

      // Fetch user profiles for each member
      const members = data as PracticeMember[];
      const enriched: PracticeMemberWithUser[] = [];

      for (const member of members) {
        // Use auth admin or a profile lookup — for client side, we use a
        // lightweight approach: store email in metadata or fetch from auth.
        // For now, return what we have with placeholder emails.
        enriched.push({
          ...member,
          email: "",
          full_name: null,
        });
      }

      return enriched;
    },
    enabled: !!practiceId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const practiceId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string;
      role: PracticeMember["role"];
    }) => {
      const res = await fetch("/api/settings/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, practiceId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to invite member");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({ title: "Invitation sent", variant: "success" });
      if (practiceId) {
        queryClient.invalidateQueries({
          queryKey: practiceKeys.members(practiceId),
        });
      }
    },
    onError: (error) => {
      addToast({ title: error.message || "Failed to invite member", variant: "destructive" });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const practiceId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (memberId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("practice_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      addToast({ title: "Member removed", variant: "success" });
      if (practiceId) {
        queryClient.invalidateQueries({
          queryKey: practiceKeys.members(practiceId),
        });
      }
    },
    onError: () => {
      addToast({ title: "Failed to remove member", variant: "destructive" });
    },
  });
}

// ---------- Billing / usage ----------

export interface UsageStats {
  patientsInSequences: number;
  messagesSentThisMonth: number;
}

export function useUsageStats() {
  const practiceId = usePracticeStore((s) => s.activePracticeId);

  return useQuery({
    queryKey: ["usage-stats", practiceId],
    queryFn: async () => {
      const supabase = createClient();

      const [enrollments, messages] = await Promise.all([
        supabase
          .from("sequence_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceId!)
          .eq("status", "active"),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practiceId!)
          .eq("direction", "outbound")
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
      ]);

      return {
        patientsInSequences: enrollments.count ?? 0,
        messagesSentThisMonth: messages.count ?? 0,
      } as UsageStats;
    },
    enabled: !!practiceId,
  });
}

// ---------- Test PMS Connection ----------

export function useTestPmsConnection() {
  return useMutation({
    mutationFn: async ({
      pmsType,
      credentials,
    }: {
      pmsType: string;
      credentials: Record<string, string>;
    }) => {
      const res = await fetch("/api/settings/test-pms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmsType, credentials }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Connection failed");
      }
      return res.json();
    },
  });
}
