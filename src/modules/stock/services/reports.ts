import { db } from '@/core/db/client';
import { recordDataset } from '@/core/reports/records';
import { text, date, integer } from '@/core/reports/columns';
const columns=[text('productCode','Product code','product.code'),text('product','Product','product.name'),text('warehouseCode','Warehouse code','warehouse.code'),text('warehouse','Warehouse','warehouse.name'),text('unit','Unit','product.unitOfMeasure')];
const include={product:{select:{code:true,name:true,unitOfMeasure:true}},warehouse:{select:{code:true,name:true}}};
export const reports=[
recordDataset({id:'stock.balances',name:'Stock balances',source:'Inventory',description:'Current recorded stock balances by product and warehouse, not historical snapshots.',anyOf:['stock.read'],columns:[...columns,integer('quantity','Quantity','quantity')]},
(s,w,take,skip)=>db.inventoryBalance.findMany({where:{AND:[{organisationId:s.organisationId},w]},include,orderBy:{id:'asc'},take,skip}),
(s,w)=>db.inventoryBalance.count({where:{AND:[{organisationId:s.organisationId},w]}}),r=>({productCode:r.product.code,product:r.product.name,warehouseCode:r.warehouse.code,warehouse:r.warehouse.name,unit:r.product.unitOfMeasure,quantity:r.quantity})),
recordDataset({id:'stock.movements',name:'Stock movements',source:'Inventory',description:'Recorded inventory movements and reasons; dates use UTC.',anyOf:['stock.read'],dateField:'createdAt',columns:[...columns,integer('delta','Quantity change','delta'),text('reason','Reason'),text('reference','Reference'),date('createdAt','Movement date')]},
(s,w,take,skip)=>db.inventoryMovement.findMany({where:{AND:[{organisationId:s.organisationId},w]},include,orderBy:[{createdAt:'desc'},{id:'asc'}],take,skip}),
(s,w)=>db.inventoryMovement.count({where:{AND:[{organisationId:s.organisationId},w]}}),r=>({productCode:r.product.code,product:r.product.name,warehouseCode:r.warehouse.code,warehouse:r.warehouse.name,unit:r.product.unitOfMeasure,delta:r.delta,reason:r.reason,reference:r.reference,createdAt:r.createdAt}))];
