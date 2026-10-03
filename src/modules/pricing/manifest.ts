import { Tags } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
export const pricingManifest:ModuleManifest={id:'pricing',name:'Pricing',description:'Business-wide pricelists, quantity breaks and customer assignments.',icon:Tags,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:[],rootPath:'/pricing',accessCapability:'core.pricing.read',navigation:[{label:'Pricelists',href:'/pricing'}],status:'available'};
