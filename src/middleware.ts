import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // يمكنك تخصيص التوجيه هنا للمتاجر المتعددة والنطاقات الفرعية
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * تطابق جميع المسارات ما عدا الملفات الثابتة والصور
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};