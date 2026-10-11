import { NextResponse, type NextRequest } from "next/server";

const RESERVED = new Set(["www", "admin", "platform", "api", "app", "static", "mail", "s", "assets"]);

function hostname(request: NextRequest) {
  const raw = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return raw.split(",")[0].trim().split(":")[0].toLowerCase();
}

function subdomainSlug(host: string) {
  if (host.endsWith(".vercel.app")) return null;
  const suffixes = [".localhost", ".tajer.com", ".tajer.local"];
  for (const suffix of suffixes) {
    if (!host.endsWith(suffix)) continue;
    const sub = host.slice(0, -suffix.length);
    if (!sub || sub.includes(".") || RESERVED.has(sub)) return null;
    if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(sub)) return null;
    return sub;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = hostname(request);
  const headers = new Headers(request.headers);
  headers.set("x-tajer-host", host);

  if (
    host.endsWith(".vercel.app") ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "tajer.com" ||
    host === "www.tajer.com" ||
    host === "admin.tajer.com" ||
    host === "platform.tajer.com" ||
    host === "admin.localhost"
  ) {
    if (host === "admin.tajer.com" || host === "platform.tajer.com" || host === "admin.localhost") {
      const dest = url.clone();
      dest.pathname = url.pathname === "/" ? "/platform" : `/platform${url.pathname}`;
      headers.set("x-pathname", dest.pathname);
      return NextResponse.rewrite(dest, { request: { headers } });
    }
    return NextResponse.next({ request: { headers } });
  }

  const forced = request.headers.get("x-tajer-tenant");
  const slug = forced && !forced.includes(".") ? forced : subdomainSlug(host);

  if (slug && !url.pathname.startsWith("/api") && !url.pathname.startsWith("/s/") && !url.pathname.startsWith("/_next")) {
    const dest = url.clone();
    dest.pathname = `/s/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    headers.set("x-pathname", dest.pathname);
    headers.set("x-tajer-slug", slug);
    headers.set("x-tajer-vanity", "1");
    return NextResponse.rewrite(dest, { request: { headers } });
  }

  headers.set("x-pathname", url.pathname);
  headers.set("x-tajer-slug", slug || "");
  headers.set("x-tajer-vanity", slug ? "1" : "0");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|.*\\..*).*)"],
};