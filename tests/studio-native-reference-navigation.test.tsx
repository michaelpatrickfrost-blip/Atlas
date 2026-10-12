import { beforeEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Prisma } from '@/generated/prisma/client';
const m = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn(), edges: vi.fn(), version: vi.fn(), metadata: vi.fn(), provider: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: m.membership } } }));
vi.mock('@/core/studio/fields/runtime-authority', () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock('@/core/studio/authoring/reference-navigation', () => ({ readDesignReferenceMetadataInTransaction: m.metadata }));
import { sessionForUser, sessionAuthorityStamp } from '@/core/auth/session';
import { checksum, entity, query, command, declarative } from '@/core/studio/registry/contracts';
import { pageSource } from '@/core/studio/registry/page-contracts';
import { CapabilityRegistry } from '@/core/studio/registry/registry';
import { pageProjectionSchema, pageQueryOutputSchema, type PageSourcePolicy } from '@/core/studio/pages/owner-contract';
import { compilePage } from '@/core/studio/pages/compiler';
import { reconstructPageMetadataInTransaction } from '@/core/studio/pages/server-approvals';
import { pagePayloadSchema } from '@/core/studio/pages/schema';
import type { FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import type { ContractReference } from '@/core/studio/registry/types';
import { readNativeDesignReferenceInTransaction, NATIVE_REFERENCE_SCAN_LIMIT } from '@/core/studio/authoring/native-reference-navigation';
import { nativeDesignReferenceLinks, parseNativeDesignReferenceLocation } from '@/core/studio/authoring/native-reference-links';
import { NativeReferencePanel } from '@/components/studio/native-reference';

// Genuine issued principal, registry, owner contracts and Page compilation are
// real. Refresh/current membership, index SQL and incoming private metadata
// authorisation are explicit collaborators; no SQL/live visibility claim.
const forms = ['desktop', 'tablet', 'phone'] as const;
const base = { version: 1, label: 'Orders', capability: 'example.order.read', lifecycle: 'active' as const, classification: 'confidential' as const };
const ref = ({ id, version, schemaHash, contractHash }: ContractReference) => ({ id, version, schemaHash, contractHash });
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
beforeEach(() => { vi.resetAllMocks(); m.edges.mockResolvedValue([]); });
async function fixture(denied = '', disabled = false) {
  const grants = ['studio.definition.read', base.capability, 'example.order.subject', 'example.order.urgent', 'example.order.header', 'example.order.action'];
  m.membership.mockResolvedValue({ id: 'member', userId: 'actor', organisationId: 'company', sessionVersion: 1, active: true,
    grantedCapabilities: grants.filter(value => value !== denied), deniedCapabilities: [], roles: [],
    user: { name: 'Actor', email: 'actor@example.invalid', authVersion: 1, platformAdmin: null },
    organisation: { id: 'company', name: 'Company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
  const session = await sessionForUser('company', 'actor'); if (!session) throw new Error('No actor');
  const columns = [{ id: 'subject', label: 'Order subject', valueType: 'string' as const, nullable: false, classification: 'confidential' as const, capability: 'example.order.subject' },
    { id: 'urgent', label: 'Urgent', valueType: 'boolean' as const, nullable: false, classification: 'confidential' as const, capability: 'example.order.urgent' }];
  const header = { id: 'example.order.header', version: 1 }, list = { id: 'example.order.list', version: 1 };
  const policy: PageSourcePolicy = { schemaVersion: 1, entity: { id: 'example.order', version: 1 }, accessMode: 'ordinary_read', variants: false, fieldSourceVersions: [],
    nativeFields: [{ id: 'subject', query: header, columnId: 'subject' }],
    queries: [{ query: header, scope: 'record', purpose: 'fact', columns }, { query: list, scope: 'list', purpose: 'list', columns }],
    facts: [{ id: 'urgent', contract: { id: 'example.order', version: 1 }, query: header, columnId: 'urgent', valueType: 'boolean', nullable: false,
      classification: 'confidential', provenance: 'owner_native', capability: 'example.order.urgent' }],
    commands: [{ command: { id: 'example.order.open', version: 1 }, formFactors: [...forms], confirmation: 'optional', previewQuery: null }],
    metrics: [], surfaces: [{ surface: { id: 'example.order.area', version: 1 }, family: 'module', queries: [], formFactors: [...forms] }], maxQueryCost: 12 };
  let unavailable = false;
  const registry = new CapabilityRegistry(async () => !unavailable);
  registry.register('example', { contributions: [entity({ ...base, id: 'example.order', kind: 'entity', key: 'string',
    fields: [{ id: 'subject', label: 'Order subject', type: 'string', nullable: false, classification: 'confidential', capability: 'example.order.subject',
      filterable: false, sortable: false, decision: false, template: false }], extensionPolicy: { customFields: false, recordTypes: false, pageVariants: false } }),
    ...[header, list].map(value => query({ ...base, ...value, kind: 'query', capability: value === header ? 'example.order.header' : base.capability,
      transaction: 'required', pagination: value === header ? 'none' : 'cursor', costClass: 'low', maxCardinality: value === header ? 1 : 10,
      input: z.strictObject({ pageSize: z.number().int(), cursor: z.unknown() }), output: pageProjectionSchema(columns, value === header ? 1 : 10), execute: m.provider })),
    command({ ...base, id: 'example.order.open', kind: 'command', capability: 'example.order.action', execution: 'transactional', idempotency: 'not_applicable', sideEffect: 'none',
      input: z.strictObject({ recordId: z.string() }), output: z.strictObject({ href: z.string() }), invoke: m.provider }),
    declarative({ ...base, id: 'example.order.area', kind: 'surface', references: ['example.order'], schema: z.strictObject({}) }),
    declarative({ ...base, id: 'example.order.secret', kind: 'surface', references: ['example.order'], schema: z.strictObject({}) }),
    pageSource({ ...base, id: 'example.order.page', policy, callbacks: { authoriseRead: m.provider,
      async bindQueryInput(_context, _anchor, input) { return input; }, async projectQueryOutput(_context, _anchor, _request, output) { return pageQueryOutputSchema.parse(output); } } })] });
  const authority: FieldRuntimeAuthority = { session, stamp: sessionAuthorityStamp(session)!, registry,
    transaction: { studioDependency: { findMany: m.edges }, studioDefinitionVersion: { findFirst: m.version } } as unknown as Prisma.TransactionClient };
  m.refresh.mockImplementation(async (principal, transaction) => {
    if (!sessionAuthorityStamp(principal) || principal !== session) throw new Error('FORBIDDEN: genuine current principal required');
    return { ...authority, transaction };
  });
  const sourcePage = ref(registry.describe('example.order.page', 1));
  const target = ref(registry.describe('example.order', 1));
  const input = { sourcePage, reference: target, focus: { kind: 'field' as const, id: 'subject' } };
  const approvals = await reconstructPageMetadataInTransaction(authority, { sourcePage, customFields: [] });
  const plan = compilePage(pagePayloadSchema.parse({ schemaVersion: 1, entity: target, formFactors: forms, sections: [{ id: 'main', label: 'Orders', formFactors: forms,
    columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: 'subject', type: 'fields', fields: [{ source: 'native', fieldId: 'subject', mode: 'read' }], formFactors: forms }] }] }), approvals);
  function saved(n: number, kind = 'page') {
    const definitionId = uuid(1000 + n), versionId = uuid(2000 + n), edgeId = uuid(3000 + n);
    const definition = { id: definitionId, organisationId: 'company', kind, revision: 2, activeVersionId: versionId, retiredAt: null };
    const version = { id: versionId, organisationId: 'company', definitionId, schemaVersion: 1, checksum: checksum(plan), definition };
    const dependency = { id: edgeId, organisationId: 'company', definitionId, versionId, ownerModuleId: 'example',
      contractId: target.id, contractVersion: target.version, schemaHash: target.schemaHash, contractHash: target.contractHash, version };
    const sealed = { ...version, compiledPlan: plan, dependencies: plan.dependencies.map(value => ({ organisationId: 'company', definitionId, versionId,
      ownerModuleId: value.ownerModuleId, contractId: value.id, contractVersion: value.version, schemaHash: value.schemaHash, contractHash: value.contractHash })) };
    return { edge: dependency, sealed };
  }
  m.metadata.mockImplementation(async (_authority, pin) => ({ name: `Saved ${pin.definitionId}`, retired: false,
    sourceHref: `/design-studio/${pin.definitionId}`, whereUsedHref: `/design-studio/references/${pin.definitionId}` }));
  unavailable = disabled;
  return { authority, input, target, sourcePage, saved };
}

it('reads only approved native metadata and round-trips exact hidden identities without any provider/index call', async () => {
  const { authority, input } = await fixture();
  const result = await readNativeDesignReferenceInTransaction(authority, input, { business: 'chosen-business' });
  expect(result).toMatchObject({ name: 'Orders', detail: 'Order subject', owner: 'Example', category: 'Native record', usages: [] });
  const url = new URL(result.whereUsedHref, 'https://atlas.invalid');
  expect(parseNativeDesignReferenceLocation(input.reference.id, Object.fromEntries(url.searchParams))).toEqual({ business: 'chosen-business', usage: true, request: input });
  expect(m.edges).not.toHaveBeenCalled(); expect(m.version).not.toHaveBeenCalled(); expect(m.metadata).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it.each(['studio.definition.read', base.capability, 'example.order.subject', 'example.order.urgent', 'example.order.header'])('denies independent %s before reverse index or incoming names', async denied => {
  const { authority, input } = await fixture(denied);
  await expect(readNativeDesignReferenceInTransaction(authority, input, {}, 'usage')).rejects.toThrow('FORBIDDEN');
  expect(m.edges).not.toHaveBeenCalled(); expect(m.metadata).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('requires the independent command grant while offering a purely descriptive action source', async () => {
  const { authority, sourcePage } = await fixture('example.order.action');
  await expect(readNativeDesignReferenceInTransaction(authority, { sourcePage, reference: ref(authority.registry.describe('example.order.open', 1)) }, {}, 'usage')).rejects.toThrow('FORBIDDEN');
  expect(m.edges).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('accepts only owner-approved native queries/actions/areas and facts, without invocation', async () => {
  const { authority, sourcePage, target } = await fixture();
  for (const id of ['example.order.header', 'example.order.list', 'example.order.open', 'example.order.area'])
    expect((await readNativeDesignReferenceInTransaction(authority, { sourcePage, reference: ref(authority.registry.describe(id, 1)) })).name).toBe('Orders');
  expect((await readNativeDesignReferenceInTransaction(authority, { sourcePage, reference: target, focus: { kind: 'fact', id: 'urgent' } })).detail).toBe('Urgent');
  await expect(readNativeDesignReferenceInTransaction(authority, { sourcePage, reference: ref(authority.registry.describe('example.order.secret', 1)) })).rejects.toThrow('DEPENDENCY_BROKEN');
  expect(m.provider).not.toHaveBeenCalled(); expect(m.edges).not.toHaveBeenCalled();
});
it('refreshes genuine identity and rejects copied identity, unavailable owner or changed exact hashes before metadata', async () => {
  let f = await fixture();
  await expect(readNativeDesignReferenceInTransaction({ ...f.authority, session: { ...f.authority.session } }, f.input)).rejects.toThrow('FORBIDDEN');
  await expect(readNativeDesignReferenceInTransaction(f.authority, { ...f.input, sourcePage: { ...f.sourcePage, contractHash: 'f'.repeat(64) } })).rejects.toThrow('DEPENDENCY_BROKEN');
  f = await fixture('', true);
  await expect(readNativeDesignReferenceInTransaction(f.authority, f.input)).rejects.toThrow('DEPENDENCY_BROKEN');
  expect(m.edges).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('honours a current membership revocation from the original authority refresh before any index or incoming label', async () => {
  const { authority, input } = await fixture();
  m.refresh.mockRejectedValueOnce(new Error('FORBIDDEN: current membership revoked'));
  await expect(readNativeDesignReferenceInTransaction(authority, input, {}, 'usage')).rejects.toThrow('FORBIDDEN');
  expect(m.edges).not.toHaveBeenCalled(); expect(m.metadata).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('validates complete immutable native dependency mirrors before private metadata names and omits denied names', async () => {
  const { authority, input, saved } = await fixture(), a = saved(1), b = saved(2);
  m.edges.mockResolvedValue([a.edge, b.edge]); m.version.mockImplementation(async ({ where }) => where.id === a.sealed.id ? a.sealed : b.sealed);
  m.metadata.mockRejectedValueOnce(new Error('FORBIDDEN: private incoming design'));
  const result = await readNativeDesignReferenceInTransaction(authority, input, {}, 'usage');
  expect(result.usages).toEqual([{ name: `Saved ${b.edge.definitionId}`, kind: 'Screen', status: 'Live', href: `/design-studio/${b.edge.definitionId}` }]);
  expect(m.edges).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: 'company', ownerModuleId: 'example', contractId: input.reference.id }), orderBy: { id: 'asc' }, take: 501 }));
  expect(m.provider).not.toHaveBeenCalled();
});
it.each(['tenant', 'hash', 'definition', 'missing-edge', 'duplicate-edge', 'compiled-hash'])('fails closed on %s mirror corruption before incoming labels', async defect => {
  const { authority, input, saved } = await fixture(), a = saved(1);
  if (defect === 'tenant') a.edge.version.organisationId = 'other';
  if (defect === 'hash') a.edge.schemaHash = 'f'.repeat(64);
  if (defect === 'definition') a.edge.definitionId = uuid(9000);
  if (defect === 'missing-edge') a.sealed.dependencies.pop();
  if (defect === 'duplicate-edge') a.sealed.dependencies.push(a.sealed.dependencies[0]);
  if (defect === 'compiled-hash') a.sealed.compiledPlan.dependencies[0].contractHash = 'f'.repeat(64);
  m.edges.mockResolvedValue([a.edge]); m.version.mockResolvedValue(a.sealed);
  await expect(readNativeDesignReferenceInTransaction(authority, input, {}, 'usage')).rejects.toThrow('DEPENDENCY_BROKEN');
  expect(m.metadata).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('paginates a bounded snapshot and rejects changed pointer or retargeted continuations', async () => {
  const { authority, input, saved } = await fixture(), rows = Array.from({ length: 26 }, (_, i) => saved(i + 1));
  m.edges.mockResolvedValue(rows.map(row => row.edge)); m.version.mockImplementation(async ({ where }) => rows.find(row => row.sealed.id === where.id)!.sealed);
  const first = await readNativeDesignReferenceInTransaction(authority, input, {}, 'usage'); expect(first.usages).toHaveLength(25);
  const url = new URL(first.nextHref!, 'https://atlas.invalid'), continuation = parseNativeDesignReferenceLocation(input.reference.id, Object.fromEntries(url.searchParams));
  const next = await readNativeDesignReferenceInTransaction(authority, continuation.request, {}, 'usage'); expect(next.usages).toHaveLength(1); expect(next.nextHref).toBeNull();
  rows[0].edge.version.definition.revision++;
  await expect(readNativeDesignReferenceInTransaction(authority, continuation.request, {}, 'usage')).rejects.toThrow('CONFLICT');
  expect(m.provider).not.toHaveBeenCalled();
});
it('surfaces 500+1 overflow as a scoped limit without incoming names or version reads', async () => {
  const { authority, input, saved } = await fixture(); m.edges.mockResolvedValue(Array.from({ length: NATIVE_REFERENCE_SCAN_LIMIT + 1 }, (_, i) => saved(i).edge));
  await expect(readNativeDesignReferenceInTransaction(authority, input, {}, 'usage')).rejects.toThrow('REFERENCE_USAGE_LIMIT');
  expect(m.version).not.toHaveBeenCalled(); expect(m.metadata).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('rejects unknown client authority, incomplete focus/cursors and does not present IDs or raw schemas as an editor', async () => {
  const { authority, input } = await fixture(), links = nativeDesignReferenceLinks(input);
  await expect(readNativeDesignReferenceInTransaction(authority, { ...input, organisationId: 'other' })).rejects.toThrow();
  const url = new URL(links.whereUsedHref, 'https://atlas.invalid'), search = Object.fromEntries(url.searchParams);
  expect(() => parseNativeDesignReferenceLocation(input.reference.id, { ...search, detail: undefined })).toThrow();
  expect(() => parseNativeDesignReferenceLocation(input.reference.id, { ...search, after: uuid(1) })).toThrow();
  expect(() => parseNativeDesignReferenceLocation(input.reference.id, { ...search, source: ['example.order.page'] })).toThrow();
  const model = await readNativeDesignReferenceInTransaction(authority, input, {}, 'usage');
  const html = renderToStaticMarkup(<NativeReferencePanel model={model} workspaceHref="/design-studio"/>);
  expect(html).toContain('Approved app version 1'); expect(html).toContain('not a count of individual fields');
  expect(html).not.toContain('<form'); expect(html).not.toContain('<textarea');
});
