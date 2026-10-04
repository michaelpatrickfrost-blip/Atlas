import {decimalUnits,roundRatio} from './money';
export const DOCUMENT_KINDS=['REQUEST','PO','RECEIPT','AP_INVOICE','AR_INVOICE','AP_CREDIT','AR_CREDIT','AP_DEBIT','AR_DEBIT','EXPENSE'] as const;
export const TAX_CODES=['STANDARD','REDUCED','ZERO','EXEMPT','OUTSIDE_SCOPE'] as const;
export function matchLine(input:{ordered:string;accepted:string;alreadyInvoiced:string;invoiceQuantity:string;expectedPrice:bigint;invoicePrice:bigint;toleranceBps:number}){
 const ordered=decimalUnits(input.ordered,6),accepted=decimalUnits(input.accepted,6),already=decimalUnits(input.alreadyInvoiced,6),quantity=decimalUnits(input.invoiceQuantity,6);
 if([ordered,accepted,already,quantity,input.expectedPrice,input.invoicePrice].some(x=>x<0n)||!Number.isInteger(input.toleranceBps)||input.toleranceBps<0)throw new Error('Invalid matching inputs.');
 const difference=input.invoicePrice-input.expectedPrice,abs=difference<0n?-difference:difference;
 const varianceBps=input.expectedPrice===0n?(abs===0n?0n:null):roundRatio(abs*10000n,input.expectedPrice);
 const issues:string[]=[];if(quantity+already>accepted)issues.push('Invoiced quantity exceeds accepted receipts.');if(quantity+already>ordered)issues.push('Invoiced quantity exceeds the purchase order.');if(input.expectedPrice===0n?abs>0n:abs*10000n>input.expectedPrice*BigInt(input.toleranceBps))issues.push('Price variance exceeds tolerance.');
 return {matched:issues.length===0,issues,variance:roundRatio(quantity*difference,1000000n),varianceBps};
}
export function budgetPosition(budget:bigint,actual:bigint,committed:bigint,request=0n){const available=budget-actual-committed;return {budget,actual,committed,available,afterRequest:available-request,overage:request>available?request-available:0n};}
export function ageBucket(due:Date|null,asOf:Date){if(!due||due>=asOf)return 'Current';const days=Math.ceil((asOf.getTime()-due.getTime())/86400000);return days<=30?'1–30':days<=60?'31–60':days<=90?'61–90':'90+';}
export function checkActorSeparation(requester:string,actor:string){if(requester===actor)throw new Error('Independent approval is required: the requester cannot approve their own action.');}
export function periodAllows(state:string,source:string){return state==='OPEN'||(state==='SOFT_CLOSED'&&source==='AP_INVOICE');}
export function normaliseInvoiceNumber(value:string){return value.toUpperCase().replace(/[^A-Z0-9]/g,'');}
export function suggestMatches(amount:bigint,documents:readonly {id:string;outstanding:bigint;reference:string}[]){const eligible=documents.filter(d=>d.outstanding>0n);const candidates:Array<{ids:string[];confidence:number;reason:string}>=[];for(let i=0;i<eligible.length;i++){const a=eligible[i];if(a.outstanding===amount)candidates.push({ids:[a.id],confidence:80,reason:'Exact amount; confirm customer and reference.'});for(let j=i+1;j<eligible.length;j++)if(a.outstanding+eligible[j].outstanding===amount)candidates.push({ids:[a.id,eligible[j].id],confidence:70,reason:'Combined amount; confirm customer and references.'});}return candidates.slice(0,20);}
