'use server';
import { createContract, sendContract } from '@/core/contracts/actions';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function createDealContract(form:FormData){
 const session=await requireSession();assertCapability(session,'core.contract.manage');
 const to=String(form.get('to')??'').trim();if(to){assertCapability(session,'core.email.send');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))throw new Error("Enter the signer's email address.");}
 const c=await createContract(form);revalidatePath('/crm/contracts');revalidatePath('/crm/opportunities','layout');
 // A failed email leaves a reviewable draft instead of encouraging a duplicate creation.
 if(to){const send=new FormData();send.set('id',c.id);send.set('to',to);send.set('accountId',String(form.get('accountId')??''));send.set('validDays',String(form.get('validDays')??'30'));try{await sendContract(send);}catch{redirect(`/crm/contracts/${c.id}?email=failed`);}}
 redirect(`/crm/contracts/${c.id}`);
}
