import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all practices with connected PMS
  const { data: practices } = await supabase
    .from("practices")
    .select("id, pms_type")
    .eq("pms_connected", true);

  if (!practices || practices.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  let syncedCount = 0;

  for (const practice of practices) {
    try {
      // PMS-specific sync logic would go here
      // Each PMS type has its own API integration
      console.log(`Syncing practice ${practice.id} (${practice.pms_type})`);
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync practice ${practice.id}:`, err);
    }
  }

  return NextResponse.json({
    synced: syncedCount,
    total: practices.length,
  });
}