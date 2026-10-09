'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { documentCapability } from './access';
import { createFinanceDocument } from './commands';
import { draftFeedback } from '../domain/draft-feedback';

export async function saveFinanceDraft(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await requireSession();
  assertCapability(session, documentCapability(String((input as { kind?: unknown })?.kind), true));
  try {
    const result = await createFinanceDocument(input);
    return { ok: true, id: result.id };
  } catch (error) {
    return { ok: false, error: draftFeedback(error) };
  }
}
