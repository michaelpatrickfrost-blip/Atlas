import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import type { AnalyticsProvider } from "./types";
/** Customer Master is Core, available independently of any installed module. */
export const customerAnalytics: AnalyticsProvider = [
 {id:"customers.lifecycle",name:"Customer accounts",subject:"Customers",definition:"Current canonical customer identities by status, respecting Customer Master read permission.",grain:"One shared Party",capability:"customers.read",href:"/customers",snapshot:true,query:async(session)=>{assertCapability(session,"customers.read");const rows=await db.party.groupBy({by:["status"],where:{organisationId:session.organisationId},_count:{_all:true}});return rows.map(r=>({label:r.status,value:r._count._all}));}},
 {id:"customers.territories",name:"Customer territories",subject:"Customers",definition:"Current canonical customer accounts by territory. Counts accounts, not orders or revenue.",grain:"One shared Party",capability:"customers.read",href:"/customers",snapshot:true,query:async(session)=>{assertCapability(session,"customers.read");const rows=await db.party.groupBy({by:["territory"],where:{organisationId:session.organisationId},_count:{_all:true}});return rows.map(r=>({label:r.territory??"Unassigned",value:r._count._all}));}}
];
