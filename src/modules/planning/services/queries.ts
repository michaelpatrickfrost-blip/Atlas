'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { getModule } from '@/core/modules/registry';
import { buildCoverage } from '../domain/netting';
import { readAvailability } from '@/modules/stock/services/availability';
/** One server-side projection keeps the desktop from gaining generic Sales table access. */
export async function getPlanningCoverage() {
 const session=await requireSession();
 assertCapability(session,'planning.demand.read');
 await assertModuleEnabled(session,'planning');
 assertCapability(session,'stock.read');
 const inventoryProvider=getModule('stock')?.planningInventoryProvider;
 const demandProvider=getModule('sales')?.planningDemandProvider;
 if(!inventoryProvider||!demandProvider)throw new Error('Planning data providers are unavailable.');
 const [snapshot,demand,chain]=await Promise.all([inventoryProvider(session),demandProvider(session),readAvailability()]);
 const byProduct=new Map(chain.products.map(row=>[row.productId,row]));
 return buildCoverage(snapshot,demand,{incoming:Object.fromEntries(chain.products.map(row=>[row.productId,row.incoming])),delivered:chain.deliveredByLine}).filter(p=>p.orders.length>0).map(row=>{
  const picture=byProduct.get(row.id);
  if(!picture)return row;
  return {...row,incoming:picture.incoming,forecasted:picture.forecasted,available:picture.available,shortage:Math.max(0,-picture.available)};
 });
}
