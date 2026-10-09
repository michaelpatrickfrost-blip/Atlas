import { ProductKind } from '@/generated/prisma/enums';
import { db } from '@/core/db/client';
import { recordDataset } from '@/core/reports/records';
import { enumText, text, date, boolean } from '@/core/reports/columns';
export const reports=[recordDataset({id:'products.catalogue',name:'Product catalogue',source:'Products',description:'Shared product codes, categories and units. Pricing is managed in its own app.',anyOf:['core.products.read'],dateField:'createdAt',columns:[text('code','Product code'),text('name','Product'),text('categoryCode','Category'),enumText('kind','Kind',Object.values(ProductKind)),text('unitOfMeasure','Unit'),boolean('active','Active'),date('createdAt','Created')]},
(s,w,take,skip)=>db.product.findMany({where:{AND:[{organisationId:s.organisationId},w]},select:{code:true,name:true,categoryCode:true,kind:true,unitOfMeasure:true,active:true,createdAt:true},orderBy:[{code:'asc'},{id:'asc'}],take,skip}),
(s,w)=>db.product.count({where:{AND:[{organisationId:s.organisationId},w]}}),r=>({...r}))];
