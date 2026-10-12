import { beforeEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
const m = vi.hoisted(() => ({ membership: vi.fn(), draft: vi.fn(), refresh: vi.fn(), provider: vi.fn(), write: vi.fn(), actor: vi.fn(), context: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: m.membership } } }));
vi.mock('@/core/auth/session', async importOriginal => ({ ...await importOriginal<typeof import('@/core/auth/session')>(), requireSession: m.actor }));
vi.mock('@/core/studio/fields/runtime-authority', () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock('@/core/studio/authoring/context', () => ({ withStudioAuthoringAuthority: m.context }));
import { sessionForUser, sessionAuthorityStamp } from '@/core/auth/session';
import { entity, query } from '@/core/studio/registry/contracts';
import { pageSource } from '@/core/studio/registry/page-contracts';
import { CapabilityRegistry } from '@/core/studio/registry/registry';
import { pageProjectionSchema, pageQueryOutputSchema, type PageSourcePolicy } from '@/core/studio/pages/owner-contract';
import { pagePayloadSchema } from '@/core/studio/pages/schema';
import type { FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import { compareCurrentPageDraftInTransaction } from '@/core/studio/authoring/page-comparison';
import { createDesignPageDisplayModel } from '@/core/studio/pages/design-model';
import { compareSavedVisualScreen } from '@/app/(studio)/design-studio/draft-comparison-actions';

// Real issued principal, registry/Page owner contracts, current compiler,
// catalogue and inert model. Authority refresh/current membership/SQL are explicit
// collaborators; these cases do not prove central SQL or browser conflict UX.
const id = '90000000-0000-4000-8000-000000000001', active = '90000000-0000-4000-8000-000000000002';
const forms = ['desktop', 'phone'] as const;
const native = { id: 'example.order', version: 1, label: 'Orders', capability: 'example.order.read', lifecycle: 'active' as const, classification: 'confidential' as const };
beforeEach(() => vi.resetAllMocks());
async function fixture(denied = '', newNativeField = false) {
  m.membership.mockResolvedValue({ id: 'member', userId: 'actor', organisationId: 'company', sessionVersion: 1, active: true,
    grantedCapabilities: ['studio.definition.read', native.capability, 'example.order.subject', 'example.order.delivery'].filter(value => value !== denied), deniedCapabilities: [], roles: [],
    user: { name: 'Actor', email: 'actor@example.invalid', authVersion: 1, platformAdmin: null },
    organisation: { id: 'company', name: 'Company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
  const session = await sessionForUser('company', 'actor'); if (!session) throw new Error('No actor');
  const header = { id: 'example.order.header', version: 1 }, columns = [{ id: 'subject', label: 'Order subject', valueType: 'string' as const,
    nullable: false, classification: 'confidential' as const, capability: 'example.order.subject' },
    ...(newNativeField ? [{ id: 'delivery', label: 'Delivery method', valueType: 'string' as const, nullable: false,
      classification: 'confidential' as const, capability: 'example.order.delivery' }] : [])];
  const policy: PageSourcePolicy = { schemaVersion: 1, entity: { id: native.id, version: 1 }, accessMode: 'ordinary_read', variants: false, fieldSourceVersions: [],
    nativeFields: [{ id: 'subject', query: header, columnId: 'subject' }, ...(newNativeField ? [{ id: 'delivery', query: header, columnId: 'delivery' }] : [])], queries: [{ query: header, scope: 'record', purpose: 'fact', columns }],
    facts: [], commands: [], metrics: [], surfaces: [], maxQueryCost: 12 };
  const registry = new CapabilityRegistry(async () => true);
  registry.register('example', { contributions: [entity({ ...native, kind: 'entity', key: 'string',
    fields: [{ id: 'subject', label: 'Order subject', type: 'string', nullable: false, classification: 'confidential', capability: 'example.order.subject',
      filterable: false, sortable: false, decision: false, template: false }, ...(newNativeField ? [{ id: 'delivery', label: 'Delivery method', type: 'string' as const, nullable: false, classification: 'confidential' as const, capability: 'example.order.delivery', filterable: false, sortable: false, decision: false, template: false }] : [])], extensionPolicy: { customFields: false, recordTypes: false, pageVariants: false } }),
    query({ ...native, ...header, kind: 'query', transaction: 'required', pagination: 'none', costClass: 'low', maxCardinality: 1,
      input: z.strictObject({ recordId: z.string() }), output: pageProjectionSchema(columns, 1), execute: m.provider }),
    pageSource({ ...native, id: 'example.order.page', policy, callbacks: { authoriseRead: m.provider,
      async bindQueryInput(_context, _anchor, input) { return input; }, async projectQueryOutput(_context, _anchor, _request, output) { return pageQueryOutputSchema.parse(output); } } })] });
  const source = registry.describe(native.id, 1), entityRef = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
  const saved = pagePayloadSchema.parse({ schemaVersion: 1, entity: entityRef, formFactors: forms, sections: [{ id: 'main', label: 'Saved order design',
    formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: 'guide', type: 'instructions', text: 'Saved guidance', formFactors: forms },
      { id: 'subject', type: 'fields', label: 'Order details', fields: [{ source: 'native', fieldId: 'subject', mode: 'read' }], formFactors: forms }] }] });
  const local = structuredClone(saved); local.sections[0].label = 'My unsaved order design';
  const guide = local.sections[0].components[0]; if (guide.type !== 'instructions') throw new Error('Fixture'); guide.text = 'My unsaved guidance';
  const row = { id: 'draft', organisationId: 'company', definitionId: id, revision: 7, payload: saved,
    definition: { id, organisationId: 'company', kind: 'page', retiredAt: null, revision: 5, activeVersionId: active } };
  m.draft.mockResolvedValue(row);
  const transaction = { studioDraft: { findFirst: m.draft, updateMany: m.write }, studioDefinition: { updateMany: m.write },
    studioDefinitionVersion: { create: m.write }, auditEntry: { create: m.write }, $executeRaw: m.write } as unknown as Prisma.TransactionClient;
  const authority: FieldRuntimeAuthority = { session, stamp: sessionAuthorityStamp(session)!, registry, transaction };
  m.refresh.mockImplementation(async (principal, tx) => {
    if (principal !== session || sessionAuthorityStamp(principal) !== authority.stamp) throw new Error('FORBIDDEN: current principal required');
    return { ...authority, transaction: tx };
  });
  m.actor.mockResolvedValue(session); m.context.mockImplementation(async (_actor, _capability, _business, callback) => callback(authority));
  const input = { definitionId: id, revision: 3, definitionRevision: 4, payload: local, formFactor: 'desktop' };
  return { authority, input, row, saved, local };
}
it('compares an older observed head against the actual current saved draft with labelled samples and structural changes only', async () => {
  const { authority, input, saved, local, row } = await fixture(), before = structuredClone(row), result = await compareCurrentPageDraftInTransaction(authority, input);
  expect(result).toMatchObject({ revision: 7, definitionRevision: 5, activeVersionId: active, payload: saved,
    model: { sections: [{ label: 'Saved order design', components: [{ text: 'Saved guidance' }, { cells: [{ label: 'Order subject', text: 'Sample' }] }] }] } });
  expect(result.changes).toEqual(['Section “My unsaved order design” has different headings, layout or visibility settings.', '“Screen item” has different content or settings in your changes.']);
  expect(result.changes.join(' ')).not.toContain('example.order'); expect(local).toEqual(input.payload); expect(row).toEqual(before);
  expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
  expect(m.draft).toHaveBeenCalledWith(expect.objectContaining({ where: { definitionId: id, organisationId: 'company', definition: { kind: 'page', retiredAt: null } } }));
});
it('allows exact unchanged local metadata to compare without fabricating differences, merging or advancing the draft', async () => {
  const { authority, input, saved } = await fixture(), result = await compareCurrentPageDraftInTransaction(authority, { ...input, payload: saved });
  expect(result.changes).toEqual([]); expect(result.payload).toEqual(saved); expect(m.write).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it.each(['studio.definition.read', native.capability, 'example.order.subject'])('requires independent current %s before labels/models or providers', async denied => {
  const { authority, input } = await fixture(denied);
  await expect(compareCurrentPageDraftInTransaction(authority, input)).rejects.toThrow('FORBIDDEN');
  if (denied === 'studio.definition.read') expect(m.draft).not.toHaveBeenCalled();
  expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('compiles the unsaved local metadata independently even when the saved draft needs fewer grants', async () => {
  const { authority, input, row, saved } = await fixture('example.order.subject'); saved.sections[0].components.pop(); row.payload = saved;
  await expect(compareCurrentPageDraftInTransaction(authority, input)).rejects.toThrow('FORBIDDEN');
  expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('denies forged, revoked or stamp-mismatched authority before draft lookup', async () => {
  const { authority, input } = await fixture();
  await expect(compareCurrentPageDraftInTransaction({ ...authority, session: { ...authority.session } }, input)).rejects.toThrow('FORBIDDEN');
  await expect(compareCurrentPageDraftInTransaction({ ...authority, stamp: {} as FieldRuntimeAuthority['stamp'] }, input)).rejects.toThrow('FORBIDDEN');
  m.refresh.mockRejectedValueOnce(new Error('FORBIDDEN: membership revoked'));
  await expect(compareCurrentPageDraftInTransaction(authority, input)).rejects.toThrow('FORBIDDEN'); expect(m.draft).not.toHaveBeenCalled();
});
it.each(['foreign', 'retired', 'definition', 'future-draft', 'future-head', 'source'])('rejects %s identity/observation instead of returning another or incompatible draft', async defect => {
  const { authority, input, row } = await fixture();
  if (defect === 'foreign') row.organisationId = 'other';
  if (defect === 'retired') row.definition.retiredAt = new Date() as unknown as null;
  if (defect === 'definition') row.definition.id = active;
  if (defect === 'future-draft') input.revision = 8;
  if (defect === 'future-head') input.definitionRevision = 6;
  if (defect === 'source') input.payload.entity.contractHash = 'f'.repeat(64);
  await expect(compareCurrentPageDraftInTransaction(authority, input)).rejects.toThrow('CONFLICT');
  expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('rejects invalid stored ownership and unsupported local metadata/device before comparison output', async () => {
  const { authority, input, row } = await fixture();
  await expect(compareCurrentPageDraftInTransaction(authority, { ...input, organisationId: 'other' })).rejects.toThrow();
  expect(m.draft).not.toHaveBeenCalled();
  await expect(compareCurrentPageDraftInTransaction(authority, { ...input, formFactor: 'tablet' })).rejects.toThrow('preview size');
  row.payload.entity.schemaHash = 'f'.repeat(64); input.payload.entity.schemaHash = 'f'.repeat(64);
  await expect(compareCurrentPageDraftInTransaction(authority, input)).rejects.toThrow('DEPENDENCY_BROKEN');
  expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('returns generic conflict for an unavailable tenant draft without versions or private names', async () => {
  const { authority, input } = await fixture(); m.draft.mockResolvedValue(null);
  await expect(compareCurrentPageDraftInTransaction(authority, input)).rejects.toThrow('CONFLICT'); expect(m.provider).not.toHaveBeenCalled(); expect(m.write).not.toHaveBeenCalled();
});
it('the separate server action authenticates/authorises first and delegates selected business to the original transaction', async () => {
  const { authority, input } = await fixture();
  expect((await compareSavedVisualScreen('selected-business', input)).revision).toBe(7);
  expect(m.context).toHaveBeenCalledWith(authority.session, 'studio.definition.read', 'selected-business', expect.any(Function));
  m.context.mockClear(); m.actor.mockResolvedValue({ ...authority.session, capabilities: new Set() });
  await expect(compareSavedVisualScreen('selected-business', input)).rejects.toThrow('FORBIDDEN'); expect(m.context).not.toHaveBeenCalled();
  expect(m.write).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});

it('returns independently fresh saved/local choices so explicit adoption can render a newly saved field and preserve local details', async () => {
  const { authority, input, saved, local } = await fixture('', true);
  const savedDetails = saved.sections[0].components[1]; if (savedDetails.type !== 'fields') throw new Error('Fixture');
  savedDetails.fields = [{ source: 'native', fieldId: 'delivery', mode: 'read' }];
  const result = await compareCurrentPageDraftInTransaction(authority, input, { business: 'selected business' });
  expect(result.model.sections[0].components[1]).toMatchObject({ cells: [{ label: 'Delivery method', text: 'Sample', unavailable: false }] });
  expect(result.presentation.saved.catalog.nativeFields).toContainEqual({ id: 'delivery', label: 'Delivery method' });
  expect(result.presentation.local.catalog.nativeFields).toContainEqual({ id: 'subject', label: 'Order subject' });
  expect(result.presentation.local.fields).toEqual(expect.arrayContaining([expect.objectContaining({ field: { source: 'native', fieldId: 'delivery', mode: 'read' } })]));
  const localModel = createDesignPageDisplayModel(local, result.presentation.local.catalog, 'desktop');
  expect(localModel.sections[0].components[1]).toMatchObject({ cells: [{ label: 'Order subject', text: 'Sample', unavailable: false }] });
  expect(result.presentation.saved.catalog).not.toBe(result.presentation.local.catalog);
  expect(result.presentation.saved.fields).not.toBe(result.presentation.local.fields);
  for (const choices of [result.presentation.saved, result.presentation.local]) {
    const links = choices.fields[0];
    expect(new URL(links.sourceHref!, 'https://atlas.test').searchParams.get('business')).toBe('selected business');
    expect(choices.palette.some(item => item.component.type === 'fields')).toBe(true);
    expect(choices.conditions).toMatchObject({ variantsAllowed: false, facts: [], recordTypes: [] });
  }
  expect(savedDetails.fields[0]).toMatchObject({ fieldId: 'delivery' });
  expect(local.sections[0].components[1]).toMatchObject({ fields: [{ fieldId: 'subject' }] });
  expect(m.write).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('never returns fresh presentation names when an independently required saved field grant is revoked', async () => {
  const { authority, input, saved } = await fixture('example.order.delivery', true);
  const details = saved.sections[0].components[1]; if (details.type !== 'fields') throw new Error('Fixture');
  details.fields = [{ source: 'native', fieldId: 'delivery', mode: 'read' }];
  await expect(compareCurrentPageDraftInTransaction(authority, input)).rejects.toThrow('FORBIDDEN');
  expect(m.write).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it('projects selected business into freshly generated navigation only from the server action context', async () => {
  const { input } = await fixture();
  const result = await compareSavedVisualScreen('business with spaces', input);
  expect(new URL(result.presentation.saved.fields[0].whereUsedHref!, 'https://atlas.test').searchParams.get('business')).toBe('business with spaces');
  await expect(compareSavedVisualScreen('business with spaces', { ...input, business: 'foreign' })).rejects.toThrow();
  expect(m.write).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
