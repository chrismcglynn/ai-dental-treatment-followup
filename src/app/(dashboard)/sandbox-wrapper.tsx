"use client";

import { type ReactNode } from "react";
import { SandboxProvider } from "@/lib/sandbox";
import { usePracticeStore } from "@/stores/practice-store";

/**
 * Reads the active practice's sandbox_mode flag and conditionally
 * wraps children in SandboxProvider. This bridges the server-seeded
 * sandbox_mode DB flag to the client-side sandbox context.
 */
export function SandboxWrapper({ children }: { children: ReactNode }) {
  const practice = usePracticeStore((s) => s.activePractice);
  const isSandbox = practice?.sandbox_mode === true;

  if (isSandbox) {
    return <SandboxProvider>{children}</SandboxProvider>;
  }

  return <>{children}</>;
}
