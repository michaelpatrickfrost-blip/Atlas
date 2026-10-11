'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { revalidatePath } from 'next/cache';
import { HandoffError,readCollection,collectProductionBatch } from '@/modules/stock/services/production-handoff';
import type { FormFeedback } from '@/core/shared/form-feedback';
export async function collectBatch(form:FormData):Promise<void|FormFeedback> {
 const session=await requireSession();
 assertCapability(session,'stock.manage');
 await assertModuleEnabled(session,'stock');
 try { await collectProductionBatch(session,readCollection(form)); }
 catch(error) { if(error instanceof HandoffError)return {error:error.message}; throw error; }
 revalidatePath('/stock','layout');revalidatePath('/manufacturing','layout');revalidatePath('/logistics','layout');revalidatePath('/planning');
}
