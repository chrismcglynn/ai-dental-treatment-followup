"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useInboxStore, type InboxFilter } from "@/stores/inbox-store";
import { useConversations } from "@/hooks/useInbox";
import { type ConversationWithPatient } from "@/types/app.types";

const BOOKING_KEYWORDS = [
  "book",
  "schedule",
  "appointment",
  "yes",
  "ready",
  "interested",
  "sign me up",
  "when can",
  "available",
];

function hasBookingIntent(preview: string | null): boolean {
  if (!preview) return false;
  const lower = preview.toLowerCase();
  return BOOKING_KEYWORDS.some((kw) => lower.includes(kw));
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationWithPatient;
  isSelected: boolean;
  onClick: () => void;
}) {
  const patient = conversation.patient;
  const isUnread = conversation.unread_count > 0;
  const isUrgent = hasBookingIntent(conversation.last_message_preview);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-primary/10 border-b border-border",
        isSelected && "bg-primary/15",
        isUnread && !isSelected && "bg-primary/5"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs font-medium">
            {getInitials(patient.first_name, patient.last_name)}
          </AvatarFallback>
        </Avatar>
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              isUnread ? "font-semibold" : "font-medium"
            )}
          >
            {patient.first_name} {patient.last_name}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(conversation.last_message_at), {
              addSuffix: false,
            })}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            SMS
          </Badge>
          {isUrgent && (
            <AlertTriangle className="h-3 w-3 text-accent shrink-0" />
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate mt-1 max-w-[240px]">
          {conversation.last_message_preview ?? "No messages yet"}
        </p>
      </div>
    </button>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-0">
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
  );
}

export function ConversationList() {
  const { selectedConversationId, setSelectedConversation, filter, setFilter } =
    useInboxStore();
  const { data: conversations, isLoading } = useConversations();

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-3 border-b border-border">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as InboxFilter)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs">
              Unread
            </TabsTrigger>
            <TabsTrigger value="needs_reply" className="flex-1 text-xs">
              Needs Reply
            </TabsTrigger>
            <TabsTrigger value="replied" className="flex-1 text-xs">
              Replied
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1" aria-live="polite" aria-label="Conversations">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : !conversations?.length ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No conversations found
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedConversationId === conv.id}
              onClick={() => setSelectedConversation(conv.id)}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
