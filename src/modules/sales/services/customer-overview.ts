import {db} from '@/core/db/client';
import type {CustomerOverviewProvider} from '@/core/modules/types';
import {can} from '@/core/permissions/check';
import {formatMoney} from '@/core/shared/money';
export const salesCustomerOverviewProvider:CustomerOverviewProvider=async({organisationId,session,partyId})=>{
 if(!can(session,'sales.order.read'))return null;
 const orders=await db.salesOrder.findMany({where:{organisationId,OR:[{partyId},{pricingPartyId:partyId}],commercialStatus:'CONFIRMED'},select:{grossAmount:true,currency:true,partyId:true}});
 const totals=orders.reduce<Record<string,number>>((s,o)=>{s[o.currency]=(s[o.currency]??0)+o.grossAmount;return s;},{}),billed=orders.filter(o=>o.partyId===partyId).reduce<Record<string,number>>((s,o)=>{s[o.currency]=(s[o.currency]??0)+o.grossAmount;return s;},{});
 return {moduleId:'sales',metrics:[{label:'Open orders linked to account',value:String(orders.length),href:`/sales/orders?rules=${encodeURIComponent(JSON.stringify([{field:'relatedAccount',operator:'eq',value:partyId}]))}`},...Object.entries(totals).map(([currency,amount])=>({label:`Linked committed orders (${currency})`,value:formatMoney(amount,currency)}))],actions:[{label:'Orders invoiced to account',href:`/sales/orders?customer=${partyId}`},{label:'Orders using account pricing',href:`/sales/orders?beneficiary=${partyId}`}],creditExposure:Object.keys(billed).length===1?{amountMinorUnits:Object.values(billed)[0],currency:Object.keys(billed)[0]}:undefined};
};
