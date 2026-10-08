import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";

export default async function AtlasAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.companies);
  return <div className="mx-auto max-w-7xl space-y-7 pb-12">
    <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-slate-900 p-3 text-white"><ShieldCheck size={22} /></span><div><h1 className="text-xl font-semibold tracking-tight">Atlas Admin</h1><p className="mt-1 text-xs text-slate-500">Platform administration · {can(session, ATLAS_CAPABILITIES.staff) ? "Full staff access" : "Staff"}</p></div></div>
        <nav aria-label="Atlas administration" className="flex flex-wrap gap-2 text-sm">
          <Link href="/atlas" className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">Companies</Link>
          {can(session, ATLAS_CAPABILITIES.staff) && <Link href="/atlas/team" className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">Atlas team</Link>}
          <Link href="/atlas/guardian" className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">Guardian</Link>
          {can(session, ATLAS_CAPABILITIES.archive) && <Link href="/atlas/cleanup" className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">Cleanup</Link>}
          <Link href="/atlas/activity" className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">Admin activity</Link>
        </nav>
      </div>
    </header>
    {children}
  </div>;
}
