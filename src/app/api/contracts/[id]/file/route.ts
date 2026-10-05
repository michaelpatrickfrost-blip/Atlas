import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";

/** Staff copy of a contract or quotation-approval PDF. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (!can(session, CORE_CAPABILITIES.contractManage) && !can(session, "sales.quote.read")) return new Response("You cannot open this document.", { status: 403 });
    const contract = await db.contractDocument.findFirst({ where: { id: (await params).id, organisationId: session.organisationId }, select: { fileContent: true, fileName: true } });
    if (!contract?.fileContent) return new Response("No file is stored for this document.", { status: 404 });
    return new Response(new Uint8Array(contract.fileContent), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${(contract.fileName ?? "document.pdf").replace(/"/g, "")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Sign in to open this document.", { status: 401 }); }
}
