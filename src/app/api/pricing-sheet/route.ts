import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { csvText } from "@/core/shared/csv";

function money(amount: number) {
  return (amount / 100).toFixed(2);
}

function day(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export async function GET(request: Request) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  const url = new URL(request.url);
  const priceListId = url.searchParams.get("priceListId") ?? "";
  const agreementId = url.searchParams.get("agreementId") ?? "";
  const products = await db.product.findMany({
    where: { organisationId: session.organisationId, active: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });
  const header = ["productCode", "productName", "minimumQuantity", "unitPrice", "discount", "validFrom", "validTo"];
  let filename = "atlas-prices.csv";
  const rows: string[][] = [header];

  if (priceListId) {
    const list = await db.priceList.findFirst({ where: { id: priceListId, organisationId: session.organisationId }, include: { entries: { where: { active: true, scope: "PRODUCT", method: "FIXED", productId: { not: null } } } } });
    if (!list) return new Response("Unknown price list", { status: 404 });
    filename = `atlas-${list.name.replace(/[^\w.-]+/g, "-").slice(0, 40)}.csv`;
    const priced = new Set<string>();
    for (const entry of list.entries.sort((a, b) => (a.productId ?? "").localeCompare(b.productId ?? "") || a.minimumQuantity - b.minimumQuantity)) {
      const product = products.find((item) => item.id === entry.productId);
      if (!product || entry.productId == null) continue;
      priced.add(product.id);
      rows.push([product.code, product.name, String(entry.minimumQuantity), money(entry.unitPriceAmount), entry.percentage ? String(entry.percentage) : "", day(entry.validFrom), day(entry.validTo)]);
    }
    for (const product of products) if (!priced.has(product.id)) rows.push([product.code, product.name, "1", "", "", "", ""]);
  } else if (agreementId) {
    const agreement = await db.commercialAgreement.findFirst({ where: { id: agreementId, organisationId: session.organisationId }, include: { prices: true } });
    if (!agreement) return new Response("Unknown agreement", { status: 404 });
    filename = `atlas-${agreement.number}.csv`;
    const priced = new Set<string>();
    for (const price of agreement.prices.sort((a, b) => a.productId.localeCompare(b.productId) || a.minimumQuantity - b.minimumQuantity)) {
      const product = products.find((item) => item.id === price.productId);
      if (!product) continue;
      priced.add(product.id);
      rows.push([product.code, product.name, String(price.minimumQuantity), money(price.unitPriceAmount), "", "", ""]);
    }
    for (const product of products) if (!priced.has(product.id)) rows.push([product.code, product.name, "1", "", "", "", ""]);
  } else {
    return new Response("Choose a price list or agreement", { status: 400 });
  }

  return new Response(`\uFEFF${csvText(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
