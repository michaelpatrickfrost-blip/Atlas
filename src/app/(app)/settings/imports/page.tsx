import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { ImportForm } from "./import-form";
export default async function ImportsPage() {
 const session=await requireSession();
 const entities=[...(can(session,'customers.create')?['customers']:[]),...(can(session,'core.products.manage')?['products']:[]),...(can(session,'core.pricing.manage')?['prices']:[])];
 const lists=can(session,'core.pricing.manage')?await db.priceList.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true}}):[];
 return <div className="mx-auto max-w-4xl space-y-6"><h1 className="text-3xl font-semibold tracking-tight">Bring your data into Atlas.</h1><p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">Download a template, validate your CSV, review it, then import. Up to 500 rows per file. Invalid files leave your records unchanged. Product codes and pricelist rules update existing entries; customer imports create new records.</p>{entities.length?<ImportForm entities={entities} lists={lists}/>:<p className="text-sm">Your role does not allow imports.</p>}</div>;
}
