import { NextResponse, type NextRequest } from "next/server";
/** Trusted routing hint only; session/capability checks remain in server services. */
export function proxy(request: NextRequest) {
  const headers=new Headers(request.headers);
  headers.set("x-atlas-request-path",request.nextUrl.pathname);
  return NextResponse.next({request:{headers}});
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|brand/).*)"]};
