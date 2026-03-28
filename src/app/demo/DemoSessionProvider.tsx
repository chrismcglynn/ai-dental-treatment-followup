"use client";

import { useEffect, type ReactNode } from "react";
import { usePracticeStore } from "@/stores/practice-store";
import { SANDBOX_PRACTICE } from "@/lib/sandbox/sandboxData";
import { SandboxProvider } from "@/lib/sandbox";

/**
 * Provides a fake auth/practice context for the public demo page.
 * Sets the sandbox practice in the practice store so all dashboard
 * hooks that read `activePracticeId` work correctly without real auth.
 */
export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const setActivePractice = usePracticeStore((s) => s.setActivePractice);
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);

  // Seed the practice store with sandbox practice on mount
  useEffect(() => {
    if (activePracticeId !== SANDBOX_PRACTICE.id) {
      setActivePractice(SANDBOX_PRACTICE);
    }
  }, [activePracticeId, setActivePractice]);

  // Don't render children until the practice store is ready
  if (activePracticeId !== SANDBOX_PRACTICE.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SandboxProvider initialSpeed="fast" autoStart>
      {children}
    </SandboxProvider>
  );
}
