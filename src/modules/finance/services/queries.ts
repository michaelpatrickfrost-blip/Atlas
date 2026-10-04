"use server";
import {z} from 'zod';
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {db} from '@/core/db/client';
import {documentScope,requireFinance,documentCapability} from './access';
import type {Prisma} from '@/generated/prisma/client';
export async function getFinanceHome(entityId?:string){
 const session=await requireSession();
 assertCapability(session,'finance.overview.read');
 await requireFinance(session,'finance.overview.read');const organisationId=session.organisationId,entities=await db.financeEntity.findMany({where:{organisationId},orderBy:{name:'asc'}});const entity=entityId?entities.find(e=>e.id===entityId):entities[0];if(entityId&&!entity)throw new Error('Entity not available.');if(!entity)return {entities,entity:null,metrics:[],exceptions:[],accounts:[],periods:[],members:[],serviceCredits:[]};
 const scope=documentScope(session),now=new Date(),metrics:Array<{label:string;amount:bigint;currency:string;href:string}>=[];
 for(const [cap,kind,label,path]of [['finance.receivables.read','AR_INVOICE','Receivables','receivables'],['finance.payables.read','AP_INVOICE','Payables','payables'],['finance.purchase.read','PO','Committed purchases','purchases']] as const){if(!session.capabilities.has(cap))continue;const sums=await db.financeDocument.groupBy({by:['currency'],where:{AND:[scope,{entityId:entity.id,kind:kind==='PO'?'PO':{in:[kind,kind.replace('_INVOICE','_DEBIT')]},status:kind==='PO'?{in:['APPROVED','PART_RECEIVED','RECEIVED']}:'POSTED'}]},_sum:{gross:true,settled:true}});for(const sum of sums){let amount=(sum._sum.gross??0n)-(sum._sum.settled??0n);if(kind==='PO'){const orders=await db.financeDocument.findMany({where:{AND:[scope,{entityId:entity.id,kind:'PO',currency:sum.currency,status:{in:['APPROVED','PART_RECEIVED','RECEIVED']}}]},include:{children:{where:{kind:'AP_INVOICE',status:'POSTED'}}}});amount=orders.reduce((total,order)=>{const billed=order.children.reduce((s,b)=>s+b.gross,0n);return total+(order.gross>billed?order.gross-billed:0n);},0n);}metrics.push({label,amount,currency:sum.currency,href:`/finance/${path}?entity=${entity.id}`});}if(kind!=='PO'){const overdue=await db.financeDocument.groupBy({by:['currency'],where:{AND:[scope,{entityId:entity.id,kind:{in:[kind,kind.replace('_INVOICE','_DEBIT')]},status:'POSTED',settled:{lt:db.financeDocument.fields.gross},dueAt:{lt:now}}]},_sum:{gross:true,settled:true}});for(const sum of overdue)metrics.push({label:`Overdue ${label.toLowerCase()}`,amount:(sum._sum.gross??0n)-(sum._sum.settled??0n),currency:sum.currency,href:`/finance/${path}?entity=${entity.id}&overdue=1`});}}
 if(session.capabilities.has('finance.bank.read')){const banks=await db.financeBank.findMany({where:{organisationId,entityId:entity.id}}),lines=await db.financeJournalLine.aggregate({where:{organisationId,accountId:{in:banks.map(b=>b.accountId)},journal:{status:'POSTED',entityId:entity.id}},_sum:{debit:true,credit:true}});metrics.push({label:'Bank ledger balance',amount:(lines._sum.debit??0n)-(lines._sum.credit??0n),currency:entity.currency,href:`/finance/banking?entity=${entity.id}`});}
 const exceptions:Array<{label:string;count:number;href:string}>=[];if(session.capabilities.has('finance.control.read')){const pending=await db.financeDocument.count({where:{AND:[scope,{entityId:entity.id,status:'AWAITING_APPROVAL'}]}});exceptions.push({label:'Documents awaiting approval',count:pending,href:'/finance/control'});if(session.capabilities.has('finance.bank.read'))exceptions.push({label:'Unreconciled bank transactions',count:await db.financeBankTransaction.count({where:{organisationId,status:'UNRECONCILED',bank:{entityId:entity.id}}}),href:'/finance/banking'});if(session.capabilities.has('finance.payables.read'))exceptions.push({label:'Supplier bank changes pending',count:await db.financeBankVersion.count({where:{organisationId,status:'PENDING'}}),href:'/finance/payables'});}
 const accounts=session.capabilities.has('finance.configure')?await db.financeAccount.findMany({where:{organisationId,entityId:entity.id},orderBy:{code:'asc'}}):[];const periods=session.capabilities.has('finance.ledger.read')?await db.financePeriod.findMany({where:{organisationId,entityId:entity.id},orderBy:{startAt:'desc'}}):[];const members=(session.capabilities.has('finance.configure')||session.capabilities.has('core.approvals.delegate'))?await db.membership.findMany({where:{organisationId,active:true},select:{userId:true,user:{select:{name:true}}}}):[];
 const serviceCredits=await db.financeDocument.findMany({where:{organisationId,entityId:entity.id,kind:'AR_CREDIT',category:'SERVICE_CREDIT',status:{in:['DRAFT','AWAITING_APPROVAL','APPROVED']}},include:{party:{select:{name:true}}},orderBy:{createdAt:'desc'},take:20});
 if(serviceCredits.length)exceptions.push({label:'Customer credits from Service',count:serviceCredits.length,href:'/finance'});
 return {entities,entity,metrics,exceptions,accounts,periods,members,serviceCredits};
}
export async function listFinanceDocuments(input:unknown){
 const session=await requireSession();
 assertCapability(session,'finance.overview.read');
 await requireFinance(session,'finance.overview.read');const filter=z.object({productId:z.string().optional(),kind:z.string().optional(),partyId:z.string().optional(),entityId:z.string().optional(),status:z.string().optional(),query:z.string().max(100).optional(),overdue:z.boolean().optional(),page:z.number().int().min(0).max(100000).default(0)}).parse(input);if(filter.kind)assertCapability(session,documentCapability(filter.kind));const scope:Prisma.FinanceDocumentWhereInput={AND:[documentScope(session),{...(filter.kind?{kind:filter.kind}:{}),...(filter.productId?{lines:{some:{productId:filter.productId}}}:{}),...(filter.partyId?{partyId:filter.partyId}:{}),...(filter.entityId?{entityId:filter.entityId}:{}),...(filter.status?{status:filter.status}:{}),...(filter.overdue?{dueAt:{lt:new Date()},status:'POSTED',settled:{lt:db.financeDocument.fields.gross}}:{}),...(filter.query?{OR:[{reference:{contains:filter.query,mode:'insensitive'}},{title:{contains:filter.query,mode:'insensitive'}},{externalReference:{contains:filter.query,mode:'insensitive'}}]}:{})}]};const rows=await db.financeDocument.findMany({where:scope,orderBy:{createdAt:'desc'},take:100,skip:filter.page*100,include:{party:{select:{name:true}}}}),count=await db.financeDocument.count({where:scope});return {rows,count};
}
export async function getFinanceDocument(id:string){
 const session=await requireSession();
 assertCapability(session,'finance.overview.read');
 await requireFinance(session,'finance.overview.read');const doc=await db.financeDocument.findFirstOrThrow({where:{AND:[documentScope(session),{id}]},include:{lines:{orderBy:{number:'asc'}},timeline:{orderBy:{createdAt:'asc'}},source:{select:{id:true,reference:true,kind:true}},children:{where:documentScope(session),select:{id:true,reference:true,kind:true,status:true}},party:{select:{name:true}}}});if(!(doc.kind==='AR_CREDIT'&&doc.category==='SERVICE_CREDIT'))assertCapability(session,documentCapability(doc.kind));const approvals=await db.approvalInstance.findMany({where:{organisationId:session.organisationId,subjectId:id,subjectType:doc.kind},include:{steps:true},orderBy:{createdAt:'desc'}});if(doc.source&&!await db.financeDocument.findFirst({where:{AND:[documentScope(session),{id:doc.source.id}]},select:{id:true}}))doc.source=null;const attachments=await db.financeAttachment.findMany({where:{organisationId:session.organisationId,documentId:id},select:{id:true,name:true,mimeType:true,checksum:true,createdAt:true}});return {doc,approvals,attachments};
}
export async function getFinanceWorkspace(workspace:string,entityId?:string){
 const session=await requireSession();
 const caps:Record<string,string>={accounting:'finance.ledger.read',banking:'finance.bank.read',assets:'finance.asset.read',planning:'finance.planning.read',tax:'finance.tax.read',reporting:'finance.report.read',control:'finance.control.read',suppliers:'finance.payables.read',purchases:'finance.purchase.read'};
 assertCapability(session,caps[workspace]??'finance.overview.read');
 await requireFinance(session,caps[workspace]??'finance.overview.read');const organisationId=session.organisationId,entities=await db.financeEntity.findMany({where:{organisationId},orderBy:{name:'asc'}}),entity=entityId?entities.find(e=>e.id===entityId):entities[0];if(entityId&&!entity)throw new Error('Entity not available.');const empty={entities,entity:entity??null,accounts:[],periods:[],journals:[],balances:[],banks:[],transactions:[],assets:[],budgets:[],scenarios:[],contracts:[],tasks:[],approvals:[],suppliers:[],runs:[]};if(!entity)return empty;
 const where={organisationId,entityId:entity.id},journalScope:Prisma.FinanceJournalWhereInput={...where,documents:{every:documentScope(session)}},result:{[K in keyof typeof empty]:unknown}={...empty};
 if(['accounting','reporting','tax'].includes(workspace)){result.accounts=await db.financeAccount.findMany({where,orderBy:{code:'asc'}});result.balances=await db.financeJournalLine.groupBy({by:['accountId'],where:{organisationId,journal:{...journalScope,status:'POSTED'}},_sum:{debit:true,credit:true}});result.journals=await db.financeJournal.findMany({where:journalScope,include:{lines:true},orderBy:{accountingDate:'desc'},take:100});result.periods=await db.financePeriod.findMany({where,orderBy:{startAt:'desc'}});}
 if(workspace==='banking'){result.banks=await db.financeBank.findMany({where,include:{account:true}});result.transactions=await db.financeBankTransaction.findMany({where:{organisationId,bank:{entityId:entity.id}},orderBy:{date:'desc'},take:200});if(session.capabilities.has('finance.payment.create')||session.capabilities.has('finance.payment.approve'))result.runs=await db.financePaymentRun.findMany({where,include:{items:true},orderBy:{createdAt:'desc'},take:100});}
 if(workspace==='assets')result.assets=await db.financeAsset.findMany({where,orderBy:{name:'asc'}});
 if(workspace==='planning'){result.budgets=await db.financeBudget.findMany({where});result.scenarios=await db.financeScenario.findMany({where:{...where,ownerUserId:session.userId}});}
 if(workspace==='purchases')result.contracts=await db.financeContract.findMany({where});
 if(workspace==='control'){result.tasks=await db.financeCloseTask.findMany({where,include:{period:true},orderBy:{name:'asc'}});const visible=await db.financeDocument.findMany({where:documentScope(session),select:{id:true}});result.approvals=await db.approvalInstance.findMany({where:{organisationId,subjectId:{in:visible.map(d=>d.id)},status:'PENDING'},include:{steps:true},orderBy:{createdAt:'asc'}});}
 if(workspace==='suppliers'){const suppliers=await db.financeSupplier.findMany({where:{organisationId},include:{party:{select:{name:true}},bankVersions:{select:{id:true,status:true,accountName:true,requesterUserId:true,createdAt:true}}},orderBy:{createdAt:'desc'}});result.suppliers=suppliers;}
 return result as unknown as {
 entities:typeof entities;entity:typeof entity;
 accounts:Awaited<ReturnType<typeof db.financeAccount.findMany>>;
 periods:Awaited<ReturnType<typeof db.financePeriod.findMany>>;
 journals:Array<Prisma.FinanceJournalGetPayload<{include:{lines:true}}>>;
 balances:Array<{accountId:string;_sum:{debit:bigint|null;credit:bigint|null}}>;
 banks:Array<Prisma.FinanceBankGetPayload<{include:{account:true}}>>;
 transactions:Awaited<ReturnType<typeof db.financeBankTransaction.findMany>>;
 assets:Awaited<ReturnType<typeof db.financeAsset.findMany>>;
 budgets:Awaited<ReturnType<typeof db.financeBudget.findMany>>;
 scenarios:Awaited<ReturnType<typeof db.financeScenario.findMany>>;
 contracts:Awaited<ReturnType<typeof db.financeContract.findMany>>;
 tasks:Array<Prisma.FinanceCloseTaskGetPayload<{include:{period:true}}>>;
 approvals:Array<Prisma.ApprovalInstanceGetPayload<{include:{steps:true}}>>;
 suppliers:Array<{id:string;status:string;party:{name:string};bankVersions:Array<{id:string;status:string;accountName:string;requesterUserId:string;createdAt:Date}>}>;
 runs:Array<Prisma.FinancePaymentRunGetPayload<{include:{items:true}}>>;
 };
}
export async function financeChoices(){
 const session=await requireSession();
 assertCapability(session,'finance.overview.read');
 await requireFinance(session,'finance.overview.read');const organisationId=session.organisationId;return {products:session.capabilities.has('core.products.read')?await db.product.findMany({where:{organisationId,active:true},select:{id:true,name:true,code:true},orderBy:{name:'asc'},take:1000}):[],entities:await db.financeEntity.findMany({where:{organisationId},orderBy:{name:'asc'}}),parties:session.capabilities.has('customers.read')?await db.party.findMany({where:{organisationId},select:{id:true,name:true},orderBy:{name:'asc'},take:1000}):[],accounts:(session.capabilities.has('finance.ledger.read')||session.capabilities.has('finance.bank.manage'))?await db.financeAccount.findMany({where:{organisationId,active:true,...(!session.capabilities.has('finance.ledger.read')?{control:'BANK'}:{})},orderBy:{code:'asc'}}):[],documents:await db.financeDocument.findMany({where:{AND:[documentScope(session),{kind:{in:['PO','AR_INVOICE','AP_INVOICE','AR_DEBIT','AP_DEBIT']},status:{in:['APPROVED','PART_RECEIVED','RECEIVED','POSTED']}}]},select:{id:true,reference:true,kind:true,partyId:true,entityId:true,currency:true,lines:{select:{id:true,number:true,description:true}}},take:1000})};
}
export async function getBudgetPositions(entityId:string){
 const session=await requireSession();
 assertCapability(session,'finance.planning.read');
 await requireFinance(session,'finance.planning.read');const {budgetUsage}=await import('./budgets');const budgets=await db.financeBudget.findMany({where:{organisationId:session.organisationId,entityId}}),departments=[...new Set(budgets.map(b=>b.department))],all=[];for(const department of departments)all.push(...await budgetUsage(db,session.organisationId,entityId,department,new Date()));return [...new Map(all.map(b=>[b.id,b])).values()];
}
export async function getInvoiceCashForecast(entityId:string){
 const session=await requireSession();
 assertCapability(session,'finance.planning.read');
 await requireFinance(session,'finance.planning.read');assertCapability(session,'finance.bank.read');assertCapability(session,'finance.receivables.read');assertCapability(session,'finance.payables.read');const entity=await db.financeEntity.findFirstOrThrow({where:{id:entityId,organisationId:session.organisationId}}),banks=await db.financeBank.findMany({where:{organisationId:session.organisationId,entityId}}),sum=await db.financeJournalLine.aggregate({where:{organisationId:session.organisationId,accountId:{in:banks.map(b=>b.accountId)},journal:{status:'POSTED'}},_sum:{debit:true,credit:true}}),opening=(sum._sum.debit??0n)-(sum._sum.credit??0n),docs=await db.financeDocument.findMany({where:{AND:[documentScope(session),{entityId,kind:{in:['AR_INVOICE','AP_INVOICE','AR_DEBIT','AP_DEBIT']},status:'POSTED',settled:{lt:db.financeDocument.fields.gross}}]}});const {convert}=await import('../domain/money');return {currency:entity.currency,opening,points:[0,7,30,60,90,180,365].map(days=>{const cutoff=new Date(Date.now()+days*86400000);let receipts=0n,payments=0n;for(const doc of docs){if(!doc.dueAt||doc.dueAt>cutoff)continue;const value=convert(doc.gross-doc.settled,doc.exchangeRate.toString(),doc.currency,entity.currency);if(doc.kind.startsWith('AR_'))receipts+=value;else payments+=value;}return {days,receipts,payments,closing:opening+receipts-payments};}),excluded:['Purchase commitments','Payroll','Tax','Loans and leases','Forecast sales','Invoices without due dates'],basis:'Posted open invoices at due dates; rates retained from the source invoices.'};
}
export async function getFinancialReport(input:unknown){
 const session=await requireSession();
 assertCapability(session,'finance.report.read');
 await requireFinance(session,'finance.report.read');const parsed=z.object({entityId:z.string(),start:z.string(),end:z.string()}).parse(input),organisationId=session.organisationId,entity=await db.financeEntity.findFirstOrThrow({where:{id:parsed.entityId,organisationId}}),start=new Date(parsed.start),end=new Date(parsed.end);if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||start>end)throw new Error('Choose a valid reporting period.');const accounts=await db.financeAccount.findMany({where:{organisationId,entityId:entity.id},orderBy:{code:'asc'}});const journal={organisationId,entityId:entity.id,status:'POSTED',documents:{every:documentScope(session)}};const [movement,position]=await Promise.all([db.financeJournalLine.groupBy({by:['accountId'],where:{organisationId,journal:{...journal,accountingDate:{gte:start,lte:end}}},_sum:{debit:true,credit:true}}),db.financeJournalLine.groupBy({by:['accountId'],where:{organisationId,journal:{...journal,accountingDate:{lte:end}}},_sum:{debit:true,credit:true}})]);const rows=accounts.map(a=>{const m=movement.find(r=>r.accountId===a.id),p=position.find(r=>r.accountId===a.id);return {id:a.id,code:a.code,name:a.name,type:a.type,movement:(m?._sum.debit??0n)-(m?._sum.credit??0n),position:(p?._sum.debit??0n)-(p?._sum.credit??0n)};});const amount=(type:string,field:'movement'|'position')=>rows.filter(r=>r.type===type).reduce((s,r)=>s+r[field],0n),revenue=-amount('REVENUE','movement'),expenses=amount('EXPENSE','movement'),assets=amount('ASSET','position'),liabilities=-amount('LIABILITY','position'),equity=-amount('EQUITY','position'),retained=-amount('REVENUE','position')-amount('EXPENSE','position');return {entity,start,end,rows,revenue,expenses,profit:revenue-expenses,assets,liabilities,equity,retained,balanceDifference:assets-liabilities-equity-retained};
}
export async function getFinanceCustomerContribution(partyId:string){
 const session=await requireSession();
 assertCapability(session,'finance.receivables.read');
 await requireFinance(session,'finance.receivables.read');assertCapability(session,'customers.read');await db.party.findFirstOrThrow({where:{id:partyId,organisationId:session.organisationId}});const rows=await db.financeDocument.findMany({where:{AND:[documentScope(session),{partyId,kind:{in:['AR_INVOICE','AR_DEBIT']},status:'POSTED'}]},select:{gross:true,settled:true,currency:true,dueAt:true}});const currencies=[...new Set(rows.map(d=>d.currency))],now=new Date();return currencies.map(currency=>({currency,outstanding:rows.filter(d=>d.currency===currency).reduce((s,d)=>s+d.gross-d.settled,0n),overdue:rows.filter(d=>d.currency===currency&&d.dueAt&&d.dueAt<now).reduce((s,d)=>s+d.gross-d.settled,0n)}));
}
export async function searchFinance(query:string){
 const session=await requireSession();
 assertCapability(session,'finance.overview.read');
 await requireFinance(session,'finance.overview.read');const q=z.string().max(100).parse(query.trim());if(q.length<2)return [];const documents=await db.financeDocument.findMany({where:{AND:[documentScope(session),{OR:[{reference:{contains:q,mode:'insensitive'}},{externalReference:{contains:q,mode:'insensitive'}},{title:{contains:q,mode:'insensitive'}}]}]},select:{id:true,reference:true,title:true,kind:true},take:20});return documents.map(d=>({id:d.id,title:d.reference,subtitle:`${d.kind} · ${d.title}`,href:`/finance/documents/${d.id}`,group:'Finance'}));
}
export async function getFinanceAttachment(id:string){
 const session=await requireSession();
 assertCapability(session,'finance.overview.read');
 await requireFinance(session,'finance.overview.read');const attachment=await db.financeAttachment.findFirstOrThrow({where:{id,organisationId:session.organisationId}});await db.financeDocument.findFirstOrThrow({where:{AND:[documentScope(session),{id:attachment.documentId}]}});return {name:attachment.name,mimeType:attachment.mimeType,base64:Buffer.from(attachment.content).toString('base64')};
}
export async function getSalesFinanceProjection(orderId:string){
 const session=await requireSession();
 assertCapability(session,'sales.order.read');
 if(!session.capabilities.has('finance.receivables.read')||!await db.moduleState.findFirst({where:{organisationId:session.organisationId,moduleId:'finance',enabled:true,entitled:true}}))return null;
 await requireFinance(session,'finance.receivables.read');await db.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId:session.organisationId}});
 const documents=await db.financeDocument.findMany({where:{AND:[documentScope(session),{salesOrderId:orderId}]},select:{id:true,reference:true,kind:true,status:true,gross:true,settled:true,currency:true,documentDate:true},orderBy:{documentDate:'asc'}}),entities=await db.financeEntity.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true,currency:true},orderBy:{name:'asc'}});return {documents,entities};
}
export async function getReceivingWarehouses(){
 const session=await requireSession();
 assertCapability(session,'finance.purchase.read');
 await requireFinance(session,'finance.purchase.read');if(!session.capabilities.has('stock.manage'))return [];const {assertModuleEnabled}=await import('@/core/modules/access');await assertModuleEnabled(session,'stock');return db.warehouse.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true,code:true},orderBy:{name:'asc'}});
}
