"use client";

import { useState, useCallback, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SMS_CHAR_LIMIT = 160;

interface ReplyComposerProps {
  onSend: (body: string) => void;
  isSending: boolean;
  disabled?: boolean;
}

export function ReplyComposer({
  onSend,
  isSending,
  disabled,
}: ReplyComposerProps) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = body.length;
  const isOverLimit = charCount > SMS_CHAR_LIMIT;
  const segmentCount = Math.ceil(charCount / SMS_CHAR_LIMIT);

  const handleSend = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setBody("");
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

  return (
    <div className="border-t border-border p-3 space-y-2">
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
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
  );
}
