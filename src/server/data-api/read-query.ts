import {db} from '@/core/db/client';
import type {Session} from '@/core/auth/session';
import {MODEL_FIELDS} from './model-metadata';
import {canReadModel,modelScope,PARENT_SCOPE,deniedScalar,resolveModel,type ModelName} from './read-policy';
type Args=Record<string,unknown>;
type Field={type:string;list:boolean;relation:boolean;nullable:boolean};
function fields(model:ModelName){return MODEL_FIELDS[model] as Record<string,Field>;}
const methods=new Set(['findMany','findFirst','findFirstOrThrow','findUnique','findUniqueOrThrow','count','groupBy','aggregate']);
const argumentKeys=new Set(['where','select','include','orderBy','take','skip','distinct','by','_sum','_count','_avg','_min','_max','having']);
function cleanCondition(session:Session,model:ModelName,value:unknown,depth=0):unknown{
 if(depth>10)throw new Error('Filter nesting limit exceeded.');if(Array.isArray(value))return value.map(v=>cleanCondition(session,model,v,depth+1));if(!value||typeof value!=='object')return value;
 const result:Args={};for(const [key,condition]of Object.entries(value)){if(['AND','OR','NOT'].includes(key)){result[key]=cleanCondition(session,model,condition,depth+1);continue;}const field=fields(model)[key];if(!field){if(key.includes('_')&&condition&&typeof condition==='object'){for(const [part,v]of Object.entries(condition))if(fields(model)[part])result[part]=v;else throw new Error('Invalid unique lookup.');continue;}throw new Error('Invalid filter field.');}
 if(deniedScalar(session,model,key))throw new Error('FORBIDDEN: protected field cannot be filtered or aggregated.');
 if(field.relation){const related=field.type as ModelName;if(!canReadModel(session,related))throw new Error('FORBIDDEN: related data is restricted.');if(condition===null){result[key]=null;continue;}const conditions=condition as Args;
 if(field.list){result[key]=Object.fromEntries(Object.entries(conditions).map(([op,filter])=>{if(!['some','every','none'].includes(op))throw new Error('Invalid related filter.');return [op,{AND:[modelScope(session,related),cleanCondition(session,related,filter,depth+1)]}];}));}
 else if('is' in conditions||'isNot' in conditions)result[key]=Object.fromEntries(Object.entries(conditions).map(([op,filter])=>[op,filter===null?null:{AND:[modelScope(session,related),cleanCondition(session,related,filter,depth+1)]}]));else result[key]={AND:[modelScope(session,related),cleanCondition(session,related,condition,depth+1)]};
 }else result[key]=condition;
 }return result;
}
export type ReadPlan={model:ModelName;args:Args;children:Record<string,ReadPlan>;injected:string[];original:Args};
export function planRead(session:Session,model:ModelName,input:Args,depth=0,nested=false,records=true):ReadPlan{
 if(!canReadModel(session,model))throw new Error('FORBIDDEN: missing data capability.');if(depth>6)throw new Error('Relation nesting limit exceeded.');
 const args:Args={...input},children:Record<string,ReadPlan>={},injected:string[]=[];
 for(const key of Object.keys(args))if(!argumentKeys.has(key))throw new Error('Unsupported read argument.');
 if(args.where)args.where=cleanCondition(session,model,args.where);if(args.having)args.having=cleanCondition(session,model,args.having);
 if(args.orderBy)cleanCondition(session,model,args.orderBy);
 for(const key of ['by','distinct'])if(args[key])for(const field of (Array.isArray(args[key])?args[key]:[args[key]]) as string[])if(!fields(model)[field]||deniedScalar(session,model,field))throw new Error('FORBIDDEN: invalid grouping field.');
 for(const projection of ['_sum','_avg','_min','_max','_count'])if(args[projection])for(const key of Object.keys(args[projection] as Args))if(key!=='_all'&&(!fields(model)[key]||deniedScalar(session,model,key)))throw new Error('FORBIDDEN: invalid aggregate field.');
 for(const projection of ['select','include']){if(!args[projection])continue;const values={...args[projection] as Args};for(const [key,value]of Object.entries(values)){if(!value)continue;if(key==='_count'){if(typeof value==='object'){const counts={...(value as {select?:Args}).select};for(const count of Object.keys(counts)){const related=fields(model)[count];if(!related?.relation||!canReadModel(session,related.type as ModelName))delete counts[count];}if(Object.keys(counts).length)values[key]={select:counts};else delete values[key];}else delete values[key];continue;}
 const field=fields(model)[key];if(!field)throw new Error('Invalid selected field.');if(field.relation){const related=field.type as ModelName;if(!canReadModel(session,related)){delete values[key];continue;}const plan=planRead(session,related,value===true?{}:value as Args,depth+1,true);if(field.list){plan.args.where={AND:[modelScope(session,related),plan.args.where??{}]};plan.args.take=Math.min(Number(plan.args.take??500),500);}else if(plan.args.where)throw new Error('Filter single related records through the parent query.');children[key]=plan;values[key]=plan.args;}
 else if(deniedScalar(session,model,key)&&model!=='BankAccount')delete values[key];}
 args[projection]=values;}
 const parent=PARENT_SCOPE[model];if(records&&parent){const projection=args.select?'select':'include',values={...args[projection] as Args};if(!values[parent]){values[parent]={select:{organisationId:true}};injected.push(parent);}else{const existing=values[parent];if(existing!==true&&(existing as Args).select)values[parent]={...existing as Args,select:{...(existing as Args).select as Args,organisationId:true}};}args[projection]=values;}
 if(records&&args.select&&'organisationId' in fields(model)){(args.select as Args).organisationId=true;}
 if(records&&model==='User'){if(!args.select)args.select={id:true,name:true,email:true,...args.include as Args};delete args.include;delete (args.select as Args).passwordHash;}
 if(!nested)args.where={AND:[modelScope(session,model),args.where??{}]};
 if(args.take!==undefined){const take=Number(args.take);if(!Number.isInteger(take)||take<0||take>5001)throw new Error('Read limit is 5,000 rows.');}if(args.skip!==undefined&&(!Number.isInteger(Number(args.skip))||Number(args.skip)<0))throw new Error('Invalid page offset.');
 return {model,args,children,injected,original:input};
}
function sanitise(session:Session,plan:ReadPlan,value:unknown):unknown{if(Array.isArray(value))return value.map(v=>sanitise(session,plan,v)).filter(v=>v!==null);if(!value||typeof value!=='object'||value instanceof Date)return value;const row={...value as Args},parent=PARENT_SCOPE[plan.model];if(row.organisationId&&row.organisationId!==session.organisationId&&!(plan.model==='Organisation'&&session.capabilities.has('atlas.companies.manage')))return null;if(parent&&row[parent]&&typeof row[parent]==='object'&&(row[parent] as Args).organisationId!==session.organisationId)return null;
 for(const [key,child]of Object.entries(plan.children))if(key in row)row[key]=sanitise(session,child,row[key]);for(const key of plan.injected)delete row[key];for(const key of Object.keys(row))if(deniedScalar(session,plan.model,key)){if(plan.model==='BankAccount'&&typeof row[key]==='string')row[key]='••••'+String(row[key]).slice(-4);else delete row[key];}
 if(plan.model==='OrderHold'&&row.type==='CREDIT'&&!session.capabilities.has('customers.credit.read'))row.reason='Credit review required';return row;}
export async function executeReadQuery(session:Session,delegate:string,method:string,input:Args){if(!methods.has(method))throw new Error('FORBIDDEN: only read operations are allowed.');const model=resolveModel(delegate),plan=planRead(session,model,input,0,false,!['count','groupBy','aggregate'].includes(method));if(method==='findMany'&&plan.args.take===undefined)plan.args.take=5000;const operation=method==='findUnique'?'findFirst':method==='findUniqueOrThrow'?'findFirstOrThrow':method;
 // The delegate/method are validated allowlists; no SQL or mutations are accepted.
 const client=db as unknown as Record<string,Record<string,(args:Args)=>Promise<unknown>>>;const result=await client[delegate][operation](plan.args);return ['count','groupBy','aggregate'].includes(method)?result:sanitise(session,plan,result);
}
