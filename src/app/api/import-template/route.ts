import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { csvText } from "@/core/shared/csv";
import { templateCsvRows } from "@/core/setup/catalogue";

const COMPANY_TEMPLATES: Record<string, string> = {
  customers: "customers.create",
  products: "core.products.manage",
  prices: "core.pricing.manage",
  "sales-orders": "sales.order.create",
  "sales-quotes": "sales.quote.create",
};

export async function GET(request: Request) {
  const session = await requireSession();
  const entity = new URL(request.url).searchParams.get("entity") ?? "";
  const rows = templateCsvRows(entity);
  if (!rows) return new Response("Unknown template", { status: 400 });
  const owner = can(session, "atlas.companies.manage");
  const companyCapability = COMPANY_TEMPLATES[entity];
  if (!owner && (!companyCapability || !can(session, companyCapability))) return new Response("This template is available to Atlas owners.", { status: 403 });
  return new Response(`\uFEFF${csvText(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="atlas-${entity}-template.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
