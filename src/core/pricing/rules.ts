export type PriceRule = {id:string;productId:string|null;categoryCode:string|null;scope:string;method:string;minimumQuantity:number;unitPriceAmount:number;percentage:number;adjustmentAmount:number;priority:number;active:boolean;validFrom:string|null;validTo:string|null};
export type PriceBasis = {currency:string;baseCurrency:string;exchangeRate:number};
export function selectPriceRule(rules:PriceRule[],product:{id:string;categoryCode:string|null},quantity:number,asOf:Date) {
 const now=asOf.getTime(),rank=(r:PriceRule)=>r.scope==='PRODUCT'?3:r.scope==='CATEGORY'?2:1;
 return rules.filter(r=>r.active&&r.minimumQuantity<=quantity&&(!r.validFrom||new Date(r.validFrom).getTime()<=now)&&(!r.validTo||new Date(r.validTo).getTime()>=now)&&(r.scope==='ALL'||r.scope==='PRODUCT'&&r.productId===product.id||r.scope==='CATEGORY'&&!!product.categoryCode&&r.categoryCode===product.categoryCode)).sort((a,b)=>rank(b)-rank(a)||b.minimumQuantity-a.minimumQuantity||b.priority-a.priority||a.id.localeCompare(b.id))[0];
}
export function calculateRulePrice(rule:PriceRule,basis:PriceBasis,product:{basePriceAmount:number;baseCurrency:string}):number {
 if(rule.method==='FIXED')return rule.unitPriceAmount;
 if(product.baseCurrency!==basis.currency&&product.baseCurrency!==basis.baseCurrency)throw new Error(`No exchange rate from ${product.baseCurrency} to ${basis.currency}.`);
 const base=product.basePriceAmount*(product.baseCurrency===basis.currency?1:basis.exchangeRate);
 const amount=Math.round(rule.method==='PERCENT'?base*(1-rule.percentage/100):base+rule.adjustmentAmount);
 if(!Number.isFinite(basis.exchangeRate)||basis.exchangeRate<=0||!Number.isSafeInteger(amount)||amount<0||amount>2147483647)throw new Error('This price rule produces an invalid price.');
 return amount;
}
export function ruleExplanation(rule:PriceRule,currency:string) {
 return rule.method==='PERCENT'?`${rule.percentage}% discount`:rule.method==='AMOUNT'?`${rule.adjustmentAmount>=0?'+':''}${(rule.adjustmentAmount/100).toFixed(2)} ${currency} adjustment`:`Fixed price · ${currency}`;
}
