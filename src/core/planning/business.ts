import type { Session } from '@/core/auth/session';
export type PlanningSource = {
 module: string; type: string; id: string; label: string; href: string;
 capability: string; active?:boolean; probability?: number; currency?: string; valueMinor?: number;
 startsOn?: string; endsOn?: string;
};
export type PlanningProduct = { id:string; code:string; name:string; unit:string; priceMinor:number; currency:string; safetyStock:number; weightGrams:number|null };
export type PlanningOrder = {
 id:string; lineId:string; reference:string; partyId:string; customer:string; productId:string;
 projectId:string|null; opportunityId:string|null; quantity:number; valueMinor:number; currency:string;
 closed?:boolean; onHold?:boolean; dispatchedQuantity?:number; bookedOn:string; requestedOn:string|null; promisedOn:string|null;
};
export type PlanningDelivery = { id:string; orderId:string; lineId:string; productId:string|null; quantity:number; deliveryQuantityVerified?:boolean; dispatchedOn:string|null; deliveredOn:string|null; plannedDispatchOn:string|null; eta:string|null; status:string; href:string };
export type PlanningSupply = { productId:string; quantity:number; on:string; type:'production'|'plan'|'receipt'; href:string };
export type PlanningInput = { id:string; planId:string; label:string; sourceModule:string; sourceType:string; sourceId:string; productId:string|null; metricKey:string; periodKey:string; value:number; probability:number; sourceInactive?:boolean; sourceProbability?:number; unitPriceMinor:number|null; note:string };
export type BusinessPlanningData = {
 sources?:PlanningSource[]; products?:PlanningProduct[]; orders?:PlanningOrder[]; deliveries?:PlanningDelivery[];
 stock?:Array<{productId:string;quantity:number}>; supply?:PlanningSupply[]; inputs?:PlanningInput[];
 budgets?:Array<{id:string;name:string;amountMinor:number;currency:string;startsOn:string;endsOn:string}>;
 planRevisions?:Array<{id:string;revision:number}>;
 targets?:Array<{planId:string;planName:string;periodKey:string;metricKey:string;value:number;currency:string;versionId:string}>;
 requiredCapabilities:string[]; warnings?:string[];
};
export type BusinessPlanningRequest = { startsOn:string; endsOn:string; historyStartsOn:string; search?:string; sourceIds?:string[]; productIds?:string[]; productCodes?:string[]; modules?:string[]; planIds?:string[]; purpose:'picker'|'forecast' };
export type BusinessPlanningProvider = (session:Session,request:BusinessPlanningRequest)=>Promise<BusinessPlanningData>;
