"use client";

import { useState, useCallback, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDraftReply } from "@/hooks/useAiDraft";

const SMS_CHAR_LIMIT = 160;

interface ReplyComposerProps {
  onSend: (body: string) => void;
  isSending: boolean;
  disabled?: boolean;
  patientFirstName?: string;
  recentMessages?: Array<{
    direction: "inbound" | "outbound";
    body: string;
  }>;
  latestIntent?: string | null;
  treatmentDescription?: string | null;
  practiceName?: string;
}

export function ReplyComposer({
  onSend,
  isSending,
  disabled,
  patientFirstName,
  recentMessages,
  latestIntent,
  treatmentDescription,
  practiceName,
}: ReplyComposerProps) {
  const [body, setBody] = useState("");
  const [isAiDraft, setIsAiDraft] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftReply = useDraftReply();

  const charCount = body.length;
  const isOverLimit = charCount > SMS_CHAR_LIMIT;
  const segmentCount = Math.ceil(charCount / SMS_CHAR_LIMIT);

  const canSuggest =
    patientFirstName && recentMessages && recentMessages.length > 0 && practiceName;

  const handleSend = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setBody("");
    setIsAiDraft(false);
    textareaRef.current?.focus();
  }, [body, isSending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestReply = useCallback(() => {
    if (!canSuggest) return;

    draftReply.mutate(
      {
        patientFirstName: patientFirstName!,
        recentMessages: recentMessages!,
        latestIntent: latestIntent ?? null,
        treatmentDescription: treatmentDescription ?? null,
        practiceName: practiceName!,
      },
      {
        onSuccess: (data) => {
          setBody(data.draft);
          setIsAiDraft(true);
          textareaRef.current?.focus();
        },
      }
    );
  }, [canSuggest, patientFirstName, recentMessages, latestIntent, treatmentDescription, practiceName, draftReply]);

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBody(e.target.value);
      if (isAiDraft) setIsAiDraft(false);
    },
    [isAiDraft]
  );

  return (
    <div className="border-t border-border p-3 space-y-2">
      {isAiDraft && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>AI draft -- review before sending</span>
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={handleBodyChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your reply..."
        className="min-h-[60px] max-h-[120px] resize-none"
        disabled={disabled || isSending}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              isOverLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {charCount}/{SMS_CHAR_LIMIT}
          </span>
          {segmentCount > 1 && (
            <span className="text-xs text-muted-foreground">
              ({segmentCount} segments)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canSuggest && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSuggestReply}
              disabled={draftReply.isPending || isSending || disabled}
            >
              <Sparkles
                className={cn(
                  "h-3.5 w-3.5 mr-1",
                  draftReply.isPending && "animate-pulse"
                )}
              />
              {draftReply.isPending ? "Drafting..." : "Suggest Reply"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!body.trim() || isSending || disabled}
          >
            {isSending ? (
              "Sending..."
            ) : (
              <>
                Send
                <Send className="h-3.5 w-3.5 ml-1" />
              </>
            )}
            <span className="sr-only">Cmd+Enter</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
