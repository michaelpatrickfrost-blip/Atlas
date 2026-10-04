import { db } from "@/core/db/client";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";
export const productsAnalytics: AnalyticsProvider = [
{id:"products.catalogue",name:"Active catalogue",subject:"Products",definition:"Active shared products and services by kind.",grain:"One shared product or service",capability:"core.products.read",href:"/products",snapshot:true,query:async(session,since)=>{void since;assertCapability(session,"core.products.read");const rows=await db.product.groupBy({by:["kind"],where:{organisationId:session.organisationId,active:true},_count:{_all:true}});return rows.map(r=>({label:String(r.kind).replaceAll("_"," "),value:r._count._all}));}},
];
