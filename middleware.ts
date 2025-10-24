import { NextResponse, NextRequest } from "next/server";

const SUPPORTED = ["en", "hu", "sr"] as const;
type Lang = (typeof SUPPORTED)[number];

function bestLang(req: NextRequest): Lang {
  const cookie = req.cookies.get("lang")?.value;
  if (cookie && (SUPPORTED as readonly string[]).includes(cookie)) {
    return cookie as Lang;
  }
  const header = (req.headers.get("accept-language") || "").toLowerCase();
  const parts = header.split(",").map(s => s.split(";")[0].trim());
  for (const p of parts) {
    if (p.startsWith("sr")) return "sr";
    if (p.startsWith("hu")) return "hu";
    if (p.startsWith("en")) return "en";
  }
  return "en";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static/next/api assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // If URL already has a supported lang, pass through and remember it
  const hasLang = SUPPORTED.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLang) {
    const res = NextResponse.next();
    const lang = SUPPORTED.find(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
    if (lang) res.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // Otherwise, redirect to best language based on cookie or Accept-Language
  const lang = bestLang(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${pathname}`;
  const res = NextResponse.redirect(url);
  res.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = {
  // Run middleware for all non-asset, non-api paths
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
