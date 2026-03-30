"use client";

import { useEffect, useRef, useMemo } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { MessageSquareText, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { ReplyComposer } from "./ReplyComposer";
import {
  useConversationMessages,
  useMarkConversationRead,
  useSendReply,
} from "@/hooks/useInbox";
import { usePatientTreatments } from "@/hooks/usePatients";
import { useSandbox } from "@/lib/sandbox";
import { type ConversationWithPatient } from "@/types/app.types";
import { type Tables } from "@/types/database.types";

function formatDateSeparator(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
        {formatDateSeparator(date)}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

function groupMessagesByDate(messages: Tables<"messages">[]) {
  const groups: { date: Date; messages: Tables<"messages">[] }[] = [];

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: msgDate, messages: [msg] });
    }
  }

  return groups;
}

function ThreadSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton
            className={`h-16 rounded-2xl ${
              i % 2 === 0 ? "w-48" : "w-56"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

interface ConversationThreadProps {
  conversation: ConversationWithPatient;
}

export function ConversationThread({ conversation }: ConversationThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages, isLoading } = useConversationMessages(
    conversation.id,
    conversation.patient_id
  );
  const markRead = useMarkConversationRead();
  const sendReply = useSendReply();
  const { isSandbox, sandboxStore } = useSandbox();
  const { data: treatments } = usePatientTreatments(conversation.patient_id);

  // Mark as read when opened
  useEffect(() => {
    if (conversation.unread_count > 0) {
      markRead.mutate(conversation.id);
    }
    // Only run when conversation changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const messageGroups = useMemo(
    () => groupMessagesByDate(messages ?? []),
    [messages]
  );

  const patient = conversation.patient;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Thread header — pinned top */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div>
          <h3 className="text-sm font-semibold">
            {patient.first_name} {patient.last_name}
          </h3>
          {patient.phone && (
            <p className="text-xs text-muted-foreground">{patient.phone}</p>
          )}
        </div>
        {isSandbox && treatments && treatments.length > 0 && (
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => {
              const treatment = treatments.find((t) => t.status === "pending") ?? treatments[0];
              const rawToken = `sandbox-token-${patient.id}-${Date.now()}`;
              sandboxStore.addPortalToken({
                rawToken,
                patientId: patient.id,
                treatmentId: treatment.id,
                practiceId: "sandbox-practice-001",
                expiresAt: Date.now() + 72 * 60 * 60 * 1000,
                usedAt: null,
              });
              const params = new URLSearchParams({
                patientFirstName: patient.first_name,
                treatmentDescription: treatment.description,
                treatmentId: treatment.id,
                treatmentCode: treatment.code,
                practiceName: "Riverside Family Dental",
                practicePhone: "(555) 123-4567",
                practiceEmail: "front-desk@riverside.demo",
                treatmentAmount: String(treatment.amount),
              });
              window.open(`/portal/${rawToken}?${params.toString()}`, "_blank");
            }}
          >
            <ExternalLink className="mr-1.5 h-3 w-3" />
            Simulate patient booking view →
          </Button>
        )}
      </div>

      {/* Messages — scrollable middle */}
      {isLoading ? (
        <ThreadSkeleton />
      ) : !messages?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <MessageSquareText className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
          aria-live="polite"
          aria-label="Messages"
        >
          <div className="p-4 space-y-1">
            {messageGroups.map((group, gi) => (
              <div key={gi}>
                <DateSeparator date={group.date} />
                <div className="space-y-2">
                  {group.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply composer — pinned bottom */}
      <div className="shrink-0">
        <ReplyComposer
          onSend={(body) =>
            sendReply.mutate({
              patientId: conversation.patient_id,
              conversationId: conversation.id,
              body,
            })
          }
          isSending={sendReply.isPending}
        />
      </div>
    </div>
  );
}

export function EmptyThreadState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <MessageSquareText className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="text-lg font-semibold mb-1">Select a conversation</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Choose a conversation from the list to view messages and reply to
        patients.
      </p>
    </div>
  );
}
