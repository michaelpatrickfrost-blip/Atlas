import type {SalesFilters} from './list-filters';
type Account={id:string;name:string;parentPartyId:string|null;customerGroup:string|null};
type Group={currency:string;commercialStatus:string;partyId:string;pricingPartyId:string|null;ownerUserId:string;_sum:{netAmount:number|null;taxAmount:number|null;grossAmount:number|null};_count:{_all:number}};
export const REPORT_DIMENSIONS=['status','customer','pricing','accountGroup','customerType','person'] as const;
export function reportSummary(groups:Group[],accounts:Account[],people:{id:string;name:string}[],dimension:string){
 const byId=new Map(accounts.map(a=>[a.id,a])),names=new Map(people.map(p=>[p.id,p.name]));
 const root=(id:string)=>{const seen=new Set<string>();while(byId.get(id)?.parentPartyId&&byId.has(byId.get(id)!.parentPartyId!)){if(seen.has(id))break;seen.add(id);id=byId.get(id)!.parentPartyId!;}return id;};
 const summary=new Map<string,{label:string;currency:string;count:number;net:number;tax:number;gross:number;drill:SalesFilters}>();
 for(const g of groups){let id=g.commercialStatus,label=id.replaceAll('_',' '),drill:SalesFilters={status:id};
 if(dimension==='customer'){id=g.partyId;label=byId.get(id)?.name??'Customer';drill={customer:id,customerScope:'exact'};}
 if(dimension==='pricing'){id=g.pricingPartyId??g.partyId;label=byId.get(id)?.name??'Pricing account';drill={beneficiary:id};}
 if(dimension==='accountGroup'){id=root(g.partyId);label=byId.get(id)?.name??'Independent account';drill={customer:id,customerScope:'descendants'};}
 if(dimension==='customerType'){id=byId.get(g.partyId)?.customerGroup??'';label=id||'Uncategorised';drill={customerType:id||'__uncategorised__'};}
 if(dimension==='person'){id=g.ownerUserId;label=names.get(id)??'Former member';drill={owner:id};}
 const key=g.currency+'|'+id,row=summary.get(key)??{label,currency:g.currency,count:0,net:0,tax:0,gross:0,drill};row.count+=g._count._all;row.net+=g._sum.netAmount??0;row.tax+=g._sum.taxAmount??0;row.gross+=g._sum.grossAmount??0;summary.set(key,row);
 }
 return [...summary.values()].sort((a,b)=>a.currency.localeCompare(b.currency)||b.gross-a.gross);
}
