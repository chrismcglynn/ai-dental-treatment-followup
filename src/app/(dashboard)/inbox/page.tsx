"use client";

import { useMemo } from "react";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
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

export default function InboxPage() {
  const selectedConversationId = useInboxStore(
    (s) => s.selectedConversationId
  );
  const { data: conversations, isLoading } = useConversations();

  // Subscribe to realtime updates
  useInboxRealtime();

  const selectedConversation = useMemo(
    () => conversations?.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const hasConversations = !!conversations?.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Inbox"
          description="Patient replies and conversations"
        />
        <div className="border border-border rounded-lg overflow-hidden bg-background h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-[340px_1fr] h-full">
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

  if (!hasConversations && conversations !== undefined) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inbox"
          description="Patient replies and conversations"
        />
        <EmptyState
          icon={Inbox}
          title="Inbox is empty"
          description="When patients reply to your follow-up messages, their responses will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inbox"
        description="Patient replies and conversations"
      />

      <div className="border border-border rounded-lg overflow-hidden bg-background h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-[340px_1fr] h-full">
          {/* Left pane — conversation list */}
          <ConversationList />

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
