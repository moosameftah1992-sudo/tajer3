import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/db";

const RESERVED = new Set(["www", "admin", "platform", "api", "app", "static", "mail", "s", "assets"]);
const cache = new Map<string, { slug: string | null; exp: number }>();

function hostname(request: NextRequest) {
  const raw = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return raw.split(",")[0].trim().split(":")[0].toLowerCase();
}

function isPlatformHost(host: string) {
  const extra = (process.env.PLATFORM_HOSTS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (
    host.endsWith(".vercel.app") ||
    host.endsWith(".localhost") ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.includes("tajer.com")
  ) {
    return true;
  }

  const allowed = new Set(["tajer.com", "www.tajer.com", "tajer.local", ...extra]);
  return allowed.has(host);
}

function subdomainSlug(host: string) {
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

async function lookupHost(host: string) {
  const hit = cache.get(host);
  if (hit && hit.exp > Date.now()) return hit.slug;
  try {
    const result = await pool.query<{ slug: string }>(
      `select t.slug from tenant_domains d join tenants t on t.id = d.tenant_id where lower(d.host) = $1 and d.verified = true limit 1`,
      [host],
    );
    const slug = result.rows[0]?.slug ?? null;
    cache.set(host, { slug, exp: Date.now() + 15000 });
    return slug;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = hostname(request);
  const headers = new Headers(request.headers);
  headers.set("x-tajer-host", host);

  // إذا كان الطلب على الجذر للمنصة أو نطاق Vercel الرئيسي، اعرض الصفحة الرئيسية مباشرة
  if (url.pathname === "/" && isPlatformHost(host) && !host.startsWith("admin.") && !host.startsWith("platform.")) {
    headers.set("x-pathname", url.pathname);
    return NextResponse.next({ request: { headers } });
  }

  if (host === "admin.tajer.com" || host === "platform.tajer.com" || host === "admin.localhost") {
    const dest = url.clone();
    dest.pathname = url.pathname === "/" ? "/platform" : `/platform${url.pathname}`;
    headers.set("x-pathname", dest.pathname);
    return NextResponse.rewrite(dest, { request: { headers } });
  }

  if (
    url.pathname.startsWith("/s/") ||
    url.pathname.startsWith("/platform") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register")
  ) {
    headers.set("x-pathname", url.pathname);
    return NextResponse.next({ request: { headers } });
  }

  const forced = request.headers.get("x-tajer-tenant");
  let slug = forced && !forced.includes(".") ? forced : subdomainSlug(host);
  let vanity = Boolean(slug);
  if (!slug && host && !isPlatformHost(host)) {
    slug = await lookupHost(host);
    vanity = Boolean(slug);
  }

  if (slug) {
    const dest = url.clone();
    dest.pathname = `/s/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    headers.set("x-pathname", dest.pathname);
    headers.set("x-tajer-slug", slug);
    headers.set("x-tajer-vanity", "1");
    return NextResponse.rewrite(dest, { request: { headers } });
  }

  headers.set("x-pathname", url.pathname);
  headers.set("x-tajer-slug", slug || "");
  headers.set("x-tajer-vanity", vanity ? "1" : "0");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/:path*"],
};