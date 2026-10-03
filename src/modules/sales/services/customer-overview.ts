import { db } from "@/core/db/client";
import type { CustomerOverviewProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { formatMoney } from "@/core/shared/money";
export const salesCustomerOverviewProvider: CustomerOverviewProvider = async ({organisationId,session,partyId}) => {
 if (!can(session,SALES_CAPABILITIES.orderRead)) return null;
 const orders = await db.salesOrder.findMany({where:{organisationId,partyId,commercialStatus:"CONFIRMED"},select:{grossAmount:true,currency:true}});
 const totals = orders.reduce<Record<string,number>>((s,o)=>{s[o.currency]=(s[o.currency]??0)+o.grossAmount;return s;},{});
 return {moduleId:"sales",metrics:[{label:"Open orders",value:String(orders.length),href:"/sales/orders"},...Object.entries(totals).map(([currency,amount])=>({label:`Committed orders (${currency})`,value:formatMoney(amount,currency)}))],actions:[{label:"View orders",href:"/sales/orders"}],creditExposure:Object.keys(totals).length===1 ? {amountMinorUnits:Object.values(totals)[0],currency:Object.keys(totals)[0]} : undefined};
};
