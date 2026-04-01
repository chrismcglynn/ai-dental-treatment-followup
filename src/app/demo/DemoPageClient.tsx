"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/shared/AppShell";

import { DemoSessionProvider } from "./DemoSessionProvider";
import { DemoSignupForm, type DemoSignupData } from "./DemoSignupForm";
import DashboardPage from "@/app/(dashboard)/dashboard/page";

type DemoStep = "landing" | "signup" | "dashboard";

export function DemoPageClient() {
  const [step, setStep] = useState<DemoStep>("landing");
  const [signupData, setSignupData] = useState<DemoSignupData | null>(null);

  if (step === "dashboard" && signupData) {
    return (
      <DemoSessionProvider signupData={signupData}>
        <AppShell>
          <DashboardPage />
        </AppShell>

      </DemoSessionProvider>
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
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
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
              className="gap-2"
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

      {/* CTA footer */}
      <div className="border-t bg-muted/30 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Ready to try it with your own practice?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Start your free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
