import { db } from '@/core/db/client';
import { serviceCaseScope } from '@/core/permissions/service-access';
import type { AttentionProvider, SearchProvider, CustomerOverviewProvider } from '@/core/modules/types';
import { ACTIVE_STATUSES } from '../domain/workflow';
export { serviceAnalytics } from "./analytics";
export const serviceSearch:SearchProvider=async({session,query})=>{
 if(!session.capabilities.has('service.case.read'))return [];
 const rows=await db.serviceCase.findMany({where:{AND:[serviceCaseScope(session),{OR:[{number:{contains:query,mode:'insensitive'}},{subject:{contains:query,mode:'insensitive'}}]}]},select:{id:true,number:true,subject:true},take:8});
 return rows.map(c=>({id:c.id,title:`${c.number} · ${c.subject}`,href:`/service/cases/${c.id}`,group:'Customer Service'}));
};
export const serviceAttention:AttentionProvider=async({session})=>{
 if(!session.capabilities.has('service.case.read'))return [];
 const rows=await db.serviceCase.findMany({where:{AND:[serviceCaseScope(session),{ownerUserId:session.userId,status:{in:[...ACTIVE_STATUSES]},customerUpdateDueAt:{lt:new Date()}}]},select:{id:true,number:true},take:10});
 return rows.map(c=>({id:c.id,label:`${c.number}: promised customer update overdue`,href:`/service/cases/${c.id}`,severity:'warning' as const}));
};
export const serviceCustomer:CustomerOverviewProvider=async({session,partyId})=>{
 if(!session.capabilities.has('service.case.read'))return null;
 const count=await db.serviceCase.count({where:{AND:[serviceCaseScope(session),{partyId,status:{in:[...ACTIVE_STATUSES]}}]}});
 return {moduleId:'service',metrics:[{label:'Open service cases',value:String(count),href:`/service/cases?partyId=${encodeURIComponent(partyId)}`}],actions:session.capabilities.has('service.case.create')?[{label:'Create case',href:`/service/cases/new?partyId=${encodeURIComponent(partyId)}`}]:[]};
};
