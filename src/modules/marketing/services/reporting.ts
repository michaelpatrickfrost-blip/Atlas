import { db } from '@/core/db/client';
import type { Session } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { requireMarketing } from './queries';
import { attributionWeights } from '../domain/policy';
export async function attributionReport(s:Session,model:'FIRST'|'LAST'|'LINEAR'){
 assertCapability(s,'marketing.report.read');assertCapability(s,'sales.order.read');await requireMarketing(s);
 const [profiles,touches,orders]=await Promise.all([db.marketingProfile.findMany({where:{organisationId:s.organisationId},select:{id:true,partyId:true},take:5001}),db.marketingTouch.findMany({where:{organisationId:s.organisationId},take:5001}),db.salesOrder.findMany({where:{organisationId:s.organisationId,commercialStatus:'CONFIRMED'},select:{id:true,partyId:true,createdAt:true,netAmount:true,currency:true},take:5001})]);
 if([profiles,touches,orders].some(r=>r.length>5000))throw new Error('Attribution projection required above 5,000 source records.');
 const totals=new Map<string,{campaignId:string;amount:number;currency:string;orders:number}>();
 for(const order of orders){const ids=new Set(profiles.filter(p=>p.partyId===order.partyId).map(p=>p.id));const weights=attributionWeights(touches.filter(t=>ids.has(t.profileId)),model,order.createdAt);const perCampaign=new Map<string,number>();for(const w of weights)perCampaign.set(w.campaignId,(perCampaign.get(w.campaignId)??0)+w.weight);for(const [campaignId,weight]of perCampaign){const key=`${campaignId}:${order.currency}`,row=totals.get(key)??{campaignId,amount:0,currency:order.currency,orders:0};row.amount+=Math.round(order.netAmount*weight);row.orders++;totals.set(key,row);}}
 return [...totals.values()];
}
