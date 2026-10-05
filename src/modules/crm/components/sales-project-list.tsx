import type { ProjectBase } from "@/modules/crm/domain/sales-project";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { DataTable } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";
import { STAGES, stageLabel, stageTone } from "@/modules/crm/domain/sales-project";

const CLOSED = ["COMPLETED", "LOST", "CANCELLED", "DORMANT"];

export async function SalesProjectList({ base, searchParams }: { base: ProjectBase; searchParams: Promise<{ q?: string; stage?: string; customer?: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityRead);
  const filters = await searchParams;
  const q = typeof filters.q === "string" ? filters.q.trim() : "";
  const stage = STAGES.find((value) => value === filters.stage) ?? "";
  const customer = typeof filters.customer === "string" ? filters.customer : "";
  const organisationId = session.organisationId;
  const [projects, customerName] = await Promise.all([
    db.salesProject.findMany({
      where: { organisationId, ...(stage ? { stage } : {}), ...(customer ? { organisations: { some: { partyId: customer } } } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }, { organisations: { some: { party: { name: { contains: q, mode: "insensitive" } } } } }] } : {}) },
      include: { organisations: { include: { party: { select: { name: true } } } }, _count: { select: { quotes: true, orders: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    }),
    customer ? db.party.findFirst({ where: { id: customer, organisationId }, select: { name: true } }) : null,
  ]);
  const open = projects.filter((project) => !CLOSED.includes(project.stage));
  const sum = (pick: (project: (typeof projects)[number]) => number | null) => open.reduce((total, project) => total + (pick(project) ?? 0), 0);
  const cards: [string, string][] = [["Open projects", String(open.length)], ["Potential", formatMoney(sum((p) => p.potentialValueAmount), "GBP")], ["Quoted", formatMoney(sum((p) => p.quotedValueAmount), "GBP")], ["Ordered", formatMoney(sum((p) => p.orderedValueAmount), "GBP")]];
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold tracking-tight">Sales projects</h2><p className="mt-1 text-sm text-slate-500">{customerName ? `Projects involving ${customerName.name}.` : "Jobs you are trying to win, with the organisations, quotations and orders on each."}</p></div>
      {can(session, SALES_CAPABILITIES.opportunityManage) && <Link href={`${base}/new${customer ? `?customer=${customer}` : ""}`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">New project</Link>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p></div>)}</div>
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      {customer && <input type="hidden" name="customer" value={customer} />}
      <label className="min-w-48 flex-1 text-xs text-slate-500">Search<input name="q" defaultValue={q} placeholder="Project, reference or organisation" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs text-slate-500">Stage<select name="stage" defaultValue={stage} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All stages</option>{STAGES.map((value) => <option key={value} value={value}>{stageLabel(value)}</option>)}</select></label>
      <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">Apply</button><Link href={base} className="px-2 py-2 text-sm text-slate-500">Reset</Link>
    </form>
    <DataTable rows={projects} getHref={(project) => `${base}/${project.id}`} emptyLabel={q || stage || customer ? "No projects match these filters." : "No sales projects yet. Create the first one."} columns={[
      { header: "Project", render: (project) => <div><p className="font-medium">{project.name}</p><p className="mt-1 text-xs text-slate-400">{project.reference}</p></div> },
      { header: "Main customer", render: (project) => (project.organisations.find((row) => row.isPrimary) ?? project.organisations[0])?.party.name ?? "—" },
      { header: "Stage", render: (project) => <StatusPill label={stageLabel(project.stage)} tone={stageTone(project.stage)} /> },
      { header: "Potential", align: "right", render: (project) => project.potentialValueAmount == null ? "—" : formatMoney(project.potentialValueAmount, project.potentialValueCurrency) },
      { header: "Quoted", align: "right", render: (project) => <span className="tabular-nums">{formatMoney(project.quotedValueAmount ?? 0, project.quotedValueCurrency)}<span className="mt-1 block text-xs text-slate-400">{project._count.quotes} quotation{project._count.quotes === 1 ? "" : "s"}</span></span> },
      { header: "Ordered", align: "right", render: (project) => <span className="tabular-nums">{formatMoney(project.orderedValueAmount ?? 0, project.orderedValueCurrency)}<span className="mt-1 block text-xs text-slate-400">{project._count.orders} order{project._count.orders === 1 ? "" : "s"}</span></span> },
      { header: "Target award", render: (project) => project.targetAwardDate ? project.targetAwardDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
      { header: "Next action", render: (project) => project.nextActionNote ?? "—" },
    ]} />
  </div>;
}
