import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { CustomerMap } from "./customer-map";
export default async function MapPage() {
 const session=await requireSession();
 assertCapability(session,CUSTOMER_CAPABILITIES.read);
 const customers=await db.party.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true,customerCode:true,parentPartyId:true,hierarchyRole:true,customerGroup:true,status:true},orderBy:{name:'asc'},take:500});
 return <div className="mx-auto max-w-7xl space-y-6"><div className="rounded-3xl border border-[#dce5f6] bg-[linear-gradient(115deg,#eaf0ff,#f5efff_65%,#eafff8)] p-8"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#66789e]">Relationships, connected</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Your customer landscape</h1><p className="mt-3 text-sm text-[var(--color-ink-muted)]">Groups. Customers. Branches. See how the whole relationship fits together.</p><Link href="/customers" className="mt-4 inline-block text-sm text-[var(--color-atlas-blue)]">← Customer list</Link></div><CustomerMap customers={customers}/>{customers.length===500&&<p className="text-xs">Showing the first 500 accounts.</p>}</div>;
}
