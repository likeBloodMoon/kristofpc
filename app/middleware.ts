import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (url.pathname === '/rs' || url.pathname.startsWith('/rs/')) {
    url.pathname = url.pathname.replace(/^\/rs(\/|$)/, '/sr$1');
    return NextResponse.redirect(url, { status: 308 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/rs/:path*', '/rs'],
};