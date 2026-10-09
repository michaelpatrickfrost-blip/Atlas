import { CustomerStatus } from '@/generated/prisma/enums';
import { db } from '@/core/db/client';
import { recordDataset } from './records';
import { enumText, text, date } from './columns';
export const customerReports=[recordDataset({id:'customers.records',name:'Customer directory',source:'Customers',description:'Active customer master records; archived and scrubbed identities are excluded.',anyOf:['customers.read'],dateField:'createdAt',columns:[text('customerCode','Customer code'),text('name','Customer'),enumText('status','Status',Object.values(CustomerStatus)),text('customerGroup','Group'),text('territory','Territory'),text('preferredCurrency','Currency'),date('createdAt','Created')]},
 (s,w,take,skip)=>db.party.findMany({where:{AND:[{organisationId:s.organisationId,archived:false,identityScrubbed:false},w]},select:{customerCode:true,name:true,status:true,customerGroup:true,territory:true,preferredCurrency:true,createdAt:true},orderBy:[{name:'asc'},{id:'asc'}],take,skip}),
 (s,w)=>db.party.count({where:{AND:[{organisationId:s.organisationId,archived:false,identityScrubbed:false},w]}}),r=>({...r}))];
