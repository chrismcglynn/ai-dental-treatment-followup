/**
 * Sandbox Zustand store — in-memory data layer for sandbox/demo mode.
 *
 * Initialized from seed data, persisted to sessionStorage so demos survive
 * browser refresh. Provides getter methods matching the exact return types
 * of each API function so hooks can swap seamlessly.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  Patient,
  Treatment,
  Sequence,
  Touchpoint,
  SequenceEnrollment,
  Message,
  Conversation,
  Practice,
  PaginatedResponse,
  PatientFilters,
  SequenceFilters,
  SequenceWithTouchpoints,
  ConversationWithPatient,
  DashboardStats,
  ActivityItem,
  AnalyticsStats,
  ChannelBreakdownItem,
  SequenceConversionRow,
  FunnelStageItem,
  EnrollmentWithSequence,
} from "@/types/app.types";

import type { InboxFilter } from "@/lib/api/inbox";

import type {
  RecentActivityItem,
  SequencePerformanceItem,
} from "@/lib/api/analytics";

import {
  SANDBOX_PRACTICE,
  SANDBOX_PATIENTS,
  SANDBOX_TREATMENTS,
  SANDBOX_SEQUENCES,
  SANDBOX_TOUCHPOINTS,
  SANDBOX_ENROLLMENTS,
  SANDBOX_MESSAGES,
  SANDBOX_CONVERSATIONS,
  SANDBOX_DAILY_REVENUE,
  SANDBOX_DASHBOARD_STATS,
  SANDBOX_ANALYTICS_STATS,
  SANDBOX_CHANNEL_BREAKDOWN,
  SANDBOX_SEQUENCE_CONVERSIONS,
  SANDBOX_FUNNEL,
  SANDBOX_RECENT_ACTIVITY,
} from "@/lib/sandbox/sandboxData";

// ─── Activity feed type for the simulation log ───────────────────────────────

export interface SandboxActivity {
  id: string;
  type: "sms_sent" | "email_sent" | "voicemail_sent" | "delivered" | "replied" | "booked" | "plan_detected";
  description: string;
  patientName: string;
  amount?: number;
  timestamp: string;
}

export interface SandboxPortalToken {
  rawToken: string;          // prefixed with 'sandbox-token-'
  patientId: string;
  treatmentId: string;       // references sandbox treatment ID
  practiceId: string;
  expiresAt: number;         // Date.now() + 72hr in ms
  usedAt: number | null;
}

// ─── Store interface ─────────────────────────────────────────────────────────

interface SandboxStoreState {
  // Raw data tables
  practice: Practice;
  patients: Patient[];
  treatments: Treatment[];
  sequences: Sequence[];
  touchpoints: Touchpoint[];
  enrollments: SequenceEnrollment[];
  messages: Message[];
  conversations: Conversation[];

  // Analytics (pre-computed, updated by simulation)
  dashboardStats: DashboardStats;
  analyticsStats: AnalyticsStats;
  channelBreakdown: ChannelBreakdownItem[];
  sequenceConversions: SequenceConversionRow[];
  funnel: FunnelStageItem[];
  dailyRevenue: { date: string; amount: number }[];
  recentActivity: ActivityItem[];

  // Simulation activity feed
  activityFeed: SandboxActivity[];

  // Portal tokens
  portalTokens: SandboxPortalToken[];
}

interface SandboxStoreActions {
  // ── Getters (match API return types) ──────────────────────────────────

  getPractice: () => Practice;

  getPatients: (filters?: PatientFilters) => PaginatedResponse<Patient>;

  getPatientsWithStats: (
    filters?: PatientFilters
  ) => PaginatedResponse<
    Patient & {
      treatments: Treatment[];
      sequence_enrollments: { id: string; status: string }[];
    }
  >;

  getPatient: (patientId: string) => Patient | undefined;

  getPatientTreatments: (patientId: string) => Treatment[];

  getPatientMessages: (patientId: string) => Message[];

  getPatientEnrollments: (
    patientId: string
  ) => EnrollmentWithSequence[];

  getSequences: (filters?: SequenceFilters) => Sequence[];

  getSequence: (sequenceId: string) => SequenceWithTouchpoints | undefined;

  getTouchpoints: (sequenceId: string) => Touchpoint[];

  getConversations: (filter: InboxFilter) => ConversationWithPatient[];

  getConversationMessages: (
    conversationId: string,
    patientId: string
  ) => Message[];

  getDashboardStats: () => DashboardStats;

  getRevenueOverTime: (days?: number) => { date: string; amount: number }[];

  getRecentActivity: () => RecentActivityItem[];

  getSequencePerformance: () => SequencePerformanceItem[];

  getPendingTreatmentsCount: () => number;

  getAnalyticsStats: () => AnalyticsStats;

  getChannelBreakdown: () => ChannelBreakdownItem[];

  getSequenceConversions: () => SequenceConversionRow[];

  getFunnelData: () => FunnelStageItem[];

  // ── Mutations ─────────────────────────────────────────────────────────

  updatePatient: (
    patientId: string,
    data: Partial<Patient>
  ) => Patient | undefined;

  createSequence: (data: Omit<Sequence, "id" | "created_at" | "updated_at">) => Sequence;

  updateSequence: (
    sequenceId: string,
    data: Partial<Sequence>
  ) => Sequence | undefined;

  deleteSequence: (sequenceId: string) => void;

  createTouchpoint: (
    data: Omit<Touchpoint, "id" | "created_at" | "updated_at">
  ) => Touchpoint;

  updateTouchpoint: (
    touchpointId: string,
    data: Partial<Touchpoint>
  ) => Touchpoint | undefined;

  deleteTouchpoint: (touchpointId: string) => void;

  reorderTouchpoints: (sequenceId: string, orderedIds: string[]) => void;

  markConversationRead: (conversationId: string) => void;

  sendReply: (
    patientId: string,
    body: string
  ) => Message;

  // ── Simulation helpers ────────────────────────────────────────────────

  addMessage: (message: Message) => void;
  addConversation: (conversation: Conversation) => void;
  addTreatment: (treatment: Treatment) => void;
  addEnrollment: (enrollment: SequenceEnrollment) => void;
  updateEnrollment: (enrollmentId: string, data: Partial<SequenceEnrollment>) => void;
  updateTreatment: (treatmentId: string, data: Partial<Treatment>) => void;
  updateDashboardStats: (data: Partial<DashboardStats>) => void;
  addActivityFeedItem: (item: SandboxActivity) => void;
  updateConversation: (conversationId: string, data: Partial<Conversation>) => void;

  // ── Portal tokens ─────────────────────────────────────────────────────
  addPortalToken: (token: SandboxPortalToken) => void;
  getPortalToken: (rawToken: string) => SandboxPortalToken | null;
  markPortalTokenUsed: (rawToken: string) => void;

  // ── Reset ─────────────────────────────────────────────────────────────
  reset: () => void;
}

export type SandboxStore = SandboxStoreState & SandboxStoreActions;

// ─── Initial state ───────────────────────────────────────────────────────────

function getInitialState(): SandboxStoreState {
  return {
    practice: SANDBOX_PRACTICE,
    patients: SANDBOX_PATIENTS,
    treatments: SANDBOX_TREATMENTS,
    sequences: SANDBOX_SEQUENCES,
    touchpoints: SANDBOX_TOUCHPOINTS,
    enrollments: SANDBOX_ENROLLMENTS,
    messages: SANDBOX_MESSAGES,
    conversations: SANDBOX_CONVERSATIONS,
    dashboardStats: SANDBOX_DASHBOARD_STATS,
    analyticsStats: SANDBOX_ANALYTICS_STATS,
    channelBreakdown: SANDBOX_CHANNEL_BREAKDOWN,
    sequenceConversions: SANDBOX_SEQUENCE_CONVERSIONS,
    funnel: SANDBOX_FUNNEL,
    dailyRevenue: SANDBOX_DAILY_REVENUE,
    recentActivity: SANDBOX_RECENT_ACTIVITY,
    activityFeed: [],
    portalTokens: [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let sandboxIdCounter = 1000;
function nextId(prefix: string): string {
  return `sandbox-${prefix}-${++sandboxIdCounter}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSandboxStore = create<SandboxStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // ── Getters ─────────────────────────────────────────────────────

      getPractice: () => get().practice,

      getPatients: (filters) => {
        const { patients } = get();
        let result = [...patients];
        const { page = 1, pageSize = 20, search, status } = filters ?? {};

        if (search) {
          const q = search.toLowerCase();
          result = result.filter(
            (p) =>
              p.first_name.toLowerCase().includes(q) ||
              p.last_name.toLowerCase().includes(q) ||
              p.email?.toLowerCase().includes(q) ||
              p.phone?.includes(q)
          );
        }

        if (status) {
          result = result.filter((p) => p.status === status);
        }

        result.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        const count = result.length;
        const from = (page - 1) * pageSize;
        const paged = result.slice(from, from + pageSize);

        return {
          data: paged,
          count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        };
      },

      getPatientsWithStats: (filters) => {
        const { patients, treatments, enrollments } = get();
        let result = [...patients];
        const { page = 1, pageSize = 20, search, status } = filters ?? {};

        if (search) {
          const q = search.toLowerCase();
          result = result.filter(
            (p) =>
              p.first_name.toLowerCase().includes(q) ||
              p.last_name.toLowerCase().includes(q) ||
              p.email?.toLowerCase().includes(q) ||
              p.phone?.includes(q)
          );
        }

        if (status) {
          result = result.filter((p) => p.status === status);
        }

        result.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        const count = result.length;
        const from = (page - 1) * pageSize;
        const paged = result.slice(from, from + pageSize);

        const withStats = paged.map((p) => ({
          ...p,
          treatments: treatments.filter((t) => t.patient_id === p.id),
          sequence_enrollments: enrollments
            .filter((e) => e.patient_id === p.id)
            .map((e) => ({ id: e.id, status: e.status })),
        }));

        return {
          data: withStats,
          count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        };
      },

      getPatient: (patientId) =>
        get().patients.find((p) => p.id === patientId),

      getPatientTreatments: (patientId) =>
        get()
          .treatments.filter((t) => t.patient_id === patientId)
          .sort(
            (a, b) =>
              new Date(b.presented_at).getTime() -
              new Date(a.presented_at).getTime()
          ),

      getPatientMessages: (patientId) =>
        get()
          .messages.filter((m) => m.patient_id === patientId)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          ),

      getPatientEnrollments: (patientId) => {
        const { enrollments, sequences } = get();
        return enrollments
          .filter((e) => e.patient_id === patientId)
          .map((e) => ({
            ...e,
            sequences: sequences.find((s) => s.id === e.sequence_id)!,
          }))
          .sort(
            (a, b) =>
              new Date(b.enrolled_at).getTime() -
              new Date(a.enrolled_at).getTime()
          );
      },

      getSequences: (filters) => {
        const { sequences } = get();
        let result = [...sequences];

        if (filters?.status) {
          result = result.filter((s) => s.status === filters.status);
        }

        return result.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      },

      getSequence: (sequenceId) => {
        const { sequences, touchpoints } = get();
        const seq = sequences.find((s) => s.id === sequenceId);
        if (!seq) return undefined;

        return {
          ...seq,
          touchpoints: touchpoints
            .filter((t) => t.sequence_id === sequenceId)
            .sort((a, b) => a.position - b.position),
        };
      },

      getTouchpoints: (sequenceId) =>
        get()
          .touchpoints.filter((t) => t.sequence_id === sequenceId)
          .sort((a, b) => a.position - b.position),

      getConversations: (filter) => {
        const { conversations, patients } = get();
        let result = conversations.filter((c) => c.status !== "archived");

        switch (filter) {
          case "unread":
            result = result.filter((c) => c.unread_count > 0);
            break;
          case "needs_reply":
            result = result.filter(
              (c) => c.status === "open" && c.unread_count > 0
            );
            break;
          case "replied":
            result = result.filter(
              (c) => c.unread_count === 0 && c.status === "open"
            );
            break;
        }

        return result
          .sort(
            (a, b) =>
              new Date(b.last_message_at).getTime() -
              new Date(a.last_message_at).getTime()
          )
          .map((c) => ({
            ...c,
            patient: patients.find((p) => p.id === c.patient_id)!,
          }));
      },

      getConversationMessages: (_conversationId, patientId) =>
        get()
          .messages.filter((m) => m.patient_id === patientId)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          ),

      getDashboardStats: () => get().dashboardStats,

      getRevenueOverTime: (days = 30) => {
        const { dailyRevenue } = get();
        return dailyRevenue.slice(-days);
      },

      getRecentActivity: () => {
        const { messages, patients } = get();
        return messages
          .filter((m) => m.direction === "outbound")
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 10)
          .map((m) => {
            const patient = patients.find((p) => p.id === m.patient_id);
            return {
              id: m.id,
              patient_name: patient
                ? `${patient.first_name} ${patient.last_name}`
                : "Unknown Patient",
              channel: m.channel,
              status: m.status,
              created_at: m.created_at,
            };
          });
      },

      getSequencePerformance: () => {
        const { sequences } = get();
        return sequences
          .filter((s) => s.status === "active")
          .sort((a, b) => b.patient_count - a.patient_count)
          .slice(0, 6)
          .map((s) => ({
            name: s.name,
            conversion_rate: s.conversion_rate,
            patient_count: s.patient_count,
          }));
      },

      getPendingTreatmentsCount: () =>
        get().treatments.filter((t) => t.status === "pending").length,

      getAnalyticsStats: () => get().analyticsStats,

      getChannelBreakdown: () => get().channelBreakdown,

      getSequenceConversions: () => get().sequenceConversions,

      getFunnelData: () => get().funnel,

      // ── Mutations ───────────────────────────────────────────────────

      updatePatient: (patientId, data) => {
        let updated: Patient | undefined;
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id === patientId) {
              updated = { ...p, ...data, updated_at: nowISO() };
              return updated;
            }
            return p;
          }),
        }));
        return updated;
      },

      createSequence: (data) => {
        const seq: Sequence = {
          ...data,
          id: nextId("sequence"),
          created_at: nowISO(),
          updated_at: nowISO(),
        };
        set((state) => ({ sequences: [seq, ...state.sequences] }));
        return seq;
      },

      updateSequence: (sequenceId, data) => {
        let updated: Sequence | undefined;
        set((state) => ({
          sequences: state.sequences.map((s) => {
            if (s.id === sequenceId) {
              updated = { ...s, ...data, updated_at: nowISO() };
              return updated;
            }
            return s;
          }),
        }));
        return updated;
      },

      deleteSequence: (sequenceId) => {
        set((state) => ({
          sequences: state.sequences.filter((s) => s.id !== sequenceId),
          touchpoints: state.touchpoints.filter(
            (t) => t.sequence_id !== sequenceId
          ),
          enrollments: state.enrollments.filter(
            (e) => e.sequence_id !== sequenceId
          ),
        }));
      },

      createTouchpoint: (data) => {
        const tp: Touchpoint = {
          ...data,
          id: nextId("touchpoint"),
          created_at: nowISO(),
          updated_at: nowISO(),
        };
        set((state) => ({ touchpoints: [...state.touchpoints, tp] }));
        return tp;
      },

      updateTouchpoint: (touchpointId, data) => {
        let updated: Touchpoint | undefined;
        set((state) => ({
          touchpoints: state.touchpoints.map((t) => {
            if (t.id === touchpointId) {
              updated = { ...t, ...data, updated_at: nowISO() };
              return updated;
            }
            return t;
          }),
        }));
        return updated;
      },

      deleteTouchpoint: (touchpointId) => {
        set((state) => ({
          touchpoints: state.touchpoints.filter((t) => t.id !== touchpointId),
        }));
      },

      reorderTouchpoints: (sequenceId, orderedIds) => {
        set((state) => ({
          touchpoints: state.touchpoints.map((t) => {
            if (t.sequence_id === sequenceId) {
              const newPos = orderedIds.indexOf(t.id);
              if (newPos !== -1) {
                return { ...t, position: newPos + 1, updated_at: nowISO() };
              }
            }
            return t;
          }),
        }));
      },

      markConversationRead: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, unread_count: 0, updated_at: nowISO() }
              : c
          ),
        }));
      },

      sendReply: (patientId, body) => {
        const msg: Message = {
          id: nextId("message"),
          practice_id: "sandbox-practice-001",
          patient_id: patientId,
          enrollment_id: null,
          touchpoint_id: null,
          channel: "sms",
          direction: "outbound",
          status: "delivered",
          subject: null,
          body,
          external_id: `sandbox-reply-${Date.now()}`,
          error: null,
          sent_at: nowISO(),
          delivered_at: nowISO(),
          read_at: null,
          created_at: nowISO(),
        };

        set((state) => {
          // Update conversation preview
          const conversations = state.conversations.map((c) =>
            c.patient_id === patientId
              ? {
                  ...c,
                  last_message_at: nowISO(),
                  last_message_preview: body.slice(0, 100),
                  unread_count: 0,
                  updated_at: nowISO(),
                }
              : c
          );

          return {
            messages: [...state.messages, msg],
            conversations,
          };
        });

        return msg;
      },

      // ── Simulation helpers ──────────────────────────────────────────

      addMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }));
      },

      addConversation: (conversation) => {
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        }));
      },

      addTreatment: (treatment) => {
        set((state) => ({ treatments: [...state.treatments, treatment] }));
      },

      addEnrollment: (enrollment) => {
        set((state) => ({
          enrollments: [...state.enrollments, enrollment],
        }));
      },

      updateEnrollment: (enrollmentId, data) => {
        set((state) => ({
          enrollments: state.enrollments.map((e) =>
            e.id === enrollmentId ? { ...e, ...data } : e
          ),
        }));
      },

      updateTreatment: (treatmentId, data) => {
        set((state) => ({
          treatments: state.treatments.map((t) =>
            t.id === treatmentId ? { ...t, ...data, updated_at: nowISO() } : t
          ),
        }));
      },

      updateDashboardStats: (data) => {
        set((state) => ({
          dashboardStats: { ...state.dashboardStats, ...data },
        }));
      },

      addActivityFeedItem: (item) => {
        set((state) => ({
          activityFeed: [item, ...state.activityFeed].slice(0, 50),
        }));
      },

      updateConversation: (conversationId, data) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, ...data, updated_at: nowISO() }
              : c
          ),
        }));
      },

      // ── Portal tokens ─────────────────────────────────────────────

      addPortalToken: (token) => {
        set((state) => ({
          portalTokens: [...state.portalTokens, token],
        }));
      },

      getPortalToken: (rawToken) => {
        return get().portalTokens.find((t) => t.rawToken === rawToken) ?? null;
      },

      markPortalTokenUsed: (rawToken) => {
        set((state) => ({
          portalTokens: state.portalTokens.map((t) =>
            t.rawToken === rawToken ? { ...t, usedAt: Date.now() } : t
          ),
        }));
      },

      // ── Reset ───────────────────────────────────────────────────────

      reset: () => {
        sandboxIdCounter = 1000;
        set(getInitialState());
      },
    }),
    {
      name: "followdent-sandbox",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
);
