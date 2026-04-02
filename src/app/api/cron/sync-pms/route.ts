import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncPractice } from "@/lib/integrations/sync-engine";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  // Fetch all practices with an active PMS connection
  const { data: practices } = await supabase
    .from("practices")
    .select("id, pms_type, metadata")
    .eq("pms_connected", true)
    .eq("sandbox_mode", false); // Never sync sandbox practices

  if (!practices || practices.length === 0) {
    return NextResponse.json({ synced: 0, results: [] });
  }

  const results = [];

  for (const practice of practices) {
    try {
      const logEntry = await syncPractice(supabase, practice);
      results.push({
        practiceId: practice.id,
        status: logEntry.status,
        patients: logEntry.patients_synced,
        treatments: logEntry.treatments_synced,
        appointments: logEntry.appointments_synced,
        autoConversions: logEntry.auto_conversions,
        warnings: logEntry.warnings.length,
        error: logEntry.error,
      });
    } catch (err) {
      console.error(`Fatal error syncing practice ${practice.id}:`, err);
      results.push({
        practiceId: practice.id,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    synced: results.filter((r) => r.status !== "failed").length,
    total: practices.length,
    results,
  });
}
