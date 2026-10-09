import { reports } from './services/reports';
import { productRecordRelationships } from "./services/relationships";
import { productBusinessPlanning } from "./services/business-planning";
import { productsAnalytics } from "./services/analytics";
import { Package } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
export const productsManifest:ModuleManifest={
 reportProvider: reports,
 recordRelationshipProvider: productRecordRelationships,
 businessPlanningProvider: productBusinessPlanning,
 analyticsProvider: productsAnalytics,id:'products',launcherVisible:false,name:'Products',description:'The shared business catalogue: products, services and codes.',icon:Package,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:[],rootPath:'/products',accessCapability:'core.products.read',navigation:[{label:'Catalogue',href:'/products'}],status:'available'};
