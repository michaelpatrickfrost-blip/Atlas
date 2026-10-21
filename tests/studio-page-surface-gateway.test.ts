import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@/generated/prisma/client';
import type { FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import type { PageDisplayModel } from '@/core/studio/pages/render-model';
const mocks = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn(), lock: vi.fn(), definition: vi.fn(), read: vi.fn(), owner: vi.fn(), resolve: vi.fn(), invoke: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: mocks.membership } } }));
vi.mock('@/core/studio/fields/runtime-authority', () => ({ fieldRuntimeAuthorityInTransaction: mocks.refresh }));
vi.mock('@/core/studio/pages/runtime', () => ({ readPublishedPageInTransaction: mocks.read }));
import { sessionForUser, sessionAuthorityStamp } from '@/core/auth/session';
import { checksum } from '@/core/studio/registry/contracts';
import { prepareVisiblePageSurfaceInTransaction } from '@/core/studio/pages/customer-gateway';

// Actual surface gateway and genuine Sessions. Refresh/pointer SQL/registry/shared
// runtime model are explicit collaborators. No actual field/owner policy, private
// row/SQL/SSI or form action/persistence/live responsive rendering proof claimed.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ref = (id: string) => ({ id, version: 1, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) });
const source = ref('tickets.ticket.page'), surface = ref('tickets.ticket.progress_form');
const input = { definitionId: uuid(1), expectedVersionId: uuid(2), expectedDefinitionRevision: 4, request: { kind: 'record' as const, recordId: 'ticket' }, formFactor: 'phone' as const, componentId: 'progress' };
const anchor = { kind: 'record' as const, organisationId: 'company', recordId: 'ticket', nativeRevision: 7, revision: '7@2026-10-11T02:03:04.000Z' };
const tx = { $queryRaw: mocks.lock, studioDefinition: { findFirst: mocks.definition } } as unknown as Prisma.TransactionClient;
const model = (): PageDisplayModel => ({ variantId: 'urgent_layout', formFactor: 'phone', sections: [{ id: 'main', label: 'Ticket', help: '', columns: 1,
  components: [{ id: 'progress', label: 'Edit ticket', help: '', type: 'surface', family: 'module', surface, outputs: [] }] }] });
function definition() {
  const identity = { ownerModuleId: 'tickets', capability: 'tickets.ticket.read', classification: 'confidential' };
  const compiledPlan = { kind: 'page', schemaVersion: 1, approvals: { entity: { ...ref('tickets.ticket'), ...identity, kind: 'entity' }, sourcePage: { ...source, ...identity, kind: 'surface' },
    variants: true, fieldSourceVersions: [], nativeFields: [], customFields: [], facts: [], contracts: [], queries: [], commands: [], metrics: [],
    surfaces: [{ ...surface, ...identity, capability: 'tickets.ticket.manage', kind: 'surface', sourceEntityId: 'tickets.ticket', family: 'module', queries: [], formFactors: ['phone'] }], maxQueryCost: 4 } };
  return { id: uuid(1), organisationId: 'company', kind: 'page', name: 'Ticket screen', revision: 4, retiredAt: null, activeVersionId: uuid(2),
    activeVersion: { id: uuid(2), organisationId: 'company', definitionId: uuid(1), schemaVersion: 1, checksum: checksum(compiledPlan), compiledPlan } };
}
async function fixture() {
  const session = await sessionForUser('company', 'actor'); if (!session) throw new Error('No actor');
  const registry = { authorisePageRead: mocks.owner, resolve: mocks.resolve, invoke: mocks.invoke } as unknown as FieldRuntimeAuthority['registry'];
  const authority: FieldRuntimeAuthority = { session, stamp: sessionAuthorityStamp(session)!, transaction: tx, registry };
  mocks.refresh.mockResolvedValue(authority); mocks.definition.mockResolvedValue(definition()); mocks.read.mockResolvedValue(model());
  mocks.owner.mockResolvedValue({ source: { ownerModuleId: 'tickets' }, anchor: { ...anchor }, policy: { surfaces: [{ surface: { id: surface.id, version: 1 }, family: 'module', queries: [], formFactors: ['phone'] }] } });
  mocks.resolve.mockResolvedValue({ ...surface, kind: 'surface', ownerModuleId: 'tickets' });
  return authority;
}
beforeEach(() => { vi.resetAllMocks(); mocks.membership.mockResolvedValue({ id: 'member', userId: 'actor', organisationId: 'company', sessionVersion: 2, active: true,
  grantedCapabilities: ['tickets.ticket.read', 'tickets.ticket.manage'], deniedCapabilities: [], roles: [], user: { name: 'Actor', email: 'actor@example.invalid', authVersion: 3, platformAdmin: null },
  organisation: { id: 'company', name: 'Company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } }); });

describe('current visible owning Page surface preparation', () => {
  it('binds the exact current phone/version/native anchor and resolves surface grants after the genuine visible read', async () => {
    const authority = await fixture(); const result = await prepareVisiblePageSurfaceInTransaction(authority, input);
    expect(result).toEqual({ authority, anchor, surface, ownerModuleId: 'tickets' });
    expect(mocks.refresh).toHaveBeenCalledWith(authority.session, tx); expect(mocks.read).toHaveBeenCalledWith(authority, { page: { kind: 'page', definitionId: uuid(1), versionId: uuid(2), schemaVersion: 1, checksum: definition().activeVersion.checksum }, request: input.request, formFactor: 'phone', cursors: {} });
    expect(mocks.owner).toHaveBeenCalledWith({ session: authority.session, transaction: tx }, source, input.request); expect(mocks.resolve).toHaveBeenCalledWith(authority.session, surface);
    expect(mocks.refresh.mock.invocationCallOrder[0]).toBeLessThan(mocks.lock.mock.invocationCallOrder[0]); expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.definition.mock.invocationCallOrder[0]);
    expect(mocks.read.mock.invocationCallOrder[0]).toBeLessThan(mocks.owner.mock.invocationCallOrder[0]); expect(mocks.owner.mock.invocationCallOrder[0]).toBeLessThan(mocks.resolve.mock.invocationCallOrder[0]); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it.each([{ expectedVersionId: uuid(3) }, { expectedDefinitionRevision: 5 }])('denies a stale publication/revision before runtime or native form preparation', async extra => {
    const authority = await fixture(); await expect(prepareVisiblePageSurfaceInTransaction(authority, { ...input, ...extra })).rejects.toThrow('screen changed');
    expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.owner).not.toHaveBeenCalled(); expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it('denies copied authority and malformed fresh authority before pointer access', async () => {
    const authority = await fixture(); await expect(prepareVisiblePageSurfaceInTransaction({ ...authority, session: { ...authority.session } }, input)).rejects.toThrow('FORBIDDEN');
    await expect(prepareVisiblePageSurfaceInTransaction({ ...authority, stamp: { ...authority.stamp } }, input)).rejects.toThrow('FORBIDDEN'); expect(mocks.refresh).not.toHaveBeenCalled();
    mocks.refresh.mockResolvedValueOnce({ ...authority, session: { ...authority.session } }); await expect(prepareVisiblePageSurfaceInTransaction(authority, input)).rejects.toThrow('FORBIDDEN'); expect(mocks.lock).not.toHaveBeenCalled();
  });
  it('rejects client tenant/surface/anchor/approval/input overrides and coerced revisions', async () => {
    const authority = await fixture();
    for (const extra of [{ organisationId: 'foreign' }, { surface }, { anchor }, { approvals: {} }, { input: { recordId: 'other' } }, { expectedDefinitionRevision: '4' }, { componentId: '../progress' }])
      await expect(prepareVisiblePageSurfaceInTransaction(authority, { ...input, ...extra })).rejects.toThrow();
    expect(mocks.refresh).not.toHaveBeenCalled(); expect(mocks.read).not.toHaveBeenCalled();
  });
  it('rejects foreign or drifted immutable metadata before the current visible runtime read', async () => {
    const authority = await fixture();
    for (const mode of ['definition', 'version', 'checksum']) {
      const stored = definition(); if (mode === 'definition') stored.organisationId = 'foreign'; if (mode === 'version') stored.activeVersion.definitionId = uuid(3); if (mode === 'checksum') stored.activeVersion.checksum = 'f'.repeat(64);
      mocks.definition.mockResolvedValueOnce(stored); await expect(prepareVisiblePageSurfaceInTransaction(authority, input)).rejects.toThrow('unavailable');
    }
    expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.owner).not.toHaveBeenCalled();
  });
  it.each(['hidden', 'wrongKind', 'missingReference'])('requires an actually visible %s component rather than just a known component ID', async mode => {
    const authority = await fixture(), view = model();
    if (mode === 'hidden') view.sections = [];
    if (mode === 'wrongKind') view.sections[0].components = [{ id: 'progress', label: 'Instructions', help: '', type: 'instructions', text: 'No form here', tone: 'info' }];
    if (mode === 'missingReference') { const component = view.sections[0].components[0]; if (component.type === 'surface') delete component.surface; }
    mocks.read.mockResolvedValueOnce(view); await expect(prepareVisiblePageSurfaceInTransaction(authority, input)).rejects.toThrow('unavailable'); expect(mocks.owner).not.toHaveBeenCalled();
  });
  it.each(['foreignAnchor', 'otherRecord', 'listAnchor', 'wrongOwner', 'wrongKind', 'notApproved', 'wrongFamily', 'wrongDevice'])('denies %s despite a visible form slot', async mode => {
    const authority = await fixture(), owner = await mocks.owner(), metadata = await mocks.resolve(); mocks.owner.mockClear(); mocks.resolve.mockClear();
    if (mode === 'foreignAnchor') owner.anchor.organisationId = 'foreign'; if (mode === 'otherRecord') owner.anchor.recordId = 'other'; if (mode === 'listAnchor') owner.anchor.kind = 'list';
    if (mode === 'wrongOwner') metadata.ownerModuleId = 'other'; if (mode === 'wrongKind') metadata.kind = 'entity'; if (mode === 'notApproved') owner.policy.surfaces = [];
    if (mode === 'wrongFamily') owner.policy.surfaces[0].family = 'documents'; if (mode === 'wrongDevice') owner.policy.surfaces[0].formFactors = ['desktop'];
    mocks.owner.mockResolvedValueOnce(owner); mocks.resolve.mockResolvedValueOnce(metadata); await expect(prepareVisiblePageSurfaceInTransaction(authority, input)).rejects.toThrow('unavailable'); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('propagates current/written field or reference denial, private owner denial and revoked surface grants without fallback', async () => {
    const authority = await fixture();
    for (const reason of ['Current field denied', 'Written field denied', 'Reference denied']) { mocks.read.mockRejectedValueOnce(new Error(reason)); await expect(prepareVisiblePageSurfaceInTransaction(authority, input)).rejects.toThrow(reason); }
    expect(mocks.owner).not.toHaveBeenCalled(); expect(mocks.resolve).not.toHaveBeenCalled();
    mocks.owner.mockRejectedValueOnce(new Error('Private receiving-team denied')); await expect(prepareVisiblePageSurfaceInTransaction(authority, input)).rejects.toThrow('Private receiving-team denied'); expect(mocks.resolve).not.toHaveBeenCalled();
    mocks.resolve.mockRejectedValueOnce(new Error('Current Manage/module revoked')); await expect(prepareVisiblePageSurfaceInTransaction(authority, input)).rejects.toThrow('Current Manage/module revoked'); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('returns only the actual new native anchor, leaving form revision/CAS checks to the owning manifest loader', async () => {
    const authority = await fixture(); mocks.owner.mockResolvedValueOnce({ source: { ownerModuleId: 'tickets' }, anchor: { ...anchor, nativeRevision: 8, revision: '8@2026-10-11T03:04:05.000Z' }, policy: { surfaces: [{ surface, family: 'module', formFactors: ['phone'] }] } });
    const prepared = await prepareVisiblePageSurfaceInTransaction(authority, input); expect(prepared.anchor).toMatchObject({ nativeRevision: 8, revision: '8@2026-10-11T03:04:05.000Z' });
    expect(prepared).not.toHaveProperty('manifest'); expect(prepared).not.toHaveProperty('operationProof'); expect(prepared).not.toHaveProperty('fieldPermissions');
  });
});
