import { db } from '@/core/db/client';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const productBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 const capability=['core.products.read','sales.order.read','stock.read'].find(c=>session.capabilities.has(c));
 if(!capability)return {requiredCapabilities:[]};
 const rows=await db.product.findMany({where:{organisationId:session.organisationId,active:true,kind:'PRODUCT',...(request.productIds?{id:{in:request.productIds}}:{}),...(request.productCodes?.length?{code:{in:request.productCodes}}:{}),...(request.search?{OR:[{name:{contains:request.search,mode:'insensitive'}},{code:{contains:request.search,mode:'insensitive'}}]}:{})},select:{id:true,code:true,name:true,unitOfMeasure:true,basePriceAmount:true,baseCurrency:true,safetyStockLevel:true,netWeightGrams:true},orderBy:{code:'asc'},take:5001});
 if(rows.length>5000&&request.purpose==='forecast')throw Error('Select a smaller product scope; the current planning read exceeds 5,000 products.');
 return {products:rows.slice(0,5000).map(p=>({id:p.id,code:p.code,name:p.name,unit:p.unitOfMeasure,priceMinor:p.basePriceAmount,currency:p.baseCurrency,safetyStock:p.safetyStockLevel,weightGrams:p.netWeightGrams})),requiredCapabilities:[capability],warnings:rows.length>5000?['Search to narrow the product list.']:[]};
};
