import { beforeEach, expect, it, vi } from 'vitest';
import type { Prisma } from '@/generated/prisma/client';
const m = vi.hoisted(() => ({ refresh: vi.fn(), compile: vi.fn(), draft: vi.fn(), member: vi.fn(), write: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: m.member } } }));
vi.mock('@/core/studio/fields/runtime-authority', () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock('@/core/studio/pages/definition-compiler', () => ({ compileStructuredPage: m.compile }));
import { sessionForUser, sessionAuthorityStamp } from '@/core/auth/session';
import type { FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import { inspectPageDraftInTransaction } from '@/core/studio/authoring/page-inspection';
import { pagePayloadSchema } from '@/core/studio/pages/schema';

// Genuine Session issuance is real; refresh/compiler/SQL are explicit metadata
// collaborators. Existing compiler suites own actual grants/pins/budget evidence.
const id = '00000000-0000-4000-8000-000000000001';
const payload = pagePayloadSchema.parse({ schemaVersion: 1, entity: { id: 'sales.order', version: 1, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) }, formFactors: ['desktop'], sections: [{ id: 'main', label: 'Order', help: '', formFactors: ['desktop'], columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: 'note', type: 'instructions', text: 'Guidance', formFactors: ['desktop'] }] }] });
let authority: FieldRuntimeAuthority;
const request = () => ({ definitionId: id, revision: 2, definitionRevision: 4, payload });
beforeEach(async () => {
  vi.resetAllMocks();
  m.member.mockResolvedValue({ id: 'membership', userId: 'actor', organisationId: 'business', active: true, sessionVersion: 1, roles: [], grantedCapabilities: ['studio.definition.edit'], deniedCapabilities: [], user: { name: 'Actor', email: 'actor@example.invalid', authVersion: 1, platformAdmin: null }, organisation: { id: 'business', name: 'Business', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
  const session = await sessionForUser('business', 'actor'); if (!session) throw new Error('Missing test Session');
  authority = { session, stamp: sessionAuthorityStamp(session)!, transaction: { studioDraft: { findFirst: m.draft, updateMany: m.write }, auditLog: { create: m.write } } as unknown as Prisma.TransactionClient } as FieldRuntimeAuthority;
  m.refresh.mockImplementation(async supplied => { if (!sessionAuthorityStamp(supplied)) throw new Error('FORBIDDEN: genuine current principal required'); return authority; });
  m.draft.mockResolvedValue({ definitionId: id, organisationId: 'business', revision: 2, payload, definition: { id, organisationId: 'business', revision: 4, kind: 'page', retiredAt: null } });
  m.compile.mockResolvedValue({ payload, warnings: ['Check the phone layout.'] });
});
it('checks exact unsaved metadata through the original compiler without validation/Audit writes', async () => {
  expect(await inspectPageDraftInTransaction(authority, request())).toEqual({ revision: 2, definitionRevision: 4, payload, warnings: ['Check the phone layout.'] });
  expect(m.draft.mock.calls[0][0].where).toEqual({ definitionId: id, organisationId: 'business', revision: 2, definition: { kind: 'page', retiredAt: null, revision: 4 } });
  expect(m.compile).toHaveBeenCalledWith(authority, payload); expect(m.write).not.toHaveBeenCalled();
});
it('rejects forged, revoked and absent edit authority before draft or compiler access', async () => {
  await expect(inspectPageDraftInTransaction({ ...authority, session: { ...authority.session } }, request())).rejects.toThrow('FORBIDDEN');
  m.refresh.mockResolvedValueOnce({ ...authority, session: { ...authority.session, capabilities: new Set() } });
  await expect(inspectPageDraftInTransaction(authority, request())).rejects.toThrow('FORBIDDEN');
  await expect(inspectPageDraftInTransaction({ ...authority, session: { ...authority.session, capabilities: new Set() } }, request())).rejects.toThrow('FORBIDDEN');
  expect(m.draft).not.toHaveBeenCalled(); expect(m.compile).not.toHaveBeenCalled();
});
it.each(['tenant', 'revision', 'definitionRevision', 'definition', 'retired'])('rejects returned %s mirror drift before compilation', async defect => {
  const row = structuredClone(await m.draft()); m.draft.mockClear();
  if (defect === 'tenant') row.organisationId = 'foreign';
  if (defect === 'revision') row.revision++;
  if (defect === 'definitionRevision') row.definition.revision++;
  if (defect === 'definition') row.definition.id = 'other';
  if (defect === 'retired') row.definition.retiredAt = new Date();
  m.draft.mockResolvedValue(row);
  await expect(inspectPageDraftInTransaction(authority, request())).rejects.toThrow('CONFLICT'); expect(m.compile).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('rejects stale/malformed/client authority and owner substitution without side effects', async () => {
  for (const extra of [{ organisationId: 'foreign' }, { approvals: {} }, { revision: -1 }]) await expect(inspectPageDraftInTransaction(authority, { ...request(), ...extra })).rejects.toThrow();
  await expect(inspectPageDraftInTransaction(authority, { ...request(), payload: { ...payload, entity: { ...payload.entity, id: 'tickets.ticket' } } })).rejects.toThrow('different business area');
  m.draft.mockResolvedValue(null); await expect(inspectPageDraftInTransaction(authority, request())).rejects.toThrow('CONFLICT');
  expect(m.compile).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('retains original current grant/pin/type/budget failures without a fallback or write', async () => {
  for (const message of ['FORBIDDEN: current field Read', 'DEPENDENCY_BROKEN: retained View pin', 'Page read budget exceeded.']) {
    m.compile.mockRejectedValueOnce(new Error(message)); await expect(inspectPageDraftInTransaction(authority, request())).rejects.toThrow(message);
  }
  expect(m.write).not.toHaveBeenCalled();
});
