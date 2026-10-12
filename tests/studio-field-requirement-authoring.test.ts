import { beforeEach, expect, it, vi } from 'vitest';
import type { Prisma } from '@/generated/prisma/client';
import { CapabilityRegistry } from '@/core/studio/registry/registry';
import { ticketStudioContract } from '@/core/service-work/studio';
import { compileCustomField } from '@/core/studio/compiler/fields';
import { checksum } from '@/core/studio/registry/contracts';
import { conditionalFieldPayloadSchema } from '@/core/studio/fields/required-contract';
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), modules: vi.fn(), module: vi.fn(), draft: vi.fn(),
  definitions: vi.fn(), definition: vi.fn(), version: vi.fn(), generation: vi.fn(), save: vi.fn(), audit: vi.fn(), transaction: vi.fn(), publication: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock('@/core/audit/log', () => ({ writeAudit: m.audit }));
vi.mock('@/core/studio/registry/runtime', () => ({ buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => {
  const registry = new CapabilityRegistry(available); registry.register('tickets', ticketStudioContract); return registry;
} }));
import { sessionForUser, sessionAuthorityStamp } from '@/core/auth/session';
import { fieldRuntimeAuthorityInTransaction } from '@/core/studio/fields/runtime-authority';
import { readAdditionalFieldRequirementInTransaction, saveAdditionalFieldRequirementInTransaction, readAdditionalFieldRequirementEvolutionInTransaction, saveAdditionalFieldRequirementEvolutionDraftInTransaction } from '@/core/studio/authoring/field-requirement-authoring';
import { additionalFieldRequirementSchema } from '@/core/studio/authoring/field-requirement-input';
// Actual genuine Session issuance, refresh/provider, registry, sealed fields and
// conditional compiler. SQL/CAS/Audit are explicit collaborators; no PG proof.
const uuid = (n: number) => `83000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const registry = new CapabilityRegistry(async () => true); registry.register('tickets', ticketStudioContract);
const d = registry.describe('tickets.ticket', 9), entity = { id: d.id, version: d.version, schemaHash: d.schemaHash, contractHash: d.contractHash };
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company },
  moduleState: { findMany: m.modules, findFirst: m.module }, studioDraft: { findFirst: m.draft, updateMany: m.save },
  studioDefinition: { findFirst: m.definition, findMany: m.definitions }, studioDefinitionVersion: { findFirst: m.version }, studioFieldGeneration: { findFirst: m.generation }, studioFieldMigrationPublication: { findFirst: m.publication } } as unknown as Prisma.TransactionClient;
const memberFixture = () => ({ id: 'member', userId: 'actor', organisationId: 'company', sessionVersion: 2, active: true,
  grantedCapabilities: ['studio.definition.edit', 'tickets.ticket.read', 'tickets.ticket.manage'], deniedCapabilities: [] as string[], roles: [],
  user: { name: 'Actor', email: 'actor@example.test', authVersion: 3, platformAdmin: null },
  organisation: { id: 'company', name: 'Company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
let member: ReturnType<typeof memberFixture>, draft: { id: string; definitionId: string; organisationId: string; revision: number; payload: unknown;
  definition: { id: string; organisationId: string; key: string; kind: string; retiredAt: null; revision: number; latestVersion: number; activeVersionId: string | null }; baseVersion: null | { version: number } };
type Row = Awaited<ReturnType<typeof sourceField>>;
let sources: Row[];
async function authenticated() { const session = await sessionForUser('company', 'actor'); if (!session) throw new Error('fixture'); return session; }
async function authority() { return fieldRuntimeAuthorityInTransaction(await authenticated(), tx); }
async function sourceField(n: number, patch: object = {}) {
  const session = await authenticated(), compiled = await compileCustomField({ ...session, capabilities: new Set([...session.capabilities, 'tickets.private.read', 'tickets.private.write']) },
    { schemaVersion: 1, entity, storageGeneration: uuid(n + 30), field: { key: `source_${n}`, label: `Approved detail ${n}`, classification: 'confidential',
      readCapability: 'tickets.ticket.read', writeCapability: 'tickets.ticket.manage', storage: { type: 'integer' }, ...patch } }, registry);
  return { id: uuid(n), organisationId: 'company', kind: 'customField', key: `tickets.ticket.source_${n}`, retiredAt: null, activeVersionId: uuid(n + 10),
    activeVersion: { id: uuid(n + 10), organisationId: 'company', definitionId: uuid(n), schemaVersion: 1, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum } };
}
beforeEach(async () => {
  vi.resetAllMocks(); member = memberFixture(); m.member.mockImplementation(async () => structuredClone(member));
  m.raw.mockImplementation(async query => query.join('') === 'SHOW transaction_isolation' ? [{ transaction_isolation: 'serializable' }] : []);
  m.company.mockResolvedValue({ id: 'company' }); m.modules.mockResolvedValue([{ moduleId: 'studio', enabled: true, entitled: true }, { moduleId: 'tickets', enabled: true, entitled: true }]);
  m.module.mockResolvedValue({ id: 'studio' }); m.generation.mockImplementation(async input => ({ id: input.where.id })); m.save.mockResolvedValue({ count: 1 });
  const session = await authenticated(), base = await compileCustomField(session, { schemaVersion: 1, entity, storageGeneration: uuid(30),
    field: { key: 'our_detail', label: 'Our detail', classification: 'confidential', readCapability: 'tickets.ticket.read', writeCapability: 'tickets.ticket.manage', storage: { type: 'string' } } }, registry);
  draft = { id: uuid(50), definitionId: uuid(1), organisationId: 'company', revision: 3, payload: base.payload,
    definition: { id: uuid(1), organisationId: 'company', key: 'tickets.ticket.our_detail', kind: 'customField', retiredAt: null, revision: 7, latestVersion: 0, activeVersionId: null }, baseVersion: null };
  sources = [await sourceField(2), await sourceField(3, { storage: { type: 'boolean' } })];
  m.draft.mockImplementation(async () => draft);
  m.definitions.mockImplementation(async () => sources);
  m.definition.mockImplementation(async ({ where }) => where.id === draft.definitionId ? draft.definition : sources.find(row => row.id === where.id && row.organisationId === where.organisationId) ?? null);
  m.version.mockImplementation(async ({ where }) => sources.find(row => row.activeVersion.id === where.id && row.id === where.definitionId)?.activeVersion ?? null);
});
const request = { definitionId: uuid(1), revision: 3, requirement: { always: false, when: { match: 'all' as const,
  conditions: [{ choiceId: 'native:status', operator: 'equals' as const, value: { type: 'enum' as const, value: 'IN_PROGRESS' } }] } } };
it('reads only approved native facts/current active fields with friendly labels and no pins/graphs/data', async () => {
  const result = await readAdditionalFieldRequirementInTransaction(await authority(), { definitionId: uuid(1) });
  expect(result).toMatchObject({ revision: 3, editable: true, initial: { always: false, when: null } });
  expect(result.choices.map(choice => choice.label)).toEqual(['Status', 'Priority', 'Approved detail 2', 'Approved detail 3']);
  expect(result.choices[0].options).toContainEqual({ value: 'IN_PROGRESS', label: 'In progress' });
  expect(JSON.stringify(result)).not.toMatch(/schemaHash|contractHash|checksum|storageGeneration|dependencyClosure|native:subject|native:type/);
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  expect(m.raw.mock.calls.every(([sql]) => !sql.join('?').match(/studio_field_values|service_work_items|studio_field_migration_observations/))).toBe(true);
});
it('saves native all/any rules through the original conditional compiler, preserving exact security/storage/defaults and CAS/Audit', async () => {
  const a = await authority(), previous = structuredClone(draft.payload);
  const result = await saveAdditionalFieldRequirementInTransaction(a, request);
  expect(result).toMatchObject({ definitionId: uuid(1), revision: 4 });
  const args = m.save.mock.calls[0][0], payload = conditionalFieldPayloadSchema.parse(args.data.payload);
  expect(payload.field).toEqual((previous as { field: object }).field); expect(payload.entity).toEqual(entity); expect(payload.storageGeneration).toBe(uuid(30));
  expect(payload.requiredIf).toEqual({ match: 'all', predicates: [{ source: { kind: 'native', fieldId: 'status' }, operator: 'equals', value: { type: 'enum', value: 'IN_PROGRESS' } }] });
  expect(args.where).toEqual({ id: uuid(50), definitionId: uuid(1), organisationId: 'company', revision: 3,
    definition: { retiredAt: null, latestVersion: 0, activeVersionId: null, revision: 7 } });
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'studio.draft.updated', entityId: uuid(1), after: { revision: 4 } }), tx);
  expect(sessionAuthorityStamp(a.session)).not.toBeNull();
  expect(await saveAdditionalFieldRequirementInTransaction(a, { ...request, requirement: { ...request.requirement, when: { ...request.requirement.when, match: 'any' } } })).toMatchObject({ revision: 4 });
});
it('absent conditional rules use unchanged original format1 plan/payload/hash; unconditional requirement stays independent', async () => {
  const a = await authority(), expected = await compileCustomField(a.session, draft.payload, a.registry);
  await saveAdditionalFieldRequirementInTransaction(a, { ...request, requirement: { always: false, when: null } });
  expect(checksum(m.save.mock.calls[0][0].data.payload)).toBe(checksum(expected.payload));
  await saveAdditionalFieldRequirementInTransaction(a, { ...request, requirement: { always: true, when: null } });
  expect(m.save.mock.calls[1][0].data.payload).toMatchObject({ schemaVersion: 1, field: { required: true } });
  await saveAdditionalFieldRequirementInTransaction(a, { ...request, requirement: { ...request.requirement, always: true } });
  expect(m.save.mock.calls[2][0].data.payload).toMatchObject({ schemaVersion: 2, field: { required: true } });
});
it.each([['integer', 0, 2], ['boolean', false, 3]] as const)('maps current active %s field pin and preserves %s without requiring its Write grant', async (type, value, id) => {
  const input = { ...request, requirement: { always: false, when: { match: 'all', conditions: [{ choiceId: `field:${uuid(id)}`, operator: 'equals', value: { type, value } }] } } };
  await saveAdditionalFieldRequirementInTransaction(await authority(), input);
  expect(conditionalFieldPayloadSchema.parse(m.save.mock.calls[0][0].data.payload).requiredIf.predicates).toEqual([{ source: { kind: 'field', definitionId: uuid(id), versionId: uuid(id + 10), checksum: sources[id - 2].activeVersion.checksum }, operator: 'equals', value: { type, value } }]);
});
it('hides private candidate metadata and rejects selecting it before draft effects', async () => {
  sources[0] = await sourceField(2, { label: 'Private secret detail', readCapability: 'tickets.private.read' });
  const a = await authority(), result = await readAdditionalFieldRequirementInTransaction(a, { definitionId: uuid(1) });
  expect(JSON.stringify(result)).not.toContain('Private secret');
  await expect(saveAdditionalFieldRequirementInTransaction(a, { ...request, requirement: { always: false, when: { match: 'all', conditions: [{ choiceId: `field:${uuid(2)}`, operator: 'present' }] } } })).rejects.toThrow();
  expect(m.save).not.toHaveBeenCalled();
});
it.each(['forged', 'tenant', 'stamp', 'edit', 'native_read', 'native_write', 'studio', 'tickets'])('denies %s before draft or condition reads/effects', async mode => {
  const a = await authority(); m.draft.mockClear(); m.definitions.mockClear(); m.raw.mockClear();
  if (mode === 'forged') a.session = { ...a.session };
  if (mode === 'tenant') a.session.organisationId = 'foreign';
  if (mode === 'stamp') member.sessionVersion++;
  if (mode === 'edit') member.deniedCapabilities = ['studio.definition.edit'];
  if (mode === 'native_read') member.deniedCapabilities = ['tickets.ticket.read'];
  if (mode === 'native_write') member.deniedCapabilities = ['tickets.ticket.manage'];
  if (mode === 'studio') m.module.mockResolvedValue(null);
  if (mode === 'tickets') m.modules.mockResolvedValue([{ moduleId: 'studio', enabled: true, entitled: true }]);
  await expect(saveAdditionalFieldRequirementInTransaction(a, request)).rejects.toThrow();
  expect(m.draft).not.toHaveBeenCalled(); expect(m.definitions).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled();
});
it.each(['published', 'bound', 'base', 'history', 'stale', 'foreign', 'cas'])('refuses %s draft override without Audit or activation', async mode => {
  const a = await authority();
  if (mode === 'published') draft.definition.latestVersion = 1;
  if (mode === 'bound') draft.definition.activeVersionId = uuid(22);
  if (mode === 'base') draft.baseVersion = { version: 1 };
  if (mode === 'history') m.version.mockResolvedValue({ id: uuid(22) });
  if (mode === 'stale') draft.revision++;
  if (mode === 'foreign') draft.organisationId = 'foreign';
  if (mode === 'cas') m.save.mockResolvedValue({ count: 0 });
  await expect(saveAdditionalFieldRequirementInTransaction(a, request)).rejects.toThrow(); expect(m.audit).not.toHaveBeenCalled();
  if (mode !== 'cas') expect(m.save).not.toHaveBeenCalled();
});
it.each(['native', 'operator', 'enum', 'type', 'duplicate', 'self', 'overflow', 'authority'])('rejects %s condition through original server validation', async mode => {
  let input: unknown = structuredClone(request);
  const rule = structuredClone(request.requirement);
  if (mode === 'native') rule.when.conditions[0].choiceId = 'native:subject';
  if (mode === 'operator') input = { ...request, requirement: { always: false, when: { match: 'all', conditions: [{ choiceId: 'native:status', operator: 'contains', optionId: 'new' }] } } };
  if (mode === 'enum') rule.when.conditions[0].value.value = 'BOGUS';
  if (mode === 'type') input = { ...request, requirement: { always: false, when: { match: 'all', conditions: [{ choiceId: 'native:status', operator: 'equals', value: { type: 'integer', value: 0 } }] } } };
  if (mode === 'duplicate') rule.when.conditions.push(rule.when.conditions[0]);
  if (mode === 'self') rule.when.conditions[0].choiceId = `field:${uuid(1)}`;
  if (mode === 'overflow') rule.when.conditions = Array(21).fill(rule.when.conditions[0]);
  if (mode === 'authority') input = { ...request, organisationId: 'foreign', principal: {} };
  if (mode !== 'operator' && mode !== 'type' && mode !== 'authority') input = { ...request, requirement: rule };
  await expect(saveAdditionalFieldRequirementInTransaction(await authority(), input)).rejects.toThrow(); expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it('read preserves saved conditional rule labels while published definitions remain explicitly read-only', async () => {
  const a = await authority(); await saveAdditionalFieldRequirementInTransaction(a, request); draft.payload = m.save.mock.calls[0][0].data.payload;
  const initial = await readAdditionalFieldRequirementInTransaction(a, { definitionId: uuid(1) }); expect(initial.initial).toEqual(request.requirement);
  draft.definition.latestVersion = 1; const existing = await readAdditionalFieldRequirementInTransaction(a, { definitionId: uuid(1) });
  expect(existing.editable).toBe(false); expect(existing.reason).toContain('reviewed change'); expect(existing.initial).toEqual(request.requirement);
});
it('request coercion/raw sources/executable expressions are closed before metadata or persistence', async () => {
  const a = await authority(); m.raw.mockClear();
  for (const extra of [{ entity }, { requiredIf: {} }, { source: { kind: 'native', fieldId: 'status' } }, { schemaVersion: 2 }, { expression: 'true' }])
    await expect(saveAdditionalFieldRequirementInTransaction(a, { ...request, ...extra })).rejects.toThrow();
  expect(additionalFieldRequirementSchema.safeParse({ always: 'false', when: null }).success).toBe(false);
  expect(m.raw).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled();
});

it('source comparison reads do not borrow a separately restricted source Write grant', async () => {
  sources[0] = await sourceField(2, { writeCapability: 'tickets.private.write' });
  await saveAdditionalFieldRequirementInTransaction(await authority(), { ...request, requirement: { always: false,
    when: { match: 'all', conditions: [{ choiceId: `field:${uuid(2)}`, operator: 'equals', value: { type: 'integer', value: 0 } }] } } });
  expect(m.save).toHaveBeenCalledTimes(1);
});
it.each(['read', 'write'])('target independent field %s denies before source metadata labels or effects', async permission => {
  const base = draft.payload as { field: Record<string, unknown> };
  draft.payload = { ...base, field: { ...base.field, [permission === 'read' ? 'readCapability' : 'writeCapability']: 'tickets.private.' + permission } };
  await expect(saveAdditionalFieldRequirementInTransaction(await authority(), request)).rejects.toThrow('FORBIDDEN');
  expect(m.definitions).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it('older owner versions remain exact format1 and cannot silently acquire unsupported native rule metadata', async () => {
  const previous = draft.payload as { entity: object }, old = registry.describe('tickets.ticket', 2);
  draft.payload = { ...previous, entity: { id: old.id, version: old.version, schemaHash: old.schemaHash, contractHash: old.contractHash } };
  await expect(saveAdditionalFieldRequirementInTransaction(await authority(), request)).rejects.toThrow('older owner');
  expect(m.save).not.toHaveBeenCalled();
  await saveAdditionalFieldRequirementInTransaction(await authority(), { ...request, requirement: { always: false, when: null } });
  expect(m.save.mock.calls[0][0].data.payload.entity.version).toBe(2);
});


// Published requirement-only targets use the same genuine Sessions/compiler,
// explicit SQL/Audit mocks and full sealed source fixtures above. No cohort SQL,
// migration mutation, native facts or PostgreSQL commit/concurrency is claimed.
async function published(sourceVersion = 9) {
  member.grantedCapabilities.push('studio.definition.publish');
  m.company.mockResolvedValue({ id: 'company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, isTest: true });
  const session = await authenticated(), owner = registry.describe('tickets.ticket', sourceVersion);
  const sourceEntity = { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash };
  const base = await compileCustomField(session, { ...(draft.payload as object), entity: sourceEntity }, registry);
  const version = { id: uuid(60), definitionId: draft.definitionId, organisationId: 'company', schemaVersion: 1,
    payload: base.payload, compiledPlan: base.plan, checksum: base.checksum };
  draft.payload = base.payload; draft.definition.latestVersion = 1; draft.definition.activeVersionId = version.id; draft.baseVersion = { version: 1 };
  m.version.mockImplementation(async ({ where }) => where.id === version.id && where.definitionId === draft.definitionId
    && where.organisationId === 'company' ? version : sources.find(row => row.activeVersion.id === where.id && row.id === where.definitionId)?.activeVersion ?? null);
  m.generation.mockImplementation(async input => input.where.definitionId ? { id: input.where.id } : null);
  m.publication.mockResolvedValue(null);
  return version;
}
const evolutionRequest = { ...request, definitionRevision: 7, sourceVersionId: uuid(60) };
it('reads published rule-editor stamps and choices from actual source/draft heads without cohort/data/provider execution', async () => {
  await published(); const result = await readAdditionalFieldRequirementEvolutionInTransaction(await authority(), { definitionId: uuid(1) });
  expect(result).toMatchObject({ definitionId: uuid(1), revision: 3, definitionRevision: 7, sourceVersionId: uuid(60), editable: true, initial: { always: false, when: null } });
  expect(result.choices.map(choice => choice.label)).toContain('Status');
  expect(JSON.stringify(result)).not.toMatch(/schemaHash|contractHash|storageGeneration|dependencyClosure|principal|recordCount/);
  expect(m.raw.mock.calls.every(([sql]) => !sql.join('?').match(/studio_field_values|service_work_items|migration_observations/))).toBe(true);
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it('saves an original compiled conditional target with a fresh unallocated generation and exact source/definition/draft CAS', async () => {
  const source = await published(); const result = await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest);
  const args = m.save.mock.calls[0][0], target = conditionalFieldPayloadSchema.parse(args.data.payload);
  expect(target.field).toEqual(source.payload.field); expect(target.entity).toEqual(entity); expect(target.storageGeneration).not.toBe(source.payload.storageGeneration);
  expect(result).toMatchObject({ definitionId: uuid(1), revision: 4, definitionRevision: 7, sourceVersionId: uuid(60), requirement: request.requirement,
    conversion: { kind: 'same_type' }, next: 'review_existing_records', impact: { requirement: { condition: 'added', requiresCanonicalReview: true, requiresConditionalValidation: true } } });
  expect(args.where).toEqual({ id: uuid(50), definitionId: uuid(1), organisationId: 'company', revision: 3,
    definition: { retiredAt: null, revision: 7, activeVersionId: uuid(60), latestVersion: 1 } });
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'studio.draft.updated', after: { revision: 4 } }), tx);
  expect(m.generation).toHaveBeenCalledWith({ where: { id: target.storageGeneration }, select: { id: true } });
});
it('retargets only explicitly supported retained source2 to current9 while leaving immutable source untouched', async () => {
  const source = await published(2), original = structuredClone(source);
  await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest);
  expect(m.save.mock.calls[0][0].data.payload.entity).toEqual(entity); expect(source).toEqual(original);
});
it('keeps exact source enum IDs/default and independent security/index constraints when adding requirements', async () => {
  draft.payload = { ...(draft.payload as object), field: { ...(draft.payload as { field: object }).field,
    storage: { type: 'enum', valueSetVersion: 4, options: [{ id: 'kept', label: 'Keep me', retired: false }, { id: 'old', label: 'Retired', retired: true }] },
    indexed: true, unique: true, defaultValue: { type: 'enum', value: 'kept' } } };
  const source = await published(); await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest);
  expect(m.save.mock.calls[0][0].data.payload.field).toEqual(source.payload.field);
});
it('retains zero/false source defaults rather than introducing implicit seeding', async () => {
  for (const [type, value] of [['integer', 0], ['boolean', false]] as const) {
    draft.payload = { ...(draft.payload as object), field: { ...(draft.payload as { field: object }).field, storage: { type }, defaultValue: { type, value } } };
    const source = await published(); await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest);
    expect(m.save.mock.calls.at(-1)![0].data.payload.field.defaultValue).toEqual(source.payload.field.defaultValue);
  }
});
it('reuses an unallocated saved target generation on edits without changing active source, labels or condition pins', async () => {
  const source = await published(); await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest);
  const target = m.save.mock.calls[0][0].data.payload; draft.payload = { ...target, field: { ...target.field, label: 'Saved friendly name' } }; draft.revision++;
  await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), { ...evolutionRequest, revision: 4, requirement: { ...request.requirement, always: true } });
  expect(m.save.mock.calls[1][0].data.payload).toMatchObject({ storageGeneration: target.storageGeneration, field: { label: 'Saved friendly name', required: true } });
  expect(draft.definition.activeVersionId).toBe(source.id);
});
it('does not reuse a saved generation allocated anywhere, including another tenant', async () => {
  await published(); const allocated = uuid(88); draft.payload = { ...(draft.payload as object), storageGeneration: allocated };
  m.generation.mockImplementation(async input => input.where.definitionId ? { id: input.where.id } : input.where.id === allocated ? { id: allocated } : null);
  await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest);
  expect(m.save.mock.calls[0][0].data.payload.storageGeneration).not.toBe(allocated);
});
it.each(['no_active', 'no_history', 'draft_base', 'source_missing', 'source_foreign', 'source_hash', 'source_binding', 'source_revision', 'draft_revision', 'source_id', 'other_settings', 'open_publication', 'cas'])('denies %s even when cohort is empty, before target/Audit effects', async mode => {
  const source = await published();
  if (mode === 'no_active') draft.definition.activeVersionId = null;
  if (mode === 'no_history') draft.definition.latestVersion = 0;
  if (mode === 'draft_base') draft.baseVersion = { version: 2 };
  if (mode === 'source_missing') m.version.mockResolvedValue(null);
  if (mode === 'source_foreign') source.organisationId = 'foreign';
  if (mode === 'source_hash') source.checksum = '0'.repeat(64);
  if (mode === 'source_binding') m.generation.mockResolvedValue(null);
  if (mode === 'source_revision') draft.definition.revision++;
  if (mode === 'draft_revision') draft.revision++;
  if (mode === 'source_id') draft.definition.activeVersionId = uuid(61);
  if (mode === 'other_settings') draft.payload = { ...(draft.payload as object), field: { ...(draft.payload as { field: object }).field, unique: true } };
  if (mode === 'open_publication') m.publication.mockResolvedValue({ preparationId: uuid(70) });
  if (mode === 'cas') m.save.mockResolvedValue({ count: 0 });
  await expect(saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest)).rejects.toThrow();
  if (mode !== 'cas') expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it.each(['forged', 'stamp', 'edit', 'publish', 'native_read', 'native_write', 'studio', 'tickets', 'live_test', 'company'])('fresh %s denial cannot create a reviewed target', async mode => {
  await published(); const a = await authority();
  if (mode === 'forged') a.session = { ...a.session };
  if (mode === 'stamp') member.sessionVersion++;
  if (mode === 'edit') member.deniedCapabilities = ['studio.definition.edit'];
  if (mode === 'publish') member.deniedCapabilities = ['studio.definition.publish'];
  if (mode === 'native_read') member.deniedCapabilities = ['tickets.ticket.read'];
  if (mode === 'native_write') member.deniedCapabilities = ['tickets.ticket.manage'];
  if (mode === 'studio') m.module.mockResolvedValue(null);
  if (mode === 'tickets') m.modules.mockResolvedValue([{ moduleId: 'studio', enabled: true, entitled: true }]);
  if (mode === 'live_test') m.company.mockResolvedValue({ id: 'company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, isTest: false });
  if (mode === 'company') m.company.mockResolvedValue({ id: 'foreign', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, isTest: true });
  await expect(saveAdditionalFieldRequirementEvolutionDraftInTransaction(a, evolutionRequest)).rejects.toThrow();
  expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it('original never-published save still rejects an active source and cannot directly change published required rules', async () => {
  await published(); await expect(saveAdditionalFieldRequirementInTransaction(await authority(), request)).rejects.toThrow('MIGRATION_REQUIRED');
  expect(m.save).not.toHaveBeenCalled();
});
it('same active rules are a no-op even when a retained source owner would be upgraded', async () => {
  await published(2); await expect(saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), { ...evolutionRequest, requirement: { always: false, when: null } })).rejects.toThrow('already match');
  expect(m.save).not.toHaveBeenCalled();
});
it('original full sealed2 source is retained and rule removal creates a reviewed schema1 target with a new generation', async () => {
  const version = await published(); const a = await authority(); await saveAdditionalFieldRequirementEvolutionDraftInTransaction(a, evolutionRequest);
  const target = m.save.mock.calls[0][0].data.payload;
  const { createRequiredMetadataProvider } = await import('@/core/studio/fields/required-source');
  const { compileConditionalCustomField } = await import('@/core/studio/fields/conditional-compiler');
  const provider = await createRequiredMetadataProvider(a.session, tx, draft.definitionId, entity);
  const sealed = await compileConditionalCustomField({ session: provider.authority.session, registry: provider.authority.registry,
    definitionId: draft.definitionId, resolveMetadata: provider.resolveMetadata }, target);
  Object.assign(version, { schemaVersion: 2, payload: sealed.payload, compiledPlan: sealed.plan, checksum: sealed.checksum });
  draft.payload = sealed.payload;
  await saveAdditionalFieldRequirementEvolutionDraftInTransaction(a, { ...evolutionRequest, requirement: { always: false, when: null } });
  const result = m.save.mock.calls[1][0].data.payload;
  expect(result.schemaVersion).toBe(1); expect(result.storageGeneration).not.toBe(version.payload.storageGeneration);
  expect(result.field).toEqual(version.payload.field);
});
it('raw tenant/owner/generation/payload/coerced stamps are rejected before metadata SQL', async () => {
  await published(); const a = await authority(); m.raw.mockClear();
  for (const patch of [{ organisationId: 'foreign' }, { storageGeneration: uuid(88) }, { entity }, { payload: draft.payload }, { definitionRevision: '7' }])
    await expect(saveAdditionalFieldRequirementEvolutionDraftInTransaction(a, { ...evolutionRequest, ...patch })).rejects.toThrow();
  expect(m.raw).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled();
});

it.each(['read', 'write'])('published source independent %s is checked even when saved draft is less restrictive', async permission => {
  const version = await published(), session = await authenticated();
  const compiled = await compileCustomField({ ...session, capabilities: new Set([...session.capabilities, 'tickets.private.read', 'tickets.private.write']) },
    { ...version.payload, field: { ...version.payload.field, [permission === 'read' ? 'readCapability' : 'writeCapability']: 'tickets.private.' + permission } }, registry);
  Object.assign(version, { payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum });
  await expect(saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest)).rejects.toThrow('FORBIDDEN');
  expect(m.definitions).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it('evolution metadata Read does not disclose choices after migration Publish is revoked', async () => {
  await published(); const a = await authority(); member.deniedCapabilities = ['studio.definition.publish'];
  await expect(readAdditionalFieldRequirementEvolutionInTransaction(a, { definitionId: uuid(1) })).rejects.toThrow('FORBIDDEN');
  expect(m.definitions).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled();
});
it('source2 evolution catalogue contains only explicitly current9 approved facts', async () => {
  await published(2); const result = await readAdditionalFieldRequirementEvolutionInTransaction(await authority(), { definitionId: uuid(1) });
  expect(result.choices.filter(choice => choice.id.startsWith('native:')).map(choice => choice.id)).toEqual(['native:status', 'native:priority']);
});
it('global allocation collision fails without target or Audit writes', async () => {
  await published(); m.generation.mockImplementation(async input => ({ id: input.where.id }));
  await expect(saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest)).rejects.toThrow('FIELD_REQUIREMENT_INVALID');
  expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});

it.each(['PUBLISHED', 'CUTOVER'])('open %s review remains metadata-readable but cannot save another target', async state => {
  await published(); await saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), evolutionRequest);
  draft.payload = m.save.mock.calls[0][0].data.payload; draft.revision = 4;
  draft.definition.latestVersion = 2; draft.baseVersion = { version: 2 }; draft.definition.revision = 8;
  m.publication.mockResolvedValue({ preparationId: uuid(70), state }); m.save.mockClear(); m.audit.mockClear();
  const result = await readAdditionalFieldRequirementEvolutionInTransaction(await authority(), { definitionId: uuid(1) });
  expect(result).toMatchObject({ revision: 4, definitionRevision: 8, sourceVersionId: uuid(60), initial: request.requirement, editable: false });
  expect(result.reason).toContain('existing reviewed');
  await expect(saveAdditionalFieldRequirementEvolutionDraftInTransaction(await authority(), { ...evolutionRequest, revision: 4, definitionRevision: 8 })).rejects.toThrow('existing reviewed');
  expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  expect(m.raw.mock.calls.every(([sql]) => !sql.join('?').match(/studio_field_values|service_work_items|migration_observations/))).toBe(true);
});
it('stale base and unrelated saved settings produce explicit read-only metadata without discarding the saved rule', async () => {
  await published(); draft.baseVersion = { version: 0 };
  let result = await readAdditionalFieldRequirementEvolutionInTransaction(await authority(), { definitionId: uuid(1) });
  expect(result).toMatchObject({ editable: false, initial: { always: false, when: null } }); expect(result.reason).toContain('refreshing');
  draft.baseVersion = { version: 1 }; draft.payload = { ...(draft.payload as object), field: { ...(draft.payload as { field: object }).field, unique: true } };
  result = await readAdditionalFieldRequirementEvolutionInTransaction(await authority(), { definitionId: uuid(1) });
  expect(result.editable).toBe(false); expect(result.reason).toContain('other field settings');
  expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it('retained conditional cutover metadata survives unavailable old input meaning without rechecking the old graph', async () => {
  const version = await published(), a = await authority();
  const input = { ...evolutionRequest, requirement: { always: false, when: { match: 'all', conditions: [
    { choiceId: `field:${uuid(2)}`, operator: 'equals', value: { type: 'integer', value: 0 } }] } } };
  await saveAdditionalFieldRequirementEvolutionDraftInTransaction(a, input); const target = m.save.mock.calls[0][0].data.payload;
  const { createRequiredMetadataProvider } = await import('@/core/studio/fields/required-source');
  const { compileConditionalCustomField } = await import('@/core/studio/fields/conditional-compiler');
  const provider = await createRequiredMetadataProvider(a.session, tx, draft.definitionId, entity);
  const sealed = await compileConditionalCustomField({ session: provider.authority.session, registry: provider.authority.registry,
    definitionId: draft.definitionId, resolveMetadata: provider.resolveMetadata }, target);
  Object.assign(version, { schemaVersion: 2, payload: sealed.payload, compiledPlan: sealed.plan, checksum: sealed.checksum });
  draft.payload = sealed.payload; draft.definition.latestVersion = 2; draft.baseVersion = { version: 2 };
  sources = []; m.publication.mockResolvedValue({ preparationId: uuid(70), state: 'CUTOVER' }); m.save.mockClear(); m.audit.mockClear();
  const result = await readAdditionalFieldRequirementEvolutionInTransaction(a, { definitionId: uuid(1) });
  expect(result.editable).toBe(false); expect(result.reason).toContain('existing reviewed');
  expect(result.choices.map(choice => choice.id)).not.toContain(`field:${uuid(2)}`);
  expect(m.save).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
