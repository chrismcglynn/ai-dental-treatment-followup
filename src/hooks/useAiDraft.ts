import { useMutation } from "@tanstack/react-query";
import { useSandbox } from "@/lib/sandbox";

interface DraftReplyParams {
  patientFirstName: string;
  recentMessages: Array<{
    direction: "inbound" | "outbound";
    body: string;
  }>;
  latestIntent: string | null;
  treatmentDescription: string | null;
  practiceName: string;
}

interface DraftReplyResponse {
  draft: string;
  reasoning: string;
}

const SANDBOX_DRAFTS: Record<string, string> = {
  wants_to_book:
    "We'd love to get you scheduled. Would mornings or afternoons work better for you?",
  has_question:
    "Great question! Give us a call and we can go over everything in detail.",
  not_ready:
    "No worries at all. Whenever you're ready, we're here. Feel free to reach out anytime.",
  stop: "We've removed you from our messages. If you ever need us, don't hesitate to call.",
};

export function useDraftReply() {
  const { isSandbox } = useSandbox();

  return useMutation<DraftReplyResponse, Error, DraftReplyParams>({
    mutationFn: async (params) => {
      if (isSandbox) {
        // Simulated delay for sandbox mode
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const template =
          SANDBOX_DRAFTS[params.latestIntent ?? ""] ??
          "Thanks for your message! How can we help?";
        return {
          draft: `Hi ${params.patientFirstName}, ${template.charAt(0).toLowerCase()}${template.slice(1)} - ${params.practiceName}`,
          reasoning: "Sandbox demo draft based on detected intent",
        };
      }

      const response = await fetch("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error ?? "Failed to generate draft");
      }

      return response.json();
    },
  });
}
