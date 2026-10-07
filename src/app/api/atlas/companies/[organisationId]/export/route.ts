import bcrypt from "bcryptjs";
import { getSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { buildCompanyExport } from "@/core/admin/company-export";
import { db } from "@/core/db/client";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function POST(request: Request, { params }: { params: Promise<{ organisationId: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401, headers });
  if (!can(session, ATLAS_CAPABILITIES.export)) return Response.json({ error: "Atlas Owner access is required." }, { status: 403, headers });
  // Compare the browser Origin to Host; the internal URL may use HTTP behind Caddy.
  let originHost: string | undefined;
  try { originHost = new URL(request.headers.get("origin") ?? "").host; } catch { /* Fail closed below. */ }
  if (!originHost || originHost !== request.headers.get("host")) return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  const { organisationId } = await params;
  const form = await request.formData();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!await bcrypt.compare(String(form.get("currentPassword") ?? ""), user.passwordHash)) return Response.json({ error: "Confirm your own password to export." }, { status: 400, headers });
  const org = await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER" }, select: { name: true } });
  if (!org) return Response.json({ error: "Company not found." }, { status: 404, headers });
  if (String(form.get("confirmName") ?? "").trim() !== org.name) return Response.json({ error: "Type the company name exactly to confirm." }, { status: 400, headers });
  try {
    const result = await buildCompanyExport(session, organisationId);
    return new Response(new Uint8Array(result.content), { headers: { ...headers, "Content-Type": "application/gzip", "Content-Disposition": `attachment; filename="atlas-company-${organisationId.replace(/[^a-z0-9-]/gi, "")}-${new Date().toISOString().slice(0, 10)}.ndjson.gz"` } });
  } catch (error) {
    console.error("Atlas company export failed", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "Export could not be completed. No partial file was created. Check attachment storage or arrange a managed export if the company exceeds 250 MB." }, { status: 500, headers });
  }
}
