import { Prisma } from '@/generated/prisma/client';
import { assertCapability } from '@/core/permissions/check';
import { writeAudit } from '@/core/audit/log';
import { STUDIO_CAPABILITIES } from '../permissions';
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from '../fields/runtime-authority';
import { lockFieldEntitiesInTransaction } from '../fields/entity-lock';
import { entityDetailsSchema, supportsFieldMigrationIntent, supportsFieldMigrationQueryIntent } from '../registry/entities';
import { assertFieldBinding, fieldDefinitionKey } from '../fields/binding';
import { analyseRequiredFieldEvolution, createFieldConverter } from '../fields/evolution';
import { compileFieldMigrationMetadata } from '../fields/migrations/metadata';
import { assertVersionedFieldMigrationPolicies } from '../fields/migrations/access';
import { referenceSchema } from '../compiler/reference';
import { compileCustomField } from '../compiler/fields';
import { checksum } from '../registry/contracts';
import { conditionalFieldPayloadSchema, versionedFieldPayloadSchema, type RequiredFactSource, type RequiredPredicate, type VersionedFieldPayload } from '../fields/required-contract';
import { customFieldPayloadSchema } from '../fields/schema';
import { compileConditionalCustomField } from '../fields/conditional-compiler';
import { createRequiredMetadataProvider } from '../fields/required-source';
import { registeredRequiredFactMetadata } from '../fields/required-owner';
import { inspectSealedFieldVersion } from '../fields/sealed-field';
import { assertFieldAccess } from '../fields/validation';
import { additionalFieldRequirementSchema, readAdditionalFieldRequirementSchema, saveAdditionalFieldRequirementSchema,
  saveAdditionalFieldRequirementEvolutionSchema, type AdditionalFieldRequirementEvolutionEditor, type AdditionalFieldRequirement, type AdditionalFieldRequirementEditor, type FieldRequirementChoice } from './field-requirement-input';

const ranks = { public_internal: 0, confidential: 1, restricted: 2 };
function unavailable(): never { throw new Error('FIELD_REQUIREMENT_INVALID: an approved condition source is unavailable. Saved rules are kept.'); }
function conflict(): never { throw new Error('CONFLICT: this saved field moved on. Refresh before saving its rules.'); }
const title = (code: string) => code.toLowerCase().replaceAll('_', ' ').replace(/^./, value => value.toUpperCase());
async function context(supplied: FieldRuntimeAuthority, definitionId: string, writing: boolean) {
  // A copied Session/registry cannot provide metadata authority. Refresh the real
  // identity and entitlement set inside the original Serializable transaction.
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction), { session, registry, transaction: tx } = authority;
  assertCapability(session, STUDIO_CAPABILITIES.edit);
  if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: 'studio', enabled: true, entitled: true }, select: { id: true } })) unavailable();
  const latest = registry.describe('tickets.ticket', 9), entity = referenceSchema.parse({ id: latest.id, version: latest.version, schemaHash: latest.schemaHash, contractHash: latest.contractHash });
  const owner = await registry.resolve(session, entity), record = entityDetailsSchema.parse(owner.details).record;
  if (owner.kind !== 'entity' || !record?.fieldPolicy) unavailable();
  assertCapability(session, record.writeCapability);
  await lockFieldEntitiesInTransaction(tx, session.organisationId, [entity.id]);
  if (writing) await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
    WHERE d.id=${definitionId}::uuid AND d."organisationId"=${session.organisationId} FOR UPDATE OF d,draft`;
  else await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
    WHERE d.id=${definitionId}::uuid AND d."organisationId"=${session.organisationId} FOR SHARE OF d,draft`;
  const draft = await tx.studioDraft.findFirst({ where: { definitionId, organisationId: session.organisationId,
    definition: { kind: 'customField', retiredAt: null } }, include: { definition: true, baseVersion: { select: { version: true } } } });
  if (!draft || draft.definitionId !== definitionId || draft.organisationId !== session.organisationId
    || draft.definition.id !== definitionId || draft.definition.organisationId !== session.organisationId
    || draft.definition.kind !== 'customField' || draft.definition.retiredAt !== null) conflict();
  const payload = versionedFieldPayloadSchema.parse(draft.payload);
  if (payload.entity.id !== entity.id || draft.definition.key !== `${payload.entity.id}.${payload.field.key}`) unavailable();
  await registry.resolve(session, payload.entity);
  assertFieldAccess(session, payload.field, 'read'); assertFieldAccess(session, payload.field, 'write');
  // Base compile is metadata-only and enforces original native/reference grants,
  // storage/default codecs and owner-approved field policy before any labels.
  await compileCustomField(session, { schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }, registry);
  return { authority, draft, payload, entity };
}
type Context = Awaited<ReturnType<typeof context>>;
async function neverPublished(current: Context) {
  const { draft, authority } = current;
  return draft.definition.latestVersion === 0 && draft.definition.activeVersionId === null && draft.baseVersion === null
    && !await authority.transaction.studioDefinitionVersion.findFirst({ where: { definitionId: draft.definitionId,
      organisationId: authority.session.organisationId }, select: { id: true } });
}
type Sources = Map<string, { source: RequiredFactSource; choice: FieldRequirementChoice }>;
async function catalogue(current: Context) {
  const { authority: { registry, session, transaction: tx }, draft, payload } = current;
  const provider = await createRequiredMetadataProvider(session, tx, draft.definitionId, payload.entity);
  const sources: Sources = new Map(), metadata = await registry.resolve(session, payload.entity), details = entityDetailsSchema.parse(metadata.details);
  function add(id: string, source: RequiredFactSource, label: string, storage: { type: string; options?: readonly { id: string; label: string; retired: boolean }[]; codes?: readonly string[]; currencies?: readonly string[] }) {
    const operators: FieldRequirementChoice['operators'] = ['reference', 'address'].includes(storage.type) ? ['present', 'absent']
      : storage.type === 'multi_enum' ? ['present', 'absent', 'contains'] : ['present', 'absent', 'equals', 'not_equals'];
    const options = storage.codes?.map(value => ({ value, label: title(value) }))
      ?? storage.options?.filter(value => !value.retired).map(value => ({ value: value.id, label: value.label }));
    sources.set(id, { source, choice: { id, label, type: storage.type, operators, ...(options ? { options } : {}), ...(storage.currencies ? { currencies: storage.currencies } : {}) } });
  }
  for (const fact of details.record?.requiredFacts?.facts ?? []) {
    if (fact.capability && !session.capabilities.has(fact.capability)) continue;
    const field = details.fields.find(field => field.id === fact.fieldId);
    if (!field || (field.capability && !session.capabilities.has(field.capability)) || ranks[fact.classification] > ranks[payload.field.classification]) continue;
    const resolved = await registeredRequiredFactMetadata(session, registry, payload.entity, fact.fieldId);
    add(`native:${fact.fieldId}`, { kind: 'native', fieldId: fact.fieldId }, field.label ?? title(fact.fieldId), resolved.storage);
  }
  const fields = await tx.studioDefinition.findMany({ where: { organisationId: session.organisationId, kind: 'customField', retiredAt: null,
    id: { not: draft.definitionId }, activeVersionId: { not: null }, fieldBinding: { entityId: payload.entity.id } }, include: { activeVersion: true },
    orderBy: [{ id: 'asc' }], take: 101 });
  if (fields.length > 100) unavailable();
  for (const definition of fields) {
    // Independent Read precedes extracting/displaying a source label or choices.
    // Unavailable private/retired/stale candidates are not friendly selections.
    try {
      if (definition.organisationId !== session.organisationId || definition.retiredAt !== null || !definition.activeVersion
        || definition.activeVersionId !== definition.activeVersion.id || definition.id === draft.definitionId) unavailable();
      const plan = inspectSealedFieldVersion(registry, definition.activeVersion, session.organisationId, definition.id);
      if (plan.payload.entity.id !== payload.entity.id || definition.key !== `${payload.entity.id}.${plan.payload.field.key}`
        || ranks[plan.payload.field.classification] > ranks[payload.field.classification]) continue;
      assertFieldAccess(session, plan.payload.field, 'read');
      const source = { kind: 'field' as const, definitionId: definition.id, versionId: definition.activeVersion.id, checksum: definition.activeVersion.checksum };
      await provider.resolveMetadata(source); // Binding/generation/current pin/graph and current field rights.
      add(`field:${definition.id}`, source, plan.payload.field.label, plan.payload.field.storage);
    } catch (error) {
      if (!(error instanceof Error) || !/FORBIDDEN|FIELD_REQUIREMENT_INVALID|FIELD_STORAGE_INVALID|DEPENDENCY_BROKEN/.test(error.message)) throw error;
    }
  }
  return { provider, sources };
}
function project(payload: VersionedFieldPayload, sources: Sources): AdditionalFieldRequirement | null {
  if (payload.schemaVersion === 1) return { always: payload.field.required, when: null };
  const conditions = [];
  for (const predicate of payload.requiredIf.predicates) {
    const choiceId = predicate.source.kind === 'native' ? `native:${predicate.source.fieldId}` : `field:${predicate.source.definitionId}`;
    const approved = sources.get(choiceId);
    if (!approved || !approved.choice.operators.includes(predicate.operator)) return null;
    if (predicate.operator === 'contains' && !approved.choice.options?.some(option => option.value === predicate.optionId)) return null;
    if ((predicate.operator === 'equals' || predicate.operator === 'not_equals') && predicate.value.type === 'enum'
      && !approved.choice.options?.some(option => option.value === predicate.value.value)) return null;
    const { source, ...rule } = predicate; void source; conditions.push({ ...rule, choiceId });
  }
  return additionalFieldRequirementSchema.parse({ always: payload.field.required, when: { match: payload.requiredIf.match, conditions } });
}
async function candidate(current: Context, input: AdditionalFieldRequirement, sources: Sources) {
  const { payload, authority, draft } = current, { always, when } = additionalFieldRequirementSchema.parse(input);
  const base = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration,
    field: { ...payload.field, required: always } });
  if (!when) return compileCustomField(authority.session, base, authority.registry);
  if (checksum(payload.entity) !== checksum(current.entity)) throw new Error('This field uses an older owner version. Keep its reviewed upgrade workflow before adding a conditional rule.');
  const predicates: RequiredPredicate[] = when.conditions.map(condition => {
    const approved = sources.get(condition.choiceId);
    if (!approved || !approved.choice.operators.includes(condition.operator)) unavailable();
    const { choiceId, ...rule } = condition; void choiceId;
    return { ...rule, source: approved.source };
  });
  const provider = await createRequiredMetadataProvider(authority.session, authority.transaction, draft.definitionId, payload.entity);
  return compileConditionalCustomField({ session: provider.authority.session, registry: provider.authority.registry,
    definitionId: draft.definitionId, resolveMetadata: provider.resolveMetadata }, conditionalFieldPayloadSchema.parse({ ...base, schemaVersion: 2,
      requiredIf: { match: when.match, predicates } }));
}
/** Metadata-only editor/read. Published rules are labelled but never edited here;
 * changing their requirements requires the original reviewed new-generation path. */
export async function readAdditionalFieldRequirementInTransaction(authority: FieldRuntimeAuthority, input: unknown): Promise<AdditionalFieldRequirementEditor> {
  const request = readAdditionalFieldRequirementSchema.parse(input), current = await context(authority, request.definitionId, false), { sources, provider } = await catalogue(current);
  if (current.payload.schemaVersion === 2) {
    // Check all retained condition pins against today's authorised meaning before
    // projecting to labels. Never silently replace an obsolete/unknown condition.
    await compileConditionalCustomField({ session: current.authority.session, registry: current.authority.registry,
      definitionId: request.definitionId, resolveMetadata: provider.resolveMetadata }, current.payload);
  }
  const initial = project(current.payload, sources), fresh = await neverPublished(current);
  return { definitionId: request.definitionId, revision: current.draft.revision, initial: initial ?? { always: current.payload.field.required, when: null },
    choices: [...sources.values()].map(value => value.choice), editable: fresh && initial !== null,
    reason: !fresh ? 'Published required-field rules use a reviewed change so existing records and history stay safe.'
      : initial === null ? 'A saved condition is unavailable in these simple controls. Its saved rule is kept.' : null };
}
/** Never-published draft only. Same original Serializable transaction, entity
 * lock, original strict compiler/provider, exact draft/definition CAS and Audit.
 * Does not publish/bind/activate or change any record/generation/migration state. */
export async function saveAdditionalFieldRequirementInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = saveAdditionalFieldRequirementSchema.parse(input), current = await context(authority, request.definitionId, true);
  if (current.draft.revision !== request.revision) conflict();
  if (!await neverPublished(current)) throw new Error('MIGRATION_REQUIRED: published required-field rules need their reviewed change workflow.');
  const { sources } = await catalogue(current), compiled = await candidate(current, request.requirement, sources);
  const { draft, authority: { session, transaction: tx } } = current;
  if ((await tx.studioDraft.updateMany({ where: { id: draft.id, definitionId: draft.definitionId, organisationId: session.organisationId,
    revision: request.revision, definition: { retiredAt: null, latestVersion: 0, activeVersionId: null, revision: draft.definition.revision } },
    data: { payload: compiled.payload, revision: { increment: 1 }, editorUserId: session.userId, validation: Prisma.DbNull } })).count !== 1) conflict();
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: 'studio.draft.updated', entityType: 'StudioDefinition',
    entityId: draft.definitionId, after: { revision: request.revision + 1 } }, tx);
  return { definitionId: draft.definitionId, revision: request.revision + 1, requirement: additionalFieldRequirementSchema.parse(request.requirement), warnings: compiled.warnings };
}

/** The current active baseline is mandatory, including for an empty business.
 * No native cohort/query/count is read here: original preparation owns that
 * complete review. Metadata compilation retains its Publish/LiveTest policy. */
async function evolutionContext(supplied: FieldRuntimeAuthority, definitionId: string, writing: boolean) {
  const current = await context(supplied, definitionId, writing), { authority, draft, entity } = current;
  const { session, registry, transaction: tx } = authority;
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (!draft.definition.activeVersionId || draft.definition.latestVersion < 1) conflict();
  let readOnlyReason = draft.baseVersion?.version !== draft.definition.latestVersion
    ? 'This saved draft needs refreshing before another reviewed rule change.' : null;
  if (writing && readOnlyReason) conflict();
  const version = await tx.studioDefinitionVersion.findFirst({ where: { id: draft.definition.activeVersionId,
    definitionId, organisationId: session.organisationId } });
  if (!version || version.id !== draft.definition.activeVersionId) conflict();
  const source = inspectSealedFieldVersion(registry, version, session.organisationId, definitionId).payload;
  await registry.resolve(session, source.entity);
  assertFieldAccess(session, source.field, 'read'); assertFieldAccess(session, source.field, 'write');
  // This editor may change requirements only. Existing other structural edits
  // must use their reviewed editor; never discard them to manufacture a target.
  const stableField = (payload: VersionedFieldPayload) => {
    const { label, help, required, ...stable } = payload.field; void label; void help; void required; return stable;
  };
  if (source.entity.id !== entity.id || fieldDefinitionKey(source) !== draft.definition.key
    || current.payload.field.key !== source.field.key
    || ![checksum(source.entity), checksum(entity)].includes(checksum(current.payload.entity))) conflict();
  if (checksum(stableField(source)) !== checksum(stableField(current.payload))) {
    const reason = 'This saved draft changes other field settings. Keep its reviewed settings editor before changing requirements.';
    if (writing) throw new Error(reason);
    readOnlyReason = reason;
  }
  const record = entityDetailsSchema.parse((await registry.resolve(session, entity)).details).record;
  if (!record) unavailable();
  for (const [mode, policy] of [['snapshot', record.migrationSnapshot], ['representation', record.migrationRepresentation]] as const) {
    if (!policy || !supportsFieldMigrationIntent(policy, 2) || !policy.sourceVersions.includes(source.entity.version))
      throw new Error('This previous field version has no approved conditional review path. Its live rules are kept.');
    const metadata = registry.describe(policy.query.id, policy.query.version);
    const query = await registry.resolve(session, referenceSchema.parse({ id: metadata.id, version: metadata.version,
      schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }));
    if (query.kind !== 'query' || query.ownerModuleId !== 'tickets' || query.capability !== record.writeCapability
      || query.details.transaction !== 'required' || !supportsFieldMigrationQueryIntent(query, entity.id, mode, 2)) unavailable();
  }
  await assertFieldBinding(tx, session, definitionId, source);
  const company = await tx.organisation.findFirst({ where: { id: session.organisationId, kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null },
    select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
  if (!company) unavailable();
  assertVersionedFieldMigrationPolicies(session, company, source, current.payload);
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: { organisationId: session.organisationId,
    definitionId, state: { in: ['PUBLISHED', 'CUTOVER'] } }, select: { preparationId: true, state: true } });
  if (publication) {
    const reason = 'Finish or cancel the existing reviewed field change before preparing different rules.';
    if (writing) throw new Error(reason);
    readOnlyReason = reason;
  }
  // A retained reference default is not silently copied under an actor who can
  // no longer read its target. No default value is returned to this UI.
  for (const payload of writing ? [source, current.payload] : []) {
    if (payload.field.defaultValue?.type === 'reference') {
      if (payload.field.storage.type !== 'reference') unavailable();
      await registry.authoriseRecord({ session, transaction: tx }, payload.field.storage.entity,
        { recordId: payload.field.defaultValue.value, intent: 'read' });
    }
  }
  if (writing) {
    const compiledSource = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, definitionId, source);
    if (compiledSource.checksum !== version.checksum) conflict();
    await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, definitionId, current.payload);
  } else {
    // The projection contains rules/stamps only, never default values or business
    // facts. Keep complete immutable source seals above, but do not re-evaluate
    // old input graphs or unused defaults just to resume a retained review.
    await compileCustomField(session, { schemaVersion: 1, entity: source.entity,
      storageGeneration: source.storageGeneration, field: source.field }, registry);
  }
  return { ...current, source, version, company, readOnlyReason };
}
/** Current metadata for the separate reviewed-rule editor, never a permission or
 * publication waiver. Returned stamps are actual current server heads. */
export async function readAdditionalFieldRequirementEvolutionInTransaction(authority: FieldRuntimeAuthority, input: unknown): Promise<AdditionalFieldRequirementEvolutionEditor> {
  const request = readAdditionalFieldRequirementSchema.parse(input), current = await evolutionContext(authority, request.definitionId, false);
  const { sources } = await catalogue({ ...current, payload: { ...current.payload, entity: current.entity } }), initial = project(current.payload, sources);
  // A new edit must still have today's exact conditional metadata meaning. An
  // open/historical review stays readable without demanding its old input graph.
  let reason = current.readOnlyReason;
  if (!reason && initial !== null) {
    try {
      const source = await compileFieldMigrationMetadata({ session: current.authority.session, transaction: current.authority.transaction },
        current.authority.registry, current.company, request.definitionId, current.source);
      if (source.checksum !== current.version.checksum) conflict();
      await compileFieldMigrationMetadata({ session: current.authority.session, transaction: current.authority.transaction },
        current.authority.registry, current.company, request.definitionId, current.payload);
    } catch (error) {
      if (!(error instanceof Error) || !/FIELD_REQUIREMENT_INVALID|DEPENDENCY_BROKEN|FIELD_STORAGE_INVALID|FORBIDDEN/.test(error.message)) throw error;
      reason = 'A saved condition is unavailable for another rule change. Its saved rule and review are kept.';
    }
  }
  return { definitionId: request.definitionId, revision: current.draft.revision,
    definitionRevision: current.draft.definition.revision, sourceVersionId: current.version.id,
    initial: initial ?? { always: current.payload.field.required, when: null }, choices: [...sources.values()].map(value => value.choice),
    editable: initial !== null && reason === null, reason: reason
      ?? (initial === null ? 'A saved condition is unavailable in these simple controls. Its saved rule is kept.' : null) };
}
/** Save a requirement-only reviewed target, NOT a publication or activation.
 * The source stays immutable/active. Full original preparation and execution
 * must validate every canonical record before the target can be cut over. */
export async function saveAdditionalFieldRequirementEvolutionDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = saveAdditionalFieldRequirementEvolutionSchema.parse(input), current = await evolutionContext(authority, request.definitionId, true);
  const { draft, source, version, entity, authority: fresh, company } = current, { session, registry, transaction: tx } = fresh;
  if (draft.revision !== request.revision || draft.definition.revision !== request.definitionRevision
    || version.id !== request.sourceVersionId) conflict();
  const { sources } = await catalogue({ ...current, payload: { ...current.payload, entity } });
  // Source field constraints/security/defaults/value sets remain exact. Only
  // friendly presentation from the saved draft and the explicit required flag
  // may differ. Current9 is approved explicitly; retained source stays pinned.
  const intended = { ...current, payload: { ...source, entity,
    field: { ...source.field, label: current.payload.field.label, help: current.payload.field.help } } };
  const proposed = await candidate(intended, request.requirement, sources);
  const rules = (payload: VersionedFieldPayload) => ({ always: payload.field.required,
    condition: payload.schemaVersion === 2 ? payload.requiredIf : null });
  if (checksum(rules(source)) === checksum(rules(proposed.payload)))
    throw new Error('These rules already match the live field. No reviewed change is needed.');
  // Reuse an unallocated saved target generation on edits. A generation already
  // allocated anywhere (including another tenant) is never borrowed or altered.
  const previousGeneration = current.payload.storageGeneration;
  const existing = previousGeneration !== source.storageGeneration ? await tx.studioFieldGeneration.findFirst({
    where: { id: previousGeneration }, select: { id: true } }) : null;
  const generation = previousGeneration !== source.storageGeneration && !existing ? previousGeneration : crypto.randomUUID();
  if (generation === source.storageGeneration || await tx.studioFieldGeneration.findFirst({ where: { id: generation }, select: { id: true } })) unavailable();
  const target = versionedFieldPayloadSchema.parse({ ...proposed.payload, storageGeneration: generation });
  const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, request.definitionId, target);
  const impact = analyseRequiredFieldEvolution(source, compiled.payload);
  // Same-type compatibility only; actual condition outcomes and values are
  // evaluated by original protocol2 observations, never this metadata adapter.
  const base = (payload: VersionedFieldPayload) => ({ schemaVersion: 1 as const, entity: payload.entity,
    storageGeneration: payload.storageGeneration, field: payload.field });
  createFieldConverter(base(source), base(compiled.payload), { kind: 'same_type' });
  if (impact.kind !== 'migration') conflict();
  if ((await tx.studioDraft.updateMany({ where: { id: draft.id, definitionId: request.definitionId, organisationId: session.organisationId,
    revision: request.revision, definition: { retiredAt: null, revision: request.definitionRevision,
      activeVersionId: request.sourceVersionId, latestVersion: draft.definition.latestVersion } }, data: { payload: compiled.payload,
      revision: { increment: 1 }, editorUserId: session.userId, validation: Prisma.DbNull } })).count !== 1) conflict();
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: 'studio.draft.updated', entityType: 'StudioDefinition',
    entityId: request.definitionId, after: { revision: request.revision + 1 } }, tx);
  return { definitionId: request.definitionId, revision: request.revision + 1, definitionRevision: request.definitionRevision,
    sourceVersionId: version.id, requirement: request.requirement, warnings: compiled.warnings, conversion: { kind: 'same_type' as const },
    impact: { index: impact.indexImpact, uniquenessCheck: impact.requiresUniquenessCheck, rollbackLimit: impact.rollbackLimit,
      requirement: impact.requirementImpact }, next: 'review_existing_records' as const };
}
