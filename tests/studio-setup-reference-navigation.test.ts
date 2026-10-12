import { beforeEach, expect, it, vi } from 'vitest';
import type { Prisma } from '@/generated/prisma/client';
const m = vi.hoisted(() => ({ membership: vi.fn(), metadata: vi.fn(), draft: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: m.membership } } }));
vi.mock('@/core/studio/authoring/reference-navigation', () => ({ readDesignReferenceMetadataInTransaction: m.metadata }));
import { sessionForUser, sessionAuthorityStamp } from '@/core/auth/session';
import { buildRegistry } from '@/core/studio/registry/runtime';
import type { FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import { readSetupReferenceNavigationInTransaction } from '@/core/studio/authoring/configuration';
const id = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pin = (kind: 'entityProfile' | 'page' | 'customField', n: number) => ({ kind, definitionId: id(n), versionId: id(n + 10), schemaVersion: 1 as const, checksum: 'a'.repeat(64) });
let authority: FieldRuntimeAuthority, payload: unknown;
beforeEach(async () => {
  vi.clearAllMocks();
  m.membership.mockResolvedValue({ id: 'member', userId: 'actor', organisationId: 'company', active: true, sessionVersion: 4,
    grantedCapabilities: ['studio.definition.read', 'tickets.ticket.read', 'tickets.ticket.manage'], deniedCapabilities: [], roles: [],
    user: { name: 'Actor', email: 'actor@example.test', authVersion: 3, platformAdmin: null },
    organisation: { name: 'Company', kind: 'CUSTOMER', status: 'ACTIVE', auditAccess: null, restrictedAccessAreas: [] } });
  const session = (await sessionForUser('company', 'actor'))!, registry = buildRegistry(async () => true), metadata = registry.describe('tickets.ticket', 9);
  payload = { schemaVersion: 1, entity: { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash },
    baseProfile: pin('entityProfile', 2), label: 'Workshop', help: '', overlay: { page: pin('page', 3), requiredFields: [pin('customField', 4)] } };
  m.draft.mockImplementation(async ({ where }) => where.organisationId === 'company' && where.definitionId === id(1)
    ? { definition: { kind: 'recordType' }, payload } : null);
  m.metadata.mockImplementation(async (_authority, reference) => ({ name: reference.kind === 'entityProfile' ? 'Retained base' : 'Saved design',
    retired: false, sourceHref: `/design-studio/setup/${reference.definitionId}`, whereUsedHref: `/design-studio/references/${reference.definitionId}?version=${reference.versionId}` }));
  authority = { session, stamp: sessionAuthorityStamp(session)!, registry, transaction: {
    moduleState: { findFirst: async () => ({ id: 'studio' }) }, studioDraft: { findFirst: m.draft },
  } as unknown as Prisma.TransactionClient };
});
// Exact pin selection/genuine owner check are actual source. Retained metadata
// inspection is an explicit collaborator covered by its original seal suite.
it('passes only saved Page/base/required pins, never looks up a current active head', async () => {
  const result = await readSetupReferenceNavigationInTransaction(authority, id(1), { business: 'selected' });
  expect(m.metadata.mock.calls.map(call => call[1])).toEqual([pin('customField', 4), pin('page', 3), pin('entityProfile', 2)]);
  expect(m.metadata.mock.calls.every(call => call[2].business === 'selected')).toBe(true);
  expect(result.page?.whereUsedHref).toContain(id(13)); expect(result.baseProfile?.name).toBe('Retained base');
});
it('omits only independently denied links without rewriting saved choices or exposing source names', async () => {
  m.metadata.mockRejectedValue(new Error('FORBIDDEN: current read revoked'));
  const before = structuredClone(payload), result = await readSetupReferenceNavigationInTransaction(authority, id(1));
  expect(result).toEqual({ page: null, baseProfile: null, requiredFields: [] }); expect(payload).toEqual(before);
});
it.each(['studio.definition.read', 'tickets.ticket.read', 'tickets.ticket.manage'])('denies %s before inspecting reference names', async capability => {
  authority.session.capabilities.delete(capability);
  await expect(readSetupReferenceNavigationInTransaction(authority, id(1))).rejects.toThrow('FORBIDDEN');
  expect(m.metadata).not.toHaveBeenCalled();
});
it('rejects copied authority and foreign setup before reference inspection', async () => {
  await expect(readSetupReferenceNavigationInTransaction({ ...authority, session: { ...authority.session } }, id(1))).rejects.toThrow('FORBIDDEN');
  await expect(readSetupReferenceNavigationInTransaction(authority, id(99))).rejects.toThrow('DEPENDENCY_BROKEN');
  expect(m.metadata).not.toHaveBeenCalled();
});

it.each(['seal', 'hash', 'graph', 'missing immutable version'])('fails closed on a broken %s rather than returning an unavailable link', async reason => {
  const before = structuredClone(payload);
  m.metadata.mockRejectedValue(new Error(`DEPENDENCY_BROKEN: ${reason}`));
  await expect(readSetupReferenceNavigationInTransaction(authority, id(1))).rejects.toThrow(`DEPENDENCY_BROKEN: ${reason}`);
  expect(payload).toEqual(before); expect(m.metadata).toHaveBeenCalledTimes(1);
});
it('keeps validated retired references inspectable without offering a current draft editor', async () => {
  m.metadata.mockImplementation(async (_authority, reference) => ({ name: 'Retained design', retired: true, sourceHref: null,
    whereUsedHref: `/design-studio/references/${reference.definitionId}?version=${reference.versionId}` }));
  const result = await readSetupReferenceNavigationInTransaction(authority, id(1));
  expect(result.page).toMatchObject({ retired: true, sourceHref: null });
  expect(result.page?.whereUsedHref).toContain(id(13)); expect(result.requiredFields).toHaveLength(1);
});
