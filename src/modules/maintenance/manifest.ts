import {Wrench} from 'lucide-react';
import type {ModuleManifest} from '@/core/modules/types';
import {MAINTENANCE_CAPABILITIES as C} from '@/core/permissions/capabilities';
export const maintenanceManifest:ModuleManifest={id:'maintenance',name:'Maintenance',description:'Equipment, breakdowns, planned servicing, spare parts and downtime.',icon:Wrench,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:Object.values(C),rootPath:'/maintenance',accessCapability:C.read,status:'available',navigation:[{label:'Work orders',href:'/maintenance',capability:C.read},{label:'Equipment',href:'/maintenance?view=equipment',capability:C.read}]};
