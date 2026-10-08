import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { csvText } from "@/core/shared/csv";
import { connectionTemplate } from "@/modules/connections/domain/catalogue";
export async function GET(request: Request) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const template = connectionTemplate(new URL(request.url).searchParams.get("entity") ?? "");
  if (!template) return new Response("Unknown Connections template", { status: 400 });
  return new Response(`\uFEFF${csvText([template.columns, template.example])}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="atlas-connections-${template.id}.csv"`, "Cache-Control": "private, no-store" } });
}
