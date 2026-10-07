import { getServiceOrderProjection } from "./services/order-projection";
import { serviceTemplateContext } from "./services/template-context";
import { LifeBuoy } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
import { SERVICE_CAPABILITIES } from '@/core/permissions/capabilities';
import { serviceSearch, serviceAttention, serviceCustomer, serviceAnalytics } from './services/providers';
export const serviceManifest:ModuleManifest={serviceOrderProjectionProvider:getServiceOrderProjection,
 templateContextProvider: serviceTemplateContext,id:'service',name:'Customer Service',description:'Customer cases, complaints and connected departmental investigations.',icon:LifeBuoy,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:Object.values(SERVICE_CAPABILITIES),rootPath:'/service',accessCapability:SERVICE_CAPABILITIES.ticketRead,status:'available',searchProvider:serviceSearch,attentionProvider:serviceAttention,customerOverviewProvider:serviceCustomer,analyticsProvider:serviceAnalytics,navigation:[
 {label:'Service Home',href:'/service',capability:SERVICE_CAPABILITIES.caseRead},
 {label:'My cases',href:'/service/cases?mine=1',capability:SERVICE_CAPABILITIES.caseRead},
 {label:'Cases',href:'/service/cases',capability:SERVICE_CAPABILITIES.caseRead},
 {label:'Queries',href:'/service/queries',capability:SERVICE_CAPABILITIES.ticketRead},
 {label:'Complaints',href:'/service/cases?type=COMPLAINT',capability:SERVICE_CAPABILITIES.caseRead},
 {label:'Historical department work',href:'/service/tickets',capability:SERVICE_CAPABILITIES.ticketRead},
 {label:'Reports',href:'/service/reports',capability:SERVICE_CAPABILITIES.caseRead,group:'Insights'},
 {label:'Knowledge',href:'/service/knowledge',capability:SERVICE_CAPABILITIES.caseRead,group:'Insights'},
 {label:'CSAT',href:'/service/csat',capability:SERVICE_CAPABILITIES.caseRead,group:'Insights'},
 {label:'Queues',href:'/service/queues',capability:SERVICE_CAPABILITIES.queueManage},
]};
