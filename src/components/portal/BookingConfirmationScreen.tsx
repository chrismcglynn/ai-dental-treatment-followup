"use client";

import { useEffect } from "react";
import { CheckCircle2, Phone, Calendar, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import type { AvailabilityPreferences } from "./TreatmentPlanView";

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

const TIME_LABELS: Record<string, string> = {
  early_morning: "Early Morning (8–10 AM)",
  late_morning: "Late Morning (10 AM–12 PM)",
  early_afternoon: "Early Afternoon (12–2 PM)",
  late_afternoon: "Late Afternoon (2–5 PM)",
};

function getMonthLabel(value: string): string {
  // value is "yyyy-MM"
  const [year, month] = value.split("-").map(Number);
  const d = new Date(year, month - 1);
  return format(d, "MMMM yyyy");
}

interface BookingSubmission {
  mode: "book" | "availability";
  date?: Date;
  time?: string;
  availability?: AvailabilityPreferences;
}

interface BookingConfirmationScreenProps {
  practice: {
    name: string;
    phone: string;
  };
  submission: BookingSubmission;
}

export function BookingConfirmationScreen({
  practice,
  submission,
}: BookingConfirmationScreenProps) {
  useEffect(() => {
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#f59e0b", "#22c55e", "#3b82f6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#f59e0b", "#22c55e", "#3b82f6"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div
      className="min-h-screen bg-stone-50 p-6"
      style={{ colorScheme: "light" }}
    >
      <div className="mx-auto max-w-[420px] flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-stone-900">
            You&apos;re all set!
          </h1>
          <p className="text-stone-600">
            {practice.name} will be in touch shortly to confirm your appointment.
          </p>
        </div>

        {/* Summary card */}
        <div className="w-full rounded-lg bg-white border border-stone-200 p-4 text-left">
          {submission.mode === "book" && submission.date && submission.time ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Your preferred time
                </span>
              </div>
              <p className="text-stone-900 font-medium">
                {format(submission.date, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-stone-600 text-sm">
                {formatTime12(submission.time)}
              </p>
            </>
          ) : submission.mode === "availability" && submission.availability ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Your availability
                </span>
              </div>
              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-0.5">
                    Months
                  </p>
                  <p className="text-sm text-stone-700">
                    {submission.availability.months
                      .map(getMonthLabel)
                      .join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-0.5">
                    Days
                  </p>
                  <p className="text-sm text-stone-700">
                    {submission.availability.daysOfWeek
                      .map((d) => d.charAt(0).toUpperCase() + d.slice(1) + "s")
                      .join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-0.5">
                    Preferred times
                  </p>
                  <p className="text-sm text-stone-700">
                    {submission.availability.timesOfDay
                      .map((t) => TIME_LABELS[t] ?? t)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <p className="text-xs text-stone-400 max-w-xs">
          The office will do their best to accommodate your preferences. They
          may reach out with options that fit your schedule.
        </p>

        <Button
          variant="outline"
          size="lg"
          asChild
          className="bg-white text-stone-900 border-stone-300 hover:bg-stone-100"
        >
          <a href={`tel:${practice.phone}`}>
            <Phone className="mr-2 h-4 w-4" />
            Questions? Call us at {practice.phone}
          </a>
        </Button>
      </div>
    </div>
  );
}
