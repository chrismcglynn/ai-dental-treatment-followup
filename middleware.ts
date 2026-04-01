import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  getSubdomain,
  isMarketingPath,
  isDemoPath,
  buildUrl,
} from "@/lib/subdomain";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = getSubdomain(host);
  const { pathname } = request.nextUrl;

  // No subdomain enforcement (localhost, vercel previews, unknown hosts)
  if (subdomain === null) {
    return await updateSession(request);
  }

  // ── Root domain (retaine.io) ──
  // Serves marketing pages only. Everything else → app subdomain.
  if (subdomain === "root") {
    if (isMarketingPath(pathname)) {
      return NextResponse.next();
    }
    if (isDemoPath(pathname)) {
      return NextResponse.redirect(buildUrl("demo", pathname));
    }
    // App routes (dashboard, auth, api, portal, etc.) → app subdomain
    return NextResponse.redirect(buildUrl("app", pathname));
  }

  // ── demo.retaine.io ──
  // Only serves /demo. Root path rewrites to /demo.
  if (subdomain === "demo") {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/demo";
      return NextResponse.rewrite(url);
    }
    if (isDemoPath(pathname)) {
      return NextResponse.next();
    }
    if (isMarketingPath(pathname)) {
      return NextResponse.redirect(buildUrl("root", pathname));
    }
    return NextResponse.redirect(buildUrl("app", pathname));
  }

  // ── app.retaine.io ──
  // Serves the authenticated app. Marketing/demo routes get redirected out.
  if (subdomain === "app") {
    if (isMarketingPath(pathname) && pathname !== "/") {
      return NextResponse.redirect(buildUrl("root", pathname));
    }
    if (isDemoPath(pathname)) {
      return NextResponse.redirect(buildUrl("demo", pathname));
    }
    // "/" on app subdomain → dashboard
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // All other app routes — run auth middleware
    return await updateSession(request);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};