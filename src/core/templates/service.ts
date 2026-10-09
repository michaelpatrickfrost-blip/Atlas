import { db } from '@/core/db/client';
import type { Session } from '@/core/auth/session';
import { can, assertCapability } from '@/core/permissions/check';
import { getModule } from '@/core/modules/registry';
import { isModuleEnabled, enabledModulesForSession } from '@/core/modules/runtime';
import { merge, parseBlocks } from './domain';
import { loadBrand } from '@/core/email/render';
import { TARGET_MODULES, type TemplateRecord } from './types';
import { templateRegistry } from '@/core/studio/registry/runtime';
import { templateRecordSchema } from '@/core/studio/registry/adapters';
export async function requireTemplateWorkspace(session:Session){if(!(await isModuleEnabled(session,'templates')))throw new Error('Templates is not enabled for this company.');}
export async function templateSources(session:Session){
 const enabled=await enabledModulesForSession(session);
 return TARGET_MODULES.flatMap(id=>{const m=getModule(id);return enabled.has(id)&&m?.templateContextProvider?m.templateContextProvider.types.filter(t=>can(session,t.capability)).map(t=>({module:id,type:t.id,label:`${m.name} · ${t.label}`})):[];});
}
export async function templateRecord(session:Session,module:string,type:string,id:string):Promise<TemplateRecord>{
 const sources=await templateSources(session);if(!sources.some(s=>s.module===module&&s.type===type))throw new Error('You cannot use that source app.');
 const registry=templateRegistry();
 const record=templateRecordSchema.nullable().parse(await registry.invoke(session,registry.describe(`${module}.template.${type}.get`,1),{id}));
 if(!record)throw new Error('This source record is unavailable or outside your access.');return record;
}
export async function templateRecords(session:Session,module:string,type:string){
 const sources=await templateSources(session);if(!sources.some(s=>s.module===module&&s.type===type))return [];
 const registry=templateRegistry();
 return templateRecordSchema.array().parse(await registry.invoke(session,registry.describe(`${module}.template.${type}.list`,1),{}));
}
export async function renderTemplate(session:Session,id:string,input:{sourceModule?:string;sourceType?:string;sourceId?:string;partyId?:string;values?:Record<string,string>}){
 assertCapability(session,'core.contract.manage');await requireTemplateWorkspace(session);
 const template=await db.documentTemplate.findFirst({where:{id,organisationId:session.organisationId,status:'PUBLISHED'}});
 if(!template)throw new Error('Choose a published template.');
 const source=input.sourceModule&&input.sourceType&&input.sourceId?await templateRecord(session,input.sourceModule,input.sourceType,input.sourceId):null;
 if(input.sourceModule&&!source)throw new Error('Choose a source record.');
 if(source&&!template.targetModules.includes(input.sourceModule!))throw new Error('This template is not published for that app.');
 const partyId=source?.partyId??input.partyId;
 const party=partyId?await db.party.findFirst({where:{id:partyId,organisationId:session.organisationId,identityScrubbed:false},select:{id:true,name:true,customerCode:true,addresses:{take:1,orderBy:{isDefaultBilling:'desc'}}}}):null;
 if(partyId&&!party)throw new Error('Choose an active customer.');
 const contact=source?.contactId?await db.contact.findFirst({where:{id:source.contactId,partyId:party?.id,party:{organisationId:session.organisationId},identityScrubbed:false},select:{id:true,firstName:true,surname:true,email:true}}):null;
 const brand=await loadBrand(session.organisationId),address=party?.addresses[0];
 const fields:Record<string,string>={'company.name':brand.name,'customer.name':party?.name??'','customer.code':party?.customerCode??'','customer.address':address?[address.line1,address.line2,address.city,address.postcode,address.country].filter(Boolean).join(', '):'','contact.name':contact?`${contact.firstName} ${contact.surname}`:'','contact.email':contact?.email??'','date.today':new Date().toLocaleDateString('en-GB',{timeZone:'Europe/London'}),...source?.fields};
 // Only user-defined fields can override source facts.
 for(const [key,value] of Object.entries(input.values??{}))if(/^custom\.[a-z][a-z0-9_]{0,49}$/.test(key)){if(value.length>4000)throw new Error('A custom field is too long.');fields[key]=value.trim();}
 const blocks=parseBlocks(template.blocks).map(b=>({...b,text:merge(b.text,fields)})),title=merge(template.titleTemplate,fields);
 return {template,blocks,title,partyId:party?.id??null,contactId:contact?.id??null,source,brand};
}
