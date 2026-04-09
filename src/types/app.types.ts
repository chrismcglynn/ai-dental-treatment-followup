import { type Tables, type Database } from "./database.types";

// Enum aliases
export type ConversationMode = Database["public"]["Enums"]["conversation_mode"];
export type SentBy = Database["public"]["Enums"]["sent_by"];

// Business hours type (stored as JSONB in practices.business_hours)
export interface BusinessHoursDay {
  open: string;  // "HH:mm" format
  close: string; // "HH:mm" format
  enabled: boolean;
}
export type BusinessHours = Record<string, BusinessHoursDay>;

// Domain aliases
export type Practice = Tables<"practices">;
export type PracticeMember = Tables<"practice_members">;
export type Patient = Tables<"patients">;
export type Treatment = Tables<"treatments">;
export type Sequence = Tables<"sequences">;
export type Touchpoint = Tables<"touchpoints">;
export type SequenceEnrollment = Tables<"sequence_enrollments">;
export type Message = Tables<"messages">;
export type Conversation = Tables<"conversations">;

// Composite types
export interface PatientWithTreatments extends Patient {
  treatments: Treatment[];
}

export interface PatientWithStats extends Patient {
  treatments: Treatment[];
  active_enrollment_count: number;
  pending_treatment_count: number;
  last_message_at: string | null;
}

export interface SequenceWithTouchpoints extends Sequence {
  touchpoints: Touchpoint[];
}

export interface ConversationWithPatient extends Conversation {
  patient: Patient;
  messages?: Message[];
}

export interface EnrollmentWithDetails extends SequenceEnrollment {
  patient: Patient;
  sequence: Sequence;
}

export interface EnrollmentWithSequence extends SequenceEnrollment {
  sequences: Sequence;
}

// Auth types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  practices: PracticeMembership[];
}

export interface PracticeMembership {
  practice_id: string;
  practice_name: string;
  role: PracticeMember["role"];
}

// Dashboard types
export interface DashboardStats {
  revenue_recovered: number;
  revenue_change: number;
  active_patients: number;
  patients_change: number;
  plans_in_sequence: number;
  messages_sent: number;
  delivery_rate: number;
  conversion_rate: number;
  conversion_change: number;
}

export interface ActivityItem {
  id: string;
  patient_name: string;
  action: string;
  timestamp: string;
  type: "success" | "info" | "warning";
}

// Analytics types
export interface AnalyticsStats {
  revenue_recovered: number;
  best_sequence: { name: string; conversion_rate: number } | null;
  best_channel: { channel: string; conversion_rate: number } | null;
  avg_days_to_book: number;
}

export interface ChannelBreakdownItem {
  channel: string;
  count: number;
}

export interface SequenceConversionRow {
  id: string;
  name: string;
  sent: number;
  delivered: number;
  replied: number;
  booked: number;
  conversion_rate: number;
}

export interface FunnelStageItem {
  stage: string;
  value: number;
}

export interface AutoReplyStats {
  autoReplied: number;
  escalated: number;
  manual: number;
  aiConversionRate: number;
  manualConversionRate: number;
  avgResponseTimeSec: number;
  escalationReasons: { reason: string; count: number }[];
}

// Filter types
export interface PatientFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: Patient["status"];
}

export interface SequenceFilters {
  status?: Sequence["status"];
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
