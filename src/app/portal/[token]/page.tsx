import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TreatmentPlanView } from "@/components/portal/TreatmentPlanView";

interface PortalPageProps {
  params: { token: string };
  searchParams: {
    patientFirstName?: string;
    treatmentDescription?: string;
    treatmentId?: string;
    treatmentCode?: string;
    practiceName?: string;
    practicePhone?: string;
    practiceEmail?: string;
  };
}

export default async function PortalPage({
  params,
  searchParams,
}: PortalPageProps) {
  const { token } = params;

  // Sandbox path: detect by prefix, read data from search params
  if (token.startsWith("sandbox-token-")) {
    const {
      patientFirstName,
      treatmentDescription,
      treatmentId,
      treatmentCode,
      practiceName,
      practicePhone,
      practiceEmail,
    } = searchParams;

    if (!patientFirstName || !treatmentDescription || !practiceName) {
      return notFound();
    }

    // TODO: enforce single-use in production path only
    return (
      <TreatmentPlanView
        patient={{ first_name: patientFirstName }}
        plan={{
          id: treatmentId ?? "",
          description: treatmentDescription,
          code: treatmentCode ?? "",
          practice: {
            name: practiceName,
            phone: practicePhone ?? "",
            email: practiceEmail ?? "",
          },
        }}
        isSandbox={true}
      />
    );
  }

  // Production path: hash token → query portal_tokens
  const supabase = createServerSupabaseClient();
  const headersList = headers();

  const tokenBytes = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
  const tokenHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: portalToken, error } = await supabase
    .from("portal_tokens")
    .select(
      `
      *,
      patient:patients(id, first_name, last_name),
      treatment:treatments(
        id, description, amount, status, code, presented_at,
        practice:practices(name, phone, email)
      )
    `
    )
    .eq("token_hash", tokenHash)
    .single();

  if (error || !portalToken) return notFound();
  if (new Date(portalToken.expires_at) < new Date())
    return redirect("/portal/expired");
  if (portalToken.used_at) return redirect("/portal/already-used");

  // Mark token as used — single-use enforcement
  await supabase
    .from("portal_tokens")
    .update({
      used_at: new Date().toISOString(),
      ip_address: headersList.get("x-forwarded-for") ?? "unknown",
      user_agent: headersList.get("user-agent") ?? "unknown",
    })
    .eq("token_hash", tokenHash);

  return (
    <TreatmentPlanView
      patient={portalToken.patient}
      plan={portalToken.treatment}
      isSandbox={false}
    />
  );
}
