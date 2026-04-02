import type { DentalRole } from "@/app/demo/DemoSignupForm";

export interface DemoPrefillData {
  full_name: string;
  email: string;
  role: DentalRole;
  practice_name: string;
}

/**
 * Map marketing request-demo roles to demo sandbox roles.
 */
const ROLE_MAP: Record<string, DentalRole> = {
  "Practice Owner": "dentist",
  "Office Manager": "office_manager",
  "Lead RDH": "hygienist",
  "Associate Dentist": "dentist",
  Other: "front_office",
};

export function mapRequestDemoRole(role: string): DentalRole {
  return ROLE_MAP[role] ?? "front_office";
}

/** Encode prefill data into a URL-safe base64 string. */
export function encodePrefill(data: DemoPrefillData): string {
  return btoa(JSON.stringify(data));
}

/** Decode prefill data from the `d` query param. Returns null on failure. */
export function decodePrefill(encoded: string): DemoPrefillData | null {
  try {
    const parsed = JSON.parse(atob(encoded));
    if (parsed.full_name && parsed.email && parsed.role && parsed.practice_name) {
      return parsed as DemoPrefillData;
    }
    return null;
  } catch {
    return null;
  }
}
