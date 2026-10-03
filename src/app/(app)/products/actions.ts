"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {persistBusinessProduct} from '@/core/products/save';
import {revalidatePath} from 'next/cache';
export async function saveProduct(form:FormData){
 const session=await requireSession();
 assertCapability(session,'core.products.manage');
 await persistBusinessProduct(session,form);revalidatePath('/products');revalidatePath('/stock/products');
}
