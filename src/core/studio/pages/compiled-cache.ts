import { z } from 'zod';
import { checksum as digest } from '../registry/contracts';
import { pageApprovalsSchema, type PageApprovals } from './approvals';
import { compilePage, type CompiledPagePlan } from './compiler';
import { pagePayloadSchema } from './schema';

export const PAGE_COMPILED_CACHE_MAX_ENTRIES = 100;
export const PAGE_COMPILED_CACHE_TTL_MS = 5 * 60 * 1000;
const identitySchema = z.strictObject({ organisationId: z.string().min(1).max(100),
  versionId: z.uuid().transform(value => value.toLowerCase()), checksum: z.string().regex(/^[a-f0-9]{64}$/) });
export type CompiledPageCacheInput = { organisationId: string; versionId: string; checksum: string; payload: unknown; approvals: PageApprovals };
type Entry = { expiresAt: number; plan: CompiledPagePlan };
// Process memory only; no record values, sessions, grants, query results or disk.
const entries = new Map<string, Entry>();
function incompatible(): never { throw new Error('DEPENDENCY_BROKEN: compiled screen does not match its published version.'); }

/** Pure metadata optimisation, NEVER an authorisation or immutable-pin loader.
 * Caller must supply server tenant/version/seal and freshly reconstructed approved
 * metadata after genuine current owner/module checks. All ordinary record/field/
 * written/reference grants and actual query reads remain independently enforced.
 * Draft compilation does not enter this cache; changing a published version key
 * invalidates reuse, while old compatible rollback versions can be compiled again.
 */
export function getCompiledPage(input: CompiledPageCacheInput): CompiledPagePlan {
  const identity = identitySchema.parse({ organisationId: input.organisationId, versionId: input.versionId, checksum: input.checksum });
  const payload = pagePayloadSchema.parse(input.payload), approvals = pageApprovalsSchema.parse(input.approvals);
  const key = digest({ ...identity, payloadDigest: digest(payload), approvalsDigest: digest(approvals) });
  const now = Date.now();
  for (const [entryKey, entry] of entries) if (entry.expiresAt <= now) entries.delete(entryKey);
  const cached = entries.get(key);
  if (cached) {
    // Recheck the COMPLETE sealed plan even on a hit; a matching lookup key is
    // insufficient evidence. Private cache objects never escape to a caller.
    if (digest(cached.plan) !== identity.checksum) { entries.delete(key); incompatible(); }
    entries.delete(key); entries.set(key, cached);
    return structuredClone(cached.plan);
  }
  const plan = compilePage(payload, approvals);
  if (digest(plan) !== identity.checksum) incompatible();
  entries.set(key, { expiresAt: now + PAGE_COMPILED_CACHE_TTL_MS, plan: structuredClone(plan) });
  while (entries.size > PAGE_COMPILED_CACHE_MAX_ENTRIES) {
    const oldest = entries.keys().next().value; if (oldest === undefined) break; entries.delete(oldest);
  }
  return structuredClone(plan);
}
