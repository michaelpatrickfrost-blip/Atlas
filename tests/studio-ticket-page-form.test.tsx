// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@/generated/prisma/client';
const mocks = vi.hoisted(() => ({ membership: vi.fn(), transaction: vi.fn(), registry: vi.fn(), manifest: vi.fn(), update: vi.fn(), search: vi.fn(), selection: vi.fn(), changeType: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: mocks.membership }, $transaction: mocks.transaction } }));
vi.mock('@/core/studio/registry/runtime', () => ({ buildRegistry: mocks.registry }));
vi.mock('@/core/service-work/field-forms', () => ({ ticketFieldFormManifestInTransaction: mocks.manifest }));
vi.mock('@/core/service-work/actions', () => ({ updateWork: mocks.update }));
vi.mock('@/core/service-work/field-form-actions', () => ({ searchTicketFieldReferences: mocks.search }));
vi.mock('@/core/studio/record-types/selection', () => ({ readRecordTypeSelectionInTransaction: mocks.selection }));
vi.mock('@/core/service-work/record-type-actions', () => ({ changeTicketBusinessType: mocks.changeType }));
import { sessionForUser, sessionAuthorityStamp } from '@/core/auth/session';
import { loadTicketProgressForm, loadTicketProgressFormInTransaction } from '@/core/service-work/page-form';
import { workScope } from '@/core/service-work/access';
import type { FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import { TicketProgressForm } from '@/components/service-work/ticket-progress-form';
import type { TicketFieldFormManifest } from '@/core/service-work/field-form-contract';

// Genuine Session issuance and actual runtime authority refresh/workScope/form
// component+typed packet renderer. Registry/field manifest and SQL collaborators
// are explicit; no PostgreSQL/private-row/SSI/atomic native action proof claimed.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const timestamp = new Date('2026-10-11T02:03:04Z');
const input = { recordId: 'ticket', expectedRevision: 4, expectedUpdatedAt: timestamp.toISOString() };
const row = () => ({ id: 'ticket', organisationId: 'company', version: 4, updatedAt: timestamp, queueId: 'queue', queue: { organisationId: 'company', restricted: false } });
const membership = (grants = ['tickets.ticket.read', 'tickets.ticket.manage']) => ({ id: 'member', userId: 'actor', organisationId: 'company', sessionVersion: 2, active: true,
  grantedCapabilities: grants, deniedCapabilities: [] as string[], roles: [], user: { name: 'Actor', email: 'actor@example.invalid', authVersion: 3, platformAdmin: null },
  organisation: { id: 'company', name: 'Company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
const manifest = (): TicketFieldFormManifest => ({ schemaVersion: 1, operation: 'update', operationId: uuid(1), recordRevision: 4, extensionRevision: 2, manifestChecksum: 'a'.repeat(64), fields: [{ operationId: uuid(2), definitionId: uuid(3), definitionRevision: 1, versionId: uuid(4), generationId: uuid(5), slotRevision: 1, valueRevision: 1, label: 'Business reference', help: '', storage: { type: 'string', minLength: 0, maxLength: 100, multiline: false }, required: false, conditionalRequired: false, value: { type: 'string', value: 'Existing reference' } }] });
async function fixture() {
  const member = membership(); mocks.membership.mockResolvedValue(member);
  const session = await sessionForUser('company', 'actor'); if (!session) throw new Error('Missing actor');
  const storage = { $queryRaw: vi.fn(async (parts: TemplateStringsArray) => parts.join('').startsWith('SHOW') ? [{ transaction_isolation: 'serializable' }] : []),
    membership: { findUnique: vi.fn(async () => member), findMany: vi.fn(async (args: unknown) => { void args; return [{ organisationId: 'company', userId: 'actor', user: { name: 'Actor' } }]; }) },
    organisation: { findFirst: vi.fn(async () => ({ id: 'company' })) }, moduleState: { findFirst: vi.fn(async () => ({ id: 'tickets' })), findMany: vi.fn(async () => [{ moduleId: 'tickets', enabled: true, entitled: true }]) },
    serviceWorkItem: { findFirst: vi.fn(async (args: { select: { status?: boolean } }) => args.select.status ? { id: 'ticket', organisationId: 'company', version: 4, status: 'NEW', ownerUserId: 'actor' } : row()) },
    serviceQueueMember: { findFirst: vi.fn(async (args: unknown) => { void args; return { id: 'queue-member' }; }), findMany: vi.fn(async () => [{ userId: 'actor' }]) } };
  const transaction = storage as unknown as Prisma.TransactionClient;
  mocks.registry.mockReturnValue({ describe: () => ({ id: 'tickets.ticket', version: 9, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) }) });
  mocks.selection.mockResolvedValue({ operationId: uuid(90), recordId: 'ticket', recordRevision: 4, extensionRevision: 2, currentDefinitionId: null, choices: [] });
  mocks.manifest.mockResolvedValue(manifest()); mocks.transaction.mockImplementation(async (callback: (tx: Prisma.TransactionClient) => Promise<unknown>) => callback(transaction));
  return { session, member, storage, transaction, authority: { session, stamp: sessionAuthorityStamp(session)!, transaction, registry: {} } as FieldRuntimeAuthority };
}
beforeEach(() => vi.resetAllMocks()); afterEach(cleanup);

describe('owning Ticket Page progress-form render adapter', () => {
  it('refreshes genuine customer grants and checks private scope/anchor/manifest before protected native values', async () => {
    const f = await fixture(); const result = await loadTicketProgressForm(f.session, input);
    expect(mocks.transaction.mock.calls[0][1]).toEqual({ isolationLevel: 'Serializable' });
    expect(result).toMatchObject({ work: { id: 'ticket', version: 4, status: 'NEW', ownerUserId: 'actor' }, owners: [{ id: 'actor', name: 'Actor' }], fieldManifest: manifest() });
    expect(f.storage.serviceWorkItem.findFirst.mock.calls[0][0]).toMatchObject({ where: { AND: [workScope(f.session), { id: 'ticket', kind: 'TICKET', mergedIntoId: null, queue: { organisationId: 'company' } }] } });
    expect(f.storage.membership.findUnique.mock.invocationCallOrder[0]).toBeLessThan(f.storage.serviceWorkItem.findFirst.mock.invocationCallOrder[0]);
    expect(mocks.manifest.mock.invocationCallOrder[0]).toBeLessThan(f.storage.serviceWorkItem.findFirst.mock.invocationCallOrder[1]);
    expect(f.storage.serviceWorkItem.findFirst.mock.calls[0][0].select).not.toHaveProperty('status'); expect(JSON.stringify(result)).not.toMatch(/organisationId|queue|capabilit|conditionGraph/);
    expect(f.storage.membership.findMany.mock.calls[0][0]).toMatchObject({ where: { organisationId: 'company', active: true, userId: { in: ['actor'] } }, take: 501 });
  });
  it('rejects copied sessions, client tenant hints and stale authentication before native form metadata', async () => {
    const f = await fixture(); await expect(loadTicketProgressForm({ ...f.session }, input)).rejects.toThrow('authenticated');
    await expect(loadTicketProgressForm(f.session, { ...input, organisationId: 'foreign' } as typeof input)).rejects.toThrow();
    f.member.sessionVersion++; await expect(loadTicketProgressFormInTransaction(f.authority, input)).rejects.toThrow('authenticated');
    expect(f.storage.serviceWorkItem.findFirst).not.toHaveBeenCalled(); expect(mocks.manifest).not.toHaveBeenCalled();
  });
  it('requires independent current Read and Manage plus enabled Tickets before native metadata', async () => {
    for (const grants of [['tickets.ticket.read'], ['tickets.ticket.manage']]) {
      const f = await fixture(); f.member.grantedCapabilities = grants;
      await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow(); expect(f.storage.serviceWorkItem.findFirst).not.toHaveBeenCalled();
    }
    const f = await fixture(); f.storage.moduleState.findFirst.mockResolvedValueOnce(null as never);
    await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow('Tickets is unavailable'); expect(f.storage.serviceWorkItem.findFirst).not.toHaveBeenCalled();
  });
  it('denies inaccessible/foreign/merged scope and mismatched version or timestamp before the field manifest', async () => {
    const f = await fixture();
    for (const head of [null, { ...row(), organisationId: 'foreign' }, { ...row(), queue: { organisationId: 'foreign', restricted: false } }, { ...row(), version: 5 }, { ...row(), updatedAt: new Date('2026-10-12T00:00:00Z') }]) {
      f.storage.serviceWorkItem.findFirst.mockResolvedValueOnce(head as never); await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow();
    }
    expect(mocks.manifest).not.toHaveBeenCalled(); expect(f.storage.membership.findMany).not.toHaveBeenCalled();
  });
  it('checks actual restricted receiving-team membership before native values or field metadata', async () => {
    const f = await fixture(); f.storage.serviceWorkItem.findFirst.mockResolvedValueOnce({ ...row(), queue: { organisationId: 'company', restricted: true } } as never); f.storage.serviceQueueMember.findFirst.mockResolvedValueOnce(null as never);
    await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow('receiving-team'); expect(mocks.manifest).not.toHaveBeenCalled(); expect(f.storage.serviceWorkItem.findFirst).toHaveBeenCalledTimes(1);
    expect(f.storage.serviceQueueMember.findFirst.mock.calls[0][0]).toMatchObject({ where: { organisationId: 'company', queueId: 'queue', userId: 'actor' } });
  });
  it('propagates current/written field denial and rejects a stale manifest before protected native data', async () => {
    const f = await fixture(); mocks.manifest.mockRejectedValueOnce(new Error('FORBIDDEN: written field policy'));
    await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow('written field policy'); expect(f.storage.serviceWorkItem.findFirst).toHaveBeenCalledTimes(1);
    mocks.manifest.mockResolvedValueOnce({ ...manifest(), recordRevision: 3 }); await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow('CONFLICT'); expect(f.storage.serviceWorkItem.findFirst).toHaveBeenCalledTimes(2);
    expect(f.storage.membership.findMany).not.toHaveBeenCalled();
  });
  it('allows native no-config forms and closed discovery for an owning reopen without granting Extend', async () => {
    const f = await fixture(); mocks.manifest.mockResolvedValueOnce(null); f.storage.serviceWorkItem.findFirst.mockResolvedValueOnce(row() as never).mockResolvedValueOnce({ id: 'ticket', organisationId: 'company', version: 4, status: 'CLOSED', ownerUserId: 'actor' } as never);
    const result = await loadTicketProgressForm(f.session, input); expect(result.fieldManifest).toBeNull(); expect(result.work.status).toBe('CLOSED'); expect(result.recordTypeSelection).toBeNull(); expect(mocks.selection).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('uses the same genuine native transaction for type choices and propagates retained policy failures', async () => {
    const f = await fixture(); await loadTicketProgressForm(f.session, input);
    expect(mocks.selection).toHaveBeenCalledWith(expect.objectContaining({ organisationId: 'company' }), f.transaction,
      { id: 'tickets.ticket', version: 9, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) }, { recordId: 'ticket', recordRevision: 4 });
    mocks.selection.mockRejectedValueOnce(new Error('FORBIDDEN: retained field access revoked'));
    await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow('retained field access revoked');
  });
  it('bounds the actual queue owner list and rejects foreign membership projections', async () => {
    const f = await fixture(); f.storage.serviceQueueMember.findMany.mockResolvedValueOnce(Array.from({ length: 501 }, (_, index) => ({ userId: String(index) })));
    await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow('unavailable'); expect(f.storage.membership.findMany).not.toHaveBeenCalled();
    f.storage.membership.findMany.mockResolvedValueOnce([{ organisationId: 'foreign', userId: 'actor', user: { name: 'Foreign' } }]); await expect(loadTicketProgressForm(f.session, input)).rejects.toThrow('unavailable');
  });
  it('renders exact native controls and stages configured edits in the existing whole packet action', async () => {
    const f = await fixture(); const data = await loadTicketProgressForm(f.session, input); render(<TicketProgressForm {...data}/>);
    fireEvent.change(screen.getByLabelText('Business reference'), { target: { value: 'Edited reference' } }); fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'IN_PROGRESS' } });
    fireEvent.change(screen.getByLabelText('Resolution / reason'), { target: { value: 'Progressing normally' } }); fireEvent.submit(screen.getByRole('button', { name: 'Update work' }).closest('form')!);
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1)); const form = mocks.update.mock.calls[0][0] as FormData;
    expect(form.get('workId')).toBe('ticket'); expect(form.get('version')).toBe('4'); expect(form.get('status')).toBe('IN_PROGRESS'); expect(form.get('ownerUserId')).toBe('actor'); expect(form.get('reason')).toBe('Progressing normally');
    expect(JSON.parse(String(form.get('studioFields')))).toMatchObject({ operationId: uuid(1), manifestChecksum: 'a'.repeat(64), extensionRevision: 2, fields: [{ definitionId: uuid(3), versionId: uuid(4), generationId: uuid(5), slotRevision: 1, valueRevision: 1, value: { type: 'string', value: 'Edited reference' } }] });
  });
  it('supports unchanged Query/native null-manifest markup and rejects an unrelated/stale manifest', () => {
    render(<TicketProgressForm work={{ id: 'query', version: 2, status: 'NEW', ownerUserId: null }} owners={[]} fieldManifest={null}/>);
    expect(screen.getByRole('button', { name: 'Update work' })).toBeTruthy(); expect(document.querySelector('[name="studioFields"]')).toBeNull(); cleanup();
    expect(() => TicketProgressForm({ work: { id: 'ticket', version: 5, status: 'NEW', ownerUserId: null }, owners: [], fieldManifest: manifest() })).toThrow('CONFLICT');
  });
});
