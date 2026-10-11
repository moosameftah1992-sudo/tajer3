import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/db";

const RESERVED = new Set(["www", "admin", "platform", "api", "app", "static", "mail", "s", "assets"]);
const cache = new Map<string, { slug: string | null; exp: number }>();

function hostname(request: NextRequest) {
  const raw = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return raw.split(",")[0].trim().split(":")[0].toLowerCase();
}

function isPlatformHost(host: string) {
  if (
    host.endsWith(".vercel.app") ||
    host.endsWith(".localhost") ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.includes("tajer.com")
  ) {
    return true;
  }
  return false;
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

  if (isPlatformHost(host)) {
    return NextResponse.next();
  }

  let slug = await lookupHost(host);
  if (slug) {
    const dest = url.clone();
    dest.pathname = `/s/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};