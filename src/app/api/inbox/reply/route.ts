import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify authenticated user
  const supabaseAuth = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { practiceId, patientId, body } = await request.json();

  if (!practiceId || !patientId || !body?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Get patient phone number
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("phone")
    .eq("id", patientId)
    .single();

  if (patientError || !patient?.phone) {
    return NextResponse.json(
      { error: "Patient not found or has no phone number", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Get practice phone number (Twilio sender)
  const { data: practice, error: practiceError } = await supabase
    .from("practices")
    .select("phone")
    .eq("id", practiceId)
    .single();

  if (practiceError || !practice?.phone) {
    return NextResponse.json(
      { error: "Practice phone number not configured", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Sandbox guard — never send real messages for sandbox practices
  const { data: practiceCheck } = await supabase
    .from("practices")
    .select("sandbox_mode")
    .eq("id", practiceId)
    .single();

  if (practiceCheck?.sandbox_mode) {
    console.log(`[SANDBOX] Would have sent SMS to ${patient.phone}: "${body.trim()}"`);

    // Insert a fake outbound message record
    const { data: sandboxMsg, error: sandboxMsgError } = await supabase
      .from("messages")
      .insert({
        practice_id: practiceId,
        patient_id: patientId,
        channel: "sms",
        direction: "outbound",
        status: "delivered",
        body: body.trim(),
        external_id: `sandbox-sms-${Date.now()}`,
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sandboxMsgError) {
      return NextResponse.json(
        { error: "Failed to save sandbox message", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(sandboxMsg);
  }

  // Send via Twilio
  let externalId: string | null = null;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  if (twilioSid && twilioToken) {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: patient.phone.startsWith("+") ? patient.phone : `+1${patient.phone}`,
        From: practice.phone,
        Body: body.trim(),
        StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
      }),
    });

    if (!twilioResponse.ok) {
      const err = await twilioResponse.json();
      return NextResponse.json(
        { error: err.message ?? "Failed to send SMS", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    const twilioData = await twilioResponse.json();
    externalId = twilioData.sid;
  }

  // Insert outbound message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      practice_id: practiceId,
      patient_id: patientId,
      channel: "sms",
      direction: "outbound",
      status: externalId ? "sent" : "queued",
      body: body.trim(),
      external_id: externalId,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (messageError) {
    return NextResponse.json(
      { error: "Failed to save message", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  // Update conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("patient_id", patientId)
    .eq("practice_id", practiceId)
    .single();

  if (conversation) {
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.trim().substring(0, 100),
        unread_count: 0,
      })
      .eq("id", conversation.id);
  }

  return NextResponse.json(message);
}
