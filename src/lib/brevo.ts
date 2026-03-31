interface DemoRequestPayload {
  fullName: string;
  email: string;
  role: string;
  practiceName: string;
  phone?: string;
  currentPms: string;
  plansPerMonth?: string;
  notes?: string;
}

export async function addToBrevoWaitlist(
  data: DemoRequestPayload
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_WAITLIST_LIST_ID || "3");

  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const [firstName, ...lastParts] = data.fullName.trim().split(" ");
  const lastName = lastParts.join(" ") || "";

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      email: data.email,
      firstName,
      lastName,
      listIds: [listId],
      updateEnabled: true,
      attributes: {
        PRACTICE_NAME: data.practiceName,
        ROLE: data.role,
        PHONE: data.phone || "",
        CURRENT_PMS: data.currentPms,
        PLANS_PER_MONTH: data.plansPerMonth || "",
        NOTES: data.notes || "",
        SOURCE: "landing_page_demo_request",
        SUBMITTED_AT: new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status !== 409) {
      throw new Error(
        `Brevo API error: ${response.status} — ${JSON.stringify(error)}`
      );
    }
  }
}
