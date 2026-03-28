"use client";

import { useState } from "react";
import { format } from "date-fns";
import { type Tables } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactTimelineProps {
  messages: Tables<"messages">[];
  loading?: boolean;
}

const channelIcons: Record<Tables<"messages">["channel"], typeof Mail> = {
  sms: MessageSquare,
  email: Mail,
  voicemail: Phone,
};

const statusColors: Record<Tables<"messages">["status"], string> = {
  queued: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  received: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, "MMM d");
}

function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy h:mm a");
}

function TimelineItem({ message }: { message: Tables<"messages"> }) {
  const [expanded, setExpanded] = useState(false);
  const ChannelIcon = channelIcons[message.channel];
  const isInbound = message.direction === "inbound";
  const DirectionIcon = isInbound ? ArrowDownLeft : ArrowUpRight;

  const timestamp = message.sent_at || message.created_at;
  const preview = message.body
    ? message.body.length > 80
      ? message.body.slice(0, 80) + "..."
      : message.body
    : message.subject || "No content";

  return (
    <div
      className={cn(
        "relative pl-8 pb-6 last:pb-0 group",
        isInbound && "bg-amber-50/50 dark:bg-amber-950/10 -mx-4 px-12 py-3 rounded-lg"
      )}
    >
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border group-last:hidden" />

      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background",
          isInbound
            ? "bg-amber-100 dark:bg-amber-900/50"
            : "bg-muted"
        )}
      >
        <ChannelIcon className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <DirectionIcon className={cn("h-3 w-3", isInbound ? "text-amber-600" : "text-muted-foreground")} />
          <span className="text-xs font-medium capitalize">
            {message.channel} {isInbound ? "received" : "sent"}
          </span>
          <Badge className={`${statusColors[message.status]} border-0 text-[10px] px-1.5 py-0`}>
            {message.status}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatRelativeTime(timestamp)}
          </span>
        </div>

        {message.subject && (
          <p className="text-xs font-medium">{message.subject}</p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-left w-full group/expand"
        >
          <p className="text-sm text-muted-foreground">
            {expanded ? message.body : preview}
          </p>
          {message.body && message.body.length > 80 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-primary mt-1">
              {expanded ? (
                <>Show less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show more <ChevronDown className="h-3 w-3" /></>
              )}
            </span>
          )}
        </button>

        {expanded && (
          <div className="text-xs text-muted-foreground space-y-0.5 mt-2 pt-2 border-t">
            <p>Created: {formatDateTime(message.created_at)}</p>
            {message.sent_at && <p>Sent: {formatDateTime(message.sent_at)}</p>}
            {message.delivered_at && <p>Delivered: {formatDateTime(message.delivered_at)}</p>}
            {message.read_at && <p>Read: {formatDateTime(message.read_at)}</p>}
            {message.error && <p className="text-red-500">Error: {message.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContactTimeline({ messages, loading }: ContactTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {messages.map((message) => (
        <TimelineItem key={message.id} message={message} />
      ))}
    </div>
  );
}
