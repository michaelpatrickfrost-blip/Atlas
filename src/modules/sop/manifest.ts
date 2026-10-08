import { Network } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
import { SOP_CAPABILITIES as C } from './capabilities';
const nav=(label:string,view:string,group?:string)=>({label,href:view?`/sop?view=${view}`:'/sop',preserveQuery:view==='help'?['cycle']:['cycle','version'],...(group?{group}:{})});
export const sopManifest:ModuleManifest={id:'sop',name:'S&OP',description:'Agree demand, review supply and finances, and release one approved operating plan.',icon:Network,version:'0.2.0',minimumCoreVersion:'0.1.0',dependencies:['plan'],capabilities:Object.values(C),rootPath:'/sop',accessCapability:C.read,status:'available',navigation:[
 nav('Start here',''),nav('Setup','setup'),nav('Demand','demand','Review'),nav('Supply','supply','Review'),nav('Finance','finance','Review'),nav('Scenarios','scenarios','Review'),nav('Reviews & release','reviews','Review'),nav('Decisions & actions','decisions'),nav('Orders & Service','service','Monitor'),nav('Accuracy & History','history','Monitor'),nav('Products','products','Intelligence'),nav('Customers','customers','Intelligence'),nav('Projects','projects','Intelligence'),nav('How to use S&OP','help','Help'),
]};
