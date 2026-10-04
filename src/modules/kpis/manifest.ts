import { kpisAnalytics } from "./services/analytics";
import { Target } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
export const kpisManifest:ModuleManifest={
 analyticsProvider: kpisAnalytics,id:'kpis',name:'Goals & KPIs',description:'Department targets, personal goals and performance plans.',icon:Target,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:['kpis.read','kpis.manage'],rootPath:'/kpis',accessCapability:'core.profile.self',navigation:[{label:'Scorecards',href:'/kpis',capability:'kpis.read'},{label:'People',href:'/kpis?view=people'}],status:'available'};
