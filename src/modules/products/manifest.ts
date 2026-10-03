import { Package } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
export const productsManifest:ModuleManifest={id:'products',launcherVisible:false,name:'Products',description:'The shared business catalogue: products, services and codes.',icon:Package,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:[],rootPath:'/stock/products',accessCapability:'core.products.read',navigation:[{label:'Catalogue',href:'/products'}],status:'available'};
