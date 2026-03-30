"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePracticeStore } from "@/stores/practice-store";
import { useSandboxStore } from "@/stores/sandbox-store";
import { SANDBOX_PRACTICE } from "@/lib/sandbox/sandboxData";
import { SandboxProvider } from "@/lib/sandbox";
import { type DemoSignupData } from "./DemoSignupForm";

interface DemoSessionProviderProps {
  children: ReactNode;
  signupData: DemoSignupData;
}

/**
 * Provides a fake auth/practice context for the public demo page.
 * Sets the sandbox practice in the practice store so all dashboard
 * hooks that read `activePracticeId` work correctly without real auth.
 */
export function DemoSessionProvider({ children, signupData }: DemoSessionProviderProps) {
  const setActivePractice = usePracticeStore((s) => s.setActivePractice);
  const activePracticeId = usePracticeStore((s) => s.activePracticeId);
  const setDemoUser = useSandboxStore((s) => s.setDemoUser);

  // Clear tour state synchronously (before children mount) so SandboxTour
  // doesn't read stale "dismissed" from a previous session.
  const tourReset = useRef(false);
  if (!tourReset.current && typeof window !== "undefined") {
    sessionStorage.removeItem("followdent-sandbox-tour");
    sessionStorage.removeItem("followdent-sandbox-tour-dismissed");
    tourReset.current = true;
  }

  // Always set the practice with the user's name (even if ID already matches
  // from a previous session, the name may differ)
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setActivePractice({
      ...SANDBOX_PRACTICE,
      name: signupData.practice_name,
    });
  }, [setActivePractice, signupData.practice_name]);

  // Seed the demo user, team member, and sandbox practice name
  useEffect(() => {
    setDemoUser({
      full_name: signupData.full_name,
      email: signupData.email,
      role: signupData.role,
    });
    // Also update sandbox store's practice so hooks reading from there get the right name
    useSandboxStore.setState((s) => ({
      practice: { ...s.practice, name: signupData.practice_name },
    }));
  }, [setDemoUser, signupData]);

  // Don't render children until the practice store is ready
  if (!activePracticeId) {
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
