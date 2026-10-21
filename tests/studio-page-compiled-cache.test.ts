import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { PageApprovals } from '@/core/studio/pages/approvals';
import type { PagePayload } from '@/core/studio/pages/schema';
const calls = vi.hoisted(() => ({ compile: vi.fn() }));
vi.mock('@/core/studio/pages/compiler', async importOriginal => {
  const actual = await importOriginal<typeof import('@/core/studio/pages/compiler')>();
  calls.compile.mockImplementation(actual.compilePage);
  return { ...actual, compilePage: calls.compile };
});
import { compilePage } from '@/core/studio/pages/compiler';
import { checksum } from '@/core/studio/registry/contracts';

// Real pure compiler/closed metadata/complete digest. Synthetic approved metadata
// and server addresses are not genuine authority/loader/value policy/SQL evidence.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const reference = (id: string) => ({ id, version: 1, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) });
function fixture() {
  const entity = reference('tickets.ticket'), forms = ['desktop', 'tablet', 'phone'] as const;
  const identity = { ownerModuleId: 'tickets', classification: 'confidential' as const, capability: 'tickets.ticket.read' };
  const approvals: PageApprovals = { entity: { ...entity, ...identity, kind: 'entity' }, sourcePage: { ...reference('tickets.ticket.page'), ...identity, kind: 'surface' },
    variants: false, fieldSourceVersions: [], nativeFields: [], customFields: [], facts: [], contracts: [], queries: [], commands: [], metrics: [], surfaces: [], maxQueryCost: 4 };
  const payload: PagePayload = { schemaVersion: 1, entity, formFactors: [...forms], sections: [{ id: 'main', label: 'Ticket', help: '', columns: { desktop: 2, tablet: 2, phone: 1 }, formFactors: [...forms],
    components: [{ id: 'instructions', type: 'instructions', text: 'Choose your next step.', formFactors: [...forms] }] }], variants: [] };
  const plan = compilePage(payload, approvals); calls.compile.mockClear();
  return { input: { organisationId: 'business', versionId: uuid(1), checksum: checksum(plan), payload, approvals }, plan };
}
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-11T12:00:00Z')); calls.compile.mockClear(); });
afterEach(() => vi.useRealTimers());

describe('bounded published Page pure metadata cache', () => {
  it('reuses exact metadata and returns complete independent clones on every hit', async () => {
    const { getCompiledPage } = await import('@/core/studio/pages/compiled-cache'); const { input, plan } = fixture();
    const first = getCompiledPage(input), second = getCompiledPage(input);
    expect(first).toEqual(plan); expect(second).toEqual(plan); expect(first).not.toBe(second); expect(first.payload).not.toBe(second.payload);
    first.base.sections[0].label = 'Caller mutation'; first.approvals.entity.capability = 'borrowed.permission';
    second.payload.sections[0].components[0].label = 'Other caller mutation';
    expect(getCompiledPage(input)).toEqual(plan); expect(calls.compile).toHaveBeenCalledTimes(1);
  });
  it('separates tenants and published versions, while draft/object identity is not a cache key', async () => {
    const { getCompiledPage } = await import('@/core/studio/pages/compiled-cache'); const { input } = fixture();
    getCompiledPage(input); getCompiledPage({ ...input, organisationId: 'other-business' }); getCompiledPage({ ...input, versionId: uuid(2) });
    getCompiledPage(structuredClone(input)); expect(calls.compile).toHaveBeenCalledTimes(3);
    expect(getCompiledPage({ ...input, organisationId: 'other-business' })).toEqual(getCompiledPage(input)); expect(calls.compile).toHaveBeenCalledTimes(3);
  });
  it('includes freshly approved metadata even when an unused policy change leaves the compiled seal unchanged', async () => {
    const { getCompiledPage } = await import('@/core/studio/pages/compiled-cache'); const { input } = fixture();
    getCompiledPage(input);
    // Unused native read policy must never be reused from an earlier approval set.
    const changed = { ...input.approvals, nativeFields: [{ id: 'private_note', classification: 'restricted' as const, capability: 'tickets.private.read', editable: false, query: reference('tickets.ticket.private_read') }] };
    getCompiledPage({ ...input, approvals: changed }); expect(calls.compile).toHaveBeenCalledTimes(2);
    expect(getCompiledPage({ ...input, approvals: changed })).not.toHaveProperty('session'); expect(calls.compile).toHaveBeenCalledTimes(2);
  });
  it('rejects changed owner metadata, payload or a false sealed checksum with no cached fallback', async () => {
    const { getCompiledPage } = await import('@/core/studio/pages/compiled-cache'); const { input, plan } = fixture(); getCompiledPage(input);
    expect(() => getCompiledPage({ ...input, approvals: { ...input.approvals, sourcePage: { ...input.approvals.sourcePage, capability: 'tickets.other.read' } } })).toThrow('owner and capability');
    const altered = structuredClone(input.payload); altered.sections[0].label = 'Altered stored payload';
    expect(() => getCompiledPage({ ...input, payload: altered })).toThrow('published version');
    expect(() => getCompiledPage({ ...input, checksum: 'f'.repeat(64) })).toThrow('published version');
    expect(getCompiledPage(input)).toEqual(plan);
  });
  it('closes invalid identities and metadata before compilation, including client-shaped extra approval fields', async () => {
    const { getCompiledPage } = await import('@/core/studio/pages/compiled-cache'); const { input } = fixture();
    for (const extra of [{ organisationId: '' }, { versionId: 'not-a-version' }, { checksum: 'F'.repeat(64) }, { payload: { ...input.payload, queryResult: 'private value' } },
      { approvals: { ...input.approvals, session: { capabilities: ['borrowed'] } } }]) expect(() => getCompiledPage({ ...input, ...extra })).toThrow();
    expect(calls.compile).not.toHaveBeenCalled();
  });
  it('expires metadata after fixed TTL rather than extending lifetime on repeated hits', async () => {
    const { getCompiledPage, PAGE_COMPILED_CACHE_TTL_MS } = await import('@/core/studio/pages/compiled-cache'); const { input } = fixture();
    getCompiledPage(input); vi.advanceTimersByTime(PAGE_COMPILED_CACHE_TTL_MS - 1); getCompiledPage(input); expect(calls.compile).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1); getCompiledPage(input); expect(calls.compile).toHaveBeenCalledTimes(2);
  });
  it('keeps at most100 plans and evicts the least recently used version without mutating retained history', async () => {
    const { getCompiledPage, PAGE_COMPILED_CACHE_MAX_ENTRIES } = await import('@/core/studio/pages/compiled-cache'); const { input, plan } = fixture();
    for (let n = 1; n <= PAGE_COMPILED_CACHE_MAX_ENTRIES; n++) getCompiledPage({ ...input, versionId: uuid(n) });
    getCompiledPage(input); // Keep version1; version2 is now the oldest.
    getCompiledPage({ ...input, versionId: uuid(101) }); expect(calls.compile).toHaveBeenCalledTimes(101);
    expect(getCompiledPage(input)).toEqual(plan); expect(calls.compile).toHaveBeenCalledTimes(101);
    expect(getCompiledPage({ ...input, versionId: uuid(2) })).toEqual(plan); expect(calls.compile).toHaveBeenCalledTimes(102);
  });
});
