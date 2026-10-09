import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { draftFeedback } from '@/modules/finance/domain/draft-feedback';

describe('Finance draft feedback', () => {
  it('keeps actionable business guidance and translates schema validation', () => {
    expect(draftFeedback(new Error('Choose a shared customer or supplier.'))).toBe('Choose a shared customer or supplier.');
    const validation = z.string().min(1).safeParse('');
    if (!validation.success) expect(draftFeedback(validation.error)).toContain('required fields');
  });
  it('does not disclose a database query or production render digest', () => {
    const failure = new Prisma.PrismaClientKnownRequestError('Private SQL diagnostic', { code: 'P2003', clientVersion: '7' });
    expect(draftFeedback(failure)).not.toContain('Private SQL');
    expect(draftFeedback(Object.assign(new Error('Private render data'), { digest: 'secret' }))).not.toContain('Private');
  });
  it('explains a duplicate source without exposing constraint metadata', () => {
    expect(draftFeedback(new Prisma.PrismaClientKnownRequestError('private', { code: 'P2002', clientVersion: '7' }))).toContain('already been used');
  });
});
