"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Play, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/shared/AppShell";
import { useSandboxStore } from "@/stores/sandbox-store";
import { decodePrefill } from "@/lib/demo-prefill";

import { DemoSessionProvider } from "./DemoSessionProvider";
import { DemoSignupForm, type DemoSignupData } from "./DemoSignupForm";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

type DemoStep = "landing" | "prefilled" | "signup" | "dashboard";

export function DemoPageClient() {
  type Phase = "loading" | "resuming" | "ready";
  const [phase, setPhase] = useState<Phase>("loading");
  const [step, setStep] = useState<DemoStep>("landing");
  const [signupData, setSignupData] = useState<DemoSignupData | null>(null);
  // Snapshot of user data captured at hydration time (avoids reactive flicker)
  const resumeData = useRef<{ fullName: string; practiceName: string } | null>(null);

  const searchParams = useSearchParams();

  // Check for prefill data from ?d= query param
  useEffect(() => {
    const encoded = searchParams.get("d");
    if (encoded) {
      const prefill = decodePrefill(encoded);
      if (prefill) {
        setSignupData(prefill);
        setStep("prefilled");
      }
    }
  }, [searchParams]);

  // Single effect: wait for hydration, then decide phase in the same tick
  useEffect(() => {
    const handleHydrated = () => {
      const { demoUser, practice } = useSandboxStore.getState();
      if (demoUser) {
        // Capture data from store snapshot — available immediately, no flicker
        resumeData.current = {
          fullName: demoUser.full_name,
          practiceName: practice.name,
        };
        setPhase("resuming");

        const data: DemoSignupData = {
          full_name: demoUser.full_name,
          email: demoUser.email,
          role: demoUser.role,
          practice_name: practice.name,
        };
        const timer = setTimeout(() => {
          setSignupData(data);
          setStep("dashboard");
          setPhase("ready");
        }, 2000);
        return () => clearTimeout(timer);
      }
      setPhase("ready");
    };

    if (useSandboxStore.persist.hasHydrated()) {
      return handleHydrated();
    }
    const unsub = useSandboxStore.persist.onFinishHydration(() => {
      handleHydrated();
    });
    return unsub;
  }, []);

  // Show interstitial while loading or resuming
  if (phase !== "ready") {
    const rd = resumeData.current;
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
        {/* Animated gradient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl animate-pulse [animation-delay:1s]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
          {/* Pulsing logo ring */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2s]" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
          </div>

          {/* Always render the same layout — skeleton or real text */}
          <div className="space-y-2">
            {/* "Welcome back" — h-5 matches text-sm line height */}
            {rd ? (
              <p className="h-5 text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Welcome back
              </p>
            ) : (
              <div className="flex h-5 items-center justify-center">
                <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
              </div>
            )}

            {/* Name — h-8 sm:h-9 matches text-2xl/3xl line height */}
            {rd ? (
              <h1 className="h-8 text-2xl font-bold text-foreground sm:h-9 sm:text-3xl">
                {rd.fullName}
              </h1>
            ) : (
              <div className="flex h-8 items-center justify-center sm:h-9">
                <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
              </div>
            )}

            {/* Practice name — h-9 sm:h-10 matches text-3xl/4xl line height */}
            {rd ? (
              <p className="h-9 text-3xl font-bold text-primary sm:h-10 sm:text-4xl">
                {rd.practiceName}
              </p>
            ) : (
              <div className="flex h-9 items-center justify-center sm:h-10">
                <div className="h-6 w-56 animate-pulse rounded-md bg-primary/10" />
              </div>
            )}
          </div>

          {/* Loading bar */}
          <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-primary/10">
            <div
              className={`h-full w-full origin-left rounded-full bg-primary ${
                rd ? "animate-[grow_2s_ease-in-out]" : "animate-pulse"
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === "dashboard" && signupData) {
    return (
      <DemoSessionProvider signupData={signupData}>
        <AppShell>
          <DashboardPage />
        </AppShell>
      </DemoSessionProvider>
    );
  }

  if (step === "prefilled" && signupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Welcome, {signupData.full_name}!
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Your interactive demo is ready to explore
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {signupData.practice_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {signupData.email}
                </p>
              </div>
              <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-green-500" />
            </div>

            <div className="border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Name</span>
                  <p className="font-medium text-foreground">{signupData.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role</span>
                  <p className="font-medium text-foreground capitalize">
                    {signupData.role.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => setStep("dashboard")}
          >
            Start Demo
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Uses simulated data tailored to your practice
          </p>
        </div>
      </div>
    );
  }

  if (step === "signup") {
    return (
      <DemoSignupForm
        onSubmit={(data) => {
          setSignupData(data);
          setStep("dashboard");
        }}
        onBack={() => setStep("landing")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Retaine recovers unscheduled treatment revenue
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Watch a live demo of a real dental practice&apos;s follow-up
            sequences — no signup required
          </p>

          <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => setStep("signup")}
              className="gap-2"
            >
              Start interactive demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled
              title="Coming soon"
            >
              <Play className="h-4 w-4" />
              Watch 2-min video
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            No account needed. Uses simulated data from a demo practice.
          </p>
        </div>
      </div>

    </div>
  );
}
