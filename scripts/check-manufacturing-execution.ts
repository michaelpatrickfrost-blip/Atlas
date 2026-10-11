/** Exact central Test acceptance. Runs only after the Decimal rollback bridge is accepted. */
import assert from 'node:assert/strict';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import { db } from '../src/core/db/client';
import type { Session } from '../src/core/auth/session';
import { encodeWire, decodeWire } from '../src/core/desktop/wire';
import { openBooks } from '../src/modules/finance/services/books';
import { addQuantity } from '../src/core/shared/quantity';

export async function checkManufacturingExecution({context,page,session,out}:{context:BrowserContext;page:Page;session:Session;out:string}) {
 const organisationId=session.organisationId,userId=session.userId;
 assert(await db.organisation.findFirst({where:{id:organisationId,isTest:true,kind:'CUSTOMER'}}));
 const guards=await db.$queryRaw<{count:bigint}[]>`SELECT count(*) FROM pg_constraint WHERE conname LIKE 'atlas_quantity_bridge_%' AND connamespace='public'::regnamespace`;
 if(Number(guards[0].count)){console.log('PASS Decimal bridge release retains whole-quantity rollback guards; fractional execution acceptance awaits final unlock.');return;}
 const call=async<T=unknown>(key:string,args:unknown[],error?:RegExp):Promise<T>=>{
  const response=await context.request.post('/api/desktop/action',{headers:{'x-atlas-client':'desktop'},data:{action:key,args:await encodeWire(args)}});
  const body=await response.json();const value=decodeWire(body.value) as T & {error?:string};
  if(error){assert.match(body.error??value?.error??'',error);return value;}
  assert.equal(response.status(),200,body.error??key);assert(!value?.error,value?.error);return value;
 };
 const command=<T=unknown>(action:string,args:unknown[],error?:RegExp)=>call<T>(`src/modules/manufacturing/services/commands:${action}`,args,error);
 const form=(data:Record<string,string|number|string[]>)=>{const result=new FormData();for(const[key,value]of Object.entries(data))for(const item of Array.isArray(value)?value:[value])result.append(key,String(item));return result;};
 const settings=(action:string,data:Record<string,string|number|string[]>,error?:RegExp)=>call(`src/modules/finance/services/manufacturing-settings:${action}`,[form(data)],error);
 const adjust=(data:Record<string,string|number>,error?:RegExp)=>call('src/app/(app)/stock/actions:adjustStock',[form(data)],error);
 const warehouse=await db.warehouse.create({data:{organisationId,code:'EXACT',name:'Exact production · Test'}});
 const yard=await db.stockLocation.create({data:{organisationId,warehouseId:warehouse.id,code:'YARD',name:'Collected stock · Test'}});
 const raw=await db.product.create({data:{organisationId,code:'MASS-RAW',name:'Weighed raw material · Test',itemClass:'RAW',sellable:false,unitOfMeasure:'kg',trackingMode:'LOT',basePriceAmount:999999}});
 const output=await db.product.create({data:{organisationId,code:'MASS-FIN',name:'Weighed finished product · Test',unitOfMeasure:'kg',trackingMode:'LOT',basePriceAmount:999999}});
 const recipe=await db.productDefinition.create({data:{organisationId,productId:output.id,version:1,status:'ACTIVE',supply:'MAKE',batchQuantity:1,yieldPercent:100,createdByUserId:userId}});
 await db.productBomLine.create({data:{organisationId,definitionId:recipe.id,componentProductId:raw.id,quantityPerUnit:2,enteredQuantityPerUnit:0.002,enteredUnit:'t',baseUnit:'kg',conversionFactor:'1000'}});
 await db.productOperation.create({data:{organisationId,definitionId:recipe.id,position:1,name:'Make by weight',machineMinorPerHour:1200,labourMinorPerHour:1800,overheadMinorPerHour:600}});
 const opening={mode:'add',productId:raw.id,warehouseId:warehouse.id,quantity:1.000125,enteredUnit:'t',lotCode:'RAW-MASS-01',reason:'Exact central Test opening',requestKey:'exact-opening'};
 await adjust(opening);await adjust(opening);await adjust({...opening,quantity:1.1},/reference.*different|different details/);
 const balance=()=>db.inventoryBalance.findUniqueOrThrow({where:{warehouseId_productId:{warehouseId:warehouse.id,productId:raw.id}}});
 assert.equal((await balance()).quantity.toString(),'1000.125');assert.equal(await db.inventoryMovement.count({where:{organisationId,requestKey:'exact-opening'}}),1);
 const entered=await db.inventoryMovement.findFirstOrThrow({where:{organisationId,requestKey:'exact-opening'}});assert.equal(entered.enteredQuantity?.toString(),'1.000125');assert.equal(entered.enteredUnit,'t');assert.equal(entered.conversionFactor?.toString(),'1000');
 console.log('PASS real receive: 1.000125 metric tonnes = 1000.125 kg, frozen conversion and one movement on replay; conflicting replay refused.');
 const year=new Date().getUTCFullYear();
 const entity=await db.$transaction(tx=>openBooks(tx,{organisationId,name:'Exact manufacturing books · Test',code:'EXACT',currency:'GBP',startAt:new Date(Date.UTC(year,0,1)),endAt:new Date(Date.UTC(year+1,11,31)),actorUserId:userId}));
 const chart=await db.financeAccount.findMany({where:{organisationId,entityId:entity.id}});
 const account=(control:string)=>{const row=chart.find(row=>row.control===control);assert(row);return row.id;};
 const wip=await db.financeAccount.create({data:{organisationId,entityId:entity.id,code:'1210',name:'Manufacturing WIP · Test',type:'ASSET'}});
 const cogs=await db.financeAccount.create({data:{organisationId,entityId:entity.id,code:'5010',name:'Cost of sales · Test',type:'EXPENSE'}});
 const scrap=await db.financeAccount.create({data:{organisationId,entityId:entity.id,code:'5020',name:'Scrap · Test',type:'EXPENSE'}});
 const profile={warehouseId:warehouse.id,entityId:entity.id,inventoryAccountId:account('INVENTORY'),wipAccountId:wip.id,cogsAccountId:cogs.id,scrapAccountId:scrap.id,absorptionAccountId:account('EXPENSE'),openingAccountId:account('EQUITY'),energyRate:'0.30',approvedDefinitionIds:[recipe.id]};
 await settings('saveManufacturingProfile',profile);
 await settings('reconcileOpeningStockValue',{warehouseId:warehouse.id,productId:raw.id,totalValue:'250.00',requestKey:'exact-value-opening',reason:'Reviewed full Test quantity and carrying value'});
 const create=async(productId:string,definitionId:string,quantity:number)=>{
  const order=await command<{id:string}>('createProductionOrder',[{productId,definitionId,warehouseId:warehouse.id,quantity}]);
  await command('markOrderReady',[order.id]);await command('releaseOrder',[order.id]);
  const work=await db.manufacturingWorkOrder.findFirstOrThrow({where:{organisationId,productionOrderId:order.id},orderBy:{sequence:'asc'}});return{order,work};
 };
 const {order,work}=await create(output.id,recipe.id,2.5);
 await command('startWorkOrder',[work.id,'exact-start']);
 await settings('recordProductionUsage',{workOrderId:work.id,machineMinutes:60,personMinutes:30,energyKwh:2,requestKey:'exact-usage'});
 await settings('recordProductionUsage',{workOrderId:work.id,machineMinutes:60,personMinutes:30,energyKwh:2,requestKey:'exact-usage'});
 const usage=await db.financeManufacturingValueEntry.findFirstOrThrow({where:{organisationId,productionOrderId:order.id,kind:'USAGE'}});assert.equal(usage.wipMinor,2760n);
 const rawHold=await db.qualityHold.create({data:{organisationId,productId:raw.id,lotCode:'RAW-MASS-01',warehouseId:warehouse.id,quantity:0.001,number:'QH-EXACT-RAW',reason:'Central Test transaction rollback probe',placedByUserId:userId}});
 await command('completeWorkOrder',[work.id,1,0.25,'exact-held-output',{finish:false,lotCode:'FIN-REFUSED'}],/stock|available|hold/i);
 assert.equal(await db.manufacturingProductionReport.count({where:{organisationId,productionOrderId:order.id}}),0);assert.equal((await balance()).quantity.toString(),'1000.125');assert.equal((await db.manufacturingWorkOrder.findFirstOrThrow({where:{organisationId,id:work.id}})).producedQuantity.toString(),'0');
 await db.qualityHold.update({where:{id:rawHold.id},data:{status:'RELEASED',releasedByUserId:userId,releasedAt:new Date()}});
 console.log('PASS held components refuse output atomically: no report, output, issue, cost or progress is committed.');
 const report=[work.id,1,0.25,'exact-partial',{finish:false,lotCode:'FIN-PART-01'}];
 await command('completeWorkOrder',report);await command('completeWorkOrder',report);await command('completeWorkOrder',[work.id,1.1,0.25,'exact-partial',{finish:false,lotCode:'FIN-PART-01'}],/different/);
 assert.equal(await db.manufacturingProductionReport.count({where:{organisationId,productionOrderId:order.id}}),1);
 assert.equal((await db.manufacturingOrder.findFirstOrThrow({where:{organisationId,id:order.id}})).status,'RUNNING');
 assert.equal((await balance()).quantity.toString(),'997.625');
 const costRows=()=>db.financeManufacturingValueEntry.findMany({where:{organisationId,productionOrderId:order.id}});
 const partial=await costRows();assert(partial.reduce((sum,row)=>sum+row.wipMinor,0n)>0n,'Partial output leaves actual costs in WIP');
 const firstBatch=await db.stockProductionBatch.findFirstOrThrow({where:{organisationId,manufacturingOrderId:order.id}});
 assert.equal(firstBatch.quantity.toString(),'1');assert.equal(await db.stockPosition.count({where:{organisationId,productId:output.id,status:'AVAILABLE',quantity:{gt:0}}}),0);
 const collection={batchId:firstBatch.id,version:firstBatch.version,quantity:0.75,locationId:yard.id,requestKey:'exact-collect-01',note:'Actual first partial collection'};
 const collect=(data:Record<string,string|number>,error?:RegExp)=>call('src/app/(app)/stock/handoffs/actions:collectBatch',[form(data)],error);
 const hold=await db.qualityHold.create({data:{organisationId,productId:output.id,lotCode:firstBatch.lotCode,warehouseId:warehouse.id,quantity:0.25,reason:'Isolated batch QA blocker',number:'QH-EXACT-OUTPUT',placedByUserId:userId}});
 await collect(collection,/hold|Quality|quality/);assert.equal(await db.stockProductionCollection.count({where:{organisationId,batchId:firstBatch.id}}),0);
 await db.qualityHold.update({where:{id:hold.id},data:{status:'RELEASED',releasedByUserId:userId,releasedAt:new Date()}});
 await collect(collection);await collect(collection);
 assert.equal((await db.stockProductionBatch.findFirstOrThrow({where:{organisationId,id:firstBatch.id}})).collectedQuantity.toString(),'0.75');
 await collect({...collection,requestKey:'exact-stale',quantity:0.1},/changed|Refresh|refresh/);
 await command('completeWorkOrder',[work.id,1.25,0,'exact-finish',{finish:true,lotCode:'FIN-PART-02',createBackorder:true}]);
 assert.equal((await db.manufacturingOrder.findFirstOrThrow({where:{organisationId,id:order.id}})).status,'COMPLETE');
 assert.equal((await balance()).quantity.toString(),'995.125');
 assert.equal((await db.manufacturingOrder.findFirstOrThrow({where:{organisationId,originOrderId:order.id}})).quantity.toString(),'0.25');
 const closed=await costRows();assert.equal(closed.reduce((sum,row)=>sum+row.wipMinor,0n),0n);
 const materials=closed.filter(row=>row.kind==='MATERIAL').reduce((sum,row)=>sum+row.wipMinor,0n);
 assert.equal(materials,125n);assert.equal(closed.filter(row=>row.kind==='OUTPUT').reduce((sum,row)=>sum+row.inventoryMinor+row.expenseMinor,0n),materials+2760n);
 await settings('recordProductionUsage',{workOrderId:work.id,machineMinutes:60,personMinutes:30,energyKwh:2,requestKey:'exact-usage'});assert.equal(await db.financeManufacturingValueEntry.count({where:{organisationId,productionOrderId:order.id,kind:'USAGE'}}),1);
 const batchCount=await db.stockProductionBatch.count({where:{organisationId,manufacturingOrderId:order.id}});assert.equal(batchCount,2);
 const uses=await db.manufacturingMaterialUse.findMany({where:{organisationId,report:{productionOrderId:order.id}}});assert.equal(uses.reduce((sum,row)=>addQuantity(sum,Number(row.quantity)),0),5);assert(uses.every(row=>row.stockAllocationId));
 await collect({...collection,version:firstBatch.version+1,quantity:0.25,requestKey:'exact-collect-02'});
 const secondBatch=await db.stockProductionBatch.findFirstOrThrow({where:{organisationId,manufacturingOrderId:order.id,id:{not:firstBatch.id}}});
 await collect({...collection,batchId:secondBatch.id,version:secondBatch.version,quantity:1.25,requestKey:'exact-collect-03'});
 console.log('PASS real partial production: 2.5 kg input → 2.25 kg good / 0.25 kg loss, linked replacement, two held output batches, Quality/stale/replay collection guards, 5 kg of actual component genealogy and zero final WIP.');
 // Actual dispatch uses a synthetic picked/packed source, then the production stock/Finance transaction.
 const party=await db.party.create({data:{organisationId,kind:'COMPANY',name:'Exact dispatch customer · Test',customerCode:'EXACT-CUST'}});
 const sales=await db.salesOrder.create({data:{organisationId,partyId:party.id,reference:'EXACT-SO',ownerUserId:userId,lines:{create:{lineNumber:1,productId:output.id,descriptionSnapshot:output.name,orderedQuantity:0.5,unitOfMeasure:'kg',unitPriceAmount:1000,netAmount:500}}},include:{lines:true}});
 const requirement=await db.fulfilmentRequirement.create({data:{organisationId,partyId:party.id,salesOrderId:sales.id,reference:'EXACT-FR',sourceEventKey:'exact-fr',shipTo:{},warehouseId:warehouse.id,lines:{create:{organisationId,salesOrderLineId:sales.lines[0].id,productId:output.id,description:output.name,orderedQuantity:0.5,pickedQuantity:0.5,packedQuantity:0.5,unitOfMeasure:'kg'}}},include:{lines:true}});
 const shipment=await db.shipment.create({data:{organisationId,partyId:party.id,reference:'EXACT-SH',shipTo:{},status:'READY',sources:{create:{organisationId,requirementId:requirement.id,salesOrderId:sales.id,fulfilmentLineId:requirement.lines[0].id,quantity:0.5}},packages:{create:{organisationId,reference:'EXACT-PKG',packageType:'BOX',contents:{create:{organisationId,fulfilmentLineId:requirement.lines[0].id,productId:output.id,description:output.name,quantity:0.5,lotCode:firstBatch.lotCode}}}}}});
 const beforeDispatch=await db.financeStockValue.findFirstOrThrow({where:{organisationId,warehouseId:warehouse.id,productId:output.id}});
 await call('src/app/(app)/logistics/actions:dispatchAction',[shipment.id,'exact-dispatch']);await call('src/app/(app)/logistics/actions:dispatchAction',[shipment.id,'exact-dispatch']);
 const afterDispatch=await db.financeStockValue.findFirstOrThrow({where:{organisationId,warehouseId:warehouse.id,productId:output.id}});assert.equal(afterDispatch.quantity.toString(),'1.75');assert(afterDispatch.valueMinor<beforeDispatch.valueMinor);
 const expense=await db.financeManufacturingValueEntry.findFirstOrThrow({where:{organisationId,productId:output.id,kind:'ISSUE'}});assert.equal(expense.expenseMinor,beforeDispatch.valueMinor-afterDispatch.valueMinor);
 assert(await db.financeJournalLine.findFirst({where:{organisationId,journalId:expense.journalId!,accountId:cogs.id,debit:expense.expenseMinor}}));
 assert.equal(await db.inventoryMovement.count({where:{organisationId,shipmentId:shipment.id,delta:{lt:0}}}),1);
 const secondWarehouse=await db.warehouse.create({data:{organisationId,code:'EXACT-DEST',name:'Exact transfer destination · Test'}});
 await settings('saveManufacturingProfile',{...profile,warehouseId:secondWarehouse.id});
 const transfer=form({productId:raw.id,fromWarehouseId:warehouse.id,toWarehouseId:secondWarehouse.id,quantity:0.125,enteredUnit:'kg',lotCode:'RAW-MASS-01',reason:'Central Test valued transfer',requestKey:'exact-transfer'});
 const totalBefore=(await db.financeStockValue.findMany({where:{organisationId,productId:raw.id}})).reduce((sum,row)=>sum+row.valueMinor,0n);
 await call('src/app/(app)/stock/actions:transferStock',[transfer]);await call('src/app/(app)/stock/actions:transferStock',[transfer]);
 const transferValues=await db.financeStockValue.findMany({where:{organisationId,productId:raw.id}});assert.equal(transferValues.reduce((sum,row)=>sum+row.valueMinor,0n),totalBefore);assert.equal(transferValues.find(row=>row.warehouseId===secondWarehouse.id)?.quantity.toString(),'0.125');assert.equal(await db.internalMove.count({where:{organisationId,requestKey:'exact-transfer'}}),1);
 console.log('PASS real fractional transfer preserves batch and total carrying value, moving 0.125 kg once between accounting warehouses.');
 console.log('PASS actual fractional dispatch takes the packed output batch once and posts Inventory → Cost of sales in the same stock transaction.');
 // Serial identity requires whole units and actual manual component selections.
 const serialRaw=await db.product.create({data:{organisationId,code:'SERIAL-RAW',name:'Serial component · Test',unitOfMeasure:'each',trackingMode:'SERIAL',basePriceAmount:999999}});
 const serialOutput=await db.product.create({data:{organisationId,code:'SERIAL-OUT',name:'Serial finished product · Test',unitOfMeasure:'each',trackingMode:'SERIAL',basePriceAmount:999999}});
 await adjust({mode:'add',productId:serialRaw.id,warehouseId:warehouse.id,quantity:1.5,serials:'SERIAL-IN-01 SERIAL-IN-02',reason:'Invalid serial fraction probe',requestKey:'serial-invalid'},/whole|serial/i);
 assert.equal(await db.inventoryMovement.count({where:{organisationId,productId:serialRaw.id}}),0);
 await adjust({mode:'add',productId:serialRaw.id,warehouseId:warehouse.id,quantity:2,lotCode:'SERIAL-RAW-LOT',serials:'SERIAL-IN-01 SERIAL-IN-02',reason:'Actual serial Test opening',requestKey:'serial-opening'});
 await settings('reconcileOpeningStockValue',{warehouseId:warehouse.id,productId:serialRaw.id,totalValue:'2.00',requestKey:'serial-value',reason:'Reviewed serial Test opening'});
 const serialRecipe=await db.productDefinition.create({data:{organisationId,productId:serialOutput.id,status:'ACTIVE',version:1,supply:'MAKE',batchQuantity:1,yieldPercent:100,createdByUserId:userId}});
 await db.productBomLine.create({data:{organisationId,definitionId:serialRecipe.id,componentProductId:serialRaw.id,quantityPerUnit:1}});
 await db.productOperation.create({data:{organisationId,definitionId:serialRecipe.id,position:1,name:'Assemble actual serials'}});
 await settings('saveManufacturingProfile',{...profile,approvedDefinitionIds:[recipe.id,serialRecipe.id]});
 const serialOrder=await create(serialOutput.id,serialRecipe.id,2);await command('startWorkOrder',[serialOrder.work.id,'serial-start']);
 for(const index of [1,2]){
  const serial=String(index).padStart(2,'0');
  await call('src/modules/manufacturing/services/materials:issueProductionMaterial',[form({workOrderId:serialOrder.work.id,productId:serialRaw.id,quantity:1,lotCode:'SERIAL-RAW-LOT',serials:`SERIAL-IN-${serial}`,requestKey:`serial-issue-${index}`,reason:'Actual selected component identity'})]);
  await command('completeWorkOrder',[serialOrder.work.id,1,0,`serial-output-${index}`,{finish:index===2,lotCode:`SERIAL-OUT-LOT-${index}`,serials:[`SERIAL-OUT-${serial}`]}]);
 }
 const serialBatches=await db.stockProductionBatch.findMany({where:{organisationId,manufacturingOrderId:serialOrder.order.id},orderBy:{createdAt:'asc'}});assert.equal(serialBatches.length,2);
 await collect({...collection,batchId:serialBatches[0].id,version:serialBatches[0].version,quantity:1,serials:'SERIAL-OUT-02',requestKey:'serial-collect-invalid'},/serial|batch/i);
 await collect({...collection,batchId:serialBatches[0].id,version:serialBatches[0].version,quantity:1,serials:'SERIAL-OUT-01',requestKey:'serial-collect'});
 assert.equal((await db.stockSerial.findFirstOrThrow({where:{organisationId,productId:serialOutput.id,serial:'SERIAL-OUT-01'}})).locationId,yard.id);
 const serialUses=await db.manufacturingMaterialUse.findMany({where:{organisationId,report:{productionOrderId:serialOrder.order.id}},include:{stockAllocation:true}});assert.deepEqual(serialUses.flatMap(row=>row.stockAllocation?.serials??[]).sort(),['SERIAL-IN-01','SERIAL-IN-02']);
 await page.goto('/manufacturing/traceability?search=SERIAL-OUT-01',{waitUntil:'networkidle'});await expect(page.getByText('SERIAL-OUT-LOT-1',{exact:true})).toBeVisible();
 console.log('PASS actual serial production: fractional identity rejected, selected component serials linked to two partial output batches, wrong collection identity refused and correct physical serial booked.');
 // Compatible products share one finite machine booking and one actual usage journal.
 const centre=await db.manufacturingWorkCentre.create({data:{organisationId,code:'MIXED',name:'Mixed processing · Test'}});
 const machine=await db.manufacturingResource.create({data:{organisationId,workCentreId:centre.id,name:'Shared batch machine · Test',type:'MACHINE',processKind:'BATCH_OVEN',calendarMode:'CONTINUOUS',timezone:'Europe/London',loadCapacity:300,loadUnit:'kg',processProfiles:['PROFILE-A']}});
 const mixed:Array<{product:typeof output;recipe:typeof recipe;quantity:number}>=[];
 for(const [code,quantity,footprint]of [['MIX-A',10,20],['MIX-B',5,10]]as const){
  const product=await db.product.create({data:{organisationId,code,name:`${code} · Test`,unitOfMeasure:'each',trackingMode:'LOT',basePriceAmount:999999}});
  const definition=await db.productDefinition.create({data:{organisationId,productId:product.id,status:'ACTIVE',version:1,supply:'MAKE',batchQuantity:1,yieldPercent:100,createdByUserId:userId}});
  await db.productBomLine.create({data:{organisationId,definitionId:definition.id,componentProductId:raw.id,quantityPerUnit:2}});
  await db.productOperation.create({data:{organisationId,definitionId:definition.id,position:1,name:'Shared cycle',workCentreId:centre.id,resourceId:machine.id,eligibleResourceIds:[machine.id],timingMode:'BATCH',batchCapacity:100,cycleMinutes:60,coolingMinutes:0,processProfile:'PROFILE-A',loadUnit:'kg',loadPerUnit:footprint,machineMinorPerHour:1200,labourMinorPerHour:1800,overheadMinorPerHour:600}});
  mixed.push({product,recipe:definition,quantity});
 }
 await settings('saveManufacturingProfile',{...profile,approvedDefinitionIds:[recipe.id,serialRecipe.id,...mixed.map(row=>row.recipe.id)]});
 const members=[];for(const row of mixed)members.push(await create(row.product.id,row.recipe.id,row.quantity));
 const loadInput={resourceId:machine.id,workOrderIds:members.map(row=>row.work.id),earliestStart:new Date(Date.now()-1000).toISOString()};
 const loadAction=<T=unknown>(action:string,args:unknown[],error?:RegExp)=>call<T>(`src/modules/manufacturing/services/machine-loads:${action}`,args,error);
 const preview=await loadAction<{fingerprint:string;start:string;end:string;occupiedCapacity:number}>('previewMachineLoad',[loadInput]);assert.equal(preview.occupiedCapacity,250);
 const load=await loadAction<{id:string}>('createMachineLoad',[loadInput,preview.fingerprint]);
 const booked=await db.manufacturingWorkOrder.findMany({where:{organisationId,machineLoadId:load.id}});assert.equal(new Set(booked.map(row=>`${row.scheduledStart?.toISOString()}:${row.scheduledEnd?.toISOString()}`)).size,1);assert.equal(new Date(preview.end).getTime()-new Date(preview.start).getTime(),60*60000);
 await loadAction('startMachineLoad',[load.id]);
 await settings('recordMachineLoadUsage',{loadId:load.id,machineMinutes:60,personMinutes:30,energyKwh:1,requestKey:'exact-load-usage'});await settings('recordMachineLoadUsage',{loadId:load.id,machineMinutes:60,personMinutes:30,energyKwh:1,requestKey:'exact-load-usage'});
 const shared=await db.financeManufacturingValueEntry.findMany({where:{organisationId,kind:'LOAD_USAGE',productionOrderId:{in:members.map(row=>row.order.id)}}});assert.equal(shared.length,2);assert.equal(shared.reduce((sum,row)=>sum+row.wipMinor,0n),2730n);assert.deepEqual(shared.map(row=>row.wipMinor).sort((a,b)=>Number(a-b)),[546n,2184n]);assert.equal(new Set(shared.map(row=>row.journalId)).size,1);
 for(const[row,index]of members.map((row,index)=>[row,index]as const))await command('completeWorkOrder',[row.work.id,mixed[index].quantity,0,`exact-mixed-${index}`,{finish:true,lotCode:`MIX-OUTPUT-${index}`}]);
 assert.equal((await db.manufacturingMachineLoad.findFirstOrThrow({where:{organisationId,id:load.id}})).status,'COMPLETE');
 const mixedCosts=await db.financeManufacturingValueEntry.findMany({where:{organisationId,productionOrderId:{in:members.map(row=>row.order.id)}}});assert.equal(mixedCosts.reduce((sum,row)=>sum+row.wipMinor,0n),0n);
 console.log('PASS actual mixed products: 250/300 kg compatible load, one 60-minute booking/cycle, one shared usage journal, exact 80%/20% cost allocation and zero completed WIP.');
 // All posted manufacturing journals balance, independent of their component rounding.
 const journals=await db.financeJournal.findMany({where:{organisationId,entityId:entity.id,status:'POSTED'},include:{lines:true}});assert(journals.length>8);for(const journal of journals)assert.equal(journal.lines.reduce((sum,line)=>sum+line.debit-line.credit,0n),0n);
 const rawLot=await db.stockLot.findFirstOrThrow({where:{organisationId,productId:raw.id,code:'RAW-MASS-01'}});
 await page.goto(`/manufacturing/traceability?lot=${rawLot.id}`,{waitUntil:'networkidle'});await expect(page.getByRole('heading',{name:'Batch traceability',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:/FIN-PART-01/}).first()).toBeVisible();await page.screenshot({path:`${out}/exact-traceability.png`});
 for(const [path,title]of [[`/finance/manufacturing?warehouse=${warehouse.id}&entity=${entity.id}`,'Manufacturing costs'],['/manufacturing/machine-loads','Machine loads'],[`/manufacturing/produce/${order.id}`,null],['/stock/handoffs','Finished batches, ready to collect.']]as const){
  assert.equal((await page.goto(path,{waitUntil:'networkidle'}))?.status(),200);if(title)await expect(page.getByRole('heading',{name:title,exact:true}).last()).toBeVisible();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 console.log('PASS actual genealogy/cost/holding/load pages and every manufacturing journal balances to the penny.');
}
