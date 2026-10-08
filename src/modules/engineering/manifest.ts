import {DraftingCompass} from 'lucide-react';
import type {ModuleManifest} from '@/core/modules/types';
import {ENGINEERING_CAPABILITIES as C} from '@/core/permissions/capabilities';
export const engineeringManifest:ModuleManifest={id:'engineering',name:'Engineering / PLM',description:'Product designs, controlled revisions and independent engineering approval.',icon:DraftingCompass,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:Object.values(C),rootPath:'/engineering',accessCapability:C.read,status:'available',navigation:[{label:'Revisions',href:'/engineering',capability:C.read}]};
