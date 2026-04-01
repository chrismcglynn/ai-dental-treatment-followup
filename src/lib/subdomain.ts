/**
 * Subdomain routing helpers.
 *
 * retaine.com        → marketing pages (/, /request-demo, /privacy, /hipaa)
 * demo.retaine.com   → sandbox demo (/demo)
 * app.retaine.com    → authenticated app (dashboard, auth, api, portal)
 * localhost           → no enforcement (dev mode)
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "retaine.io";

/** Marketing paths served from the root domain */
const MARKETING_PATHS = ["/", "/request-demo", "/privacy", "/hipaa"];

/** Returns the subdomain or null. "root" means bare root domain. */
export function getSubdomain(host: string): "demo" | "app" | "root" | null {
  // Local development / Vercel preview — skip subdomain logic
  if (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("vercel.app")
  ) {
    return null;
  }

  const hostWithoutPort = host.replace(/:\d+$/, "");

  // Subdomain present: e.g. demo.retaine.com or app.retaine.com
  if (hostWithoutPort.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostWithoutPort.replace(`.${ROOT_DOMAIN}`, "");
    if (sub === "demo") return "demo";
    if (sub === "app") return "app";
    return null; // unknown subdomain — no enforcement
  }

  // Bare root domain
  if (hostWithoutPort === ROOT_DOMAIN) {
    return "root";
  }

  return null;
}

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/"))
  );
}

export function isDemoPath(pathname: string): boolean {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

export function buildUrl(
  subdomain: "demo" | "app" | "root",
  pathname: string
): string {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host =
    subdomain === "root" ? ROOT_DOMAIN : `${subdomain}.${ROOT_DOMAIN}`;
  return `${protocol}://${host}${pathname}`;
}