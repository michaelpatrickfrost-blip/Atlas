import { reports } from './services/reports';
import { stockBusinessPlanning } from "./services/business-planning";
import {receiveFinanceGoods} from './services/finance-receipt';
import { stockAnalytics } from "./services/analytics";
import { Boxes } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
import { inventorySnapshot } from './services/queries';
import { stockProvider } from './services/provider';
export const stockManifest:ModuleManifest={
 launcherConsolidatedInto:'manufacturing',
 reportProvider: reports,
 businessPlanningProvider: stockBusinessPlanning,financeReceiptConsumer:receiveFinanceGoods,
 analyticsProvider: stockAnalytics,
 id:'stock',name:'Inventory',description:'Product stock, warehouses, controlled transfers and traceable movements.',icon:Boxes,version:'0.2.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:['stock.read','stock.manage'],rootPath:'/stock',accessCapability:'stock.read',status:'available',stockProvider,
 planningInventoryProvider:inventorySnapshot,
 navigation:[{label:'On hand',href:'/stock'},{label:'Forecast',href:'/stock/forecast'},{label:'Movements',href:'/stock/movements'},{label:'Places',href:'/stock/warehouses'}],
};
