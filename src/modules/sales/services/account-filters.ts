import {db} from '@/core/db/client';
import {descendantAccountIds} from '@/core/customers/hierarchy';
import {selections} from './view-definition';
import type {SalesFilters} from './list-filters';
/** Expand only server-owned customer identities, retaining the original saved view. */
export async function prepareSalesFilters(organisationId:string,filters:SalesFilters):Promise<SalesFilters>{
 if(filters.customerScope!=='descendants'||!filters.customer)return filters;
 const accounts=await db.party.findMany({where:{organisationId},select:{id:true,parentPartyId:true}}),roots=selections(filters.customer).filter(id=>accounts.some(a=>a.id===id));
 const ids=descendantAccountIds(accounts,roots);return {...filters,customer:ids.length?ids.join(','):'__no_matching_customer__'};
}
