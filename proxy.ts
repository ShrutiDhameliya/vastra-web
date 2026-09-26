import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  // Both names: plain in dev, __Host- prefixed when cookies go secure in production
  const authed =
    req.cookies.has("better-auth.session_token") ||
    req.cookies.has("__Host-better-auth.session_token");
  if (!authed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };