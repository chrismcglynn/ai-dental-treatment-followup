interface DemoRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  practiceName: string;
  phone?: string;
  currentPms: string;
  plansPerMonth?: string;
  notes?: string;
}

export async function addToBrevoWaitlist(
  data: DemoRequestPayload & { demoLink: string }
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_WAITLIST_LIST_ID || "3");

  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      email: data.email,
      listIds: [listId],
      updateEnabled: true,
      attributes: {
        FIRSTNAME: data.firstName,
        LASTNAME: data.lastName,
        PRACTICE_NAME: data.practiceName,
        ROLE: data.role,
        PHONE: data.phone || "",
        CURRENT_PMS: data.currentPms,
        PLANS_PER_MONTH: data.plansPerMonth || "",
        NOTES: data.notes || "",
        DEMO_LINK: data.demoLink,
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
