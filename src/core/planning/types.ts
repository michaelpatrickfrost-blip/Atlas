import type { Session } from '@/core/auth/session';
export type PlanningDemand = { id: string; productId: string; orderId: string; reference: string; quantity: number; unitOfMeasure: string; requiredDate: string | null };
export type InventorySnapshot = {
 products: Array<{id:string;code:string;name:string;unitOfMeasure:string;active:boolean;categoryCode?:string|null;itemClass?:string|null}>;
 warehouses: Array<{id:string;code:string;name:string;kind?:string;siteId?:string|null;siteName?:string|null}>;
 sites?: Array<{id:string;code:string;name:string}>;
 balances: Array<{id:string;productId:string;warehouseId:string;quantity:number}>;
};
export type PlanningDemandProvider = (session:Session)=>Promise<PlanningDemand[]>;
export type PlanningInventoryProvider = (session:Session)=>Promise<InventorySnapshot>;
