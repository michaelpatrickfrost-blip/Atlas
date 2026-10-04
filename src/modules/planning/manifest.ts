import { planningAnalytics } from "./services/analytics";
import { CalendarRange } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
export const planningManifest:ModuleManifest={
 analyticsProvider: planningAnalytics,
 id:'planning',name:'Production Planning',description:'See confirmed product demand, physical stock coverage and shortages in one connected workbench.',
 icon:CalendarRange,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:['stock','sales'],capabilities:['planning.demand.read','planning.plan.manage','planning.team.manage'],
 rootPath:'/planning',accessCapability:'planning.demand.read',status:'available',
 navigation:[{label:'Planner workbench',href:'/planning'},{label:'Product plans',href:'/planning/plans'},{label:'Teams & work',href:'/planning/teams'}],
};
