"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {persistBusinessProduct,saveProductMeasures} from '@/core/products/save';
import {addStarterCategories,retireProductCategory,saveProductCategory,saveProductDetails,saveProductLinks,saveProductPack} from '@/core/products/catalogue';
import {revalidatePath} from 'next/cache';
function refreshCatalogue(){revalidatePath('/products');revalidatePath('/stock');revalidatePath('/pricing');}
export async function saveProduct(form:FormData){
 const session=await requireSession();
 assertCapability(session,'core.products.manage');
 await persistBusinessProduct(session,form);refreshCatalogue();
}
export async function saveProductRecord(productId:string,input:Parameters<typeof saveProductDetails>[2]){
 const session=await requireSession();
 await saveProductDetails(session,productId,input);refreshCatalogue();
}
export async function saveCategory(input:Parameters<typeof saveProductCategory>[1]){
 const session=await requireSession();
 await saveProductCategory(session,input);refreshCatalogue();
}
export async function retireCategory(categoryId:string){
 const session=await requireSession();
 await retireProductCategory(session,categoryId);refreshCatalogue();
}
export async function addStandardCategories(){
 const session=await requireSession();
 const added=await addStarterCategories(session);refreshCatalogue();return added;
}
export async function savePack(productId:string,input:Parameters<typeof saveProductPack>[2]){
 const session=await requireSession();
 await saveProductPack(session,productId,input);refreshCatalogue();
}
export async function saveLinks(productId:string,links:Parameters<typeof saveProductLinks>[2]){
 const session=await requireSession();
 await saveProductLinks(session,productId,links);refreshCatalogue();
}
export async function saveMeasures(productId:string,input:Parameters<typeof saveProductMeasures>[2]){
 const session=await requireSession();
 assertCapability(session,'core.products.manage');
 await saveProductMeasures(session,productId,input);revalidatePath('/products');revalidatePath('/stock');
}
