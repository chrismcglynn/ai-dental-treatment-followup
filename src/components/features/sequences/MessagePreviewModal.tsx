"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, RefreshCw, Check, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type StepData } from "./types";

interface MessagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StepData | null;
  practiceId: string;
  onUseTemplate: (stepId: string, message: string) => void;
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}

function SMSBubble({ message, isLoading }: { message: string; isLoading: boolean }) {
  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-muted rounded-2xl rounded-bl-sm p-4 shadow-sm">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating...</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">
            <TypewriterText text={message} />
          </p>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">SMS Preview</p>
    </div>
  );
}

function EmailPreview({ message, isLoading }: { message: string; isLoading: boolean }) {
  const lines = message.split("\n");
  const subjectLine = lines.find((l) => l.toLowerCase().startsWith("subject:"));
  const body = lines
    .filter((l) => !l.toLowerCase().startsWith("subject:"))
    .join("\n")
    .trim();

  return (
    <div className="max-w-md mx-auto border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2.5 border-b">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating...</span>
          </div>
        ) : (
          <p className="text-sm font-medium">
            {subjectLine
              ? subjectLine.replace(/^subject:\s*/i, "")
              : "Follow-up on your treatment plan"}
          </p>
        )}
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded animate-pulse w-full" />
            <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
            <div className="h-3 bg-muted rounded animate-pulse w-3/5" />
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            <TypewriterText text={body} />
          </div>
        )}
      </div>
    </div>
  );
}

function VoicemailScript({ message, isLoading }: { message: string; isLoading: boolean }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-4 border border-amber-200 dark:border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Voicemail Script
          </span>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating...</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed italic">
            <TypewriterText text={message} />
          </p>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
        ~30 seconds when read aloud
      </p>
    </div>
  );
}

export function MessagePreviewModal({
  open,
  onOpenChange,
  step,
  practiceId,
  onUseTemplate,
}: MessagePreviewModalProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePreview() {
    if (!step) return;
    setIsLoading(true);
    setError(null);
    setMessage("");

    try {
      const res = await fetch("/api/preview-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId,
          channel: step.channel,
          tone: step.tone,
          stepNumber: step.position + 1,
          dayOffset: step.dayOffset,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate preview");

      const data = await res.json();
      setMessage(data.message);
    } catch {
      setError("Failed to generate message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open && step) {
      if (step.templateOverride) {
        setMessage(step.templateOverride);
        setIsLoading(false);
      } else {
        generatePreview();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step?.id]);

  if (!step) return null;

  const PreviewComponent =
    step.channel === "sms"
      ? SMSBubble
      : step.channel === "email"
      ? EmailPreview
      : VoicemailScript;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message Preview</DialogTitle>
          <DialogDescription>
            Day {step.dayOffset} &middot;{" "}
            {step.channel.toUpperCase()} &middot; {step.tone} tone
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={generatePreview}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Try Again
              </Button>
            </div>
          ) : (
            <PreviewComponent message={message} isLoading={isLoading} />
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreview}
            disabled={isLoading}
          >
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isLoading && "animate-spin")} />
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onUseTemplate(step.id, message);
              onOpenChange(false);
            }}
            disabled={isLoading || !message}
          >
            <Check className="mr-2 h-3.5 w-3.5" />
            Use This
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
