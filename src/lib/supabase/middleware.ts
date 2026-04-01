import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/auth/forgot-password",
  "/api/auth/signup",
  "/api/webhooks",
  "/demo",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (isPublicPath(pathname)) {
    // Redirect authenticated users away from login/signup
    if (
      user &&
      (pathname.startsWith("/auth/login") ||
        pathname.startsWith("/auth/signup"))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Unauthenticated users → login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting onboarding — always allow
  if (pathname.startsWith("/auth/onboarding")) {
    return supabaseResponse;
  }

  // Authenticated user hitting dashboard routes — check if they have a practice
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/patients") ||
    pathname.startsWith("/sequences") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings") ||
    pathname === "/" // on app subdomain, "/" redirects to /dashboard before reaching here
  ) {
    const { data: memberships } = await supabase
      .from("practice_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!memberships || memberships.length === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
