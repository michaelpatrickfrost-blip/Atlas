import { FileSpreadsheet } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
export const reportsManifest:ModuleManifest={id:'reports',name:'Reports',description:'Filter authorised data and download formatted Excel workbooks.',icon:FileSpreadsheet,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:[],rootPath:'/reports',accessCapability:'core.profile.self',launcherVisible:false,utility:true,status:'available',navigation:[]};
