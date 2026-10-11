import type {BusinessPlanningProvider} from "@/core/planning/business";
import {physicalStockState} from "./physical-state";
export const stockBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose==="picker"||!session.capabilities.has("stock.read"))return{requiredCapabilities:[]};
 const physical=await physicalStockState(session.organisationId);
 return{stock:[...physical].filter(([id])=>!request.productIds||request.productIds.includes(id)).map(([productId,row])=>({productId,quantity:row.pickable})),requiredCapabilities:["stock.read"]};
};
