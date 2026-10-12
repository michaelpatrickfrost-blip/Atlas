import { beforeEach, expect, it, vi } from 'vitest';
import type { Session, SessionAuthorityStamp } from '@/core/auth/session';
import type { Prisma } from '@/generated/prisma/client';
import type { FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
const m = vi.hoisted(() => ({ stamp: vi.fn(), refresh: vi.fn(), draft: vi.fn(), module: vi.fn(), metrics: vi.fn(), edges: vi.fn(), write: vi.fn(), provider: vi.fn(), retained: vi.fn() }));
vi.mock('@/core/auth/session', () => ({ sessionAuthorityStamp: m.stamp, requireSession: vi.fn(), getSession: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: new Proxy({}, { get: () => ({ findMany: m.provider, groupBy: m.provider, count: m.provider }) }) }));
vi.mock('@/core/studio/fields/runtime-authority', () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock('@/core/modules/runtime', () => ({ getEnabledModuleIds: vi.fn(), enabledModulesForSession: vi.fn(), isModuleEnabled: vi.fn() }));
vi.mock('@/core/modules/access', () => ({ assertModuleEnabled: vi.fn() }));
vi.mock('@/core/analytics/catalogue', () => ({ getAnalyticsMetrics: m.metrics }));
vi.mock('@/core/studio/authoring/reference-navigation', () => ({ readDesignReferenceMetadataInTransaction: m.retained }));
import { CapabilityRegistry } from '@/core/studio/registry/registry';
import { analyticsBusinessViewContract } from '@/modules/analytics/services/studio-view';
import { salesAnalyticsStudioContract } from '@/modules/sales/services/studio-analytics';
import { productsAnalyticsStudioContract } from '@/modules/products/services/studio-analytics';
import { analyticsBusinessViewContentSchema } from '@/modules/analytics/services/business-view-contract';
import { inspectBusinessViewDraftInTransaction, compareBusinessViewDraftInTransaction, readBusinessMeasureReferencesInTransaction } from '@/modules/analytics/services/studio-business-view-inspection';
import { readNativeDesignReferenceInTransaction } from '@/core/studio/authoring/native-reference-navigation';
import { nativeDesignReferenceLinks, nativeDesignReferenceRequestSchema, parseNativeDesignReferenceLocation } from '@/core/studio/authoring/native-reference-links';
const id = '00000000-0000-4000-8000-000000000001';
const content = () => analyticsBusinessViewContentSchema.parse({ name: 'Overview', widgets: [{ id: 'one', metricId: 'sales.orders', visual: 'bar', wide: false }] });
let authority: FieldRuntimeAuthority, session: Session, registry: CapabilityRegistry, enabled: Set<string>, stamps: WeakMap<Session, SessionAuthorityStamp>;
const exact = (name: string) => { const { id, version, schemaHash, contractHash } = registry.describe(name, 1); return { id, version, schemaHash, contractHash }; };
const request = () => ({ definitionId: id, revision: 3, definitionRevision: 5, content: { ...content(), name: 'Local overview' } });
// Real closed owner compiler and registry/source guards; genuine issuance,
// current refresh, native catalogue and storage are explicit collaborators.
// No SQL, provider values or live publication evidence is claimed.
beforeEach(() => {
  vi.resetAllMocks(); enabled = new Set(['analytics', 'sales', 'products']); stamps = new WeakMap();
  session = { organisationId: 'business', userId: 'author', membershipId: 'member', userName: 'Author', userEmail: 'author@example.test', organisationName: 'Business',
    capabilities: new Set(['studio.definition.read', 'studio.definition.edit', 'analytics.dashboard.read', 'analytics.dashboard.manage', 'sales.order.read', 'sales.quote.read', 'core.products.read']) };
  const stamp = { organisationId: 'business', userId: 'author', membershipId: 'member', authVersion: 1, sessionVersion: 1 }; stamps.set(session, stamp);
  m.stamp.mockImplementation(value => stamps.get(value));
  registry = new CapabilityRegistry(async (_session, owner) => enabled.has(owner));
  registry.register('analytics', analyticsBusinessViewContract); registry.register('sales', salesAnalyticsStudioContract); registry.register('products', productsAnalyticsStudioContract);
  const tx = { moduleState: { findFirst: m.module }, studioDraft: { findFirst: m.draft, updateMany: m.write }, studioDefinition: { updateMany: m.write },
    studioDependency: { findMany: m.edges }, auditEntry: { create: m.write }, studioDefinitionVersion: { findFirst: m.provider } } as unknown as Prisma.TransactionClient;
  authority = { session, registry, stamp, transaction: tx };
  m.refresh.mockImplementation(async principal => { if (!stamps.has(principal)) throw new Error('FORBIDDEN: genuine principal required'); return authority; });
  m.module.mockResolvedValue({ id: 'studio' });
  m.draft.mockResolvedValue({ id: 'draft', organisationId: 'business', definitionId: id, revision: 3,
    payload: { schemaVersion: 1, sourceView: exact('analytics.dashboard.view'), content: content() },
    definition: { id, organisationId: 'business', kind: 'view', retiredAt: null, revision: 5, activeVersionId: null } });
  m.metrics.mockResolvedValue([{ id: 'sales.orders', name: 'Orders' }, { id: 'sales.quotes', name: 'Quotes' }, { id: 'products.catalogue', name: 'Products' }]);
  m.edges.mockResolvedValue([]);
});
it('continuously compiles saved/local current metadata and strict exact heads without any provider, update or Audit', async () => {
  const result = await inspectBusinessViewDraftInTransaction(authority, request(), { business: 'chosen' });
  expect(result).toMatchObject({ definitionId: id, revision: 3, definitionRevision: 5, content: request().content, warnings: [] });
  expect(result.measures).toHaveLength(3); expect(result.measures[0].sourceHref).toContain('family=view');
  expect(result.measures[0].sourceHref).toContain('business=chosen');
  expect(m.draft.mock.calls[0][0].where).toMatchObject({ organisationId: 'business', definitionId: id, definition: { kind: 'view', retiredAt: null } });
  expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled(); expect(m.edges).not.toHaveBeenCalled();
});
it('compares against newer server heads retaining local content and plain structural changes, no write/review/publish', async () => {
  const saved = await m.draft(); saved.revision = 4; saved.definition.revision = 7; saved.definition.activeVersionId = 'live';
  const result = await compareBusinessViewDraftInTransaction(authority, request());
  expect(result).toMatchObject({ revision: 4, definitionRevision: 7, activeVersionId: 'live', saved: content(), local: request().content, changes: ['The dashboard name differs.'] });
  await expect(inspectBusinessViewDraftInTransaction(authority, request())).rejects.toThrow('CONFLICT');
  await expect(compareBusinessViewDraftInTransaction(authority, { ...request(), revision: 5 })).rejects.toThrow('CONFLICT');
  expect(m.write).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it.each(['studio.definition.read', 'studio.definition.edit', 'analytics.dashboard.read', 'analytics.dashboard.manage'])('denies fresh %s before draft names', async capability => {
  session.capabilities.delete(capability);
  await expect(inspectBusinessViewDraftInTransaction(authority, request())).rejects.toThrow('FORBIDDEN'); expect(m.draft).not.toHaveBeenCalled();
});
it('rejects forged authority and unsupported/foreign/retired saved identities without metadata fallback', async () => {
  await expect(inspectBusinessViewDraftInTransaction({ ...authority, session: { ...session } }, request())).rejects.toThrow('FORBIDDEN');
  const row = await m.draft(); row.organisationId = 'other'; m.draft.mockClear();
  await expect(compareBusinessViewDraftInTransaction(authority, request())).rejects.toThrow('unavailable');
  expect(m.metrics).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('rechecks ALL saved/local used source rights before reference labels and rejects raw payload/capability injections', async () => {
  session.capabilities.delete('sales.order.read');
  await expect(compareBusinessViewDraftInTransaction(authority, request())).rejects.toThrow('FORBIDDEN'); expect(m.metrics).not.toHaveBeenCalled();
  await expect(inspectBusinessViewDraftInTransaction(authority, { ...request(), organisationId: 'other' })).rejects.toThrow();
  session.capabilities.add('sales.order.read');
  const row = await m.draft(); row.payload.sourceView.schemaHash = 'f'.repeat(64);
  await expect(compareBusinessViewDraftInTransaction(authority, request())).rejects.toThrow('DEPENDENCY_BROKEN'); expect(m.write).not.toHaveBeenCalled();
});
it('omits unused forbidden measure names but treats current opt-out/hash/module changes as broken', async () => {
  session.capabilities.delete('sales.quote.read');
  expect((await readBusinessMeasureReferencesInTransaction(authority)).map(value => value.id)).toEqual(['sales.orders', 'products.catalogue']);
  const original = salesAnalyticsStudioContract.contributions.find(value => value.metadata.id === 'sales.orders.metric.read')!;
  registry.register('sales', { contributions: [{ ...original, metadata: { ...original.metadata, version: 2, capability: 'sales.order.manage' } }] });
  await expect(readBusinessMeasureReferencesInTransaction(authority)).rejects.toThrow('DEPENDENCY_BROKEN');
  expect(m.provider).not.toHaveBeenCalled();
});
it('View references round-trip unchanged exact hashes and use original bounded usage index without any provider', async () => {
  const input = { sourceView: exact('analytics.dashboard.view'), reference: exact('sales.orders.metric') };
  const links = nativeDesignReferenceLinks(input, { business: 'chosen' }), url = new URL(links.whereUsedHref, 'https://atlas.invalid');
  expect(parseNativeDesignReferenceLocation(input.reference.id, Object.fromEntries(url.searchParams))).toEqual({ business: 'chosen', usage: true, request: input });
  expect((await readNativeDesignReferenceInTransaction(authority, input, {}, 'usage'))).toMatchObject({ name: registry.describe('sales.orders.metric', 1).label, category: 'Approved measure', usages: [] });
  expect(m.edges.mock.calls[0][0]).toMatchObject({ take: 501, orderBy: { id: 'asc' }, where: { organisationId: 'business', contractId: input.reference.id } });
  expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
  expect(() => nativeDesignReferenceRequestSchema.parse({ ...input, focus: { kind: 'field', id: 'status' } })).toThrow();
});
it('View navigation denies target/query/current module/forged identity before reverse-index or names', async () => {
  const input = { sourceView: exact('analytics.dashboard.view'), reference: exact('sales.orders.metric') };
  session.capabilities.delete('sales.order.read');
  await expect(readNativeDesignReferenceInTransaction(authority, input, {}, 'usage')).rejects.toThrow('FORBIDDEN'); expect(m.edges).not.toHaveBeenCalled();
  session.capabilities.add('sales.order.read'); enabled.delete('sales');
  await expect(readNativeDesignReferenceInTransaction(authority, input, {}, 'usage')).rejects.toThrow('DEPENDENCY_BROKEN'); expect(m.edges).not.toHaveBeenCalled();
  expect(m.provider).not.toHaveBeenCalled();
});
