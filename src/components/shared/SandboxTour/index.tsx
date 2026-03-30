"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Inbox,
  Monitor,
  Zap,
  Play,
  X,
  ChevronRight,
  CheckCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandbox } from "@/lib/sandbox";
import { useSandboxStore } from "@/stores/sandbox-store";
import { cn } from "@/lib/utils";

// ─── Tour steps ──────────────────────────────────────────────────────────────

interface TourStep {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Route prefix that marks this step as visited. */
  matchPath: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "practice",
    label: "Set up your practice",
    description: "Add phone number, timezone, and logo",
    href: "/settings",
    icon: Building2,
    matchPath: "/settings",
  },
  {
    id: "pms",
    label: "Connect your PMS",
    description: "Sync patient and treatment data automatically",
    href: "/settings/integrations",
    icon: Monitor,
    matchPath: "/settings/integrations",
  },
  {
    id: "team",
    label: "Set up your team",
    description: "Add dentists, hygienists, and staff members",
    href: "/settings?tab=team",
    icon: Users,
    matchPath: "__team__",
  },
  {
    id: "sequence",
    label: "Create your first sequence",
    description: "Set up automated follow-ups for patients",
    href: "/sequences",
    icon: Zap,
    matchPath: "/sequences",
  },
  {
    id: "inbox",
    label: "Check the Inbox",
    description: "See and reply to patient messages",
    href: "/inbox",
    icon: Inbox,
    matchPath: "/inbox",
  },
  {
    id: "simulation",
    label: "Watch the simulation",
    description: "Click \"Start simulation\" and watch revenue tick up",
    href: "#simulation",
    icon: Play,
    matchPath: "__simulation__",
  },
];

const STORAGE_KEY = "followdent-sandbox-tour";

// ─── Persistence helpers ─────────────────────────────────────────────────────

function loadCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore
  }
  return new Set();
}

function saveCompleted(completed: Set<string>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completed)));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SandboxTour() {
  const { isSandbox, simulationActive } = useSandbox();
  const teamMemberCount = useSandboxStore((s) => s.teamMembers.length);
  const pathname = usePathname();
  const router = useRouter();

  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    setCompleted(loadCompleted());
  }, []);

  // Auto-complete steps based on visited routes
  useEffect(() => {
    if (!isSandbox || dismissed) return;

    let didUpdate = false;
    const next = new Set(completed);

    for (const step of TOUR_STEPS) {
      if (step.id === "simulation") continue;
      if (!next.has(step.id) && pathname.startsWith(step.matchPath)) {
        next.add(step.id);
        didUpdate = true;
      }
    }

    if (didUpdate) {
      setCompleted(next);
      saveCompleted(next);
    }
  }, [pathname, isSandbox, dismissed, completed]);

  // Auto-complete simulation step when simulation starts
  useEffect(() => {
    if (!isSandbox || dismissed) return;

    if (simulationActive && !completed.has("simulation")) {
      const next = new Set(completed);
      next.add("simulation");
      setCompleted(next);
      saveCompleted(next);
    }
  }, [simulationActive, isSandbox, dismissed, completed]);

  // Auto-complete team step when team has more than 1 member
  useEffect(() => {
    if (!isSandbox || dismissed) return;

    if (teamMemberCount > 1 && !completed.has("team")) {
      const next = new Set(completed);
      next.add("team");
      setCompleted(next);
      saveCompleted(next);
    }
  }, [teamMemberCount, isSandbox, dismissed, completed]);

  const handleStepClick = useCallback(
    (step: TourStep) => {
      if (step.id === "simulation") {
        // Scroll to banner / just mark as a hint
        return;
      }
      router.push(step.href);
    },
    [router]
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(`${STORAGE_KEY}-dismissed`, "true");
  }, []);

  // Check dismiss state on mount
  useEffect(() => {
    if (sessionStorage.getItem(`${STORAGE_KEY}-dismissed`) === "true") {
      setDismissed(true);
    }
  }, []);

  if (!isSandbox || dismissed) return null;

  const completedCount = completed.size;
  const allDone = completedCount === TOUR_STEPS.length;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-80 rounded-lg border border-border bg-background shadow-lg sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => setIsCollapsed((p) => !p)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-sm font-semibold text-foreground">
            {allDone ? "Setup complete!" : "Get started"}
          </span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{TOUR_STEPS.length}
          </span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed((p) => !p)}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={isCollapsed ? "Expand tour" : "Collapse tour"}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                !isCollapsed && "rotate-90"
              )}
            />
          </button>
          <button
            onClick={handleDismiss}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!isCollapsed && (
        <div className="px-4 py-3 space-y-1">
          <p className="text-xs text-muted-foreground mb-3">
            Complete these steps to set up your practice and start recovering
            revenue:
          </p>

          {TOUR_STEPS.map((step, i) => {
            const isDone = completed.has(step.id);
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step)}
                disabled={step.id === "simulation"}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
                  isDone
                    ? "opacity-60"
                    : "hover:bg-muted/50",
                  step.id === "simulation" && "cursor-default"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      isDone
                        ? "line-through text-muted-foreground"
                        : "font-medium text-foreground"
                    )}
                  >
                    {i + 1}. {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}

          {allDone && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={handleDismiss}
              >
                Got it, close
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
