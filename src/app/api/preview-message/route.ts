import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/ai/claude";

const systemPrompt = `You are a dental practice communication specialist.
Generate a single follow-up message for a patient who has an unscheduled treatment plan.

HIPAA/PHI RULES (CRITICAL):
- NEVER include the patient's treatment or procedure name/description in the message
- NEVER include clinical details, tooth numbers, or diagnosis information
- You may use the patient's first name via the {{first_name}} placeholder
- Always include {{portal_link}} where the patient can securely view their treatment details
- The portal link is the ONLY place treatment information should appear

General rules:
- Never be pushy or create anxiety about dental health
- Always include a clear, simple call to action (view your plan, call us, reply YES)
- For SMS: 160 characters max, conversational, include {{portal_link}}
- For email: subject line + 3-4 short paragraphs, warm opening, include {{portal_link}}, easy booking CTA, sign off
- For voicemail: script format, 30 seconds max when read aloud, natural speech patterns, direct patient to check their text/email for the secure link
- Tone mapping: friendly=warm neighbor, clinical=professional healthcare, urgent=important but not scary
- Never mention specific dollar amounts
- Always include practice name placeholder as [PRACTICE_NAME]
- Available placeholders: {{first_name}}, {{portal_link}}, [PRACTICE_NAME]`;

function buildUserPrompt(params: {
  channel: string;
  tone: string;
  stepNumber: number;
  dayOffset: number;
}): string {
  return `Generate a ${params.channel} message for step ${params.stepNumber} of a follow-up sequence.

Channel: ${params.channel}
Tone: ${params.tone}
Day offset: ${params.dayOffset} days after the treatment plan was presented
Step number: ${params.stepNumber} in the sequence

Remember: Do NOT mention any treatment/procedure details. Use {{portal_link}} so the patient can view their plan securely. Use {{first_name}} for personalization.

${params.channel === "email" ? "Start with 'Subject: ' on the first line, then the email body." : ""}
${params.channel === "voicemail" ? "Write as a natural voicemail script. Since you can't include a link in voicemail, direct the patient to check their text or email for the secure link, or call the office." : ""}

Generate only the message content, nothing else.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      channel,
      tone,
      stepNumber,
      dayOffset,
    } = body;

    if (!channel || !tone) {
      return NextResponse.json(
        { error: "Missing required fields", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const message = await callClaude({
      system: systemPrompt,
      userMessage: buildUserPrompt({ channel, tone, stepNumber, dayOffset }),
    });

    if (!message) {
      const fallback = generateFallbackMessage(channel, tone);
      return NextResponse.json({ message: fallback });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Preview message error:", error);
    return NextResponse.json(
      { error: "Failed to generate message", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

function generateFallbackMessage(
  channel: string,
  tone: string,
): string {
  const toneStyle = {
    friendly: { greeting: "Hi {{first_name}}!", closing: "Have a great day!" },
    clinical: { greeting: "Hi {{first_name}},", closing: "Best regards, [PRACTICE_NAME]" },
    urgent: { greeting: "Hi {{first_name}},", closing: "Please contact us at your earliest convenience." },
  }[tone] ?? { greeting: "Hi {{first_name}},", closing: "Thank you!" };

  if (channel === "sms") {
    return `${toneStyle.greeting} This is [PRACTICE_NAME]. We have an update on your treatment plan. View details and schedule here: {{portal_link}}`;
  }

  if (channel === "email") {
    return `Subject: Your treatment plan at [PRACTICE_NAME]

${toneStyle.greeting}

We hope you're doing well! We're reaching out because you have a treatment plan ready to schedule, and we wanted to check in.

Your oral health is important to us, and we want to make sure you have all the information you need to make the best decision for your care.

You can view your treatment plan details and schedule your appointment here:
{{portal_link}}

Or simply reply to this email or call us to book.

${toneStyle.closing}`;
  }

  // voicemail
  return `Hi {{first_name}}, this is [PRACTICE_NAME] calling. We're following up on a treatment plan from your recent visit. We just wanted to check in and see if you have any questions. Check your text or email for a secure link to view your plan details, or give us a call back and we'd be happy to help you get scheduled. ${toneStyle.closing}`;
}
