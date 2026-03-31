"use client";

import { useState, useMemo } from "react";
import { Calendar, Phone, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingConfirmationScreen } from "./BookingConfirmationScreen";
import { useSandboxStore } from "@/stores/sandbox-store";
import { useUiStore } from "@/stores/ui-store";
import { broadcastPortalBooking } from "@/lib/sandbox/portalBroadcast";
import { format, addMonths } from "date-fns";

// ─── Practice hours types ───────────────────────────────────────────────────

export interface DayHours {
  open: string; // "08:00"
  close: string; // "17:00"
}

export type PracticeHours = Record<string, DayHours | null>; // null = closed

export const DEFAULT_PRACTICE_HOURS: PracticeHours = {
  sunday: null,
  monday: { open: "08:00", close: "17:00" },
  tuesday: { open: "08:00", close: "17:00" },
  wednesday: { open: "08:00", close: "17:00" },
  thursday: { open: "08:00", close: "17:00" },
  friday: { open: "08:00", close: "14:00" },
  saturday: null,
};

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export interface AvailabilityPreferences {
  months: string[];
  daysOfWeek: string[];
  timesOfDay: string[];
}

// ─── Preference option constants ────────────────────────────────────────────

function getUpcomingMonths(): { value: string; label: string }[] {
  const now = new Date();
  const months: { value: string; label: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const d = addMonths(now, i);
    months.push({
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy"),
    });
  }
  return months;
}

const DAYS_OF_WEEK_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
] as const;

const TIME_OF_DAY_OPTIONS = [
  { value: "early_morning", label: "Early Morning", desc: "8:00 – 10:00 AM" },
  { value: "late_morning", label: "Late Morning", desc: "10:00 AM – 12:00 PM" },
  { value: "early_afternoon", label: "Early Afternoon", desc: "12:00 – 2:00 PM" },
  { value: "late_afternoon", label: "Late Afternoon", desc: "2:00 – 5:00 PM" },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value];
}

function formatAvailabilityMessage(prefs: AvailabilityPreferences): string {
  const monthLabels = getUpcomingMonths();
  const months = prefs.months
    .map((m) => monthLabels.find((o) => o.value === m)?.label ?? m)
    .join(", ");
  const days = prefs.daysOfWeek
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1) + "s")
    .join(", ");
  const times = prefs.timesOfDay
    .map(
      (t) =>
        TIME_OF_DAY_OPTIONS.find((o) => o.value === t)?.label ?? t
    )
    .join(", ");

  return `I'd like to schedule my appointment. Here's my availability:\n• Months: ${months}\n• Days: ${days}\n• Preferred times: ${times}`;
}

// ─── Component interfaces ───────────────────────────────────────────────────

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
  practiceHours?: PracticeHours;
}

// ─── Hours of Operation display ─────────────────────────────────────────────

function HoursOfOperation({ hours }: { hours: PracticeHours }) {
  return (
    <div className="rounded-lg bg-stone-50 border border-stone-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-3.5 w-3.5 text-stone-500" />
        <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
          Hours of Operation
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {DAY_NAMES.map((day) => {
          const dayHours = hours[day];
          return (
            <div key={day} className="flex justify-between text-xs">
              <span className="text-stone-500 capitalize">
                {day.slice(0, 3)}
              </span>
              <span className={dayHours ? "text-stone-700" : "text-stone-400"}>
                {dayHours
                  ? `${formatTime12(dayHours.open)} – ${formatTime12(dayHours.close)}`
                  : "Closed"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Availability preference picker ─────────────────────────────────────────

function AvailabilityPicker({
  preferences,
  onUpdate,
  practiceHours,
}: {
  preferences: AvailabilityPreferences;
  onUpdate: (prefs: AvailabilityPreferences) => void;
  practiceHours: PracticeHours;
}) {
  const upcomingMonths = useMemo(() => getUpcomingMonths(), []);

  // Filter day-of-week options to only days the practice is open
  const openDays = DAYS_OF_WEEK_OPTIONS.filter(
    (d) => practiceHours[d.value] !== null && practiceHours[d.value] !== undefined
  );

  // Filter time-of-day options to times that overlap with practice hours
  const availableTimes = useMemo(() => {
    // Find earliest open and latest close across all open days
    let earliestOpen = 24 * 60;
    let latestClose = 0;
    for (const day of DAY_NAMES) {
      const h = practiceHours[day];
      if (!h) continue;
      const [oh, om] = h.open.split(":").map(Number);
      const [ch, cm] = h.close.split(":").map(Number);
      earliestOpen = Math.min(earliestOpen, oh * 60 + om);
      latestClose = Math.max(latestClose, ch * 60 + cm);
    }

    const timeRanges: Record<string, [number, number]> = {
      early_morning: [8 * 60, 10 * 60],
      late_morning: [10 * 60, 12 * 60],
      early_afternoon: [12 * 60, 14 * 60],
      late_afternoon: [14 * 60, 17 * 60],
    };

    return TIME_OF_DAY_OPTIONS.filter((opt) => {
      const [start, end] = timeRanges[opt.value];
      // Time slot overlaps with practice hours if slot starts before latest close
      // and slot ends after earliest open
      return start < latestClose && end > earliestOpen;
    });
  }, [practiceHours]);

  return (
    <div className="space-y-5">
      {/* Month preference */}
      <div>
        <label className="text-sm font-medium text-stone-700 mb-2 block">
          What month works best for you?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {upcomingMonths.map((month) => (
            <button
              key={month.value}
              type="button"
              onClick={() =>
                onUpdate({
                  ...preferences,
                  months: toggleInArray(preferences.months, month.value),
                })
              }
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                preferences.months.includes(month.value)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "border-stone-200 text-stone-700 hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              {month.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-1">Select all that apply</p>
      </div>

      {/* Day of week preference */}
      <div>
        <label className="text-sm font-medium text-stone-700 mb-2 block">
          What day of the week works best?
        </label>
        <div className="flex flex-wrap gap-2">
          {openDays.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() =>
                onUpdate({
                  ...preferences,
                  daysOfWeek: toggleInArray(
                    preferences.daysOfWeek,
                    day.value
                  ),
                })
              }
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                preferences.daysOfWeek.includes(day.value)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "border-stone-200 text-stone-700 hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-1">Select all that apply</p>
      </div>

      {/* Time of day preference */}
      <div>
        <label className="text-sm font-medium text-stone-700 mb-2 block">
          What time of day works best?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableTimes.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() =>
                onUpdate({
                  ...preferences,
                  timesOfDay: toggleInArray(
                    preferences.timesOfDay,
                    time.value
                  ),
                })
              }
              className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                preferences.timesOfDay.includes(time.value)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "border-stone-200 text-stone-700 hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              <span className="text-sm font-medium block">{time.label}</span>
              <span
                className={`text-[11px] ${
                  preferences.timesOfDay.includes(time.value)
                    ? "text-teal-100"
                    : "text-stone-400"
                }`}
              >
                {time.desc}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-1">Select all that apply</p>
      </div>
    </div>
  );
}

// ─── Submission data type ───────────────────────────────────────────────────

interface BookingSubmission {
  availability: AvailabilityPreferences;
}

// ─── Main component ─────────────────────────────────────────────────────────

export function TreatmentPlanView({
  patient,
  plan,
  isSandbox,
  treatmentAmount,
  practiceHours = DEFAULT_PRACTICE_HOURS,
}: TreatmentPlanViewProps) {
  const [step, setStep] = useState<"plan" | "schedule" | "confirmed">("plan");
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityPreferences>({
    months: [],
    daysOfWeek: [],
    timesOfDay: [],
  });
  const [submission, setSubmission] = useState<BookingSubmission | null>(null);

  const sandboxStore = useSandboxStore();
  const addToast = useUiStore((s) => s.addToast);

  const canSubmit =
    availability.months.length > 0 &&
    availability.daysOfWeek.length > 0 &&
    availability.timesOfDay.length > 0;

  if (step === "confirmed" && submission) {
    return (
      <BookingConfirmationScreen
        practice={plan.practice}
        submission={submission}
      />
    );
  }

  async function handleSubmit() {
    setLoading(true);
    const messageBody = formatAvailabilityMessage(availability);
    const sub: BookingSubmission = { availability: { ...availability } };

    try {
      if (isSandbox) {
        const now = new Date().toISOString();
        const amount = treatmentAmount ?? 0;
        const ts = Date.now();

        const treatmentUpdate = { status: "accepted" as const, decided_at: now };
        const activityItem = {
          id: `portal-booked-${ts}`,
          type: "booked" as const,
          description: `Booked ${plan.description} — $${amount.toLocaleString()} recovered`,
          patientName: patient.first_name,
          amount,
          timestamp: now,
        };

        // Find patient ID from first name (portal only has first_name)
        const patientId = sandboxStore.patients.find(
          (p) => p.first_name === patient.first_name
        )?.id;

        const message = patientId
          ? {
              id: `sandbox-portal-msg-${ts}`,
              practice_id: "sandbox-practice-001",
              patient_id: patientId,
              enrollment_id: null,
              touchpoint_id: null,
              channel: "sms" as const,
              direction: "inbound" as const,
              status: "received" as const,
              subject: null,
              body: messageBody,
              external_id: `portal-booking-${ts}`,
              error: null,
              sent_at: now,
              delivered_at: null,
              read_at: null,
              created_at: now,
            }
          : null;

        let conversationUpdate: {
          conversationId: string;
          data: { last_message_at: string; last_message_preview: string; unread_count: number };
        } | null = null;

        if (patientId) {
          const conversation = sandboxStore.conversations.find(
            (c) => c.patient_id === patientId
          );
          if (conversation) {
            conversationUpdate = {
              conversationId: conversation.id,
              data: {
                last_message_at: now,
                last_message_preview: messageBody.slice(0, 100),
                unread_count: conversation.unread_count + 1,
              },
            };
          }
        }

        // Apply to local store (this tab)
        sandboxStore.updateTreatment(plan.id, treatmentUpdate);
        const currentStats = sandboxStore.getDashboardStats();
        sandboxStore.updateDashboardStats({
          revenue_recovered: currentStats.revenue_recovered + amount,
        });
        sandboxStore.addActivityFeedItem(activityItem);
        if (message) sandboxStore.addMessage(message);
        if (conversationUpdate) {
          sandboxStore.updateConversation(
            conversationUpdate.conversationId,
            conversationUpdate.data
          );
        }

        // Broadcast to admin tab so it picks up the changes
        if (message) {
          broadcastPortalBooking({
            type: "portal_booking",
            treatmentId: plan.id,
            treatmentUpdate,
            revenueRecovered: amount,
            activityItem,
            message,
            conversationUpdate,
          });
        }

        addToast({
          title: "Treatment plan booked!",
          description: `${patient.first_name} — $${amount.toLocaleString()} recovered`,
          variant: "success",
        });
      } else {
        await fetch("/api/portal/request-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treatmentId: plan.id,
            availability,
          }),
        });
      }

      setSubmission(sub);
      setStep("confirmed");
    } finally {
      setLoading(false);
    }
  }

  // ── Schedule step ─────────────────────────────────────────────────────────
  if (step === "schedule") {
    return (
      <div
        className="min-h-screen bg-stone-50 p-6 flex items-center justify-center"
        style={{ colorScheme: "light" }}
      >
        <div className="w-full max-w-[420px] space-y-4">
          <div className="text-center pt-4">
            <h1 className="text-lg font-semibold text-stone-900">
              {plan.practice.name}
            </h1>
            <p className="text-sm text-stone-500">
              Tell us when works best for you
            </p>
          </div>

          <Card className="border-stone-200 shadow-sm bg-white text-stone-900">
            <CardContent className="pt-5 space-y-4">
              <HoursOfOperation hours={practiceHours} />

              <AvailabilityPicker
                preferences={availability}
                onUpdate={setAvailability}
                practiceHours={practiceHours}
              />

              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="mr-2 h-4 w-4" />
                )}
                Submit Availability
              </Button>

              {/* Back link */}
              <button
                type="button"
                onClick={() => setStep("plan")}
                className="w-full text-center text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                &larr; Back to treatment plan
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Initial plan view ─────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-stone-50 p-6 flex items-center justify-center"
      style={{ colorScheme: "light" }}
    >
      <div className="w-full max-w-[420px] space-y-6">
        <div className="text-center pt-4">
          <h1 className="text-lg font-semibold text-stone-900">
            {plan.practice.name}
          </h1>
          <p className="text-sm text-stone-500">Treatment plan follow-up</p>
        </div>

        <Card className="border-stone-200 shadow-sm bg-white text-stone-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-normal text-stone-900">
              Hi {patient.first_name}, your treatment plan is ready to schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-stone-100 p-4">
              <p
                className="text-stone-700 leading-relaxed"
                style={{ fontFamily: "var(--font-lora)" }}
              >
                {plan.description}
              </p>
            </div>

            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              size="lg"
              onClick={() => setStep("schedule")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Yes, I&apos;d like to schedule this
            </Button>

            <Button
              variant="outline"
              className="w-full bg-white text-stone-900 border-stone-300 hover:bg-stone-100"
              size="lg"
              asChild
            >
              <a href={`tel:${plan.practice.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call us to schedule
              </a>
            </Button>

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
