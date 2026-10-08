import {Car} from 'lucide-react';
import type {ModuleManifest} from '@/core/modules/types';
import {FLEET_CAPABILITIES as C} from '@/core/permissions/capabilities';
export const fleetManifest:ModuleManifest={id:'fleet',name:'Fleet',description:'Vehicles, inspections, servicing, fuel and driver records.',icon:Car,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:Object.values(C),rootPath:'/fleet',accessCapability:C.read,status:'available',navigation:[{label:'Vehicles',href:'/fleet',capability:C.read}]};
