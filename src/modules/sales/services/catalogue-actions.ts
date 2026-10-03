"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {persistBusinessProduct} from '@/core/products/save';
import {revalidatePath} from 'next/cache';
export async function createSalesCatalogueProduct(mode:'order'|'quote',form:FormData){
 const session=await requireSession();
 assertCapability(session,'core.products.manage');
 assertCapability(session,mode==='order'?'sales.order.create':'sales.quote.create');await assertModuleEnabled(session,'sales');
 const product=await persistBusinessProduct(session,form);revalidatePath('/products');revalidatePath('/stock/products');
 return {id:product.id,name:product.name};
}
