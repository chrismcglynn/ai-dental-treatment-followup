import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = await request.json();
  const { type, table, record, old_record } = payload;
  const supabase = createAdminClient();

  switch (table) {
    case "patients":
      if (type === "INSERT" || type === "UPDATE") {
        // Sync patient data to search index / analytics
        await supabase
          .from("patients")
          .select("id")
          .eq("id", record.id)
          .single();
      }
      break;

    case "treatments":
      if (type === "INSERT" && record.status === "pending") {
        // Auto-enroll in sequences based on trigger rules
        const { data: sequences } = await supabase
          .from("sequences")
          .select("id")
          .eq("practice_id", record.practice_id)
          .eq("trigger_type", "treatment_declined")
          .eq("status", "active");

        if (sequences && sequences.length > 0) {
          console.log(
            `Found ${sequences.length} matching sequences for treatment ${record.id}`
          );
        }
      }
      if (
        type === "UPDATE" &&
        old_record?.status === "pending" &&
        record.status === "declined"
      ) {
        // Enroll patient in declined-treatment sequences
        const { data: sequences } = await supabase
          .from("sequences")
          .select("id")
          .eq("practice_id", record.practice_id)
          .eq("trigger_type", "treatment_declined")
          .eq("status", "active");

        if (sequences) {
          for (const seq of sequences) {
            await supabase.from("sequence_enrollments").insert({
              sequence_id: seq.id,
              patient_id: record.patient_id,
              practice_id: record.practice_id,
              status: "active",
              current_touchpoint: 0,
            });
          }
        }
      }
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}