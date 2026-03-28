import { NextRequest, NextResponse } from "next/server";

const systemPrompt = `You are a dental practice communication specialist.
Generate a single follow-up message for a patient who has an unscheduled treatment plan.
Rules:
- Never be pushy or create anxiety about dental health
- Always include a clear, simple call to action (call us, reply YES, click to book)
- For SMS: 160 characters max, conversational, one sentence CTA
- For email: subject line + 3-4 short paragraphs, warm opening, procedure mention, easy booking CTA, sign off
- For voicemail: script format, 30 seconds max when read aloud, natural speech patterns
- Tone mapping: friendly=warm neighbor, clinical=professional healthcare, urgent=important but not scary
- Never mention specific dollar amounts
- Always include practice name placeholder as [PRACTICE_NAME]`;

function buildUserPrompt(params: {
  procedureDescription: string;
  channel: string;
  tone: string;
  stepNumber: number;
  dayOffset: number;
}): string {
  return `Generate a ${params.channel} message for step ${params.stepNumber} of a follow-up sequence.

Channel: ${params.channel}
Tone: ${params.tone}
Day offset: ${params.dayOffset} days after the treatment plan was presented
Procedure: ${params.procedureDescription}
Step number: ${params.stepNumber} in the sequence

${params.channel === "email" ? "Start with 'Subject: ' on the first line, then the email body." : ""}
${params.channel === "voicemail" ? "Write as a natural voicemail script." : ""}

Generate only the message content, nothing else.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      procedureDescription = "dental treatment",
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

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Fallback: generate a placeholder message if no API key
      const fallback = generateFallbackMessage(channel, tone, dayOffset, procedureDescription);
      return NextResponse.json({ message: fallback });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: buildUserPrompt({
              procedureDescription,
              channel,
              tone,
              stepNumber,
              dayOffset,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Anthropic API error:", errorData);
      // Fall back to generated message
      const fallback = generateFallbackMessage(channel, tone, dayOffset, procedureDescription);
      return NextResponse.json({ message: fallback });
    }

    const data = await response.json();
    const message =
      data.content?.[0]?.type === "text" ? data.content[0].text : "";

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
  dayOffset: number,
  procedure: string
): string {
  const toneStyle = {
    friendly: { greeting: "Hi there!", closing: "Have a great day!" },
    clinical: { greeting: "Dear Patient,", closing: "Best regards, [PRACTICE_NAME]" },
    urgent: { greeting: "Important:", closing: "Please contact us at your earliest convenience." },
  }[tone] ?? { greeting: "Hello,", closing: "Thank you!" };

  if (channel === "sms") {
    return `${toneStyle.greeting} This is [PRACTICE_NAME]. We wanted to follow up on your ${procedure} treatment plan. Ready to schedule? Reply YES or call us!`;
  }

  if (channel === "email") {
    return `Subject: Your ${procedure} treatment plan at [PRACTICE_NAME]

${toneStyle.greeting}

We hope you're doing well! We're reaching out because it's been ${dayOffset} days since we discussed your ${procedure} treatment plan, and we wanted to check in.

Your oral health is important to us, and we want to make sure you have all the information you need to make the best decision for your care.

Scheduling is easy — just reply to this email, call us, or click the link below to book your appointment online.

${toneStyle.closing}`;
  }

  // voicemail
  return `Hi, this is [PRACTICE_NAME] calling. We're following up on the ${procedure} treatment plan we discussed with you about ${dayOffset} days ago. We just wanted to check in and see if you have any questions. When you get a chance, give us a call back and we'd be happy to help you get scheduled. ${toneStyle.closing}`;
}
