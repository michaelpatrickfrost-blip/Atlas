import { db } from "@/core/db/client";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import type { CustomerOverviewProvider } from "@/core/modules/types";
import { formatMoney } from "@/core/shared/money";
export const crmCustomerOverviewProvider: CustomerOverviewProvider = async ({organisationId,session,partyId}) => {
 if(!can(session,SALES_CAPABILITIES.opportunityRead)) return null;
 const opportunities = await db.opportunity.findMany({where:{organisationId,partyId,status:"OPEN"},select:{valueAmount:true,valueCurrency:true}});
 const totals = opportunities.reduce<Record<string,number>>((s,o)=>{s[o.valueCurrency]=(s[o.valueCurrency]??0)+o.valueAmount;return s;},{});
 const projects = await db.salesProject.count({where:{organisationId,organisations:{some:{partyId}},stage:{notIn:["COMPLETED","LOST","CANCELLED","DORMANT"]}}});
 return {moduleId:"crm",metrics:[...Object.entries(totals).map(([currency,amount])=>({label:`Open pipeline (${currency})`,value:formatMoney(amount,currency),href:"/crm/pipeline"})),{label:"Open sales projects",value:String(projects),href:`/crm/projects?customer=${partyId}`}],actions:[{label:"View pipeline",href:"/crm/pipeline"},{label:"Sales projects",href:`/crm/projects?customer=${partyId}`},...(can(session,SALES_CAPABILITIES.opportunityManage)?[{label:"New sales project",href:`/crm/projects/new?customer=${partyId}`}]:[])]};
};
