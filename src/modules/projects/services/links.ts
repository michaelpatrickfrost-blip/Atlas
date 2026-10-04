import type {Session} from '@/core/auth/session';
import {db} from '@/core/db/client';
import {taskScope,documentScope} from '@/core/permissions/work-access';
export async function resolveWorkLink(session:Session,link:{targetEntity:string;targetId:string}){
 const {targetEntity,targetId}=link,where={id:targetId,organisationId:session.organisationId};
 if(targetEntity==='ProjectTask'){const t=await db.projectTask.findFirst({where:{AND:[taskScope(session),{id:targetId}]},select:{title:true,status:true}});return t?{title:t.title,detail:t.status,href:`/projects/tasks/${targetId}`}:null;}
 if(targetEntity==='ProjectDocument'){const d=await db.projectDocument.findFirst({where:{AND:[documentScope(session),{id:targetId}]},select:{title:true,version:true}});return d?{title:d.title,detail:`Version ${d.version}`,href:`/projects/documents/${targetId}`}:null;}
 const capability={Party:'customers.read',Product:'core.products.read',SalesOrder:'sales.order.read',Quote:'sales.quote.read'}[targetEntity];if(!capability||!session.capabilities.has(capability))return null;
 if(targetEntity==='Party'){const p=await db.party.findFirst({where,select:{name:true}});return p?{title:p.name,detail:'Business account',href:`/customers/${targetId}`}:null;}
 if(targetEntity==='Product'){const p=await db.product.findFirst({where,select:{name:true}});return p?{title:p.name,detail:'Product',href:`/products`}:null;}
 if(targetEntity==='SalesOrder'){const o=await db.salesOrder.findFirst({where,select:{reference:true,commercialStatus:true}});return o?{title:o.reference,detail:o.commercialStatus,href:`/sales/orders/${targetId}`}:null;}
 if(targetEntity==='Quote'){const q=await db.quote.findFirst({where,select:{reference:true,status:true}});return q?{title:q.reference,detail:q.status,href:`/sales/quotes/${targetId}`}:null;}return null;
}
