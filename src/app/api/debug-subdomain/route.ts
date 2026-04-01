import { NextRequest, NextResponse } from "next/server";
import { getSubdomain, isMarketingPath, isDemoPath } from "@/lib/subdomain";

export function GET(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const subdomain = getSubdomain(host);
  return NextResponse.json({
    host,
    pathname,
    subdomain,
    isMarketingPath: isMarketingPath(pathname),
    isDemoPath: isDemoPath(pathname),
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "(not set)",
  });
}
