import {db} from "@/core/db/client";
import {CreateDialog} from "@/components/ui/create-dialog";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability,can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { listProducts } from "@/core/products/queries";
import { DataTable } from "@/components/ui/table";
import { formatMoney } from "@/core/shared/money";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { saveProduct } from "./actions";
export default async function ProductsPage() {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.productsRead);
 const products=await listProducts(session.organisationId);
 const policy=await db.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{allowProductCreation:true}});
 return <div className="space-y-6"><Link href="/settings/imports" className="inline-block text-sm text-[var(--color-atlas-blue)]">CSV templates & imports →</Link><div><h2 className="text-2xl font-semibold tracking-tight">Products & services</h2><p className="mt-2 text-sm text-[var(--color-ink-muted)]">One shared catalogue for your business.</p></div>{can(session,CORE_CAPABILITIES.productsManage)&&<CreateDialog title="Add or update a product" label={policy.allowProductCreation?"New product":"Update existing product"}><ActionForm action={saveProduct} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['code','Product code / SKU','text',''],['categoryCode','Catalogue / category code','text',''],['name','Product name','text',''],['price','Standard price','number','0'],['currency','Currency','text','GBP'],['unit','Unit of measure','text','each']].map(([name,label,type,value])=><label key={name} className="text-xs">{label}<input name={name} required={name!=="categoryCode"} type={type} defaultValue={value} min={type==='number'?0:undefined} step={type==='number'?'0.01':undefined} className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm"/></label>)}<label className="text-xs">Type<select name="kind" className="mt-2 block w-full border border-[var(--color-border)] bg-white p-3 text-sm"><option value="PRODUCT">Product</option><option value="SERVICE">Service</option><option value="CHARGE">Charge</option></select></label><label className="text-xs">Tax category<select name="taxCategory" className="mt-2 block w-full border border-[var(--color-border)] bg-white p-3 text-sm"><option>STANDARD</option><option>ZERO_RATED</option><option>EXEMPT</option></select></label><p className="text-xs text-[var(--color-ink-muted)] sm:col-span-2">{policy.allowProductCreation?"Using an existing code updates its name and standard price.":"New products are disabled by company policy. Enter an existing SKU to update it."} Existing order lines keep their saved prices.</p><Button type="submit" variant="primary" className="justify-self-start">Save product</Button></ActionForm></CreateDialog>}<DataTable rows={products} emptyLabel="Add your first product or service." columns={[{header:'Code',render:p=>p.code},{header:'Product',render:p=>p.name},{header:'Type',render:p=>p.kind},{header:'Unit',render:p=>p.unitOfMeasure},{header:'Standard price',render:p=>formatMoney(p.basePriceAmount,p.baseCurrency),align:'right'}]}/></div>;
}
