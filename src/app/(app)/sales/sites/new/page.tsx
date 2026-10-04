import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { createSite } from "@/modules/sales/services/sites";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createSiteAction(formData: FormData) {
  "use server";
  const session = await requireSession();
  assertCapability(session, "sales.site.manage");
  const site = await createSite(session, {
    name: String(formData.get("name") ?? ""),
    partyId: String(formData.get("partyId") ?? ""),
    opportunityId: String(formData.get("opportunityId") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
    startAt: String(formData.get("startAt") ?? "") || undefined,
    targetAt: String(formData.get("targetAt") ?? "") || undefined,
  });
  revalidatePath("/sales/sites");
  redirect(`/sales/sites/${site.id}`);
}

export default async function NewSitePage() {
  const session = await requireSession();
  assertCapability(session, "sales.site.manage");

  const [customers, opportunities] = await Promise.all([
    db.party.findMany({
      where: { organisationId: session.organisationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.opportunity.findMany({
      where: {
        organisationId: session.organisationId,
        status: "OPEN",
      },
      select: { id: true, name: true, valueAmount: true, valueCurrency: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/sales/sites" className="text-sm text-slate-400 hover:text-blue-600">
          ← Back to Sites
        </Link>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">New site</h2>
        <p className="mt-2 text-sm text-slate-500">
          A site is a big project or location that will receive multiple quotes
          over time. Think of it as the umbrella under which all the individual
          quotes and orders for that engagement live.
        </p>
      </div>

      <form action={createSiteAction} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Site name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Harlow Estate Phase 2"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            name="partyId"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Related opportunity <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <select
            name="opportunityId"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">No linked opportunity</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Start date</label>
            <input
              type="date"
              name="startAt"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Target completion</label>
            <input
              type="date"
              name="targetAt"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Anything useful to remember about this site…"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create site
          </button>
          <Link
            href="/sales/sites"
            className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
