import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { CreateDialog } from "@/components/ui/create-dialog";
import { Button } from "@/components/ui/button";
import { ConsoleNav } from "./console-nav";
import { NewCompanyForm } from "./account-forms";

export default async function AtlasConsole({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const { q = "" } = await searchParams;
  const organisations = await db.organisation.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    include: { _count: { select: { memberships: true, parties: true, products: true, priceLists: true, employees: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl bg-[#12213c] p-8 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-300">Atlas owner console</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Company accounts</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Create a business, give its people access, then load customers, prices, stock locations and employees from templates. Company records stay inside that workspace.</p>
      </div>
      <ConsoleNav current="companies" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form className="flex gap-3">
          <input aria-label="Search companies" name="q" defaultValue={q} placeholder="Find a company…" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
          <Button type="submit">Search</Button>
        </form>
        <CreateDialog title="Create a company account" label="New company"><NewCompanyForm /></CreateDialog>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Company", "Account", "Subscription", "Setup", ""].map((heading) => <th key={heading} className="p-4 font-medium">{heading}</th>)}</tr></thead>
          <tbody>
            {organisations.map((organisation) => (
              <tr key={organisation.id} className="border-t border-slate-100">
                <td className="p-4 font-semibold">
                  <Link href={`/atlas/${organisation.id}`} className="text-blue-600">{organisation.name}</Link>
                  <p className="mt-1 text-xs font-normal text-slate-400">{organisation.planName}</p>
                </td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-[10px] ${organisation.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>{organisation.status}</span></td>
                <td className="p-4 text-xs">{organisation.subscriptionStatus}{organisation.trialEndsAt && <p className="mt-1 text-slate-400">Trial ends {organisation.trialEndsAt.toLocaleDateString("en-GB")}</p>}</td>
                <td className="p-4 text-xs text-slate-500">{organisation._count.memberships} users · {organisation._count.parties} customers · {organisation._count.products} products · {organisation._count.priceLists} price lists · {organisation._count.employees} people</td>
                <td className="p-4 text-right"><Link href={`/atlas/${organisation.id}/setup`} className="text-blue-600">Set up →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">Showing up to 100 matching accounts. Atlas owner access cannot be granted through a company role.</p>
    </div>
  );
}
