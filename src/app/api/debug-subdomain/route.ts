import { NextRequest, NextResponse } from "next/server";
import { getSubdomain } from "@/lib/subdomain";

export function GET(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = getSubdomain(host);
  return NextResponse.json({
    host,
    subdomain,
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "(not set)",
  });
}
