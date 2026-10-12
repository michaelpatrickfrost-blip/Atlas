import { z } from "zod";
import { readDesignReferenceMetadataInTransaction } from "./reference-navigation";
import type { ReferenceNavigationContext } from "./reference-links";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { STUDIO_CAPABILITIES as CAP } from "../permissions";
import { entityDetailsSchema, supportsFieldMigrationIntent, supportsFieldMigrationQueryIntent } from "../registry/entities";
import { checksum } from "../registry/contracts";
import { referenceSchema } from "../compiler/reference";
import { compileDefinitionInTransaction, parseDefinitionPayload } from "../compiler";
import { customFieldPayloadSchema, fieldStorageSchema, type FieldStorage, type CustomFieldPayload } from "../fields/schema";
import { versionedFieldPayloadSchema } from "../fields/required-contract";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { assertFieldAccess } from "../fields/validation";
import { assertFieldBinding, fieldDefinitionKey } from "../fields/binding";
import { analyseRequiredFieldEvolution, createFieldConverter, type FieldConversion } from "../fields/evolution";
import { entityProfileDefinitionKey } from "../record-types/binding";
import { entityProfilePayloadSchema, recordTypePayloadSchema, configurationReferenceSchema, entityProfileReferenceSchema, pageReferenceSchema, type EntityProfileReference } from "../record-types/schema";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { pagePayloadSchema } from "../pages/schema";
import { publishCompiledDefinitionInTransaction } from "../definitions/publication";
import { activateCompiledVersionInTransaction } from "../definitions/activation";
import { prepareRequiredFieldActivationInTransaction } from "../fields/activation-coverage";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { projectAdditionalFieldSetup } from "./field-setup-projection";
import { additionalFieldSetupSchema, additionalFieldTypeCatalogue, type AdditionalFieldSetup } from "./field-setup-contract";
import { additionalFieldEvolutionDraftSchema, type FriendlyFieldConversion } from "./field-evolution-contract";

const uuid = z.uuid().transform(value => value.toLowerCase());
const revision = z.number().int().nonnegative().max(2147483646);
const identity = z.strictObject({ definitionId: uuid, revision });
const label = z.string().trim().min(1).max(100), help = z.string().max(500).default("");
const fieldSave = identity.extend({ label, help });
const fieldConfigure = z.strictObject({ ...identity.shape, setup: additionalFieldSetupSchema });
const requiredFields = z.array(uuid).max(100).refine(ids => new Set(ids).size === ids.length, "Choose each additional field once.");
const baseChoices = z.strictObject({ pageDefinitionId: uuid.nullable(), requiredFieldDefinitionIds: requiredFields });
const typeChoices = z.strictObject({ label, help, pageDefinitionId: uuid.nullable().optional(), requiredFieldDefinitionIds: requiredFields });
const baseSave = baseChoices.extend(identity.shape), typeSave = typeChoices.extend(identity.shape);
const publishRequest = identity.extend({ acknowledgeWarnings: z.boolean() });
const activateRequest = z.strictObject({ definitionId: uuid, versionId: uuid, definitionRevision: revision });
const supportedKinds = ["customField", "entityProfile", "recordType"] as const;
function conflict(): never { throw new Error("CONFLICT: someone else saved this setup. Your changes are kept; compare the saved draft before trying again."); }
function unavailable(): never { throw new Error("DEPENDENCY_BROKEN: this Tickets setup choice is unavailable or incompatible."); }
const audit = (authority: FieldRuntimeAuthority, action: string, id: string, after: Prisma.InputJsonValue) => writeAudit({
  organisationId: authority.session.organisationId, actorUserId: authority.session.userId, action,
  entityType: "StudioDefinition", entityId: id, after,
}, authority.transaction);

/** Trusted selected-business authority from the original authoring context only.
 * No client tenant, grant, contract/hash, generation or approval body enters here. */
async function owner(authority: FieldRuntimeAuthority, capability: typeof CAP.read | typeof CAP.edit | typeof CAP.publish) {
  const { session, stamp, transaction, registry } = authority;
  if (!sessionAuthorityStamp(session) || sessionAuthorityStamp(session) !== stamp
    || stamp.organisationId !== session.organisationId || stamp.userId !== session.userId || stamp.membershipId !== session.membershipId)
    throw new Error("FORBIDDEN: genuine current business setup authority is required.");
  assertCapability(session, capability);
  if (!await transaction.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } })) unavailable();
  const metadata = registry.describe("tickets.ticket", 9);
  const entity = referenceSchema.parse({ id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash });
  const approved = await registry.resolve(session, entity), details = entityDetailsSchema.parse(approved.details);
  if (approved.kind !== "entity" || approved.ownerModuleId !== "tickets" || !details.extensionPolicy.customFields
    || !details.extensionPolicy.recordTypes || !details.record?.fieldPolicy || !details.record.writeCapability) unavailable();
  assertCapability(session, details.record.writeCapability);
  return { entity, classification: approved.classification, readCapability: approved.capability,
    writeCapability: details.record.writeCapability, fieldPolicy: details.record.fieldPolicy,
    migrationSnapshot: details.record.migrationSnapshot, migrationRepresentation: details.record.migrationRepresentation };
}
const scopedDraft = (authority: FieldRuntimeAuthority, definitionId: string, expectedRevision?: number) => authority.transaction.studioDraft.findFirst({
  where: { definitionId, organisationId: authority.session.organisationId,
    ...(expectedRevision === undefined ? {} : { revision: expectedRevision }), definition: { kind: { in: [...supportedKinds] }, retiredAt: null } },
  include: { definition: true, baseVersion: { select: { version: true } } },
});
function ticketPayload(kind: string, input: unknown) {
  if (!supportedKinds.includes(kind as typeof supportedKinds[number])) unavailable();
  const payload = kind === "customField" ? versionedFieldPayloadSchema.parse(input) : parseDefinitionPayload(kind, input);
  if (!("entity" in payload) || payload.entity.id !== "tickets.ticket") unavailable();
  return payload;
}
async function preflightMetadataRead(authority: FieldRuntimeAuthority, kind: string, payload: unknown) {
  if (kind !== "customField") return;
  const parsed = versionedFieldPayloadSchema.parse(payload), field = parsed.field;
  assertFieldAccess(authority.session, field, "read");
  if (field.defaultValue?.type === "reference") {
    if (field.storage.type !== "reference") unavailable();
    await authority.registry.resolve(authority.session, field.storage.entity);
    await authority.registry.authoriseRecord({ session: authority.session, transaction: authority.transaction }, field.storage.entity,
      { recordId: field.defaultValue.value, intent: "read" });
  }
}
function presentationEditable(authority: FieldRuntimeAuthority, kind: string, payload: unknown) {
  if (!authority.session.capabilities.has(CAP.edit)) return false;
  if (kind !== "customField") return true;
  const parsed = versionedFieldPayloadSchema.parse(payload);
  return parsed.schemaVersion === 1 && (!parsed.field.writeCapability || authority.session.capabilities.has(parsed.field.writeCapability));
}
function displayName(kind: string, payload: unknown, fallback: string) {
  return kind === "customField" ? versionedFieldPayloadSchema.parse(payload).field.label
    : kind === "recordType" ? recordTypePayloadSchema.parse(payload).label : fallback;
}
async function compileDraft(authority: FieldRuntimeAuthority, definitionId: string, kind: string, payload: unknown) {
  ticketPayload(kind, payload);
  return compileDefinitionInTransaction(authority, definitionId, kind, payload);
}
async function create(authority: FieldRuntimeAuthority, key: string, name: string, kind: typeof supportedKinds[number], payload: unknown) {
  const id = crypto.randomUUID(), compiled = await compileDraft(authority, id, kind, payload);
  await lockFieldEntitiesInTransaction(authority.transaction, authority.session.organisationId, ["tickets.ticket"]);
  const result = await authority.transaction.studioDefinition.create({ data: { id, organisationId: authority.session.organisationId,
    key, kind, name, createdBy: authority.session.userId, draft: { create: { editorUserId: authority.session.userId, payload: compiled.payload } } }, select: { id: true } });
  await audit(authority, "studio.draft.created", id, { kind, name });
  return { ...result, revision: 0 };
}
async function save(authority: FieldRuntimeAuthority, draft: NonNullable<Awaited<ReturnType<typeof scopedDraft>>>, payload: unknown,
  sourceHead?: { revision: number; activeVersionId: string }) {
  const compiled = await compileDraft(authority, draft.definitionId, draft.definition.kind, payload);
  await lockFieldEntitiesInTransaction(authority.transaction, authority.session.organisationId, ["tickets.ticket"]);
  const changed = await authority.transaction.studioDraft.updateMany({ where: { id: draft.id, organisationId: authority.session.organisationId,
    revision: draft.revision, definition: { retiredAt: null, ...(sourceHead ?? {}) } }, data: { payload: compiled.payload, revision: { increment: 1 },
    editorUserId: authority.session.userId, validation: Prisma.DbNull } });
  if (changed.count !== 1) conflict();
  await audit(authority, "studio.draft.updated", draft.definitionId, { revision: draft.revision + 1 });
  return { revision: draft.revision + 1, payload: compiled.payload };
}
async function activePin(authority: FieldRuntimeAuthority, definitionId: string, kind: "page" | "customField" | "entityProfile") {
  const definition = await authority.transaction.studioDefinition.findFirst({ where: { id: definitionId,
    organisationId: authority.session.organisationId, kind, retiredAt: null }, include: { activeVersion: true } });
  if (!definition?.activeVersion || definition.activeVersionId !== definition.activeVersion.id) unavailable();
  const pin = configurationReferenceSchema.parse({ kind, definitionId, versionId: definition.activeVersion.id,
    schemaVersion: definition.activeVersion.schemaVersion, checksum: definition.activeVersion.checksum });
  const version = await loadSealedConfigurationVersion(authority.session, authority.transaction, pin);
  const payload = kind === "page" ? pagePayloadSchema.parse(version.payload) : kind === "customField"
    ? inspectSealedFieldVersion(authority.registry, version, authority.session.organisationId, definitionId).payload : entityProfilePayloadSchema.parse(version.payload);
  if (payload.entity.id !== "tickets.ticket") unavailable();
  if (kind === "customField") {
    const sealed = inspectSealedFieldVersion(authority.registry, version, authority.session.organisationId, definitionId);
    assertFieldAccess(authority.session, sealed.payload.field, "read");
    assertFieldAccess(authority.session, sealed.payload.field, "write");
  }
  return pin;
}
async function choices(authority: FieldRuntimeAuthority, value: z.infer<typeof baseChoices> | z.infer<typeof typeChoices>) {
  const page = value.pageDefinitionId ? await activePin(authority, value.pageDefinitionId, "page") : value.pageDefinitionId;
  const fields = [];
  for (const id of [...value.requiredFieldDefinitionIds].sort()) fields.push(await activePin(authority, id, "customField"));
  return { page, requiredFields: fields };
}
async function currentBase(authority: FieldRuntimeAuthority): Promise<EntityProfileReference> {
  const bindings = await authority.transaction.studioProfileBinding.findMany({ where: { organisationId: authority.session.organisationId,
    entityId: "tickets.ticket", kind: "entityProfile" }, select: { definitionId: true }, take: 2 });
  if (bindings.length !== 1) unavailable();
  return entityProfileReferenceSchema.parse(await activePin(authority, bindings[0].definitionId, "entityProfile"));
}

type OwnerPolicy = Awaited<ReturnType<typeof owner>>;
async function referenceTarget(authority: FieldRuntimeAuthority, policy: OwnerPolicy, entityId: string) {
  // The actual Tickets9 owner approves only canonical Tickets. Additional future
  // owners need an explicit current reference-selection policy, never a guessed
  // version or a lower accessible version from a filtered registry catalogue.
  if (!policy.fieldPolicy.referenceEntities.includes(entityId) || entityId !== policy.entity.id) unavailable();
  const target = await authority.registry.resolve(authority.session, policy.entity);
  if (target.kind !== "entity" || !entityDetailsSchema.parse(target.details).record) unavailable();
  return { entity: policy.entity, name: target.label };
}
async function getSetupReferenceTargets(authority: FieldRuntimeAuthority) {
  const policy = await owner(authority, CAP.read), targets = [];
  for (const id of policy.fieldPolicy.referenceEntities) {
    const target = await referenceTarget(authority, policy, id);
    targets.push({ id: target.entity.id, name: target.name });
  }
  return targets;
}
async function setupStorage(authority: FieldRuntimeAuthority, policy: OwnerPolicy, value: AdditionalFieldSetup, previousStorage?: FieldStorage,
  publishedChoices?: { sourceIndexes?: readonly (number | null)[]; draftStorage?: FieldStorage }) {
  if (!policy.fieldPolicy.types.includes(value.type)) unavailable();
  let storage: FieldStorage, initialValue: unknown = value.initialValue;
  switch (value.type) {
    case "string": {
      const { characters, ...settings } = value.settings;
      const classes = { letters: "A-Za-z", letters_numbers: "A-Za-z0-9", numbers: "0-9", letters_numbers_spaces_dashes: "A-Za-z0-9 _-" } as const;
      storage = fieldStorageSchema.parse({ type: value.type, ...settings,
        ...(characters !== "any" ? { pattern: `^[${classes[characters]}]{${settings.minLength},${settings.maxLength}}$` } : {}) });
      break;
    }
    case "integer": case "decimal": case "money": case "duration": case "address":
      storage = fieldStorageSchema.parse({ type: value.type, ...value.settings, ...(value.type === "duration" ? { unit: "seconds" } : {}) }); break;
    case "boolean": case "date": case "email": storage = { type: value.type }; break;
    case "datetime": storage = { type: value.type, timezone: "UTC" }; break;
    case "phone": storage = { type: value.type, format: "E164" }; break;
    case "url": storage = { type: value.type, protocols: value.settings.allowHttp ? ["https", "http"] : ["https"] }; break;
    case "enum": case "multi_enum": {
      const previous = previousStorage?.type === "enum" || previousStorage?.type === "multi_enum" ? previousStorage : undefined;
      if (publishedChoices?.sourceIndexes && (!previous || previous.type !== value.type))
        throw new Error("Match choices only when changing the existing choice field.");
      const options = value.settings.choices.map((label, index) => {
        const sourceIndex = publishedChoices?.sourceIndexes?.[index];
        const retained = sourceIndex === null ? undefined : sourceIndex !== undefined ? previous?.options[sourceIndex]
          : previous?.options.find(option => !option.retired && option.label.trim().toLowerCase() === label.trim().toLowerCase());
        if (sourceIndex !== null && sourceIndex !== undefined && (!retained || retained.retired))
          throw new Error("This previous choice is unavailable for new selection. Its history is kept.");
        const target = publishedChoices?.draftStorage;
        const savedNewChoice = target && (target.type === "enum" || target.type === "multi_enum")
          ? target.options.find(option => !option.retired && !previous?.options.some(old => old.id === option.id)
            && option.label.trim().toLowerCase() === label.trim().toLowerCase()) : undefined;
        return { id: retained?.id ?? savedNewChoice?.id ?? `o_${crypto.randomUUID().replaceAll("-", "")}`, label, retired: false };
      });
      const retainedOptions = publishedChoices && previous ? [ ...options,
        ...previous.options.filter(option => !options.some(next => next.id === option.id)).map(option => ({ ...option, retired: true })) ] : options;
      const byId = (left: { id: string }, right: { id: string }) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
      const choicesChanged = previous && checksum([...previous.options].sort(byId)) !== checksum([...retainedOptions].sort(byId));
      storage = fieldStorageSchema.parse({ type: value.type, valueSetVersion: previous
        ? previous.valueSetVersion + (publishedChoices && choicesChanged ? 1 : 0) : 1, options: retainedOptions,
        ...(value.type === "multi_enum" ? { maxSelections: value.settings.maxSelections } : {}) });
      const option = (index: number) => { if (!options[index]) throw new Error("Choose an existing default choice."); return options[index].id; };
      if (value.initialValue !== undefined) initialValue = value.type === "enum" ? option(value.initialValue) : value.initialValue.map(option);
      break;
    }
    case "reference": {
      const target = await referenceTarget(authority, policy, value.settings.entityId);
      storage = { type: "reference", entity: target.entity };
      if (value.initialValue !== undefined) await authority.registry.authoriseRecord({ session: authority.session, transaction: authority.transaction },
        target.entity, { recordId: value.initialValue, intent: "read" });
      break;
    }
  }
  // Original strict metadata codec/compiler validates every literal against the
  // actual precision, limits, value set and approved reference contract. Zero and
  // false are present defaults; missing initialValue installs no default.
  return { storage, ...(initialValue !== undefined ? { defaultValue: { type: value.type, value: initialValue } } : {}) };
}

export async function createAdditionalFieldDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const policy = await owner(authority, CAP.edit), value = additionalFieldSetupSchema.parse(input), configured = await setupStorage(authority, policy, value);
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: policy.entity, storageGeneration: crypto.randomUUID(),
    field: { key: `f_${crypto.randomUUID().replaceAll("-", "")}`, label: value.label, help: value.help,
      classification: policy.classification, readCapability: policy.readCapability, writeCapability: policy.writeCapability,
      required: false, indexed: value.indexed ?? false, unique: value.unique ?? false, ...configured } });
  return create(authority, fieldDefinitionKey(payload), value.label, "customField", payload);
}
/** Initial field setup only. Once any version has been published, changing type,
 * limits, choices/defaults requires the original reviewed structural evolution.
 * Same entity lock precedes the draft/version check and all resulting writes. */
export async function configureAdditionalFieldDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const policy = await owner(authority, CAP.edit), value = fieldConfigure.parse(input);
  await lockFieldEntitiesInTransaction(authority.transaction, authority.session.organisationId, [policy.entity.id]);
  const draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft || draft.definition.kind !== "customField") conflict();
  if (draft.definition.latestVersion !== 0 || draft.baseVersion !== null || draft.definition.activeVersionId !== null
    || await authority.transaction.studioDefinitionVersion.findFirst({ where: { definitionId: draft.definitionId,
      organisationId: authority.session.organisationId }, select: { id: true } }))
    throw new Error("MIGRATION_REQUIRED: published fields need reviewed evolution. Their labels and help can still be edited.");
  const previous = customFieldPayloadSchema.parse(ticketPayload("customField", draft.payload));
  if (checksum(previous.entity) !== checksum(policy.entity)) unavailable();
  assertFieldAccess(authority.session, previous.field, "write");
  const representable = projectAdditionalFieldSetup(previous, policy.fieldPolicy.referenceEntities.map(id => ({ id })));
  if (representable.kind === "read_only") throw new Error(representable.reason);
  const configured = await setupStorage(authority, policy, value.setup, previous.field.storage), field = { ...previous.field };
  delete field.defaultValue;
  return save(authority, draft, { ...previous, field: { ...field, ...configured, indexed: value.setup.indexed ?? previous.field.indexed,
    unique: value.setup.unique ?? previous.field.unique, label: value.setup.label, help: value.setup.help } });
}
function friendlyConversion(rule: FriendlyFieldConversion, target: CustomFieldPayload): FieldConversion {
  if (rule.kind !== "string_to_enum") return rule;
  const storage = target.field.storage;
  if (storage.type !== "enum") throw new Error("Choose one choice as the destination for each existing text.");
  return { ...rule, mapping: rule.mapping.map(({ from, toChoice }) => {
    const choice = storage.options[toChoice];
    if (!choice || choice.retired) throw new Error("A conversion mapping must choose an available target choice.");
    return { from, to: choice.id };
  }) };
}

/** Proposed published-field settings only: no preparation, publication, value
 * conversion, generation row, pointer activation or migration-state mutation.
 * Active immutable schemas/values remain untouched. A subsequent explicit
 * preparation must freshly seal these saved settings and the conversion again. */
export async function saveAdditionalFieldEvolutionDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const policy = await owner(authority, CAP.edit), value = additionalFieldEvolutionDraftSchema.parse(input), tx = authority.transaction;
  await lockFieldEntitiesInTransaction(tx, authority.session.organisationId, [policy.entity.id]);
  await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
    WHERE d.id=${value.definitionId}::uuid AND d."organisationId"=${authority.session.organisationId} FOR UPDATE OF d,draft`;
  const draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft || draft.definition.kind !== "customField" || draft.definition.id !== value.definitionId
    || draft.definition.organisationId !== authority.session.organisationId || draft.definition.revision !== value.definitionRevision
    || draft.definition.activeVersionId !== value.sourceVersionId || draft.definition.latestVersion < 1
    || draft.baseVersion?.version !== draft.definition.latestVersion) conflict();
  const version = await tx.studioDefinitionVersion.findFirst({ where: { id: value.sourceVersionId,
    definitionId: value.definitionId, organisationId: authority.session.organisationId } });
  if (!version || version.id !== value.sourceVersionId) conflict();
  const source = inspectSealedFieldVersion(authority.registry, version, authority.session.organisationId, value.definitionId).payload;
  const previous = versionedFieldPayloadSchema.parse(ticketPayload("customField", draft.payload));
  await preflightMetadataRead(authority, "customField", source);
  await preflightMetadataRead(authority, "customField", previous);
  assertFieldAccess(authority.session, source.field, "write");
  assertFieldAccess(authority.session, previous.field, "write");
  if (source.schemaVersion !== 1 || previous.schemaVersion !== 1)
    throw new Error("Conditional field rules need their reviewed conditional editor. These saved rules are kept.");
  if (source.entity.id !== policy.entity.id || (checksum(previous.entity) !== checksum(source.entity) && checksum(previous.entity) !== checksum(policy.entity))
    || previous.field.key !== source.field.key || draft.definition.key !== fieldDefinitionKey(source)) conflict();
  const security = (payload: CustomFieldPayload) => ({ classification: payload.field.classification,
    readCapability: payload.field.readCapability, writeCapability: payload.field.writeCapability,
    required: payload.field.required, indexed: payload.field.indexed, unique: payload.field.unique });
  if (checksum(security(previous)) !== checksum(security(source)))
    throw new Error("This saved draft changes access or business rules. Keep its existing reviewed editor.");
  if (value.setup.indexed !== undefined && value.setup.indexed !== source.field.indexed)
    throw new Error("Search availability for a published detail needs a separately reviewed index change. Its existing search setting is kept.");
  if (value.setup.unique !== undefined && value.setup.unique !== source.field.unique)
    throw new Error("Duplicate-value rules for a published detail need a separately reviewed uniqueness change. Its existing rule is kept.");
  const representable = projectAdditionalFieldSetup(source, policy.fieldPolicy.referenceEntities.map(id => ({ id })));
  if (representable.kind === "read_only") throw new Error(representable.reason);
  if (value.setup.type === "reference" && value.setup.initialValue !== undefined)
    throw new Error("Choose a starting linked record only through an approved record picker. Its saved rules are kept.");
  // Target the explicit CURRENT owner protocol; immutable source entity versions
  // stay exact. Tickets2 has no migration contract, while current Tickets9
  // explicitly approves retained source2–9. Never infer a compatibility range.
  for (const [mode, approval] of [["snapshot", policy.migrationSnapshot], ["representation", policy.migrationRepresentation]] as const) {
    if (!approval || !supportsFieldMigrationIntent(approval, 1) || !approval.sourceVersions.includes(source.entity.version))
      throw new Error("This previous field version has no approved conversion path. Its live settings are kept.");
    const metadata = authority.registry.describe(approval.query.id, approval.query.version), approved = await authority.registry.resolve(authority.session,
      referenceSchema.parse({ id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }));
    if (approved.kind !== "query" || approved.ownerModuleId !== "tickets" || approved.capability !== policy.writeCapability
      || approved.details.transaction !== "required" || !supportsFieldMigrationQueryIntent(approved, policy.entity.id, mode, 1)) unavailable();
  }
  await assertFieldBinding(tx, authority.session, value.definitionId, source);
  const compiledSource = await compileDraft(authority, value.definitionId, "customField", source);
  if (compiledSource.checksum !== version.checksum) conflict();
  if (await tx.studioFieldMigrationPublication.findFirst({ where: { organisationId: authority.session.organisationId,
    definitionId: value.definitionId, state: { in: ["PUBLISHED", "CUTOVER"] } }, select: { preparationId: true } }))
    throw new Error("Finish or cancel the existing reviewed field change before preparing different settings.");
  const configured = await setupStorage(authority, policy, value.setup, source.field.storage,
    { sourceIndexes: value.choiceSourceIndexes, draftStorage: previous.field.storage });
  const field = { ...source.field };
  delete field.defaultValue;
  const candidate = customFieldPayloadSchema.parse({ ...source, entity: policy.entity, field: { ...field,
    label: value.setup.label, help: value.setup.help, ...configured } });
  // No-op settings/name/help belong to the existing cosmetic editor. Choice
  // labels stay stable-ID changes and may use the reviewed path: the ordinary
  // publisher deliberately cannot rewrite a saved value set in place.
  const settings = (payload: CustomFieldPayload) => ({ ...payload.field, label: "", help: "" });
  if (checksum(settings(source)) === checksum(settings(candidate)))
    throw new Error("Change the name or description using the existing field editor. No conversion is needed.");
  const existingGeneration = previous.storageGeneration !== source.storageGeneration
    ? await tx.studioFieldGeneration.findFirst({ where: { id: previous.storageGeneration,
      organisationId: authority.session.organisationId }, select: { id: true } }) : null;
  const generation = previous.storageGeneration !== source.storageGeneration && !existingGeneration
    ? previous.storageGeneration : crypto.randomUUID();
  const target = customFieldPayloadSchema.parse({ ...candidate, storageGeneration: generation });
  const analysis = analyseRequiredFieldEvolution(source, target);
  createFieldConverter(source, target, friendlyConversion(value.conversion, target));
  const saved = await save(authority, draft, analysis.target, { revision: value.definitionRevision, activeVersionId: value.sourceVersionId });
  return { revision: saved.revision, definitionRevision: value.definitionRevision, sourceVersionId: value.sourceVersionId,
    conversion: value.conversion, impact: { index: analysis.indexImpact, uniquenessCheck: analysis.requiresUniquenessCheck,
      rollbackLimit: analysis.rollbackLimit }, next: "review_existing_records" as const };
}

/** Presentation-only: storage, security, required/default and stable identity
 * remain the exact server-saved payload. The original binder independently rejects
 * structural changes at publication; this path supplies no migration waiver. */
export async function saveAdditionalFieldDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await owner(authority, CAP.edit); const value = fieldSave.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft || draft.definition.kind !== "customField") conflict();
  const payload = customFieldPayloadSchema.parse(ticketPayload("customField", draft.payload));
  return save(authority, draft, { ...payload, field: { ...payload.field, label: value.label, help: value.help } });
}
export async function createBaseProfileDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const policy = await owner(authority, CAP.edit), value = baseChoices.parse(input), selected = await choices(authority, value);
  const payload = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity: policy.entity, profile: selected });
  return create(authority, entityProfileDefinitionKey(policy.entity.id), "Tickets record setup", "entityProfile", payload);
}
export async function saveBaseProfileDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await owner(authority, CAP.edit); const value = baseSave.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft || draft.definition.kind !== "entityProfile") conflict();
  const previous = entityProfilePayloadSchema.parse(ticketPayload("entityProfile", draft.payload)), selected = await choices(authority, value);
  // Existing Process/Decision settings cannot be erased through this earlier
  // setup form; the original compiler keeps unavailable future adapters closed.
  return save(authority, draft, { ...previous, profile: { ...previous.profile, ...selected } });
}
export async function createRecordTypeDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const policy = await owner(authority, CAP.edit), value = typeChoices.parse(input), selected = await choices(authority, value);
  const baseProfile = await currentBase(authority), payload = recordTypePayloadSchema.parse({ schemaVersion: 1, entity: policy.entity,
    baseProfile, label: value.label, help: value.help, overlay: { requiredFields: selected.requiredFields,
      ...(selected.page !== undefined ? { page: selected.page } : {}) } });
  return create(authority, `record_type.${crypto.randomUUID()}`, value.label, "recordType", payload);
}
export async function saveRecordTypeDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await owner(authority, CAP.edit); const value = typeSave.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft || draft.definition.kind !== "recordType") conflict();
  const previous = recordTypePayloadSchema.parse(ticketPayload("recordType", draft.payload)), selected = await choices(authority, value);
  const overlay = { ...previous.overlay, requiredFields: selected.requiredFields };
  if (selected.page === undefined) delete overlay.page; else overlay.page = pageReferenceSchema.nullable().parse(selected.page);
  // Retain the chosen exact base across edits; today's active base is not silently
  // substituted into an existing subtype's immutable inheritance choice.
  return save(authority, draft, { ...previous, label: value.label, help: value.help, overlay });
}
export async function readConfigurationDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await owner(authority, CAP.read); const id = uuid.parse(input), draft = await scopedDraft(authority, id);
  if (!draft) unavailable();
  const payload = ticketPayload(draft.definition.kind, draft.payload);
  await preflightMetadataRead(authority, draft.definition.kind, payload);
  const versions = await authority.transaction.studioDefinitionVersion.findMany({ where: { definitionId: id, organisationId: authority.session.organisationId },
    select: { id: true, version: true, publishedAt: true }, orderBy: { version: "desc" }, take: 50 });
  const fieldSettings = draft.definition.kind === "customField" && draft.definition.latestVersion === 0 && draft.baseVersion === null
    && draft.definition.activeVersionId === null && versions.length === 0
    ? projectAdditionalFieldSetup(payload, (await getSetupReferenceTargets(authority)).map(target => ({ id: target.id }))) : null;
  return { id, kind: draft.definition.kind, name: displayName(draft.definition.kind, payload, draft.definition.name), payload, revision: draft.revision, fieldSettings,
    presentationEditable: presentationEditable(authority, draft.definition.kind, payload),
    definitionRevision: draft.definition.revision, activeVersionId: draft.definition.activeVersionId,
    versions: versions.map(version => ({ ...version, publishedAt: version.publishedAt.toISOString() })) };
}
/** Saved setup links retain their exact pins, even when a newer source is live.
 * Missing access keeps the selection intact but discloses no source name/link.
 * Broken retained seals/graphs always fail closed; retirement remains inspectable. */
export async function readSetupReferenceNavigationInTransaction(authority: FieldRuntimeAuthority, input: unknown,
  navigation: ReferenceNavigationContext = {}) {
  await owner(authority, CAP.read);
  const id = uuid.parse(input), draft = await scopedDraft(authority, id);
  if (!draft) unavailable();
  const payload = ticketPayload(draft.definition.kind, draft.payload);
  const read = async (pin: unknown) => {
    const reference = configurationReferenceSchema.parse(pin);
    try { return { id: reference.definitionId, ...await readDesignReferenceMetadataInTransaction(authority, reference, navigation) }; }
    catch (error) {
      if (error instanceof Error && error.message.startsWith("FORBIDDEN:")) return null;
      throw error;
    }
  };
  if (draft.definition.kind === "customField") return { page: null, baseProfile: null, requiredFields: [] };
  const typed = draft.definition.kind === "recordType" ? recordTypePayloadSchema.parse(payload) : null;
  const profile = typed ? typed.overlay : entityProfilePayloadSchema.parse(payload).profile;
  const requiredFields = [];
  for (const pin of profile.requiredFields ?? []) { const metadata = await read(pin); if (metadata) requiredFields.push(metadata); }
  return { page: profile.page ? await read(profile.page) : null,
    baseProfile: typed ? await read(typed.baseProfile) : null, requiredFields };
}

export async function reviewConfigurationDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await owner(authority, CAP.edit); const value = identity.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileDraft(authority, draft.definitionId, draft.definition.kind, draft.payload);
  const changed = await authority.transaction.studioDraft.updateMany({ where: { id: draft.id, organisationId: authority.session.organisationId, revision: value.revision,
    definition: { retiredAt: null } }, data: { validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: value.revision } } });
  if (changed.count !== 1) conflict();
  return { payload: compiled.payload, checksum: compiled.checksum, warnings: compiled.warnings };
}
export async function publishConfigurationDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await owner(authority, CAP.publish); const value = publishRequest.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileDraft(authority, draft.definitionId, draft.definition.kind, draft.payload);
  if (compiled.warnings.length && !value.acknowledgeWarnings) throw new Error("Review and acknowledge these setup warnings before publishing.");
  const published = await publishCompiledDefinitionInTransaction(authority.transaction, authority.session, draft, value.revision, compiled);
  return { revision: published.draftRevision, definitionRevision: draft.definition.revision + 1, versionId: published.version.id, version: published.versionNumber };
}
export async function activateConfigurationVersionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await owner(authority, CAP.publish); const value = activateRequest.parse(input);
  const version = await authority.transaction.studioDefinitionVersion.findFirst({ where: { id: value.versionId, definitionId: value.definitionId,
    organisationId: authority.session.organisationId, definition: { kind: { in: [...supportedKinds] }, retiredAt: null } }, include: { definition: true } });
  if (!version) unavailable();
  const compiled = await compileDraft(authority, value.definitionId, version.definition.kind, version.payload);
  if (checksum(version.compiledPlan) !== version.checksum || compiled.checksum !== version.checksum) unavailable();
  const session = compiled.plan.kind === "customField" && compiled.plan.payload.field.required
    ? await prepareRequiredFieldActivationInTransaction(authority.session, authority.transaction,
      { definitionId: value.definitionId, versionId: value.versionId, definitionRevision: value.definitionRevision }, { payload: compiled.plan.payload, plan: compiled.plan, checksum: compiled.checksum, warnings: compiled.warnings }) : authority.session;
  return activateCompiledVersionInTransaction(authority.transaction, session, value.definitionId, value.definitionRevision, version, compiled);
}

/** Explicit UI go-live request only. Any activation/coverage/Audit failure rolls
 * back the new publication as well; warnings are never acknowledged implicitly. */
export async function goLiveConfigurationDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const published = await publishConfigurationDraftInTransaction(authority, input);
  const value = publishRequest.parse(input);
  const activated = await activateConfigurationVersionInTransaction(authority, { definitionId: value.definitionId,
    versionId: published.versionId, definitionRevision: published.definitionRevision });
  return { ...published, definitionRevision: activated.revision };
}

/** Bounded metadata choices for friendly setup; no native records/typed values.
 * A displayed draft is never promoted to a sealed runtime selection: create/save
 * independently load each selected current active pin and compile it again. */
export async function getSetupCatalogInTransaction(authority: FieldRuntimeAuthority, navigation: ReferenceNavigationContext = {}) {
  const policy = await owner(authority, CAP.read), groups = [];
  for (const kind of supportedKinds) {
    const definitions = await authority.transaction.studioDefinition.findMany({ where: { organisationId: authority.session.organisationId,
      kind, retiredAt: null, OR: [{ fieldBinding: { entityId: policy.entity.id } }, { profileBinding: { entityId: policy.entity.id } },
        { draft: { payload: { path: ["entity", "id"], equals: policy.entity.id } } }] },
      include: { draft: true, activeVersion: true }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 101 });
    if (definitions.length > 100) throw new Error("This setup exceeds the bounded design catalogue. Review existing drafts first.");
    const items = [];
    for (const definition of definitions) {
      if (!definition.draft) unavailable();
      const payload = ticketPayload(kind, definition.draft.payload);
      try { await preflightMetadataRead(authority, kind, payload); }
      catch (error) { if (error instanceof Error && error.message.startsWith("FORBIDDEN:")) continue; throw error; }
      let referenceNavigation;
      if (definition.activeVersionId) {
        try { referenceNavigation = await readDesignReferenceMetadataInTransaction(authority, { kind, definitionId: definition.id,
          versionId: definition.activeVersionId, schemaVersion: definition.activeVersion?.schemaVersion, checksum: definition.activeVersion?.checksum }, navigation); }
        catch (error) { if (error instanceof Error && error.message.startsWith("FORBIDDEN:")) continue; throw error; }
      }
      items.push({ id: definition.id, name: displayName(kind, payload, definition.name), kind, revision: definition.draft.revision,
        definitionRevision: definition.revision, activeVersionId: definition.activeVersionId,
        presentationEditable: presentationEditable(authority, kind, payload), payload,
        ...(referenceNavigation ? { navigation: referenceNavigation } : {}) });
    }
    groups.push({ kind, definitions: items });
  }
  const pages = await authority.transaction.studioDefinition.findMany({ where: { organisationId: authority.session.organisationId,
    kind: "page", retiredAt: null, activeVersionId: { not: null }, activeVersion: { payload: { path: ["entity", "id"], equals: policy.entity.id } } }, include: { activeVersion: true },
    orderBy: [{ name: "asc" }, { id: "asc" }], take: 101 });
  if (pages.length > 100) throw new Error("This setup exceeds the bounded screen catalogue.");
  const screenChoices = [];
  for (const definition of pages) {
    if (!definition.activeVersion || definition.activeVersionId !== definition.activeVersion.id) unavailable();
    if (pagePayloadSchema.parse(definition.activeVersion.payload).entity.id !== policy.entity.id) continue;
    const pin = await activePin(authority, definition.id, "page");
    screenChoices.push({ id: definition.id, ...await readDesignReferenceMetadataInTransaction(authority, pin, navigation) });
  }
  const referenceTargets = [];
  if (policy.fieldPolicy.types.includes("reference") && policy.fieldPolicy.referenceEntities.includes(policy.entity.id)) {
    const target = await referenceTarget(authority, policy, policy.entity.id);
    referenceTargets.push({ id: target.entity.id, name: target.name });
  }
  return { groups, pages: screenChoices, fieldTypes: additionalFieldTypeCatalogue.filter(type => policy.fieldPolicy.types.includes(type.id)
    && (type.id !== "reference" || referenceTargets.length > 0)), referenceTargets };
}
