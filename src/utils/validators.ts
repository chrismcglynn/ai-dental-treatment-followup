import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    practice_name: z.string().min(2, "Practice name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const inviteTeamSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]),
});

// Practice schemas
export const practiceSchema = z.object({
  name: z.string().min(2, "Practice name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  timezone: z.string(),
});

// Patient schemas
export const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  date_of_birth: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Sequence schemas
export const sequenceSchema = z.object({
  name: z.string().min(2, "Sequence name must be at least 2 characters"),
  description: z.string().optional(),
  treatment_type: z.string().optional(),
  trigger_type: z.enum(["manual", "treatment_declined", "no_show", "schedule"]),
});

export const touchpointSchema = z.object({
  channel: z.enum(["sms", "email", "voicemail"]),
  delay_days: z.number().min(0).default(0),
  delay_hours: z.number().min(0).max(23).default(0),
  subject: z.string().optional(),
  body_template: z.string().min(1, "Message body is required"),
  ai_personalize: z.boolean().default(true),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PracticeInput = z.infer<typeof practiceSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type SequenceInput = z.infer<typeof sequenceSchema>;
export type TouchpointInput = z.infer<typeof touchpointSchema>;
export type InviteTeamInput = z.infer<typeof inviteTeamSchema>;