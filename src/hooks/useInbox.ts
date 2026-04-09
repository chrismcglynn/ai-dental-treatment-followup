import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getConversationMessages,
  markConversationRead,
  sendReply,
  takeOverConversation,
  returnToAutoConversation,
  type InboxFilter,
} from "@/lib/api/inbox";
import type { ConversationWithPatient, Message } from "@/types/app.types";
import { usePracticeStore } from "@/stores/practice-store";
import { useInboxStore } from "@/stores/inbox-store";
import { useUiStore } from "@/stores/ui-store";
import { useSandbox } from "@/lib/sandbox";
import { simulateDelay } from "@/lib/sandbox/utils";

export const inboxKeys = {
  all: (practiceId: string) => ["inbox", practiceId] as const,
  conversations: (practiceId: string, filter: InboxFilter) =>
    [...inboxKeys.all(practiceId), "conversations", filter] as const,
  messages: (practiceId: string, conversationId: string) =>
    [...inboxKeys.all(practiceId), "messages", conversationId] as const,
};

export function useConversations() {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const filter = useInboxStore((s) => s.filter);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: inboxKeys.conversations(activePracticeId!, filter),
    queryFn: async (): Promise<ConversationWithPatient[]> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getConversations(filter) as ConversationWithPatient[];
      }
      return getConversations(activePracticeId!, filter);
    },
    enabled: !!activePracticeId,
  });
}

export function useUnreadCount(): number {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  const { data: conversations } = useQuery({
    queryKey: inboxKeys.conversations(activePracticeId!, "all"),
    queryFn: async (): Promise<ConversationWithPatient[]> => {
      if (isSandbox) {
        await simulateDelay(300);
        return sandboxStore.getConversations("all") as ConversationWithPatient[];
      }
      return getConversations(activePracticeId!, "all");
    },
    enabled: !!activePracticeId,
  });

  return conversations?.filter((c) => c.unread_count > 0).length ?? 0;
}

export function useConversationMessages(
  conversationId: string | null,
  patientId: string | null
) {
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useQuery({
    queryKey: inboxKeys.messages(activePracticeId!, conversationId!),
    queryFn: async (): Promise<Message[]> => {
      if (isSandbox) {
        await simulateDelay(200);
        return sandboxStore.getConversationMessages(conversationId!, patientId!) as Message[];
      }
      return getConversationMessages(conversationId!, patientId!);
    },
    enabled: !!activePracticeId && !!conversationId && !!patientId,
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (isSandbox) {
        await simulateDelay(200);
        sandboxStore.markConversationRead(conversationId);
        return;
      }
      return markConversationRead(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inboxKeys.all(activePracticeId!),
      });
    },
  });
}

export function useSendReply() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async ({
      patientId,
      body,
    }: {
      patientId: string;
      body: string;
      conversationId: string;
    }) => {
      if (isSandbox) {
        await simulateDelay(600);
        return sandboxStore.sendReply(patientId, body);
      }
      return sendReply(activePracticeId!, patientId, body);
    },
    onSuccess: (_, { conversationId }) => {
      addToast({ title: "Reply sent", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: inboxKeys.messages(activePracticeId!, conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: inboxKeys.all(activePracticeId!),
      });
    },
    onError: () => {
      addToast({ title: "Failed to send reply", variant: "destructive" });
    },
  });
}

export function useTakeOverConversation() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (isSandbox) {
        await simulateDelay(300);
        sandboxStore.updateConversation(conversationId, {
          conversation_mode: "staff_handling",
        });
        return;
      }
      return takeOverConversation(conversationId);
    },
    onSuccess: () => {
      addToast({ title: "You've taken over this conversation", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: inboxKeys.all(activePracticeId!),
      });
    },
    onError: () => {
      addToast({ title: "Failed to take over conversation", variant: "destructive" });
    },
  });
}

export function useReturnToAuto() {
  const queryClient = useQueryClient();
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const addToast = useUiStore((s) => s.addToast);
  const { isSandbox, sandboxStore } = useSandbox();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (isSandbox) {
        await simulateDelay(300);
        sandboxStore.updateConversation(conversationId, {
          conversation_mode: "auto_idle",
          auto_reply_count: 0,
          escalation_reason: null,
          escalated_at: null,
        });
        return;
      }
      return returnToAutoConversation(conversationId);
    },
    onSuccess: () => {
      addToast({ title: "AI auto-reply re-enabled for this conversation", variant: "success" });
      queryClient.invalidateQueries({
        queryKey: inboxKeys.all(activePracticeId!),
      });
    },
    onError: () => {
      addToast({ title: "Failed to return to auto mode", variant: "destructive" });
    },
  });
}
