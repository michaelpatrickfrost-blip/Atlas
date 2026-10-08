import {fieldServiceCustomer} from './services/queries';
import {MapPinned} from 'lucide-react';
import type {ModuleManifest} from '@/core/modules/types';
import {FIELDSERVICE_CAPABILITIES as C} from '@/core/permissions/capabilities';
export const fieldserviceManifest:ModuleManifest={id:'fieldservice',name:'Field Service',description:'Engineer visits, installations, repairs and mobile job sheets.',icon:MapPinned,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],customerOverviewProvider:fieldServiceCustomer,capabilities:Object.values(C),rootPath:'/fieldservice',accessCapability:C.read,status:'available',navigation:[{label:'Schedule',href:'/fieldservice',capability:C.read},{label:'My visits',href:'/fieldservice?mine=1',capability:C.read}]};
