"use client";

/**
 * Simulation engine — fires realistic events on an interval so the
 * sandbox dashboard feels like a live, working system during demos.
 *
 * Each event mutates the sandbox Zustand store, then invalidates the
 * relevant TanStack Query keys so the UI updates in real time.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSandbox, type SimulationSpeed } from "@/lib/sandbox";
import { useSandboxStore, type SandboxActivity, type SandboxStore } from "@/stores/sandbox-store";
import { useUiStore } from "@/stores/ui-store";
import { patientKeys } from "@/hooks/usePatients";
import { sequenceKeys } from "@/hooks/useSequences";
import { analyticsKeys } from "@/hooks/useAnalytics";
import { inboxKeys } from "@/hooks/useInbox";
import type { Message, Conversation } from "@/types/app.types";

// ─── Event types & weights ───────────────────────────────────────────────────

type SimulationEventType =
  | "NEW_PLAN_DETECTED"
  | "SEQUENCE_STEP_SENT"
  | "MESSAGE_DELIVERED"
  | "PATIENT_REPLIED"
  | "PLAN_BOOKED"
  | "SEQUENCE_ADVANCED";

const EVENT_WEIGHTS: { type: SimulationEventType; weight: number }[] = [
  { type: "SEQUENCE_STEP_SENT", weight: 30 },
  { type: "MESSAGE_DELIVERED", weight: 25 },
  { type: "SEQUENCE_ADVANCED", weight: 15 },
  { type: "NEW_PLAN_DETECTED", weight: 12 },
  { type: "PATIENT_REPLIED", weight: 10 },
  { type: "PLAN_BOOKED", weight: 8 },
];

const TOTAL_WEIGHT = EVENT_WEIGHTS.reduce((s, e) => s + e.weight, 0);

function pickWeightedEvent(): SimulationEventType {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const { type, weight } of EVENT_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return "SEQUENCE_STEP_SENT";
}

// ─── Speed → interval mapping ────────────────────────────────────────────────

function getInterval(speed: SimulationSpeed): number {
  switch (speed) {
    case "normal":
      return 30000 + Math.random() * 30000; // 30–60s
    case "fast":
      return 8000 + Math.random() * 7000; // 8–15s
    case "10x":
      return 2000 + Math.random() * 2000; // 2–4s
  }
}

// ─── Fake data generators ────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Alex", "Brianna", "Caleb", "Diana", "Ethan", "Fatima", "Greg", "Hannah",
  "Isaac", "Julia", "Kevin", "Laura", "Marco", "Natalie", "Oscar", "Paige",
];

const LAST_NAMES = [
  "Anderson", "Brooks", "Campbell", "Davis", "Edwards", "Franklin", "Garcia",
  "Hill", "Ingram", "Jensen", "Kim", "Lopez", "Miller", "Nelson", "Park",
];

const PROCEDURES = [
  { code: "D2740", description: "Crown — upper molar", amount: 1450 },
  { code: "D3330", description: "Root canal — premolar", amount: 1200 },
  { code: "D2392", description: "Two-surface composite", amount: 285 },
  { code: "D6010", description: "Implant placement", amount: 3800 },
  { code: "D4341", description: "Deep cleaning (SRP)", amount: 480 },
  { code: "D7210", description: "Extraction", amount: 650 },
];

const REPLY_TEMPLATES = [
  "Yes, I'd like to schedule. What do you have available?",
  "Can I come in next week?",
  "Thanks for the reminder! I'll call tomorrow to book.",
  "What are my payment options for this?",
  "I need to check my insurance first, but I'm interested.",
  "Yes please! Afternoons work best for me.",
];

const CHANNELS: ("sms" | "email" | "voicemail")[] = ["sms", "email", "voicemail"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let simIdCounter = 5000;
function simId(prefix: string): string {
  return `sandbox-${prefix}-sim-${++simIdCounter}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Event handlers ──────────────────────────────────────────────────────────

type EventResult = {
  activityItem: SandboxActivity;
  invalidateKeys: string[][]; // query key prefixes to invalidate
};

function handleNewPlanDetected(store: SandboxStore): EventResult {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const procedure = pick(PROCEDURES);
  const patientId = simId("patient");
  const treatmentId = simId("treatment");
  const now = nowISO();

  store.patients.push({
    id: patientId,
    practice_id: "sandbox-practice-001",
    external_id: `OD-${10000 + Math.floor(Math.random() * 90000)}`,
    first_name: firstName,
    last_name: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    phone: `(${pick(["720", "303"])}) 555-${String(Math.floor(1000 + Math.random() * 9000))}`,
    date_of_birth: "1985-01-15",
    last_visit: now,
    next_appointment: null,
    status: "active",
    tags: [],
    metadata: {},
    created_at: now,
    updated_at: now,
  });

  store.addTreatment({
    id: treatmentId,
    practice_id: "sandbox-practice-001",
    patient_id: patientId,
    code: procedure.code,
    description: procedure.description,
    amount: procedure.amount,
    status: "pending",
    presented_at: now,
    decided_at: null,
    created_at: now,
    updated_at: now,
  });

  return {
    activityItem: {
      id: simId("activity"),
      type: "plan_detected",
      description: `New treatment plan detected: ${procedure.description} ($${procedure.amount.toLocaleString()})`,
      patientName: `${firstName} ${lastName}`,
      amount: procedure.amount,
      timestamp: now,
    },
    invalidateKeys: [["patients"], ["analytics"]],
  };
}

function handleSequenceStepSent(store: SandboxStore): EventResult | null {
  const activeEnrollments = store.enrollments.filter((e) => e.status === "active");
  if (activeEnrollments.length === 0) return null;

  const enrollment = pick(activeEnrollments);
  const patient = store.patients.find((p) => p.id === enrollment.patient_id);
  if (!patient) return null;

  const channel = pick(CHANNELS);
  const now = nowISO();
  const patientName = `${patient.first_name} ${patient.last_name}`;

  const message: Message = {
    id: simId("message"),
    practice_id: "sandbox-practice-001",
    patient_id: patient.id,
    enrollment_id: enrollment.id,
    touchpoint_id: null,
    channel,
    direction: "outbound",
    status: "sent",
    subject: channel === "email" ? "Follow-up on your treatment plan" : null,
    body: `Hi ${patient.first_name}, this is Riverside Family Dental following up on your treatment plan.`,
    external_id: `sandbox-sim-${Date.now()}`,
    error: null,
    sent_at: now,
    delivered_at: null,
    read_at: null,
    created_at: now,
  };

  store.addMessage(message);

  const channelLabel = channel === "sms" ? "SMS" : channel === "email" ? "Email" : "Voicemail";

  return {
    activityItem: {
      id: simId("activity"),
      type: channel === "sms" ? "sms_sent" : channel === "email" ? "email_sent" : "voicemail_sent",
      description: `${channelLabel} sent — follow-up sequence step ${enrollment.current_touchpoint}`,
      patientName,
      timestamp: now,
    },
    invalidateKeys: [["inbox"], ["analytics"]],
  };
}

function handleMessageDelivered(store: SandboxStore): EventResult | null {
  const sentMessages = store.messages.filter(
    (m) => m.direction === "outbound" && m.status === "sent"
  );
  if (sentMessages.length === 0) return null;

  const message = pick(sentMessages);
  const patient = store.patients.find((p) => p.id === message.patient_id);
  if (!patient) return null;

  // Update message status in place
  const msgIndex = store.messages.findIndex((m) => m.id === message.id);
  if (msgIndex !== -1) {
    store.messages[msgIndex] = {
      ...store.messages[msgIndex],
      status: "delivered",
      delivered_at: nowISO(),
    };
  }

  const patientName = `${patient.first_name} ${patient.last_name}`;

  return {
    activityItem: {
      id: simId("activity"),
      type: "delivered",
      description: `Message delivered via ${message.channel}`,
      patientName,
      timestamp: nowISO(),
    },
    invalidateKeys: [["inbox"], ["analytics"]],
  };
}

function handlePatientReplied(store: SandboxStore): EventResult | null {
  // Pick a patient who is in an active enrollment and hasn't replied recently
  const activeEnrollments = store.enrollments.filter((e) => e.status === "active");
  if (activeEnrollments.length === 0) return null;

  const enrollment = pick(activeEnrollments);
  const patient = store.patients.find((p) => p.id === enrollment.patient_id);
  if (!patient) return null;

  const now = nowISO();
  const patientName = `${patient.first_name} ${patient.last_name}`;
  const replyBody = pick(REPLY_TEMPLATES);

  const inboundMessage: Message = {
    id: simId("message"),
    practice_id: "sandbox-practice-001",
    patient_id: patient.id,
    enrollment_id: enrollment.id,
    touchpoint_id: null,
    channel: "sms",
    direction: "inbound",
    status: "received",
    subject: null,
    body: replyBody,
    external_id: `sandbox-inbound-${Date.now()}`,
    error: null,
    sent_at: null,
    delivered_at: null,
    read_at: null,
    created_at: now,
  };

  store.addMessage(inboundMessage);

  // Update or create conversation
  const existingConvo = store.conversations.find(
    (c) => c.patient_id === patient.id
  );
  if (existingConvo) {
    store.updateConversation(existingConvo.id, {
      last_message_at: now,
      last_message_preview: replyBody.slice(0, 100),
      unread_count: existingConvo.unread_count + 1,
      status: "open",
    });
  } else {
    const newConvo: Conversation = {
      id: simId("conversation"),
      practice_id: "sandbox-practice-001",
      patient_id: patient.id,
      last_message_at: now,
      last_message_preview: replyBody.slice(0, 100),
      unread_count: 1,
      status: "open",
      assigned_to: null,
      created_at: now,
      updated_at: now,
    };
    store.addConversation(newConvo);
  }

  return {
    activityItem: {
      id: simId("activity"),
      type: "replied",
      description: `New reply: "${replyBody.slice(0, 60)}${replyBody.length > 60 ? "..." : ""}"`,
      patientName,
      timestamp: now,
    },
    invalidateKeys: [["inbox"], ["patients"], ["analytics"]],
  };
}

function handlePlanBooked(store: SandboxStore): EventResult | null {
  const activeEnrollments = store.enrollments.filter((e) => e.status === "active");
  if (activeEnrollments.length === 0) return null;

  const enrollment = pick(activeEnrollments);
  const patient = store.patients.find((p) => p.id === enrollment.patient_id);
  const treatment = store.treatments.find(
    (t) => t.patient_id === enrollment.patient_id && t.status === "pending"
  );
  if (!patient || !treatment) return null;

  const now = nowISO();
  const patientName = `${patient.first_name} ${patient.last_name}`;

  // Convert enrollment
  store.updateEnrollment(enrollment.id, {
    status: "converted",
    converted_at: now,
  });

  // Accept treatment
  store.updateTreatment(treatment.id, {
    status: "accepted",
    decided_at: now,
  });

  // Update dashboard stats
  const currentStats = store.getDashboardStats();
  store.updateDashboardStats({
    revenue_recovered: currentStats.revenue_recovered + treatment.amount,
    plans_in_sequence: Math.max(0, currentStats.plans_in_sequence - 1),
  });

  return {
    activityItem: {
      id: simId("activity"),
      type: "booked",
      description: `Booked ${treatment.description} — $${treatment.amount.toLocaleString()} recovered`,
      patientName,
      amount: treatment.amount,
      timestamp: now,
    },
    invalidateKeys: [["patients"], ["analytics"], ["sequences"], ["inbox"]],
  };
}

function handleSequenceAdvanced(store: SandboxStore): EventResult | null {
  const activeEnrollments = store.enrollments.filter((e) => e.status === "active");
  if (activeEnrollments.length === 0) return null;

  const enrollment = pick(activeEnrollments);
  const patient = store.patients.find((p) => p.id === enrollment.patient_id);
  const sequence = store.sequences.find((s) => s.id === enrollment.sequence_id);
  if (!patient || !sequence) return null;

  const touchpoints = store.touchpoints.filter(
    (t) => t.sequence_id === sequence.id
  );
  const maxStep = touchpoints.length;
  const nextStep = enrollment.current_touchpoint + 1;

  if (nextStep > maxStep) {
    // Complete the enrollment
    store.updateEnrollment(enrollment.id, {
      status: "completed",
      completed_at: nowISO(),
    });
  } else {
    store.updateEnrollment(enrollment.id, {
      current_touchpoint: nextStep,
    });
  }

  const patientName = `${patient.first_name} ${patient.last_name}`;

  return {
    activityItem: {
      id: simId("activity"),
      type: "sms_sent",
      description:
        nextStep > maxStep
          ? `Sequence "${sequence.name}" completed`
          : `Advanced to step ${nextStep} of "${sequence.name}"`,
      patientName,
      timestamp: nowISO(),
    },
    invalidateKeys: [["patients"], ["sequences"], ["analytics"]],
  };
}

// ─── Event dispatcher ────────────────────────────────────────────────────────

function dispatchEvent(
  eventType: SimulationEventType,
  store: SandboxStore
): EventResult | null {
  switch (eventType) {
    case "NEW_PLAN_DETECTED":
      return handleNewPlanDetected(store);
    case "SEQUENCE_STEP_SENT":
      return handleSequenceStepSent(store);
    case "MESSAGE_DELIVERED":
      return handleMessageDelivered(store);
    case "PATIENT_REPLIED":
      return handlePatientReplied(store);
    case "PLAN_BOOKED":
      return handlePlanBooked(store);
    case "SEQUENCE_ADVANCED":
      return handleSequenceAdvanced(store);
  }
}

// ─── React hook ──────────────────────────────────────────────────────────────

export function useSimulationEngine() {
  const { isSandbox, simulationActive, simulationSpeed } = useSandbox();
  const store = useSandboxStore();
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSandbox || !simulationActive) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    function tick() {
      const eventType = pickWeightedEvent();
      const result = dispatchEvent(eventType, store);

      if (result) {
        // Add to activity feed
        store.addActivityFeedItem(result.activityItem);

        // Invalidate relevant query caches
        const practiceId = "sandbox-practice-001";
        for (const keyPrefix of result.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: keyPrefix });
        }

        // Also invalidate analytics with practice scoping
        if (result.invalidateKeys.some((k) => k[0] === "analytics")) {
          queryClient.invalidateQueries({
            queryKey: analyticsKeys.all(practiceId),
          });
        }
        if (result.invalidateKeys.some((k) => k[0] === "patients")) {
          queryClient.invalidateQueries({
            queryKey: patientKeys.all(practiceId),
          });
        }
        if (result.invalidateKeys.some((k) => k[0] === "inbox")) {
          queryClient.invalidateQueries({
            queryKey: inboxKeys.all(practiceId),
          });
        }
        if (result.invalidateKeys.some((k) => k[0] === "sequences")) {
          queryClient.invalidateQueries({
            queryKey: sequenceKeys.all(practiceId),
          });
        }

        // Revenue toast for PLAN_BOOKED
        if (eventType === "PLAN_BOOKED" && result.activityItem.amount) {
          addToast({
            title: "Treatment plan booked!",
            description: `${result.activityItem.patientName} — $${result.activityItem.amount.toLocaleString()} recovered`,
            variant: "success",
          });
        }
      }

      // Schedule next tick with variable interval
      timerRef.current = setTimeout(tick, getInterval(simulationSpeed));
    }

    // Fire first event after a short initial delay
    timerRef.current = setTimeout(tick, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSandbox, simulationActive, simulationSpeed, store, queryClient, addToast]);
}
