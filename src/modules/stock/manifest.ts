import { Boxes } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
export const stockManifest:ModuleManifest={id:'stock',name:'Inventory',description:'Warehouses, stock balances and a traceable movement ledger.',icon:Boxes,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:['stock.read','stock.manage'],rootPath:'/stock',accessCapability:'stock.read',navigation:[{label:'Stock & movements',href:'/stock'},{label:'Products & services',href:'/stock/products',capability:'core.products.read'}],status:'available'};
