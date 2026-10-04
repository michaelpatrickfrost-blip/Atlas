import { z } from 'zod';
export const CAMPAIGN_TYPES = ['PRODUCT_LAUNCH','LEAD_GENERATION','CUSTOMER_ACQUISITION','CUSTOMER_RETENTION','UPSELL','CROSS_SELL','REACTIVATION','EVENT','WEBINAR','BRAND','CONTENT','SOCIAL','PAID_MEDIA','ACCOUNT_BASED','CUSTOM'] as const;
export const CHANNELS = ['EMAIL','SMS','PUSH','SOCIAL','ADVERTISING'] as const;
export const PERMISSION_STATES = ['UNKNOWN','OPTED_IN','SUBSCRIBED','UNSUBSCRIBED','OBJECTED','SUPPRESSED','BOUNCED','INVALID'] as const;
export const EVENT_TYPES = ['PAGE_VIEWED','FORM_SUBMITTED','EMAIL_SENT','EMAIL_DELIVERED','EMAIL_OPENED','EMAIL_CLICKED','EMAIL_BOUNCED','EMAIL_UNSUBSCRIBED','SMS_CLICKED','AD_CLICKED','CONTENT_DOWNLOADED','WEBINAR_REGISTERED','WEBINAR_ATTENDED','QUOTE_REQUESTED','PURCHASE_COMPLETED','CASE_OPENED'] as const;
export const SCORES: Record<string,number> = {PAGE_VIEWED:1,EMAIL_CLICKED:4,CONTENT_DOWNLOADED:10,WEBINAR_ATTENDED:15,QUOTE_REQUESTED:25,EMAIL_UNSUBSCRIBED:-30};
export const CAMPAIGN_TRANSITIONS: Record<string,readonly string[]> = {
 IDEA:['PLANNING','CANCELLED'],PLANNING:['CONTENT','APPROVAL','CANCELLED'],CONTENT:['APPROVAL','PLANNING','CANCELLED'],APPROVAL:['PLANNING','SCHEDULED','CANCELLED'],SCHEDULED:['LIVE','PAUSED','CANCELLED'],LIVE:['PAUSED','COMPLETED'],PAUSED:['SCHEDULED','COMPLETED','CANCELLED'],COMPLETED:['ARCHIVED'],CANCELLED:['ARCHIVED'],ARCHIVED:[]
};
const leaf = z.object({field:z.enum(['country','lifecycle','score','source','brand','event']),operator:z.enum(['eq','neq','gte','lte','contains','exists','absent']),value:z.union([z.string().max(200),z.number().finite()]),days:z.number().int().min(1).max(3650).optional()}).strict();
export type Rule = z.infer<typeof leaf> | {all:Rule[]} | {any:Rule[]} | {not:Rule};
const rule: z.ZodType<Rule> = z.lazy(()=>z.union([leaf,z.object({all:z.array(rule).min(1).max(20)}).strict(),z.object({any:z.array(rule).min(1).max(20)}).strict(),z.object({not:rule}).strict()]));
export function parseRule(value:unknown):Rule {let count=0;function depth(v:unknown,d=0){if(d>6||++count>100)throw new Error('Audience rule is too complex.');if(v&&typeof v==='object')for(const c of Object.values(v)){if(Array.isArray(c))c.forEach(x=>depth(x,d+1));else if(c&&typeof c==='object')depth(c,d+1);}}depth(value);return rule.parse(value);}
export type RuleProfile = {country:string;lifecycle:string;score:number;source:string;brand:string;events:{type:string;occurredAt:Date}[]};
export function evaluateRule(r:Rule,p:RuleProfile,now=new Date()):{matched:boolean;reasons:string[]} {
 if('all' in r){const children=r.all.map(x=>evaluateRule(x,p,now));return {matched:children.every(x=>x.matched),reasons:children.flatMap(x=>x.reasons)};}
 if('any' in r){const children=r.any.map(x=>evaluateRule(x,p,now));return {matched:children.some(x=>x.matched),reasons:children.flatMap(x=>x.reasons)};}
 if('not' in r){const child=evaluateRule(r.not,p,now);return {matched:!child.matched,reasons:[`NOT (${child.reasons.join('; ')})`]};}
 const actual=r.field==='event'?p.events.filter(e=>e.type===r.value&&(!r.days||e.occurredAt.getTime()>=now.getTime()-r.days*86400000)).length:p[r.field];
 const matched=r.operator==='exists'?Number(actual)>0:r.operator==='absent'?Number(actual)===0:r.operator==='eq'?String(actual)===String(r.value):r.operator==='neq'?String(actual)!==String(r.value):r.operator==='gte'?Number(actual)>=Number(r.value):r.operator==='lte'?Number(actual)<=Number(r.value):String(actual).toLowerCase().includes(String(r.value).toLowerCase());
 return {matched,reasons:[`${r.field} ${r.operator} ${r.value}: ${matched?'matched':'not matched'}`]};
}
export type EligibilityInput = {channel:string;purpose:string;brand:string;country:string;legalEntity:string;classification:string;email:string|null;mobile:string|null;active:boolean;suppressions:{channel:string;reason:string}[];permissions:{channel:string;purpose:string;brand:string;country:string;legalEntity:string;state:string;occurredAt:Date;createdAt?:Date}[];sentIn7Days:number;severeComplaint:boolean};
export function eligibility(p:EligibilityInput) {
 const reasons:string[]=[];
 if(!p.active)reasons.push('Contact is inactive');
 if(p.channel==='EMAIL'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email??''))reasons.push('No valid email');
 if(p.channel==='SMS'&&!/^\+?[0-9 ()-]{7,20}$/.test(p.mobile??''))reasons.push('No valid mobile');
 for(const s of p.suppressions)if(s.channel==='ALL'||s.channel===p.channel)reasons.push(`Suppressed: ${s.reason}`);
 if(p.classification==='PROMOTIONAL'){
  const states=p.permissions.filter(c=>c.channel===p.channel&&c.purpose===p.purpose&&c.brand===p.brand&&c.country===p.country&&c.legalEntity===p.legalEntity).sort((a,b)=>b.occurredAt.getTime()-a.occurredAt.getTime()||(b.createdAt?.getTime()??0)-(a.createdAt?.getTime()??0));
  if(!states[0]||!['OPTED_IN','SUBSCRIBED'].includes(states[0].state))reasons.push('Promotion subscription unavailable');
  if(p.sentIn7Days>=3)reasons.push('Frequency cap: 3 messages in 7 days');
  if(p.severeComplaint)reasons.push('Customer exclusion policy');
 }
 return {eligible:reasons.length===0,reasons};
}
export function campaignTransition(from:string,to:string){if(!CAMPAIGN_TRANSITIONS[from]?.includes(to))throw new Error(`Cannot move ${from} to ${to}.`);}
export function allocateExperiment(ids:string[],control:number,variant:number,holdout:number){if([control,variant,holdout].some(n=>!Number.isInteger(n)||n<0)||control+variant+holdout!==100)throw new Error('Allocations must total 100%.');const sorted=[...new Set(ids)].sort();const a=Math.floor(sorted.length*control/100),b=Math.floor(sorted.length*variant/100);return sorted.map((profileId,i)=>({profileId,group:i<a?'CONTROL':i<a+b?'VARIANT':'HOLDOUT'}));}
export function attributionWeights(touches:{campaignId:string;occurredAt:Date}[],model:'FIRST'|'LAST'|'LINEAR',at:Date,windowDays=90){const eligible=touches.filter(t=>t.occurredAt<=at&&t.occurredAt.getTime()>=at.getTime()-windowDays*86400000).sort((a,b)=>a.occurredAt.getTime()-b.occurredAt.getTime());if(!eligible.length)return [];const chosen=model==='FIRST'?[eligible[0]]:model==='LAST'?[eligible[eligible.length-1]]:eligible;return chosen.map(t=>({campaignId:t.campaignId,weight:1/chosen.length}));}
export const journeyNodes=z.array(z.discriminatedUnion('kind',[
 z.object({kind:z.literal('WAIT'),hours:z.number().int().min(1).max(8760)}).strict(),
 z.object({kind:z.literal('GOAL'),event:z.enum(EVENT_TYPES)}).strict(),
 z.object({kind:z.literal('BRANCH'),event:z.enum(EVENT_TYPES),yes:z.number().int().min(0),no:z.number().int().min(0)}).strict(),
 z.object({kind:z.literal('END')}).strict(),
])).min(1).max(50);
export function validateJourney(value:unknown){const nodes=journeyNodes.parse(value);nodes.forEach((n,i)=>{if(n.kind==='BRANCH'&&(n.yes<=i||n.no<=i||n.yes>=nodes.length||n.no>=nodes.length))throw new Error('Branches must point to later existing steps.');});if(nodes[nodes.length-1].kind!=='END')throw new Error('Journey must finish with END.');return nodes;}
