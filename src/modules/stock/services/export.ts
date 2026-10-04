'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { inventorySnapshot } from './queries';
import { db } from '@/core/db/client';
export async function inventoryExportRows(type:string,warehouse:string,q:string,focus:string):Promise<Array<Array<string|number>>> {
 const session=await requireSession();
 assertCapability(session,'stock.read');await assertModuleEnabled(session,'stock');
 if(type==='movements') {
  const rows=await db.inventoryMovement.findMany({where:{organisationId:session.organisationId,...(focus==='in'?{delta:{gt:0}}:focus==='out'?{delta:{lt:0}}:{}),...(warehouse?{warehouseId:warehouse}:{}),...(q?{OR:[{product:{code:{contains:q,mode:'insensitive'}}},{product:{name:{contains:q,mode:'insensitive'}}},{reason:{contains:q,mode:'insensitive'}},{reference:{contains:q,mode:'insensitive'}}]}:{})},select:{createdAt:true,delta:true,reason:true,reference:true,product:{select:{code:true,name:true,unitOfMeasure:true}},warehouse:{select:{code:true,name:true}}},orderBy:[{createdAt:'desc'},{id:'desc'}],take:10001});
  if(rows.length>10000)throw new Error('Narrow your filters to export at most 10,000 movements.');
  return [['Recorded UTC','SKU','Product','Warehouse code','Warehouse','Quantity change','Unit','Reason','Reference'],...rows.map(m=>[m.createdAt.toISOString(),m.product.code,m.product.name,m.warehouse.code,m.warehouse.name,m.delta,m.product.unitOfMeasure,m.reason,m.reference??''])];
 }
 const snapshot=await inventorySnapshot(session);
 const warehouses=snapshot.warehouses.filter(w=>!warehouse||w.id===warehouse);
 const rows=snapshot.products.filter(p=>{
  if(q&&!`${p.code} ${p.name}`.toLowerCase().includes(q.toLowerCase()))return false;
  const total=snapshot.balances.filter(b=>b.productId===p.id&&warehouses.some(w=>w.id===b.warehouseId)).reduce((sum,b)=>sum+b.quantity,0);
  return focus==='empty'?total===0:focus==='stocked'?total>0:true;
 }).flatMap(p=>warehouses.map(w=>[p.code,p.name,w.code,w.name,snapshot.balances.find(b=>b.productId===p.id&&b.warehouseId===w.id)?.quantity??0,p.unitOfMeasure]));
 if(rows.length>10000)throw new Error('Narrow your filters to export at most 10,000 stock rows.');
 return [['SKU','Product','Warehouse code','Warehouse','Physical on hand','Unit'],...rows];
}
