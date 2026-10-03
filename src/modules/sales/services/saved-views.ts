"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {orderWhere,quoteWhere,type SalesFilters} from './list-filters';
import {selectedColumns} from './view-definition';
const definition=z.object({customerScope:z.enum(['exact','descendants']).optional(),beneficiary:z.string().max(12000).optional(),q:z.string().max(150).optional(),owner:z.string().max(12000).optional(),customer:z.string().max(12000).optional(),tag:z.string().max(4000).optional(),tagMode:z.enum(['any','all']).optional(),status:z.string().max(200).optional(),currency:z.string().max(200).optional(),view:z.enum(['list','board']).optional(),from:z.string().max(10).optional(),to:z.string().max(10).optional(),dateField:z.string().max(20).optional(),rules:z.string().max(12000).optional(),match:z.enum(['all','any']).optional(),columns:z.string().max(300).optional(),sort:z.string().max(30).optional(),direction:z.enum(['asc','desc']).optional()}).strict();
export async function saveSalesView(mode:'order'|'quote',form:FormData){
 const session=await requireSession();
 assertCapability(session,mode==='order'?'sales.order.read':'sales.quote.read');
 await assertModuleEnabled(session,'sales');
 const name=String(form.get('name')??'').trim();if(!name||name.length>80)throw new Error('Give this view a name of up to 80 characters.');
 const filters=definition.parse(JSON.parse(String(form.get('definition')??'{}'))) as SalesFilters;
 if(mode==='order')orderWhere(session.organisationId,filters);else quoteWhere(session.organisationId,filters);
 filters.columns=selectedColumns(filters.columns).join(',');
 await db.salesSavedView.upsert({where:{organisationId_ownerUserId_mode_name:{organisationId:session.organisationId,ownerUserId:session.userId,mode,name}},create:{organisationId:session.organisationId,ownerUserId:session.userId,mode,name,definition:filters},update:{definition:filters,archived:false}});
 revalidatePath(`/sales/${mode==='order'?'orders':'quotes'}`);
}
export async function archiveSalesView(mode:'order'|'quote',id:string){
 const session=await requireSession();
 assertCapability(session,mode==='order'?'sales.order.read':'sales.quote.read');
 await assertModuleEnabled(session,'sales');
 await db.salesSavedView.updateMany({where:{id,mode,organisationId:session.organisationId,ownerUserId:session.userId},data:{archived:true}});
 revalidatePath(`/sales/${mode==='order'?'orders':'quotes'}`);
}
