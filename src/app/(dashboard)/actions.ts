"use server";

import { clearSandboxData } from "@/lib/sandbox/seedSandboxData";

export async function exitSandboxAction(practiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await clearSandboxData(practiceId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
