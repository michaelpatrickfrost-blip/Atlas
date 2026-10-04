export type PriceRule = {id:string;productId:string|null;categoryCode:string|null;scope:string;method:string;minimumQuantity:number;unitPriceAmount:number;percentage:number;adjustmentAmount:number;priority:number;active:boolean;validFrom:string|null;validTo:string|null};
export type PriceBasis = {currency:string;baseCurrency:string;exchangeRate:number};
export function selectPriceRule(rules:PriceRule[],product:{id:string;categoryCode:string|null},quantity:number,asOf:Date) {
 const now=asOf.getTime(),rank=(r:PriceRule)=>r.scope==='PRODUCT'?3:r.scope==='CATEGORY'?2:1;
 return rules.filter(r=>r.active&&r.minimumQuantity<=quantity&&(!r.validFrom||new Date(r.validFrom).getTime()<=now)&&(!r.validTo||new Date(r.validTo).getTime()>=now)&&(r.scope==='ALL'||r.scope==='PRODUCT'&&r.productId===product.id||r.scope==='CATEGORY'&&!!product.categoryCode&&r.categoryCode===product.categoryCode)).sort((a,b)=>rank(b)-rank(a)||b.minimumQuantity-a.minimumQuantity||b.priority-a.priority||a.id.localeCompare(b.id))[0];
}
export const SALES_CURRENCIES = ["GBP", "EUR", "USD", "CAD", "AUD"] as const;

function convertedCatalogue(basis:PriceBasis,product:{basePriceAmount:number;baseCurrency:string}) {
 if(product.baseCurrency!==basis.currency&&product.baseCurrency!==basis.baseCurrency)throw new Error(`No exchange rate from ${product.baseCurrency} to ${basis.currency}.`);
 if(!Number.isFinite(basis.exchangeRate)||basis.exchangeRate<=0)throw new Error('This price rule produces an invalid price.');
 const amount=Math.round(product.basePriceAmount*(product.baseCurrency===basis.currency?1:basis.exchangeRate));
 if(!Number.isSafeInteger(amount)||amount<0||amount>2147483647)throw new Error('This price rule produces an invalid price.');
 return amount;
}
/** A set price keeps its amount. A category discount keeps the catalogue price and takes that percent off it on a quote or order. */
export function commercialPrice(rule:PriceRule,basis:PriceBasis,product:{basePriceAmount:number;baseCurrency:string}):{unitPriceAmount:number;discountPercent:number} {
 if(rule.method==='FIXED'){
  if(!Number.isFinite(rule.percentage)||rule.percentage<0||rule.percentage>100)throw new Error('Enter a discount from 0 to 100.');
  const net=Math.round(rule.unitPriceAmount*(1-rule.percentage/100));
  if(!Number.isSafeInteger(rule.unitPriceAmount)||rule.unitPriceAmount<0||!Number.isSafeInteger(net)||net<0||net>2147483647)throw new Error('This price rule produces an invalid price.');
  return {unitPriceAmount:rule.unitPriceAmount,discountPercent:rule.percentage};
 }
 if(rule.method==='PERCENT'&&rule.percentage>=0&&rule.percentage<=100)return {unitPriceAmount:convertedCatalogue(basis,product),discountPercent:rule.percentage};
 return {unitPriceAmount:calculateRulePrice(rule,basis,product),discountPercent:0};
}
export function calculateRulePrice(rule:PriceRule,basis:PriceBasis,product:{basePriceAmount:number;baseCurrency:string}):number {
 if(rule.method==='FIXED'){const offer=commercialPrice(rule,basis,product);return Math.round(offer.unitPriceAmount*(1-offer.discountPercent/100));}
 if(product.baseCurrency!==basis.currency&&product.baseCurrency!==basis.baseCurrency)throw new Error(`No exchange rate from ${product.baseCurrency} to ${basis.currency}.`);
 const base=product.basePriceAmount*(product.baseCurrency===basis.currency?1:basis.exchangeRate);
 const amount=Math.round(rule.method==='PERCENT'?base*(1-rule.percentage/100):base+rule.adjustmentAmount);
 if(!Number.isFinite(basis.exchangeRate)||basis.exchangeRate<=0||!Number.isSafeInteger(amount)||amount<0||amount>2147483647)throw new Error('This price rule produces an invalid price.');
 return amount;
}
export function ruleExplanation(rule:PriceRule,currency:string) {
 return rule.method==='PERCENT'?`${rule.percentage}% discount`:rule.method==='AMOUNT'?`${rule.adjustmentAmount>=0?'+':''}${(rule.adjustmentAmount/100).toFixed(2)} ${currency} adjustment`:rule.percentage?`Set price · ${rule.percentage}% discount`:`Fixed price · ${currency}`;
}
