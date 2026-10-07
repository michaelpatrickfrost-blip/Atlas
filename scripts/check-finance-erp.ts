/** Server-only synthetic acceptance through normal password sign-in and deployed Server Actions. */
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import {db} from '../src/core/db/client';
import {wipeCompany} from '../src/core/admin/wipe-company';
import {FINANCE_CAPABILITIES} from '../src/modules/finance/capabilities';
async function main(){
 if(process.env.ATLAS_FINANCE_LIVE_TEST!=='1'||process.env.ATLAS_RUNTIME==='desktop')throw new Error('Run explicitly on the deployed central server with ATLAS_FINANCE_LIVE_TEST=1.');
 const base=process.env.ATLAS_FINANCE_TEST_URL??'https://atlassystem.online',suffix=randomBytes(8).toString('hex'),password=randomBytes(24).toString('base64url');
 const manifest=JSON.parse(await readFile('.next/server/server-reference-manifest.json','utf8'));
 const post=async(name:string,args:unknown[],cookie='',fields?:Record<string,string|string[]>)=>{
  const action=Object.entries(manifest.node as Record<string,{exportedName?:string}>).find(([,v])=>v.exportedName===name);assert(action,`Action exists: ${name}`);
  let body:FormData|string;const headers:Record<string,string>={Origin:base,'Next-Action':action[0],Accept:'text/x-component',...(cookie?{Cookie:cookie}:{})};
  if(fields){const data=new FormData();for(const [key,values]of Object.entries(fields))for(const value of Array.isArray(values)?values:[values])data.append(`_1_${key}`,value);data.set('0',JSON.stringify([...args,'$K1']));body=data;}else{body=JSON.stringify(args);headers['Content-Type']='text/plain;charset=UTF-8';}
  const response=await fetch(`${base}${name==='loginAction'?'/login':'/finance'}`,{method:'POST',redirect:'manual',headers,body});return {response,body:await response.text()};
 };
 const check=(condition:unknown,label:string)=>{assert(condition,label);console.log(`PASS ${label}`);};
 const call=async(name:string,args:unknown[],cookie:string,fields?:Record<string,string|string[]>)=>{const r=await post(name,args,cookie,fields);assert(r.response.status<400&&!/\n\w+:E\{/.test(r.body),`${name} succeeds (HTTP ${r.response.status}; server error ${/\n\w+:E\{/.test(r.body)})`);return r;};
 const login=async(email:string)=>{const r=await post('loginAction',[],'',{email,password}),cookie=r.response.headers.get('set-cookie')?.match(/atlas_session=[^;]+/)?.[0];assert(cookie,'Normal password sign-in');return cookie;};
 const companies:string[]=[],users:string[]=[];
 try{
  const company=await db.organisation.create({data:{name:`Disposable Finance ${suffix}`,slug:`finance-check-${suffix}`,isTest:true}});companies.push(company.id);const organisationId=company.id;
  const outside=await db.organisation.create({data:{name:`Disposable outside ${suffix}`,slug:`finance-outside-${suffix}`,isTest:true}});companies.push(outside.id);
  await db.moduleState.create({data:{organisationId,moduleId:'finance',enabled:true,entitled:true}});
  const makeUser=async(name:string,capabilities:string[],org=organisationId)=>{const u=await db.user.create({data:{name,email:`finance-${name}-${suffix}@example.test`,passwordHash:await bcrypt.hash(password,10)}});users.push(u.id);await db.membership.create({data:{organisationId:org,userId:u.id,grantedCapabilities:capabilities}});return u;};
  const capabilities=[...Object.values(FINANCE_CAPABILITIES),'customers.read','core.products.read'];
  const maker=await makeUser('maker',capabilities),approver=await makeUser('approver',capabilities),reader=await makeUser('reader',['finance.overview.read','finance.ledger.read','finance.receivables.read','finance.bank.read']);
  const makerCookie=await login(maker.email),approverCookie=await login(approver.email),readerCookie=await login(reader.email);
  await call('setupFinance',[],makerCookie,{name:'Synthetic GBP books',code:'CHECK',currency:'GBP',startAt:'2026-01-01',endAt:'2026-12-31'});
  const entity=await db.financeEntity.findFirstOrThrow({where:{organisationId}}),entityId=entity.id;const period=await db.financePeriod.findFirstOrThrow({where:{organisationId,entityId}});
  const accounts=await db.financeAccount.findMany({where:{organisationId,entityId}});const account=(control:string)=>{const a=accounts.find(a=>a.control===control);assert(a,control);return a.id;};
  for(const [code,control,type]of [['6000','FX_GAIN','REVENUE'],['6001','FX_LOSS','EXPENSE'],['6002','ROUNDING','EXPENSE']])await call('saveFinanceAccount',[],makerCookie,{entityId,code,name:control,type,control,active:'on',postingAllowed:'on'});
  for(const [subjectType,currency]of [['AR_INVOICE','GBP'],['AP_INVOICE','EUR'],['AP_INVOICE','GBP'],['REQUEST','GBP'],['JOURNAL','GBP'],['PERIOD_REOPEN','GBP']])await call('saveApprovalPolicy',[],makerCookie,{name:`Check ${subjectType} ${currency}`,subjectType,currency,minimum:'0',stages:JSON.stringify([[approver.id]])});
  const party=await db.party.create({data:{organisationId,kind:'COMPANY',name:'Synthetic shared counterparty',customerCode:'CHECK',tags:[]}}),foreignParty=await db.party.create({data:{organisationId:outside.id,kind:'COMPANY',name:'Outside tenant',customerCode:'OUTSIDE',tags:[]}});
  await call('onboardSupplier',[],makerCookie,{partyId:party.id,currency:'GBP',paymentDays:'30'});const supplier=await db.financeSupplier.findFirstOrThrow({where:{organisationId,partyId:party.id}});
  await post('approveSupplier',[supplier.id],makerCookie,{evidence:'Synthetic self approval attempt'});check((await db.financeSupplier.findUniqueOrThrow({where:{id:supplier.id}})).status==='REQUESTED','Supplier requester cannot approve own onboarding');
  await call('approveSupplier',[supplier.id],approverCookie,{evidence:'Synthetic independent verification'});
  const draft=async(kind:string,price:string,currency='GBP',extra:Record<string,unknown>={})=>{
   const title=`Synthetic ${kind} ${randomBytes(4).toString('hex')}`;await call('createFinanceDocument',[{entityId,kind,title,currency,exchangeRate:currency==='GBP'?'1':'0.86',documentDate:'2026-10-01',accountingDate:'2026-10-02',taxDate:'2026-10-01',dueAt:'2026-10-03',partyId:party.id,externalReference:title,lines:[{description:'Acceptance line',quantity:'1',unitPrice:price,taxCode:currency==='GBP'?'STANDARD':'OUTSIDE_SCOPE',taxRateBps:currency==='GBP'?2000:0}],...extra}],makerCookie);return db.financeDocument.findFirstOrThrow({where:{organisationId,title},include:{lines:true}});
  };
  const approve=async(id:string)=>{await call('submitFinanceDocument',[id],makerCookie);const approval=await db.approvalInstance.findFirstOrThrow({where:{organisationId,subjectId:id,status:'PENDING'}});await post('decideFinanceApproval',[approval.id],makerCookie,{decision:'APPROVED',reason:'Attempt own decision'});check((await db.approvalInstance.findUniqueOrThrow({where:{id:approval.id}})).status==='PENDING','Document creator cannot approve own request');await call('decideFinanceApproval',[approval.id],approverCookie,{decision:'APPROVED',reason:'Synthetic independent review'});};
  const invoice=await draft('AR_INVOICE','10000');await approve(invoice.id);await call('postFinanceDocument',[invoice.id],makerCookie);
  const posted=await db.financeDocument.findUniqueOrThrow({where:{id:invoice.id},include:{journal:{include:{lines:{include:{account:true}}}}}});assert(posted.journal);const ar=posted.journal.lines.find(l=>l.account.control==='AR');
  check(ar?.debit===1200000n&&posted.journal.lines.some(l=>l.account.control==='REVENUE'&&l.credit===1000000n)&&posted.journal.lines.some(l=>l.account.control==='VAT_OUTPUT'&&l.credit===200000n),'£10,000 plus VAT posts balanced AR, revenue and output tax');
  check(posted.journal.accountingDate.toISOString().startsWith('2026-10-02')&&posted.journal.documentDate?.toISOString().startsWith('2026-10-01')&&posted.journal.exchangeRate?.toString()==='1','Document, accounting, tax dates and original rate retained');
  await call('postFinanceDocument',[invoice.id],makerCookie);check(await db.financeJournal.count({where:{organisationId,sourceId:invoice.id}})===1,'Invoice posting retry produces one journal');
  await call('createFinanceBank',[],makerCookie,{entityId,accountId:account('BANK'),name:'Synthetic bank'});const bank=await db.financeBank.findFirstOrThrow({where:{organisationId}});
  const statement=async(externalId:string,amount:string)=>{const rows=[{externalId,date:'2026-10-05',reference:externalId,amount}];await call('importFinanceStatement',[bank.id,rows],makerCookie);return db.financeBankTransaction.findFirstOrThrow({where:{organisationId,externalId}});};
  const cash=await statement('AR-full','12000');await statement('AR-full','12000');check(await db.financeBankTransaction.count({where:{organisationId,externalId:'AR-full'}})===1,'Statement import replay leaves one identical row');
  await post('importFinanceStatement',[bank.id,[{externalId:'AR-full',date:'2026-10-05',reference:'AR-full',amount:'12001'}]],makerCookie);check((await db.financeBankTransaction.findUniqueOrThrow({where:{id:cash.id}})).amount===1200000n,'Conflicting statement ID cannot replace evidence');
  await call('reconcileFinanceStatement',[cash.id,[{documentId:invoice.id,amount:'12000'}]],makerCookie);await call('reconcileFinanceStatement',[cash.id,[{documentId:invoice.id,amount:'12000'}]],makerCookie);
  check((await db.financeDocument.findUniqueOrThrow({where:{id:invoice.id}})).settled===1200000n&&await db.financeSettlement.count({where:{organisationId,bankTransactionId:cash.id}})===1,'Bank allocation and replay settle AR exactly once');
  const bill=await draft('AP_INVOICE','10000','EUR');await approve(bill.id);await call('postFinanceDocument',[bill.id],makerCookie);const payment=await statement('AP-FX','-8750');
  await call('reconcileFinanceStatement',[payment.id,[{documentId:bill.id,amount:'10000',bankAmount:'8750'}]],makerCookie);
  const fx=await db.financeSettlement.findFirstOrThrow({where:{organisationId,documentId:bill.id}}),fxJournal=await db.financeJournal.findFirstOrThrow({where:{organisationId,sourceId:payment.id},include:{lines:{include:{account:true}}}});
  check(fx.carryingAmount===860000n&&fx.bankAmount===875000n&&fx.realisedFx===-15000n&&fxJournal.lines.some(l=>l.account.control==='FX_LOSS'&&l.debit===15000n),'EUR bill settles at retained £8,600 carrying value with £150 realised loss');
  check((await db.financeDocument.findUniqueOrThrow({where:{id:bill.id}})).exchangeRate.toString()==='0.86','Settlement preserves original invoice exchange rate');
  const partial=await draft('AR_INVOICE','100');await approve(partial.id);await call('postFinanceDocument',[partial.id],makerCookie);const partialCash=await statement('AR-partial','50');await call('reconcileFinanceStatement',[partialCash.id,[{documentId:partial.id,amount:'50'}]],makerCookie);
  check((await db.financeDocument.findUniqueOrThrow({where:{id:partial.id}})).settled===5000n,'Partial receipt leaves £70 outstanding');
  await call('recordFinanceCollection',[],makerCookie,{documentId:partial.id,kind:'PROMISE',notes:'Synthetic promise recorded',promisedAmount:'70',followUpAt:'2026-10-20'});
  await post('recordFinanceCollection',[],readerCookie,{documentId:partial.id,kind:'CALL',notes:'Forbidden reader mutation'});check(await db.financeCollectionActivity.count({where:{organisationId,documentId:partial.id}})===1,'Collections retain promise and reject read-only writes');
  await post('recordFinanceCollection',[],makerCookie,{documentId:partial.id,kind:'PROMISE',notes:'Invalid over-promise',promisedAmount:'71',followUpAt:'2026-10-20'});check(await db.financeCollectionActivity.count({where:{organisationId,documentId:partial.id}})===1,'Promise cannot exceed outstanding balance');
  const badCash=await statement('AR-over','71');await post('reconcileFinanceStatement',[badCash.id,[{documentId:partial.id,amount:'71'}]],makerCookie);check(await db.financeSettlement.count({where:{organisationId,bankTransactionId:badCash.id}})===0&&(await db.financeBankTransaction.findUniqueOrThrow({where:{id:badCash.id}})).status==='UNRECONCILED','Over-allocation rolls back bank and document mutations');
  const before=await db.financeDocument.count({where:{organisationId}});await post('createFinanceDocument',[{entityId,kind:'AR_INVOICE',title:'Foreign identity attack',currency:'GBP',documentDate:'2026-10-01',partyId:foreignParty.id,lines:[{description:'Foreign',quantity:'1',unitPrice:'100',taxCode:'OUTSIDE_SCOPE',taxRateBps:0}]}],makerCookie);check(await db.financeDocument.count({where:{organisationId}})===before,'Cross-tenant Party cannot enter Finance');
  const request=await draft('REQUEST','10','GBP',{lines:[{description:'Synthetic ordered service',quantity:'100',unitPrice:'10',taxCode:'OUTSIDE_SCOPE',taxRateBps:0}]});await approve(request.id);await call('createPurchaseOrder',[request.id],makerCookie);const po=await db.financeDocument.findFirstOrThrow({where:{organisationId,sourceId:request.id,kind:'PO'},include:{lines:true}});const poLine=po.lines[0];
  await call('recordGoodsReceipt',[po.id,{requestKey:'check-receipt',date:'2026-10-03',lines:[{lineId:poLine.id,quantity:'80',damaged:'0'}]}],makerCookie);
  await call('recordGoodsReceipt',[po.id,{requestKey:'check-receipt',date:'2026-10-03',lines:[{lineId:poLine.id,quantity:'80',damaged:'0'}]}],makerCookie);check(await db.financeDocument.count({where:{organisationId,sourceId:po.id,kind:'RECEIPT'}})===1,'Goods receipt retry retains one source, GRNI posting and quantity');
  const line=(quantity:string,unitPrice='10')=>({description:'Synthetic matched service',quantity,unitPrice,taxCode:'OUTSIDE_SCOPE',taxRateBps:0,sourceLineId:poLine.id});
  const excessive=await draft('AP_INVOICE','10','GBP',{sourceId:po.id,lines:[line('100')]});await approve(excessive.id);await post('postFinanceDocument',[excessive.id],makerCookie);
  check(await db.financeJournal.count({where:{organisationId,sourceId:excessive.id}})===0,'Bill for 100 cannot post against 80 accepted units');
  const repeated=await draft('AP_INVOICE','10','GBP',{sourceId:po.id,lines:[line('60'),line('60')]});await approve(repeated.id);await post('postFinanceDocument',[repeated.id],makerCookie);
  check(await db.financeJournal.count({where:{organisationId,sourceId:repeated.id}})===0,'Repeated PO line cannot bypass cumulative receipt quantity limit');
  await call('saveFinanceEntityDetails',[],makerCookie,{entityId,name:entity.name,registrationNumber:'TEST',registeredAddress:'Synthetic test only',vatNumber:'',country:'GB',fiscalStartMonth:'1',matchToleranceBps:'200'});
  const matched=await draft('AP_INVOICE','10','GBP',{sourceId:po.id,lines:[line('80','10.10')]});await approve(matched.id);await call('postFinanceDocument',[matched.id],makerCookie);
  const matchJournal=await db.financeJournal.findFirstOrThrow({where:{organisationId,sourceId:matched.id},include:{lines:{include:{account:true}}}});
  check(matchJournal.lines.some(l=>l.account.control==='GRNI'&&l.debit===80000n)&&matchJournal.lines.some(l=>l.account.control==='PURCHASE_VARIANCE'&&l.debit===800n),'Accepted bill clears PO cost from GRNI and posts tolerated price variance separately');
  await call('saveFinanceDimension',[],makerCookie,{entityId,dimension:'department',code:'QA',name:'Synthetic Finance QA',active:'on'});
  await call('saveFinanceAccount',[],makerCookie,{id:account('EXPENSE'),entityId,code:'5000',name:'Operating expenses',type:'EXPENSE',control:'EXPENSE',active:'on',postingAllowed:'on',department:'REQUIRED'});
  const journalInput={entityId,date:'2026-10-04',description:'Synthetic dimension journal',lines:[{accountId:account('EXPENSE'),description:'Expense',debit:'5',credit:'0'},{accountId:account('EQUITY'),description:'Equity',debit:'0',credit:'5'}]};
  await post('createManualJournal',[journalInput],makerCookie);check(await db.financeJournal.count({where:{organisationId,sourceType:'MANUAL'}})===0,'Missing required account dimension prevents journal creation');
  journalInput.lines[0]={...journalInput.lines[0],department:'QA'} as typeof journalInput.lines[0];await call('createManualJournal',[journalInput],makerCookie);const manual=await db.financeJournal.findFirstOrThrow({where:{organisationId,sourceType:'MANUAL'}});
  await call('approveManualJournal',[manual.id],approverCookie,{reason:'Synthetic journal review'});await call('reverseJournal',[manual.id],approverCookie,{date:'2026-10-05',reason:'Synthetic correction'});
  check(await db.financeJournal.count({where:{organisationId,reversalOfId:manual.id}})===1&&await db.financeJournalLine.count({where:{organisationId,journal:{reversalOfId:manual.id},department:'QA'}})===1,'Independent journal approval and linked reversal preserve dimensions');
  let immutable=false;try{await db.financeJournal.update({where:{id:posted.journal.id},data:{description:'Forbidden rewrite'}});}catch{immutable=true;}check(immutable,'Database rejects alteration of posted journal');
  const invalidKey=`invalid:${suffix}`;let unbalanced=false;
  try{await db.$transaction(async tx=>{const j=await tx.financeJournal.create({data:{organisationId,entityId,periodId:period.id,reference:'INVALID',description:'Synthetic invalid journal',sourceKey:invalidKey,sourceType:'MANUAL',accountingDate:new Date('2026-10-04'),currency:'GBP',exchangeRate:'1',creatorUserId:maker.id,lines:{create:[{accountId:account('BANK'),description:'Debit',debit:1n,credit:0n,transactionDebit:1n,transactionCredit:0n},{accountId:account('EQUITY'),description:'Credit',debit:0n,credit:2n,transactionDebit:0n,transactionCredit:2n}]}}});await tx.financeJournal.update({where:{id:j.id},data:{status:'POSTED'}});});}catch{unbalanced=true;}
  check(unbalanced&&await db.financeJournal.count({where:{organisationId,sourceKey:invalidKey}})===0,'Database blocks unbalanced posting and rolls back draft and lines');
  for(const task of await db.financeCloseTask.findMany({where:{organisationId,periodId:period.id}}))await call('completeCloseTask',[task.id],makerCookie,{evidence:'Synthetic completion evidence'});
  await call('setFinancePeriodState',[period.id],makerCookie,{state:'CLOSED',reason:'Synthetic period close'});
  await call('reconcileFinanceStatement',[cash.id,[{documentId:invoice.id,amount:'12000'}]],makerCookie);check(await db.financeJournal.count({where:{organisationId,sourceId:cash.id}})===1,'Reconciliation retry remains safe after closing period');
  const closed=await draft('AR_INVOICE','10');await approve(closed.id);await post('postFinanceDocument',[closed.id],makerCookie);check((await db.financeDocument.findUniqueOrThrow({where:{id:closed.id}})).status==='APPROVED'&&await db.financeJournal.count({where:{organisationId,sourceId:closed.id}})===0,'Closed-period posting leaves approval and ledger unchanged');
  await call('requestFinancePeriodReopen',[],makerCookie,{periodId:period.id,reason:'Synthetic independent reopening'});const reopen=await db.approvalInstance.findFirstOrThrow({where:{organisationId,subjectType:'PERIOD_REOPEN',subjectId:period.id,status:'PENDING'}});
  await post('decideFinancePeriodReopen',[],makerCookie,{approvalId:reopen.id,decision:'APPROVED',reason:'Self decision attempt'});check((await db.financePeriod.findUniqueOrThrow({where:{id:period.id}})).state==='CLOSED','Period requester cannot approve reopening');
  await call('decideFinancePeriodReopen',[],approverCookie,{approvalId:reopen.id,decision:'APPROVED',reason:'Synthetic reopening reviewed'});check((await db.financePeriod.findUniqueOrThrow({where:{id:period.id}})).state==='OPEN','Independent versioned approval reopens period');
  for(const [path,label]of [['/finance/ledger','General ledger'],['/finance/settings','Finance settings'],['/finance/reconcile','Bank reconciliation'],['/finance/collections','Collections'],['/finance/help','Finance help'],[`/finance/journals/${posted.journal.id}`,'Accounting distribution']]){const r=await fetch(`${base}${path}`,{headers:{Cookie:makerCookie},redirect:'manual'}),html=await r.text();check(r.status===200&&html.includes(label),`Authenticated live page ${path}`);}
  const rec=await call('getFinanceSubledgerReconciliation',[entityId],makerCookie);check(rec.body.includes('"difference":"$n0"'),'AR/AP control reconciliation returns zero difference');
  console.log('LIVE FINANCE ERP ACCEPTANCE PASSED');
 }finally{
  for(const id of companies.reverse()){const company=await db.organisation.findUnique({where:{id}});assert(company?.isTest,'Cleanup only verified disposable Test company');await wipeCompany(id);}
  await db.user.deleteMany({where:{id:{in:users}}});await db.$disconnect();console.log('Disposable Finance acceptance records removed.');
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Finance acceptance failed');process.exitCode=1;});
