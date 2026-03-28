"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandbox } from "@/lib/sandbox";
import { cn } from "@/lib/utils";
import type { SandboxActivity } from "@/stores/sandbox-store";

// ─── Color mapping by event type ────────────────────────────────────────────

const TYPE_CONFIG: Record<
  SandboxActivity["type"],
  { icon: string; borderColor: string }
> = {
  sms_sent: { icon: "\u{1F4E9}", borderColor: "border-l-blue-500" },
  email_sent: { icon: "\u{1F4E7}", borderColor: "border-l-purple-500" },
  voicemail_sent: { icon: "\u{1F4DE}", borderColor: "border-l-amber-500" },
  delivered: { icon: "\u{2705}", borderColor: "border-l-emerald-500" },
  replied: { icon: "\u{1F4AC}", borderColor: "border-l-rose-400" },
  booked: { icon: "\u{1F389}", borderColor: "border-l-green-500" },
  plan_detected: { icon: "\u{1F4CB}", borderColor: "border-l-sky-500" },
};

function timeAgo(timestamp: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000
  );
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SandboxActivityFeedProps {
  /** Whether the panel starts open. */
  defaultOpen?: boolean;
}

export function SandboxActivityFeed({
  defaultOpen = false,
}: SandboxActivityFeedProps) {
  const { isSandbox, activityFeed } = useSandbox();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!isSandbox) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex w-80 flex-col rounded-lg border border-border bg-background shadow-lg sm:w-96">
      {/* Header — always visible */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-t-lg"
      >
        <span className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Activity Feed
          {activityFeed.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activityFeed.length}
            </span>
          )}
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Feed list — collapsible */}
      {isOpen && (
        <div className="max-h-72 overflow-y-auto border-t border-border scrollbar-thin">
          {activityFeed.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Start the simulation to see activity here.
            </div>
          ) : (
            <ul role="log" aria-label="Simulation activity">
              {activityFeed.map((item) => {
                const config = TYPE_CONFIG[item.type];
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "border-b border-border/50 border-l-2 px-3 py-2 last:border-b-0",
                      config.borderColor
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          <span className="mr-1.5">{config.icon}</span>
                          {item.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {item.patientName}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
