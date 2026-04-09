/**
 * Business Hours Utility
 *
 * Checks whether the current time falls within a practice's configured
 * business hours, respecting the practice timezone.
 */

import type { BusinessHours } from "@/types/app.types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Check if a given moment is within business hours for a practice.
 *
 * @param businessHours - Per-day open/close config from practices.business_hours
 * @param timezone - IANA timezone string (e.g. "America/Denver")
 * @param at - The moment to check (defaults to now)
 */
export function isWithinBusinessHours(
  businessHours: BusinessHours | null | undefined,
  timezone: string,
  at: Date = new Date()
): boolean {
  if (!businessHours || !timezone) return true; // If not configured, allow

  // Get current day/time in practice timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(at);
  const dayName = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  const dayConfig = businessHours[dayName];
  if (!dayConfig || !dayConfig.enabled) return false;

  const currentMinutes = parseInt(hour) * 60 + parseInt(minute);
  const openMinutes = parseTimeToMinutes(dayConfig.open);
  const closeMinutes = parseTimeToMinutes(dayConfig.close);

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
