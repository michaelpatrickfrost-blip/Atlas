import {readSalesPolicy} from './sales-policy';
export function requiresApproval(order:{grossAmount:number;currency?:string},lines:{discountPercent:number|null;priceSource?:string|null}[],configuration:unknown={}){
 const policy=readSalesPolicy(configuration),currency=order.currency??'GBP',limit=policy.valueLimits[currency];
 if(limit==null)return `No value authority configured for ${currency}`;
 if(order.grossAmount>limit)return `Order value exceeds ${new Intl.NumberFormat('en-GB',{style:'currency',currency,maximumFractionDigits:0}).format(limit/100)}`;
 const maximum=Math.max(0,...lines.map(l=>l.discountPercent??0));
 if(maximum>policy.discountLimit)return `A line discount of ${maximum}% exceeds the ${policy.discountLimit}% approval threshold`;
 if(lines.some(l=>l.priceSource?.startsWith('Manual price')))return 'A manual price override requires commercial approval';
 return null;
}
