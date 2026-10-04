import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { db } from '@/core/db/client';
import type { InventorySnapshot } from '@/core/planning/types';
import type { Session } from '@/core/auth/session';
export async function inventorySnapshot(session:Session):Promise<InventorySnapshot> {
 assertCapability(session,'stock.read');
 await assertModuleEnabled(session,'stock');
 const organisationId=session.organisationId;
 const [products,places,balances,sites]=await Promise.all([
  db.product.findMany({where:{organisationId,kind:'PRODUCT'},select:{id:true,code:true,name:true,unitOfMeasure:true,active:true,categoryCode:true,itemClass:true},orderBy:{name:'asc'}}),
  db.warehouse.findMany({where:{organisationId},select:{id:true,code:true,name:true,kind:true,siteId:true,site:{select:{name:true}}},orderBy:{name:'asc'}}),
  db.inventoryBalance.findMany({where:{organisationId},select:{id:true,productId:true,warehouseId:true,quantity:true}}),
  db.site.findMany({where:{organisationId},select:{id:true,code:true,name:true},orderBy:{name:'asc'}}),
 ]);
 const warehouses=places.map(place=>({id:place.id,code:place.code,name:place.name,kind:place.kind,siteId:place.siteId,siteName:place.site?.name??null}));
 return {products,warehouses,balances,sites};
}
export async function readInventory() {
 const session=await requireSession();
 assertCapability(session,'stock.read');
 return {session,...await inventorySnapshot(session)};
}
