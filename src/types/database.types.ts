export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      practices: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          timezone: string;
          pms_type: string | null;
          pms_connected: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: "trialing" | "active" | "past_due" | "canceled" | "free";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          timezone: string;
          pms_type?: string | null;
          pms_connected: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status: "trialing" | "active" | "past_due" | "canceled" | "free";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          timezone?: string;
          pms_type?: string | null;
          pms_connected?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: "trialing" | "active" | "past_due" | "canceled" | "free";
          created_at?: string;
          updated_at?: string;
        };
      };
      practice_members: {
        Row: {
          id: string;
          practice_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          practice_id: string;
          external_id: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          last_visit: string | null;
          next_appointment: string | null;
          status: "active" | "inactive" | "archived";
          tags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          external_id?: string | null;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          last_visit?: string | null;
          next_appointment?: string | null;
          status: "active" | "inactive" | "archived";
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          external_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          last_visit?: string | null;
          next_appointment?: string | null;
          status?: "active" | "inactive" | "archived";
          tags?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      treatments: {
        Row: {
          id: string;
          practice_id: string;
          patient_id: string;
          code: string;
          description: string;
          amount: number;
          status: "pending" | "accepted" | "declined" | "completed";
          presented_at: string;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          patient_id: string;
          code: string;
          description: string;
          amount: number;
          status: "pending" | "accepted" | "declined" | "completed";
          presented_at: string;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          patient_id?: string;
          code?: string;
          description?: string;
          amount?: number;
          status?: "pending" | "accepted" | "declined" | "completed";
          presented_at?: string;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sequences: {
        Row: {
          id: string;
          practice_id: string;
          name: string;
          description: string | null;
          treatment_type: string | null;
          status: "draft" | "active" | "paused" | "archived";
          trigger_type: "manual" | "treatment_declined" | "no_show" | "schedule";
          patient_count: number;
          conversion_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          name: string;
          description?: string | null;
          treatment_type?: string | null;
          status: "draft" | "active" | "paused" | "archived";
          trigger_type: "manual" | "treatment_declined" | "no_show" | "schedule";
          patient_count?: number;
          conversion_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          name?: string;
          description?: string | null;
          treatment_type?: string | null;
          status?: "draft" | "active" | "paused" | "archived";
          trigger_type?: "manual" | "treatment_declined" | "no_show" | "schedule";
          patient_count?: number;
          conversion_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      touchpoints: {
        Row: {
          id: string;
          sequence_id: string;
          position: number;
          channel: "sms" | "email" | "voicemail";
          delay_days: number;
          delay_hours: number;
          subject: string | null;
          body_template: string;
          ai_personalize: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          position: number;
          channel: "sms" | "email" | "voicemail";
          delay_days: number;
          delay_hours: number;
          subject?: string | null;
          body_template: string;
          ai_personalize: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sequence_id?: string;
          position?: number;
          channel?: "sms" | "email" | "voicemail";
          delay_days?: number;
          delay_hours?: number;
          subject?: string | null;
          body_template?: string;
          ai_personalize?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sequence_enrollments: {
        Row: {
          id: string;
          sequence_id: string;
          patient_id: string;
          practice_id: string;
          status: "active" | "completed" | "converted" | "opted_out" | "paused";
          current_touchpoint: number;
          enrolled_at: string;
          completed_at: string | null;
          converted_at: string | null;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          patient_id: string;
          practice_id: string;
          status: "active" | "completed" | "converted" | "opted_out" | "paused";
          current_touchpoint: number;
          enrolled_at?: string;
          completed_at?: string | null;
          converted_at?: string | null;
        };
        Update: {
          id?: string;
          sequence_id?: string;
          patient_id?: string;
          practice_id?: string;
          status?: "active" | "completed" | "converted" | "opted_out" | "paused";
          current_touchpoint?: number;
          enrolled_at?: string;
          completed_at?: string | null;
          converted_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          practice_id: string;
          patient_id: string;
          enrollment_id: string | null;
          touchpoint_id: string | null;
          channel: "sms" | "email" | "voicemail";
          direction: "outbound" | "inbound";
          status: "queued" | "sent" | "delivered" | "failed" | "received";
          subject: string | null;
          body: string;
          external_id: string | null;
          error: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          patient_id: string;
          enrollment_id?: string | null;
          touchpoint_id?: string | null;
          channel: "sms" | "email" | "voicemail";
          direction: "outbound" | "inbound";
          status: "queued" | "sent" | "delivered" | "failed" | "received";
          subject?: string | null;
          body: string;
          external_id?: string | null;
          error?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          patient_id?: string;
          enrollment_id?: string | null;
          touchpoint_id?: string | null;
          channel?: "sms" | "email" | "voicemail";
          direction?: "outbound" | "inbound";
          status?: "queued" | "sent" | "delivered" | "failed" | "received";
          subject?: string | null;
          body?: string;
          external_id?: string | null;
          error?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          practice_id: string;
          patient_id: string;
          last_message_at: string;
          last_message_preview: string | null;
          unread_count: number;
          status: "open" | "closed" | "archived";
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_id: string;
          patient_id: string;
          last_message_at: string;
          last_message_preview?: string | null;
          unread_count?: number;
          status: "open" | "closed" | "archived";
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_id?: string;
          patient_id?: string;
          last_message_at?: string;
          last_message_preview?: string | null;
          unread_count?: number;
          status?: "open" | "closed" | "archived";
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_status: "trialing" | "active" | "past_due" | "canceled" | "free";
      member_role: "owner" | "admin" | "member";
      patient_status: "active" | "inactive" | "archived";
      treatment_status: "pending" | "accepted" | "declined" | "completed";
      sequence_status: "draft" | "active" | "paused" | "archived";
      trigger_type: "manual" | "treatment_declined" | "no_show" | "schedule";
      channel_type: "sms" | "email" | "voicemail";
      message_direction: "outbound" | "inbound";
      message_status: "queued" | "sent" | "delivered" | "failed" | "received";
      conversation_status: "open" | "closed" | "archived";
      enrollment_status: "active" | "completed" | "converted" | "opted_out" | "paused";
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
