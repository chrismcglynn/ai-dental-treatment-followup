import { NextResponse, type NextRequest } from "next/server";
import { getConnector, getSupportedPmsTypes } from "@/lib/integrations/factory";
import type { PmsCredentials } from "@/lib/integrations/types";

export async function POST(request: NextRequest) {
  const { pmsType, credentials } = await request.json();

  if (!pmsType || !credentials) {
    return NextResponse.json(
      { error: "Missing required fields", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Validate PMS type is supported
  if (!getSupportedPmsTypes().includes(pmsType)) {
    return NextResponse.json(
      { error: `Unsupported PMS type: ${pmsType}`, code: "UNSUPPORTED" },
      { status: 400 }
    );
  }

  const { apiUrl, apiKey, developerKey } = credentials;
  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "API URL and API key are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const connector = getConnector(pmsType);
  const pmsCreds: PmsCredentials = {
    apiUrl,
    apiKey,
    extras: developerKey ? { developerKey } : undefined,
  };

  const result = await connector.testConnection(pmsCreds);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Connection failed", code: "CONNECTION_FAILED" },
      { status: 400 }
    );
  }

  return NextResponse.json({ status: "ok", message: "Connection successful" });
}
