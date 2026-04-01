import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // ── demo subdomain (demo.retaine.io / demo.localhost:3000) ──
  if (hostname.startsWith("demo.")) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/demo";
      return NextResponse.rewrite(url);
    }
    // Allow /demo/* paths through
    if (pathname.startsWith("/demo")) {
      return NextResponse.next();
    }
    // Everything else on demo subdomain → rewrite to /demo
    const url = request.nextUrl.clone();
    url.pathname = "/demo";
    return NextResponse.rewrite(url);
  }

  // ── app subdomain (app.retaine.io / app.localhost:3000) ──
  if (hostname.startsWith("app.")) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
    // All other app routes — run auth middleware
    return await updateSession(request);
  }

  // ── root domain (retaine.io / localhost:3000) ──
  // Redirect app routes to app subdomain
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/patients") ||
    pathname.startsWith("/sequences") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings")
  ) {
    const protocol = hostname.includes("localhost") ? "http" : "https";
    const rootDomain = hostname.replace(/^www\./, "").replace(/:\d+$/, "");
    const port = hostname.match(/:(\d+)$/)?.[1];
    const portSuffix = port ? `:${port}` : "";
    return NextResponse.redirect(
      `${protocol}://app.${rootDomain}${portSuffix}${pathname}`
    );
  }

  // Redirect demo routes to demo subdomain
  if (pathname.startsWith("/demo")) {
    const protocol = hostname.includes("localhost") ? "http" : "https";
    const rootDomain = hostname.replace(/^www\./, "").replace(/:\d+$/, "");
    const port = hostname.match(/:(\d+)$/)?.[1];
    const portSuffix = port ? `:${port}` : "";
    return NextResponse.redirect(`${protocol}://demo.${rootDomain}${portSuffix}/`);
  }

  // Marketing pages + everything else
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
