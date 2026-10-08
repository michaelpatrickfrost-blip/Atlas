import { getSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { csvText } from "@/core/shared/csv";
import { connectionTemplate } from "@/modules/connections/domain/catalogue";
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Sign in to download Connections templates.", { status: 401 });
  if (!can(session, "atlas.companies.manage")) return new Response("Connections is available to Atlas staff only.", { status: 403 });
  const template = connectionTemplate(new URL(request.url).searchParams.get("entity") ?? "");
  if (!template) return new Response("Unknown Connections template", { status: 400 });
  return new Response(`\uFEFF${csvText([template.columns, template.example])}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="atlas-connections-${template.id}.csv"`, "Cache-Control": "private, no-store" } });
}
