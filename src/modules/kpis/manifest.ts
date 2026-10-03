import { Target } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
export const kpisManifest:ModuleManifest={id:'kpis',name:'Goals & KPIs',description:'Flexible team targets, progress and review history.',icon:Target,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:['kpis.read','kpis.manage'],rootPath:'/kpis',accessCapability:'kpis.read',navigation:[{label:'Scorecards',href:'/kpis'}],status:'available'};
