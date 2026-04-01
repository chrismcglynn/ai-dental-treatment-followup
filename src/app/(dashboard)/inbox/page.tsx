"use client";

import { useEffect, useMemo, useRef } from "react";
import { Inbox } from "lucide-react";
import { usePageHeader } from "@/hooks/usePageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationList } from "@/components/features/inbox/ConversationList";
import {
  ConversationThread,
  EmptyThreadState,
} from "@/components/features/inbox/ConversationThread";
import { useInboxStore } from "@/stores/inbox-store";
import { useInboxRealtime } from "@/hooks/useInboxRealtime";
import { useConversations } from "@/hooks/useInbox";
import { type ConversationWithPatient } from "@/types/app.types";

export default function InboxPage() {
  const selectedConversationId = useInboxStore(
    (s) => s.selectedConversationId
  );
  const pendingPatientId = useInboxStore((s) => s.pendingPatientId);
  const filter = useInboxStore((s) => s.filter);
  const setSelectedConversation = useInboxStore((s) => s.setSelectedConversation);
  const setPendingPatientId = useInboxStore((s) => s.setPendingPatientId);
  const { data: conversations, isLoading } = useConversations();

  // Subscribe to realtime updates
  useInboxRealtime();

  // Auto-select conversation when navigating from a notification
  useEffect(() => {
    if (pendingPatientId && conversations?.length) {
      const convo = conversations.find((c) => c.patient_id === pendingPatientId);
      if (convo) {
        setSelectedConversation(convo.id);
      }
      setPendingPatientId(null);
    }
  }, [pendingPatientId, conversations, setSelectedConversation, setPendingPatientId]);

  // Keep a ref to the last selected conversation so it stays visible
  // even after it drops out of the current filter (e.g. marking unread → read)
  const lastSelectedRef = useRef<ConversationWithPatient | null>(null);

  const selectedConversation = useMemo(() => {
    const found = conversations?.find((c) => c.id === selectedConversationId) ?? null;
    if (found) {
      lastSelectedRef.current = found;
      return found;
    }
    // Still selected but no longer in filtered list — keep showing it
    if (selectedConversationId && lastSelectedRef.current?.id === selectedConversationId) {
      return lastSelectedRef.current;
    }
    lastSelectedRef.current = null;
    return null;
  }, [conversations, selectedConversationId]);

  const hasConversations = !!conversations?.length;

  usePageHeader({ title: "Inbox" });

  if (isLoading) {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <div className="border border-border rounded-lg overflow-hidden bg-background h-full">
          <div className="grid grid-cols-[360px_1fr] grid-rows-1 h-full min-h-0 overflow-hidden">
            <div className="border-r border-border p-3 space-y-0">
              <Skeleton className="h-9 w-full mb-3" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border-b border-border">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-56"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasConversations && conversations !== undefined && filter === "all") {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Inbox}
          title="Inbox is empty"
          description="When patients reply to your follow-up messages, their responses will appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="border border-border rounded-lg overflow-hidden bg-background h-full">
        <div className="grid grid-cols-[360px_1fr] grid-rows-1 h-full min-h-0 overflow-hidden">
          {/* Left pane — conversation list */}
          <ConversationList pinnedConversation={selectedConversation} />

          {/* Right pane — thread or empty state */}
          {selectedConversation ? (
            <ConversationThread conversation={selectedConversation} />
          ) : (
            <EmptyThreadState />
          )}
        </div>
      </div>
    </div>
  );
}
