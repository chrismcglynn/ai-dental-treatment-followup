import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function generatePortalToken(
  patientId: string,
  treatmentId: string,
  practiceId: string
): Promise<string> {
  const rawToken = crypto.randomUUID() + "-" + Date.now();
  const tokenBytes = new TextEncoder().encode(rawToken);

  const hashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
  const tokenHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Invalidate any existing unused tokens for this patient+treatment
  await supabase
    .from("portal_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("patient_id", patientId)
    .eq("treatment_id", treatmentId)
    .is("used_at", null);

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  await supabase.from("portal_tokens").insert({
    token_hash: tokenHash,
    patient_id: patientId,
    treatment_id: treatmentId,
    practice_id: practiceId,
    expires_at: expiresAt.toISOString(),
  });

  return rawToken;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { patientId, treatmentId, practiceId } = await req.json();

    if (!patientId || !treatmentId || !practiceId) {
      return new Response(
        JSON.stringify({ error: "patientId, treatmentId, and practiceId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawToken = await generatePortalToken(patientId, treatmentId, practiceId);

    return new Response(
      JSON.stringify({ token: rawToken }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate portal token" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
