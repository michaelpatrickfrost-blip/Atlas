import { db } from "@/core/db/client";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";
export const pricingAnalytics: AnalyticsProvider = [
{id:"pricing.lists",name:"Pricelists",subject:"Pricing",definition:"Current pricelist count by currency. Prices are not added across currencies.",grain:"One pricelist",capability:"core.pricing.read",href:"/pricing",snapshot:true,query:async(session,since)=>{void since;assertCapability(session,"core.pricing.read");const rows=await db.priceList.groupBy({by:["currency"],where:{organisationId:session.organisationId},_count:{_all:true}});return rows.map(r=>({label:String(r.currency).replaceAll("_"," "),value:r._count._all}));}},
];
