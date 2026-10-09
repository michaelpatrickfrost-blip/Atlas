import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_PATH } from "@/core/auth/admin-address";
/** Trusted routing hint only; session/capability checks remain in server services. */
export function proxy(request: NextRequest) {
  const headers=new Headers(request.headers);
  headers.set("x-atlas-request-path",request.nextUrl.pathname);
  const response = NextResponse.next({request:{headers}});
  const path = request.nextUrl.pathname;
  if (path === ADMIN_LOGIN_PATH || path.startsWith(`${ADMIN_LOGIN_PATH}/`) || path === "/atlas" || path.startsWith("/atlas/") || path.startsWith("/api/atlas/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|brand/).*)"]};
