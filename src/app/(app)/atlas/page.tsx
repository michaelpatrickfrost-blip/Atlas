import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { CreateDialog } from "@/components/ui/create-dialog";
import { Button } from "@/components/ui/button";
import { NewCompanyForm } from "./account-forms";

export default async function AtlasAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const params = await searchParams, query = (params.q ?? "").trim().slice(0, 100);
  const status = ["ACTIVE", "SUSPENDED", "ARCHIVED"].includes(params.status ?? "") ? params.status! : "";
  const page = Math.max(1, Math.min(10000, Math.floor(Number(params.page) || 1)));
  const where = { kind: "CUSTOMER", ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}), ...(status ? { status } : {}) };
  const [organisations, total, stats] = await Promise.all([
    db.organisation.findMany({ where, include: { _count: { select: { memberships: true, parties: true, products: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 30, skip: (page - 1) * 30 }),
    db.organisation.count({ where }),
    db.organisation.groupBy({ by: ["status"], where: { kind: "CUSTOMER" }, _count: true }),
  ]);
  const count = (key: string) => stats.find(row => row.status === key)?._count ?? 0;
  const pageHref = (number: number) => `/atlas?${new URLSearchParams({ q: query, status, page: String(number) })}`;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight">Company accounts</h2><p className="mt-2 text-sm text-slate-500">Set up customers, control access and manage their complete account lifecycle.</p></div><CreateDialog title="Create a company account" label="New company"><NewCompanyForm /></CreateDialog></div>
    <div className="grid grid-cols-3 gap-3">{[["Active", "ACTIVE"], ["Suspended", "SUSPENDED"], ["Archived", "ARCHIVED"]].map(([label, key]) => <Link href={`/atlas?status=${key}`} key={key} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{count(key)}</p></Link>)}</div>
    <form className="flex flex-wrap gap-3"><input aria-label="Search companies" name="q" defaultValue={query} placeholder="Find a company…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" /><select name="status" defaultValue={status} aria-label="Account status" className="rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">All accounts</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option></select><Button type="submit">Search</Button></form>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Company", "Access", "Subscription", "Records", ""].map(heading => <th key={heading} className="p-4 font-medium">{heading}</th>)}</tr></thead><tbody>{organisations.map(org => <tr key={org.id} className="border-t border-slate-100"><td className="p-4"><Link href={`/atlas/${org.id}`} className="font-semibold text-blue-700">{org.name}</Link><p className="mt-1 text-xs text-slate-500">{org.planName}{org.isTest ? " · Test company" : ""}</p></td><td className="p-4"><span className={`rounded-full px-3 py-1 text-[11px] ${org.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{org.status.toLowerCase()}</span></td><td className="p-4 text-xs text-slate-500">{org.subscriptionStatus.replaceAll("_", " ").toLowerCase()}</td><td className="p-4 text-xs text-slate-500">{org._count.memberships} users · {org._count.parties} customers · {org._count.products} products</td><td className="p-4 text-right"><Link href={`/atlas/${org.id}/users`} className="whitespace-nowrap text-xs text-blue-700">Manage users →</Link></td></tr>)}</tbody></table>{!organisations.length && <p className="p-8 text-sm text-slate-500">No companies match these filters.</p>}</div>
    <div className="flex items-center justify-between text-xs text-slate-500"><span>{total} matching accounts · Page {page}</span><div className="flex gap-4">{page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}{page * 30 < total && <Link href={pageHref(page + 1)}>Next</Link>}</div></div>
  </div>;
}
