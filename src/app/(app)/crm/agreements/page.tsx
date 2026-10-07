import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import { agreementLabel, formatHours } from "@/core/pricing/agreements";
import { StatusPill } from "@/components/ui/status-pill";
import { DataTable } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
const field = "mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm";
export default async function AgreementsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  const filters = await searchParams;
  const q = String(filters.q ?? "").trim().slice(0, 150);
  const status = ["DRAFT", "ACTIVE", "ENDED", "EXPIRED", "SCHEDULED"].includes(filters.status ?? "") ? filters.status : "";
  const now = new Date();
  const where: Prisma.CommercialAgreementWhereInput = { organisationId: session.organisationId,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { number: { contains: q, mode: "insensitive" } }, { party: { name: { contains: q, mode: "insensitive" } } }, { party: { customerCode: { contains: q, mode: "insensitive" } } }] } : {}),
    ...(status === "EXPIRED" ? { status: "ACTIVE", endsOn: { lt: now } } : status === "SCHEDULED" ? { status: "ACTIVE", startsOn: { gt: now } } : status === "ACTIVE" ? { status: "ACTIVE", startsOn: { lte: now }, AND: [{ OR: [{ endsOn: null }, { endsOn: { gte: now } }] }] } : status === "DRAFT" || status === "ENDED" ? { status } : {}),
  };
  const total = await db.commercialAgreement.count({ where });
  const pages = Math.max(1, Math.ceil(total / 30));
  const page = Math.min(pages, Math.max(1, Number.parseInt(filters.page ?? "1") || 1));
  const agreements = await db.commercialAgreement.findMany({ where, include: { party: { select: { name: true, customerCode: true } }, priceList: { select: { name: true } } }, orderBy: [{ startsOn: "desc" }, { id: "asc" }], skip: (page - 1) * 30, take: 30 });
  const href = (next: number) => `/crm/agreements?${new URLSearchParams({ q, status: status ?? "", page: String(next) })}`;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-tight">Commercial agreements</h2><p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">Customer terms, agreed prices and service promises. Active agreements feed pricing into Sales; drafts do not change prices.</p></div>{can(session, CORE_CAPABILITIES.pricingManage) && <Link href="/crm/agreements/new"><Button variant="primary">New agreement</Button></Link>}</div>
    <form className="flex flex-wrap items-end gap-3"><label className="min-w-56 flex-1 text-xs text-[var(--color-ink-muted)]">Search agreements<input name="q" defaultValue={q} placeholder="Agreement, reference, customer or account code" className={field} /></label><label className="text-xs text-[var(--color-ink-muted)]">Status<select name="status" defaultValue={status} className={field}><option value="">All statuses</option>{[["DRAFT", "Draft"], ["ACTIVE", "Active now"], ["SCHEDULED", "Scheduled"], ["EXPIRED", "Expired"], ["ENDED", "Ended"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Button type="submit" variant="secondary">Search</Button>{(q || status) && <Link href="/crm/agreements" className="py-2 text-sm text-[var(--color-ink-muted)]">Reset</Link>}</form>
    <DataTable rows={agreements} getHref={a => `/crm/agreements/${a.id}`} emptyLabel={q || status ? "No agreements match these filters." : "No agreements yet. Create one for agreed prices, payment terms or a service promise."} columns={[
      { header: "Agreement", render: a => <><span className="font-medium text-blue-600">{a.number} · {a.name}</span><span className="mt-1 block text-xs text-[var(--color-ink-muted)]">{a.startsOn.toLocaleDateString("en-GB")} → {a.endsOn?.toLocaleDateString("en-GB") ?? "No end date"}</span></> },
      { header: "Customer", render: a => <>{a.party.name}<span className="mt-1 block text-xs text-[var(--color-ink-muted)]">{a.party.customerCode}</span></> },
      { header: "Price list", render: a => a.priceList?.name ?? "Usual customer pricing" },
      { header: "Service promise", render: a => <>{a.slaName || "—"}{a.responseMinutes ? <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">Respond in {formatHours(a.responseMinutes)}</span> : null}</> },
      { header: "Status", render: a => { const label = a.status === "ACTIVE" && a.startsOn > now ? { label: "Scheduled", tone: "neutral" as const } : agreementLabel(a.status, a.endsOn, now); return <StatusPill {...label} />; } },
    ]} />
    <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)]"><span>{total} agreements · page {page} of {pages}</span><div className="flex gap-4">{page > 1 && <Link href={href(page - 1)}>Previous</Link>}{page < pages && <Link href={href(page + 1)}>Next</Link>}</div></div>
    <p className="text-xs text-[var(--color-ink-muted)]">Signed documents and quotation approvals are in <Link href="/crm/contracts" className="text-blue-600">CRM contracts & approvals</Link>. Quantity call-offs remain in <Link href="/sales/agreements" className="text-blue-600">Sales</Link>.</p>
  </div>;
}
