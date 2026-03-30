/**
 * Server-side sandbox seeding — inserts realistic demo data into Supabase
 * for a newly created practice so the user sees a pre-populated dashboard
 * immediately after signup.
 *
 * This runs once during the signup flow. The sandbox data uses real DB
 * records (not in-memory) so the practice works like any other tenant
 * until they connect a real PMS and exit sandbox mode.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Seed data (server-side variant with practice_id injected at runtime) ────

const PATIENTS = [
  { first_name: "Maria", last_name: "Castellano", email: "maria.castellano@email.com", phone: "(720) 555-0198", status: "active" as const, tags: ["preferred-sms"], metadata: { preferred_contact: "sms" } },
  { first_name: "James", last_name: "Whitfield", email: "j.whitfield@gmail.com", phone: "(303) 555-0271", status: "active" as const, tags: ["preferred-email"], metadata: { preferred_contact: "email" } },
  { first_name: "Priya", last_name: "Nair", email: "priya.n@outlook.com", phone: "(720) 555-0334", status: "active" as const, tags: ["preferred-sms"], metadata: { preferred_contact: "sms" } },
  { first_name: "David", last_name: "Kowalski", email: "dkowalski@yahoo.com", phone: "(303) 555-0419", status: "active" as const, tags: ["preferred-sms"], metadata: { preferred_contact: "sms" } },
  { first_name: "Sarah", last_name: "Okonkwo", email: "sokonkwo@email.com", phone: "(720) 555-0587", status: "active" as const, tags: ["preferred-email"], metadata: { preferred_contact: "email" } },
  { first_name: "Carlos", last_name: "Mendoza", email: "carlos.m@email.com", phone: "(303) 555-0623", status: "active" as const, tags: ["preferred-sms"], metadata: { preferred_contact: "sms" } },
  { first_name: "Emily", last_name: "Thornton", email: "ethornton@gmail.com", phone: "(720) 555-0741", status: "active" as const, tags: ["preferred-sms"], metadata: { preferred_contact: "sms" } },
  { first_name: "Robert", last_name: "Chen", email: "rob.chen@email.com", phone: "(303) 555-0856", status: "active" as const, tags: ["preferred-email"], metadata: { preferred_contact: "email" } },
  { first_name: "Angela", last_name: "Rivera", email: "angela.r@outlook.com", phone: "(720) 555-0912", status: "active" as const, tags: ["preferred-sms"], metadata: { preferred_contact: "sms" } },
  { first_name: "Marcus", last_name: "Johnson", email: "marcus.j@gmail.com", phone: "(303) 555-1034", status: "active" as const, tags: ["preferred-sms"], metadata: { preferred_contact: "sms" } },
];

const TREATMENTS = [
  { code: "D2740", description: "Crown — upper left molar (#14)", amount: 1450 },
  { code: "D6010", description: "Implant placement and crown — lower left (#19)", amount: 3800 },
  { code: "D2392", description: "Two-surface composite — #19 mesial-occlusal", amount: 285 },
  { code: "D4341", description: "Full upper arch deep cleaning (SRP)", amount: 480 },
  { code: "D2960", description: "Composite veneer — upper front four (#7–10)", amount: 2400 },
  { code: "D6240", description: "Three-unit bridge — #28–30", amount: 3200 },
  { code: "D3330", description: "Root canal — lower right premolar (#28)", amount: 1200 },
  { code: "D7210", description: "Extraction and socket preservation — #17", amount: 650 },
];

const SEQUENCES = [
  {
    name: "Standard Crown & Restorative",
    description: "For crown, bridge, and multi-surface composite plans",
    treatment_type: "D2740,D2392,D6240",
    status: "active" as const,
    trigger_type: "treatment_declined" as const,
    patient_count: 12,
    conversion_rate: 37.5,
  },
  {
    name: "High-Value Implant & Prosthetic",
    description: "For implant, full arch, and cosmetic cases over $2,000",
    treatment_type: "D6010,D6065,D2960",
    status: "active" as const,
    trigger_type: "treatment_declined" as const,
    patient_count: 8,
    conversion_rate: 45.4,
  },
  {
    name: "Perio & Preventive Follow-Up",
    description: "For SRP, extraction, and hygiene treatment plans",
    treatment_type: "D4341,D7210,D7953",
    status: "active" as const,
    trigger_type: "treatment_declined" as const,
    patient_count: 6,
    conversion_rate: 22.2,
  },
];

const TOUCHPOINT_TEMPLATES = [
  // Sequence 0 (Crown & Restorative) — 3 steps
  [
    { position: 1, channel: "sms" as const, delay_days: 3, delay_hours: 0, subject: null, body_template: "Hi {{first_name}}, this is {{practice_name}}. We noticed you have a treatment plan for {{treatment_description}}. We'd love to help you get that scheduled — would any time this week or next work for you?", ai_personalize: true },
    { position: 2, channel: "email" as const, delay_days: 10, delay_hours: 0, subject: "Your treatment plan at {{practice_name}}", body_template: "Dear {{first_name}},\n\nDr. Anderson wanted to follow up regarding the {{treatment_description}} we discussed during your last visit.\n\nPlease reply to this email or call us to book your appointment.\n\nBest regards,\n{{practice_name}}", ai_personalize: true },
    { position: 3, channel: "voicemail" as const, delay_days: 21, delay_hours: 0, subject: null, body_template: "Hi {{first_name}}, this is a friendly reminder from {{practice_name}} about your {{treatment_description}}. Give us a call whenever you're ready to schedule.", ai_personalize: false },
  ],
  // Sequence 1 (Implant & Prosthetic) — 4 steps
  [
    { position: 1, channel: "sms" as const, delay_days: 2, delay_hours: 0, subject: null, body_template: "Hi {{first_name}}! This is {{practice_name}}. Just following up on the {{treatment_description}} we discussed. We know it's a big decision — happy to answer any questions.", ai_personalize: true },
    { position: 2, channel: "email" as const, delay_days: 7, delay_hours: 0, subject: "Important information about your treatment plan", body_template: "Dear {{first_name}},\n\nWe understand that {{treatment_description}} is a significant investment. We offer financing options through CareCredit.\n\nWarm regards,\n{{practice_name}}", ai_personalize: true },
    { position: 3, channel: "sms" as const, delay_days: 14, delay_hours: 0, subject: null, body_template: "{{first_name}}, quick reminder about your {{treatment_description}}. We have limited openings this month. Reply YES to reserve a spot.", ai_personalize: true },
    { position: 4, channel: "voicemail" as const, delay_days: 30, delay_hours: 0, subject: null, body_template: "Hi {{first_name}}, this is {{practice_name}} reaching out one more time about your {{treatment_description}}. Call us anytime. Take care!", ai_personalize: false },
  ],
  // Sequence 2 (Perio & Preventive) — 2 steps
  [
    { position: 1, channel: "sms" as const, delay_days: 5, delay_hours: 0, subject: null, body_template: "Hi {{first_name}}, {{practice_name}} here. We wanted to check in about the {{treatment_description}} we recommended. Can we schedule you this week?", ai_personalize: true },
    { position: 2, channel: "email" as const, delay_days: 15, delay_hours: 0, subject: "Follow-up: Your recommended treatment", body_template: "Dear {{first_name}},\n\nWe're reaching out regarding the {{treatment_description}} recommended during your last visit. This treatment is important for maintaining your gum health.\n\nThank you,\n{{practice_name}}", ai_personalize: true },
  ],
];

// ─── Seeding functions ───────────────────────────────────────────────────────

export async function seedSandboxData(practiceId: string): Promise<void> {
  const supabase = createAdminClient();

  // 1. Insert patients
  const patientInserts = PATIENTS.map((p) => ({
    ...p,
    practice_id: practiceId,
    date_of_birth: "1985-01-15",
    last_visit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    next_appointment: null,
  }));

  const { data: patients, error: patientError } = await supabase
    .from("patients")
    .insert(patientInserts)
    .select("id");

  if (patientError) throw new Error(`Seed patients failed: ${patientError.message}`);

  const patientIds = patients.map((p) => p.id);

  // 2. Insert treatments (one per patient, first 8 get treatments)
  const treatmentInserts = TREATMENTS.slice(0, Math.min(TREATMENTS.length, patientIds.length)).map(
    (t, i) => ({
      practice_id: practiceId,
      patient_id: patientIds[i],
      code: t.code,
      description: t.description,
      amount: t.amount,
      status: "pending" as const,
      presented_at: new Date(Date.now() - (14 + i * 2) * 24 * 60 * 60 * 1000).toISOString(),
    })
  );

  const { error: treatmentError } = await supabase
    .from("treatments")
    .insert(treatmentInserts);

  if (treatmentError) throw new Error(`Seed treatments failed: ${treatmentError.message}`);

  // 3. Insert sequences
  const sequenceInserts = SEQUENCES.map((s) => ({
    ...s,
    practice_id: practiceId,
  }));

  const { data: sequences, error: seqError } = await supabase
    .from("sequences")
    .insert(sequenceInserts)
    .select("id");

  if (seqError) throw new Error(`Seed sequences failed: ${seqError.message}`);

  const sequenceIds = sequences.map((s) => s.id);

  // 4. Insert touchpoints for each sequence
  const touchpointInserts = sequenceIds.flatMap((seqId, seqIndex) =>
    TOUCHPOINT_TEMPLATES[seqIndex].map((tp) => ({
      ...tp,
      sequence_id: seqId,
    }))
  );

  const { error: tpError } = await supabase
    .from("touchpoints")
    .insert(touchpointInserts);

  if (tpError) throw new Error(`Seed touchpoints failed: ${tpError.message}`);

  // 5. Create a few enrollments for the first 5 patients
  const enrollmentInserts = patientIds.slice(0, 5).map((patientId, i) => ({
    sequence_id: sequenceIds[i % sequenceIds.length],
    patient_id: patientId,
    practice_id: practiceId,
    status: "active" as const,
    current_touchpoint: 1,
  }));

  const { error: enrollError } = await supabase
    .from("sequence_enrollments")
    .insert(enrollmentInserts);

  if (enrollError) throw new Error(`Seed enrollments failed: ${enrollError.message}`);
}

export async function flagPracticeAsSandbox(practiceId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("practices")
    .update({
      sandbox_mode: true,
      sandbox_seeded_at: new Date().toISOString(),
    })
    .eq("id", practiceId);

  if (error) throw new Error(`Flag sandbox failed: ${error.message}`);
}

export async function clearSandboxData(practiceId: string): Promise<void> {
  const supabase = createAdminClient();

  // Delete in dependency order
  await supabase.from("messages").delete().eq("practice_id", practiceId);
  await supabase.from("conversations").delete().eq("practice_id", practiceId);
  await supabase.from("sequence_enrollments").delete().eq("practice_id", practiceId);
  await supabase.from("touchpoints").delete().in(
    "sequence_id",
    (await supabase.from("sequences").select("id").eq("practice_id", practiceId)).data?.map((s) => s.id) ?? []
  );
  await supabase.from("sequences").delete().eq("practice_id", practiceId);
  await supabase.from("treatments").delete().eq("practice_id", practiceId);
  await supabase.from("patients").delete().eq("practice_id", practiceId);

  // Unflag sandbox
  await supabase
    .from("practices")
    .update({ sandbox_mode: false, sandbox_seeded_at: null })
    .eq("id", practiceId);
}
