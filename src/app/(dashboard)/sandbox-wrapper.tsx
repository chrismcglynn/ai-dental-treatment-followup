"use client";

import { type ReactNode } from "react";
import { SandboxProvider } from "@/lib/sandbox";
import { usePracticeStore } from "@/stores/practice-store";
import { useSandboxStore } from "@/stores/sandbox-store";

/**
 * Reads the active practice's sandbox_mode flag and conditionally
 * wraps children in SandboxProvider. This bridges the server-seeded
 * sandbox_mode DB flag to the client-side sandbox context.
 *
 * When a demoUser exists (set by the demo signup flow), auto-starts
 * the simulation at fast speed.
 */
export function SandboxWrapper({ children }: { children: ReactNode }) {
  const practice = usePracticeStore((s) => s.activePractice);
  const isSandbox = practice?.sandbox_mode === true;
  const isDemoSession = useSandboxStore((s) => s.demoUser !== null);

  if (isSandbox) {
    return (
      <SandboxProvider
        autoStart={isDemoSession}
        initialSpeed={isDemoSession ? "fast" : "normal"}
      >
        {children}
      </SandboxProvider>
    );
  }

  return <>{children}</>;
}
