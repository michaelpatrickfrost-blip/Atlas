import { Prisma } from '@/generated/prisma/client';
import { ZodError } from 'zod';

/** Return business guidance without exposing database/request diagnostics. */
export function draftFeedback(error: unknown): string {
  if (error instanceof ZodError) return 'Check the required fields and line values before saving.';
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 'This source has already been used. Open the existing document before creating another.';
    if (error.code === 'P2025') return 'A selected record is no longer available to your profile. Review the source and selections.';
    if (error.code === 'P2034') return 'Another change was made at the same time. Review the latest source before trying again.';
    return 'The draft could not be saved. Your entries are retained; retry or ask your administrator to review the source links.';
  }
  if (error instanceof Error && error.constructor === Error && !('digest' in error)) {
    if (error.message === 'FORBIDDEN') return 'Your profile does not have permission for this action.';
    if (error.message.length > 0 && error.message.length <= 1000) return error.message;
  }
  return 'The draft could not be saved. Your entries are retained; reload the source if the problem continues.';
}
