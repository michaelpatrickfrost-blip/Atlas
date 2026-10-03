import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/core/auth/session";
import { searchAtlas } from "@/core/search/aggregate";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ results: [] }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchAtlas(session, query);
  return NextResponse.json({ results });
}
