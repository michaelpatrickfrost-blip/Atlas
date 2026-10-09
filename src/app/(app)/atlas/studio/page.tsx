import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { db } from "@/core/db/client";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const session=await requireSession();
  assertCapability(session,ATLAS_CAPABILITIES.staff);
  const q=(await searchParams).q?.trim().slice(0,100)??"";
  const companies=await db.organisation.findMany({where:{kind:"CUSTOMER",status:"ACTIVE",archivedAt:null,...(q?{name:{contains:q,mode:"insensitive" as const}}:{})},select:{id:true,name:true,isTest:true},orderBy:{name:"asc"},take:100});
  return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">Studio setup console</h2><p className="mt-2 text-sm text-slate-500">Set up company configuration here under your Atlas staff login. Customer Studio stays in the customer&apos;s workspace.</p></div><form className="flex gap-3"><input name="q" defaultValue={q} aria-label="Find a company" placeholder="Find a company" className="rounded-lg border p-3"/><button className="text-sm text-blue-700">Search</button></form><ul className="divide-y rounded-xl border bg-white px-5">{companies.map(c=><li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><Link className="font-medium text-blue-700" href={`/atlas/studio/${c.id}`}>{c.name}{c.isTest?" · Test":""}</Link><Link className="text-xs text-slate-500" href={`/atlas/${c.id}`}>Company access & app entitlements</Link></li>)}</ul>{companies.length===100&&<p className="text-sm text-slate-500">Showing the first 100 companies. Search to narrow the list.</p>}</div>;
}
