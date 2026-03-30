"use client";

import { useState } from "react";
import { Calendar, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingConfirmationScreen } from "./BookingConfirmationScreen";
import { useSandboxStore } from "@/stores/sandbox-store";
import { useUiStore } from "@/stores/ui-store";

interface PortalPatient {
  first_name: string;
}

interface PortalPractice {
  name: string;
  phone: string;
  email: string;
}

interface PortalPlan {
  id: string;
  description: string;
  code: string;
  practice: PortalPractice;
}

interface TreatmentPlanViewProps {
  patient: PortalPatient;
  plan: PortalPlan;
  isSandbox: boolean;
  treatmentAmount?: number;
}

export function TreatmentPlanView({
  patient,
  plan,
  isSandbox,
  treatmentAmount,
}: TreatmentPlanViewProps) {
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const sandboxStore = useSandboxStore();
  const addToast = useUiStore((s) => s.addToast);

  if (booked) {
    return <BookingConfirmationScreen practice={plan.practice} />;
  }

  async function handleBooking() {
    setLoading(true);
    try {
      if (isSandbox) {
        const now = new Date().toISOString();
        const amount = treatmentAmount ?? 0;

        sandboxStore.updateTreatment(plan.id, {
          status: "accepted",
          decided_at: now,
        });

        const currentStats = sandboxStore.getDashboardStats();
        sandboxStore.updateDashboardStats({
          revenue_recovered: currentStats.revenue_recovered + amount,
        });

        sandboxStore.addActivityFeedItem({
          id: `portal-booked-${Date.now()}`,
          type: "booked",
          description: `Booked ${plan.description} — $${amount.toLocaleString()} recovered`,
          patientName: patient.first_name,
          amount,
          timestamp: now,
        });

        addToast({
          title: "Treatment plan booked!",
          description: `${patient.first_name} — $${amount.toLocaleString()} recovered`,
          variant: "success",
        });
      } else {
        await fetch("/api/portal/request-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ treatmentId: plan.id }),
        });
      }
      setBooked(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="mx-auto max-w-[420px] space-y-6">
        {/* Practice header */}
        <div className="text-center pt-4">
          <h1 className="text-lg font-semibold text-stone-900">
            {plan.practice.name}
          </h1>
          <p className="text-sm text-stone-500">Treatment plan follow-up</p>
        </div>

        {/* Greeting + procedure + CTAs */}
        <Card className="border-stone-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-normal text-stone-900">
              Hi {patient.first_name}, your treatment plan is ready to schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Procedure block */}
            <div className="rounded-lg bg-stone-100 p-4">
              <p
                className="text-stone-700 leading-relaxed"
                style={{ fontFamily: "var(--font-lora)" }}
              >
                {plan.description}
              </p>
            </div>

            {/* Primary CTA */}
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Yes, I&apos;d like to schedule this
            </Button>

            {/* Secondary CTA */}
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              asChild
            >
              <a href={`tel:${plan.practice.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call us to schedule
              </a>
            </Button>

            {/* Footer */}
            <p className="text-center text-xs text-stone-400">
              To stop receiving these reminders, reply STOP to any of our
              messages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
