import { getSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { GUARDIAN_CAPABILITY } from "@/core/guardian/report";
import { db } from "@/core/db/client";
export async function GET(_request: Request, { params }: { params: Promise<{ issueId: string }> }) {
  const headers = { "Cache-Control": "private, no-store" };
  const session = await getSession();
  if (!session) return new Response(null, { status: 401, headers });
  if (!can(session, GUARDIAN_CAPABILITY)) return new Response(null, { status: 403, headers });
  const { issueId } = await params;
  const issue = await db.guardianIssue.findUnique({ where: { id: issueId } });
  if (!issue) return new Response(null, { status: 404, headers });
  return new Response(issue.brief, { headers: { ...headers, "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="atlas-repair-brief.md"', "X-Content-Type-Options": "nosniff" } });
}
