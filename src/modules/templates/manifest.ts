import { PanelsTopLeft } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
export const templatesManifest:ModuleManifest={id:'templates',name:'Templates',description:'Build reusable business documents and connect them to your apps.',icon:PanelsTopLeft,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:[],rootPath:'/templates',accessCapability:'core.contract.manage',status:'available',navigation:[{label:'Library',href:'/templates'},{label:'New template',href:'/templates/new'}]};
