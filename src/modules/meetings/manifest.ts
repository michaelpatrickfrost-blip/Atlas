import {CalendarDays} from 'lucide-react';
import type {ModuleManifest} from '@/core/modules/types';
import {MEETINGS_CAPABILITIES as C} from '@/core/permissions/capabilities';
export const meetingsManifest:ModuleManifest={id:'meetings',name:'Meetings',description:'Shared calendars, agendas, meeting notes, decisions and owned actions.',icon:CalendarDays,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:Object.values(C),rootPath:'/meetings',accessCapability:C.read,status:'available',navigation:[{label:'Calendar',href:'/meetings',capability:C.read},{label:'Actions',href:'/meetings?view=actions',capability:C.read},{label:'Connections',href:'/meetings?view=connections',capability:C.read}]};
