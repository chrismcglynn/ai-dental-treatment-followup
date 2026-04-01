const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_TIMEOUT_MS = 10_000;

interface CallClaudeParams {
  system: string;
  userMessage: string;
  maxTokens?: number;
  model?: string;
}

export async function callClaude({
  system,
  userMessage,
  maxTokens = DEFAULT_MAX_TOKENS,
  model = DEFAULT_MODEL,
}: CallClaudeParams): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, skipping Claude call");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Claude API error:", response.status, errorData);
      return null;
    }

    const data = await response.json();
    return data.content?.[0]?.type === "text" ? data.content[0].text : null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Claude API call timed out");
    } else {
      console.error("Claude API call failed:", error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
