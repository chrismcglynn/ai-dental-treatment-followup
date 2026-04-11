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
import { useNotificationStore } from "@/stores/notification-store";
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
  | "SEQUENCE_ADVANCED"
  | "AI_AUTO_REPLY";

const EVENT_WEIGHTS: { type: SimulationEventType; weight: number }[] = [
  { type: "SEQUENCE_STEP_SENT", weight: 28 },
  { type: "MESSAGE_DELIVERED", weight: 23 },
  { type: "SEQUENCE_ADVANCED", weight: 14 },
  { type: "NEW_PLAN_DETECTED", weight: 12 },
  { type: "PATIENT_REPLIED", weight: 10 },
  { type: "PLAN_BOOKED", weight: 7 },
  { type: "AI_AUTO_REPLY", weight: 6 },
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

const AUTO_REPLY_TEMPLATES = [
  "No worries at all, {name}! The offer is always open whenever you're ready. Feel free to reach out anytime. — Riverside Family Dental",
  "Totally understand, {name}! We're here whenever the time is right. — Riverside Family Dental",
  "Thanks for letting us know, {name}. Your treatment plan stays available whenever you'd like to move forward. — Riverside Family Dental",
  "No problem, {name}! Reach out anytime you're ready and we'll get you scheduled. — Riverside Family Dental",
];

const AUTO_REPLY_QUESTION_TEMPLATES = [
  "Great question, {name}! Your doctor can walk you through the details — check your treatment info at your portal link, or give us a call. We're happy to help!",
  "Hi {name}! For details on that, check your personalized treatment page or give us a ring — we'd love to chat. — Riverside Family Dental",
  "Good question, {name}! You can find more info on your treatment portal, or feel free to call us directly. — Riverside Family Dental",
];

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

/** Returns true if the patient has a message (in the given direction) within the last `ms` milliseconds */
function hasRecentMessage(
  store: SandboxStore,
  patientId: string,
  direction: "outbound" | "inbound",
  ms: number
): boolean {
  const cutoff = Date.now() - ms;
  return store.messages.some(
    (m) =>
      m.patient_id === patientId &&
      m.direction === direction &&
      new Date(m.created_at).getTime() > cutoff
  );
}

// Minimum gap between outbound messages to the same patient (5 min)
const OUTBOUND_COOLDOWN_MS = 5 * 60 * 1000;
// Minimum gap between inbound replies from the same patient (3 min)
const INBOUND_COOLDOWN_MS = 3 * 60 * 1000;

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
    external_id: null,
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

  // Filter out enrollments where:
  // - the patient was messaged recently (cooldown)
  // - the patient's conversation is in a non-idle state (escalated, staff handling, etc.)
  const pausedModes = new Set(["escalated", "staff_handling", "auto_replying"]);
  const eligible = activeEnrollments.filter((e) => {
    if (hasRecentMessage(store, e.patient_id, "outbound", OUTBOUND_COOLDOWN_MS)) return false;
    const convo = store.conversations.find((c) => c.patient_id === e.patient_id);
    if (convo && pausedModes.has(convo.conversation_mode)) return false;
    return true;
  });
  if (eligible.length === 0) return null;

  const enrollment = pick(eligible);
  const patient = store.patients.find((p) => p.id === enrollment.patient_id);
  if (!patient) return null;

  const channel = pick(CHANNELS);
  const now = nowISO();
  const patientName = `${patient.first_name} ${patient.last_name}`;

  const smsTemplates = [
    `Hi ${patient.first_name}, this is Riverside Family Dental. You have a treatment plan ready to schedule. View details here: https://retaine.io/portal/t/${simId("link")}`,
    `Hi ${patient.first_name}! Just a friendly reminder from Riverside Family Dental — your treatment plan is waiting. Tap here to view & book: https://retaine.io/portal/t/${simId("link")}`,
    `Hi ${patient.first_name}, Dr. Anderson's office here. We wanted to follow up on the treatment we discussed. Details: https://retaine.io/portal/t/${simId("link")} — reply or call us anytime!`,
    `Hey ${patient.first_name}, Riverside Family Dental checking in. Ready to get your treatment scheduled? View your plan: https://retaine.io/portal/t/${simId("link")}`,
  ];

  const voicemailTemplates = [
    `Hi ${patient.first_name}, this is Riverside Family Dental following up on your treatment plan. Check your text or email for a secure link to view your plan details, or give us a call back. Have a great day!`,
    `Hi ${patient.first_name}, this is Dr. Anderson's office calling about your treatment plan. We sent you a link by text — take a look when you get a chance, or call us back at your convenience.`,
    `Hey ${patient.first_name}, just a quick call from Riverside Family Dental. We'd love to help you get your treatment scheduled — give us a ring back or check your texts for a booking link. Thanks!`,
  ];

  const emailSubjects = [
    "Follow-up on your treatment plan",
    "Your treatment plan at Riverside Family Dental",
    `${patient.first_name}, your plan is ready to schedule`,
  ];

  const body = channel === "voicemail"
    ? pick(voicemailTemplates)
    : channel === "sms"
    ? pick(smsTemplates)
    : `Dear ${patient.first_name},\n\nWe're reaching out about your treatment plan at Riverside Family Dental. View your details here:\nhttps://retaine.io/portal/t/${simId("link")}\n\nBest regards,\nRiverside Family Dental`;

  const message: Message = {
    id: simId("message"),
    practice_id: "sandbox-practice-001",
    patient_id: patient.id,
    enrollment_id: enrollment.id,
    touchpoint_id: null,
    channel,
    direction: "outbound",
    status: "sent",
    subject: channel === "email" ? pick(emailSubjects) : null,
    body,
    external_id: `sandbox-sim-${Date.now()}`,
    error: null,
    sent_at: now,
    delivered_at: null,
    read_at: null,
    intent: null,
    intent_confidence: null,
    sent_by: "system",
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

  // Filter out patients who already replied recently
  const eligible = activeEnrollments.filter(
    (e) => !hasRecentMessage(store, e.patient_id, "inbound", INBOUND_COOLDOWN_MS)
  );
  if (eligible.length === 0) return null;

  const enrollment = pick(eligible);
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
    intent: "wants_to_book",
    intent_confidence: 0.9,
    sent_by: "staff",
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
      latest_intent: "wants_to_book",
      conversation_mode: "manual",
      auto_reply_count: 0,
      escalation_reason: null,
      escalated_at: null,
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
      patientId: patient.id,
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

function handleAiAutoReply(store: SandboxStore): EventResult | null {
  // Find conversations eligible for auto-reply:
  // - manual or already auto_replying (under cap of 3)
  // - safe intents: not_ready, other, or has_question
  const eligibleConversations = store.conversations.filter(
    (c) =>
      (c.conversation_mode === "manual" || c.conversation_mode === "auto_replying") &&
      c.status === "open" &&
      (c.latest_intent === "not_ready" || c.latest_intent === "other" || c.latest_intent === "has_question") &&
      (c.auto_reply_count ?? 0) < 3 &&
      c.unread_count > 0
  );

  if (eligibleConversations.length === 0) return null;

  // Filter out patients who were already sent a message recently
  const cooledDown = eligibleConversations.filter(
    (c) => !hasRecentMessage(store, c.patient_id, "outbound", OUTBOUND_COOLDOWN_MS)
  );
  if (cooledDown.length === 0) return null;

  const conversation = pick(cooledDown);
  const patient = store.patients.find((p) => p.id === conversation.patient_id);
  if (!patient) return null;

  const now = nowISO();
  const patientName = `${patient.first_name} ${patient.last_name}`;
  const templates = conversation.latest_intent === "has_question"
    ? AUTO_REPLY_QUESTION_TEMPLATES
    : AUTO_REPLY_TEMPLATES;
  const replyTemplate = pick(templates);
  const replyBody = replyTemplate.replace("{name}", patient.first_name);

  // Create the auto-reply message
  const autoReplyMessage: Message = {
    id: simId("message"),
    practice_id: "sandbox-practice-001",
    patient_id: patient.id,
    enrollment_id: null,
    touchpoint_id: null,
    channel: "sms",
    direction: "outbound",
    status: "delivered",
    subject: null,
    body: replyBody,
    external_id: `sandbox-auto-${Date.now()}`,
    error: null,
    sent_at: now,
    delivered_at: now,
    read_at: null,
    intent: null,
    intent_confidence: null,
    sent_by: "ai_auto",
    created_at: now,
  };

  store.addMessage(autoReplyMessage);

  // Update conversation to auto_replying
  store.updateConversation(conversation.id, {
    conversation_mode: "auto_replying",
    auto_reply_count: (conversation.auto_reply_count ?? 0) + 1,
    last_message_at: now,
    last_message_preview: replyBody.slice(0, 100),
    unread_count: 0,
  });

  return {
    activityItem: {
      id: simId("activity"),
      type: "replied",
      description: `AI auto-replied: "${replyBody.slice(0, 50)}..."`,
      patientName,
      timestamp: now,
    },
    invalidateKeys: [["inbox"], ["analytics"]],
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
    case "AI_AUTO_REPLY":
      return handleAiAutoReply(store);
  }
}

// ─── React hook ──────────────────────────────────────────────────────────────

export function useSimulationEngine() {
  const { isSandbox, simulationActive, simulationSpeed } = useSandbox();
  const store = useSandboxStore();
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
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

        // Notification for PLAN_BOOKED
        if (eventType === "PLAN_BOOKED" && result.activityItem.amount) {
          addNotification({
            title: "Treatment plan booked!",
            description: `${result.activityItem.patientName} — $${result.activityItem.amount.toLocaleString()} recovered`,
            type: "booking",
          });
        }

        // Notification for PATIENT_REPLIED
        if (eventType === "PATIENT_REPLIED") {
          addNotification({
            title: "New patient reply",
            description: result.activityItem.description,
            type: "reply",
            patientId: result.activityItem.patientId,
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
  }, [isSandbox, simulationActive, simulationSpeed, store, queryClient, addNotification]);
}
