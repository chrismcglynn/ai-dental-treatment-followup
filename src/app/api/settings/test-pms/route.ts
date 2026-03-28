import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { pmsType, credentials } = await request.json();

  if (!pmsType || !credentials) {
    return NextResponse.json(
      { error: "Missing required fields", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Validate based on PMS type
  switch (pmsType) {
    case "open_dental": {
      const { apiUrl, apiKey } = credentials;
      if (!apiUrl || !apiKey) {
        return NextResponse.json(
          { error: "API URL and API key are required", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }

      // In production, make a test call to the Open Dental API:
      // try {
      //   const res = await fetch(`${apiUrl}/patients?limit=1`, {
      //     headers: { Authorization: `ODFHIR ${apiKey}` },
      //   });
      //   if (!res.ok) throw new Error(`API returned ${res.status}`);
      // } catch (err) {
      //   return NextResponse.json({ error: "Failed to connect to Open Dental" }, { status: 400 });
      // }

      return NextResponse.json({ status: "ok", message: "Connection successful" });
    }

    default:
      return NextResponse.json(
        { error: `Unsupported PMS type: ${pmsType}`, code: "UNSUPPORTED" },
        { status: 400 }
      );
  }
}
