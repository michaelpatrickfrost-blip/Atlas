import type { Session } from '@/core/auth/session';
import { templateRecord } from '@/core/templates/service';
import { db } from '@/core/db/client';
export type ContractSource={sourceModule:string|null;sourceType:string|null;sourceId:string|null;opportunityId?:string|null};
export async function canAccessContractSource(session:Session,row:ContractSource){
 if(!row.sourceModule && !row.opportunityId)return true;
 try{await templateRecord(session,row.sourceModule??'crm',row.sourceType??'deal',row.sourceId??row.opportunityId!);return true;}catch{return false;}
}
export async function staffContract(session:Session,id:string){
 const row=await db.contractDocument.findFirst({where:{id,organisationId:session.organisationId}});
 if(!row||!await canAccessContractSource(session,row))throw new Error('This document is unavailable or outside your access.');return row;
}
