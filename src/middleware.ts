import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.split(",")[0].trim().split(":")[0].toLowerCase();

  // السماح للنطاقات الرئيسية بالمرور مباشرة بدون أي استعلام بطيء
  if (
    host.endsWith(".vercel.app") ||
    host.endsWith(".localhost") ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.includes("tajer.com") ||
    host === "www.tajer.com"
  ) {
    return NextResponse.next();
  }

  // استخراج اسم المتجر من النطاق الفرعي (مثل store1.tajer.com)
  const parts = host.split(".");
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (!["www", "admin", "platform", "api", "app"].includes(subdomain)) {
      const dest = url.clone();
      dest.pathname = `/s/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(dest);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};