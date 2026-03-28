export type Channel = "sms" | "email" | "voicemail";
export type Tone = "friendly" | "clinical" | "urgent";

export interface StepData {
  id: string;
  dayOffset: number;
  channel: Channel;
  tone: Tone;
  templateOverride: string;
  position: number;
}

export const CHANNEL_CONFIG = {
  sms: { label: "SMS", icon: "MessageSquare", color: "blue" },
  email: { label: "Email", icon: "Mail", color: "purple" },
  voicemail: { label: "Voicemail", icon: "Phone", color: "amber" },
} as const;

export const TONE_CONFIG = {
  friendly: { label: "Friendly", description: "Warm neighbor" },
  clinical: { label: "Clinical", description: "Professional healthcare" },
  urgent: { label: "Urgent", description: "Important but not scary" },
} as const;
