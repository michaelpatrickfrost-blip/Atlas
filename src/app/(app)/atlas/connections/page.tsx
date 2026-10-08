import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { CONNECTION_TEMPLATES } from "@/modules/connections/domain/catalogue";
import { ConnectionsWorkspace } from "./workspace";
export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  assertCapability(session, "atlas.companies.manage");
  const { company } = await searchParams;
  const companies = await db.organisation.findMany({ where: { kind: "CUSTOMER", archivedAt: null }, select: { id: true, name: true, status: true }, orderBy: { name: "asc" } });
  const selected = companies.find(item => item.id === company)?.id ?? "";
  const history = selected ? await db.auditEntry.findMany({ where: { organisationId: selected, entityType: "Import", action: { startsWith: "import." } }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, action: true, createdAt: true, after: true, actorUserId: true } }) : [];
  return <ConnectionsWorkspace companies={companies} selectedCompany={selected} templates={CONNECTION_TEMPLATES} history={history.map(entry => ({ id: entry.id, section: CONNECTION_TEMPLATES.find(template => `import.${template.id}` === entry.action)?.title ?? entry.action, date: entry.createdAt.toISOString(), details: entry.after && typeof entry.after === "object" && !Array.isArray(entry.after) ? { rows: String(entry.after.rows ?? ""), fileName: String(entry.after.fileName ?? "") } : { rows: "", fileName: "" } }))} />;
}
