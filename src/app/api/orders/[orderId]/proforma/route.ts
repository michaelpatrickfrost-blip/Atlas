import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { documentBrandFrom } from "@/core/documents/company-brand";
import { buildProformaPdf } from "@/modules/sales/services/proforma-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await requireSession();
  assertCapability(session, "sales.order.read");
  await assertModuleEnabled(session, "sales");
  const { orderId } = await params;
  const order = await db.salesOrder.findFirst({
    where: { id: orderId, organisationId: session.organisationId },
    include: { party: true, organisation: true, paymentTerm: true, proforma: true },
  });
  if (!order?.proforma) return new Response("This sale has no export proforma.", { status: 404 });
  const snapshot = order.proforma.snapshot && typeof order.proforma.snapshot === "object" ? order.proforma.snapshot as Record<string, unknown> : {};
  const bytes = await buildProformaPdf({
    reference: order.proforma.reference, orderReference: order.reference, organisationName: order.organisation.name,
    customerName: order.party.name, customerCode: order.party.customerCode, createdAt: order.proforma.issuedAt ?? order.proforma.createdAt,
    currency: order.currency, customerPo: order.customerPoReference, paymentTerms: order.paymentTerm?.name ?? null, snapshot,
    brand: documentBrandFrom(order.organisation),
  });
  const name = order.proforma.reference.replace(/[^a-zA-Z0-9_-]/g, "_");
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${new URL(request.url).searchParams.get("preview") === "1" ? "inline" : "attachment"}; filename="${name}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
