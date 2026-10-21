import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { STUDIO_CAPABILITIES } from "../permissions";
import { withStudioAuthoringAuthority } from "./context";
import { captureCustomerFieldMigrationPrincipal, openFieldMigrationSupportContext } from "../fields/principal";
import type { FieldMigrationPrincipal } from "../fields/principal-contract";
import { withFieldMigrationAuthority, type FieldMigrationAuthority } from "../fields/migrations/authority";
import { studioRegistry } from "../registry/runtime";
import type { CapabilityRegistry } from "../registry/registry";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema, recordAnchorSchema, supportsFieldMigrationIntent } from "../registry/entities";
import { customFieldPayloadSchema, type CustomFieldPayload, type FieldValue } from "../fields/schema";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { assertFieldBinding } from "../fields/binding";
import { lockBoundFieldEntityInTransaction } from "../fields/entity-lock";
import { analyseFieldEvolution, fieldConversionSchema, type FieldConversion } from "../fields/evolution";
import { compileFieldMigrationMetadata } from "../fields/migrations/metadata";
import { assertFieldAccess } from "../fields/validation";
import { compileCustomField } from "../compiler/fields";
import { projectAdditionalFieldSetup } from "./field-setup-projection";
import { assertFieldMigrationPolicies, authoriseFieldMigrationReference } from "../fields/migrations/access";
import { sealFieldMigrationIntent, fieldMigrationIntentFromReview, fieldMigrationObservationSchema, FieldMigrationReviewError,
  type FieldMigrationIntent } from "../fields/migrations/contracts";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "../fields/migrations/stored-protocol";
import { inspectFieldMigrationRecord } from "../fields/migrations/observation";
import { readObservedMigrationSource } from "../fields/migrations/observation-source";
import type { FriendlyFieldConversion } from "./field-evolution-contract";
import { additionalFieldMigrationPreviewRequestSchema, additionalFieldMigrationPreviewSchema,
  additionalFieldMigrationDetailRequestSchema, additionalFieldMigrationDetailSchema,
  additionalFieldMigrationSetupRequestSchema, additionalFieldMigrationSetupSchema } from "./field-migration-contract";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function closed(input: unknown): CustomFieldPayload {
  const header = z.object({ schemaVersion: z.number() }).parse(input);
  if (header.schemaVersion !== 1) throw new Error("Conditional field changes are not supported by this preview yet. Their existing reviewed workflow remains required.");
  return customFieldPayloadSchema.parse(input);
}
/** Called only by an explicit server Review records/support action. Never return
 * this object to the browser, persist it in a draft, or invoke migration engines
 * inside withStudioAuthoringAuthority's transaction. No membership is created. */
export async function resolveAdditionalFieldMigrationContext(actor: Session, target?: string) {
  const selected = await withStudioAuthoringAuthority(actor, STUDIO_CAPABILITIES.publish, target, async authority => authority.session);
  if (selected.capabilities.has(ATLAS_CAPABILITIES.staff)) return openFieldMigrationSupportContext(actor, selected.organisationId);
  return { session: selected, principal: await captureCustomerFieldMigrationPrincipal(selected) };
}
/** UI ordinals are resolved against the ACTUAL saved target. Original converter
 * validates the result; no client raw option IDs or alternate conversion engine. */
function conversion(rule: FriendlyFieldConversion, target: CustomFieldPayload): FieldConversion {
  if (rule.kind !== "string_to_enum") return fieldConversionSchema.parse(rule);
  if (target.field.storage.type !== "enum") changed();
  const options = target.field.storage.options;
  return fieldConversionSchema.parse({ ...rule, mapping: rule.mapping.map(row => {
    const option = options[row.toChoice];
    if (!option || option.retired) throw new Error("Choose an available target choice for each mapped text.");
    return { from: row.from, to: option.id };
  }) });
}
/** Already-authorised values only. Friendly labels are scoped to exact loaded
 * schemas; reference titles are never guessed or fetched by this adapter. */
function display(payload: CustomFieldPayload, value: FieldValue | null) {
  if (value === null) return "No value";
  let text: string;
  switch (value.type) {
    case "boolean": text = value.value ? "Yes" : "No"; break;
    case "money": text = `${value.value.amount} ${value.value.currency}`; break;
    case "reference": text = "Linked record"; break;
    case "enum": case "multi_enum": {
      const storage = payload.field.storage;
      if (storage.type !== "enum" && storage.type !== "multi_enum") changed();
      const label = (id: string) => storage.options.find(option => option.id === id)?.label ?? "Unavailable previous choice";
      text = typeof value.value === "string" ? label(value.value) : value.value.map(label).join(", ") || "No value"; break;
    }
    case "address": text = Object.values(value.value).filter(Boolean).join(", "); break;
    case "duration": text = `${value.value} seconds`; break;
    default: text = String(value.value);
  }
  return text.length > 4000 ? `${text.slice(0, 3999)}…` : text || "No value";
}
function impact(source: CustomFieldPayload, target: CustomFieldPayload) {
  const analysis = analyseFieldEvolution(source, target);
  if (analysis.kind !== "migration") throw new Error("Use the normal name and help editor for presentation changes.");
  return { index: analysis.indexImpact, uniquenessCheck: analysis.requiresUniquenessCheck,
    rollbackLimit: "reverse_review_after_target_writes" as const };
}
type Context = { session: Session; transaction: FieldMigrationAuthority["transaction"] };
const scope = { organisationId: z.string().min(1).max(100), entityId: z.string().min(1).max(100) };
const preflightSchema = z.strictObject({ ...scope, mode: z.literal("preflight"), count: z.number().int().nonnegative(), nativeAccessComplete: z.literal(true) });
const snapshotSchema = z.strictObject({ ...scope, mode: z.literal("snapshot"), records: z.array(recordAnchorSchema).max(50),
  next: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/).nullable() });

/** Metadata, current data policies and complete private owner coverage precede
 * counts/IDs. Current writer capability is independent of Studio publication. */
async function preflight(authority: FieldMigrationAuthority, registry: CapabilityRegistry, intent: FieldMigrationIntent) {
  const { session, transaction: tx, company } = authority, context = { session, transaction: tx };
  assertFieldMigrationPolicies(session, company, intent.source.payload); assertFieldMigrationPolicies(session, company, intent.target.payload);
  const source = await registry.resolve(session, intent.source.payload.entity), target = await registry.resolve(session, intent.target.payload.entity);
  const sr = entityDetailsSchema.parse(source.details).record, tr = entityDetailsSchema.parse(target.details).record;
  const policy = tr?.migrationSnapshot;
  if (!sr?.fieldPolicy || !tr?.fieldPolicy || !policy || !supportsFieldMigrationIntent(policy, 1)
    || !policy.sourceVersions.includes(source.version) || source.id !== target.id || policy.query.id !== intent.ownerQuery.id
    || policy.query.version !== intent.ownerQuery.version) changed();
  assertCapability(session, sr.writeCapability); assertCapability(session, tr.writeCapability);
  const query = await registry.resolve(session, intent.ownerQuery);
  if (query.kind !== "query" || query.ownerModuleId !== target.ownerModuleId || query.details.transaction !== "required") changed();
  // Retained schema1 dependencies contain only the owning/reference entities.
  const modules = new Set([source.ownerModuleId, target.ownerModuleId, query.ownerModuleId]);
  for (const payload of [intent.source.payload, intent.target.payload]) if (payload.field.storage.type === "reference")
    modules.add((await registry.resolve(session, payload.field.storage.entity)).ownerModuleId);
  for (const moduleId of [...modules].sort()) {
    await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
  }
  const result = preflightSchema.parse(await registry.invokeQueryInTransaction(context, intent.ownerQuery, { mode: "preflight" }));
  if (result.organisationId !== session.organisationId || result.entityId !== source.id) changed();
  return { context, count: result.count };
}

/** One bounded read-only page, never a durable review or publication approval.
 * All plaintext exists only in the authorised response, not metadata/Audit/DB. */
export async function previewAdditionalFieldMigration(session: Session, principal: FieldMigrationPrincipal, input: unknown) {
  const request = additionalFieldMigrationPreviewRequestSchema.parse(input);
  return withFieldMigrationAuthority(session, principal, async authority => {
    const { session: fresh, transaction: tx, company } = authority, registry = studioRegistry();
    await lockBoundFieldEntityInTransaction(tx, fresh.organisationId, request.definitionId);
    await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
      WHERE d.id=${request.definitionId}::uuid AND d."organisationId"=${fresh.organisationId} FOR SHARE OF d,draft`;
    const definition = await tx.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: fresh.organisationId,
      kind: "customField", retiredAt: null, revision: request.definitionRevision }, include: { activeVersion: true, draft: true } });
    const version = definition?.activeVersion, draft = definition?.draft;
    if (!definition || !version || !draft || definition.activeVersionId !== request.sourceVersionId || version.id !== request.sourceVersionId
      || draft.revision !== request.draftRevision || version.organisationId !== fresh.organisationId || version.definitionId !== definition.id
      || draft.organisationId !== fresh.organisationId || draft.definitionId !== definition.id) changed();
    const source = closed(version.payload), target = closed(draft.payload);
    inspectSealedFieldVersion(registry, version, fresh.organisationId, definition.id);
    const context: Context = { session: fresh, transaction: tx };
    const compiledSource = await compileFieldMigrationMetadata(context, registry, company, definition.id, source);
    const compiledTarget = await compileFieldMigrationMetadata(context, registry, company, definition.id, target);
    if (compiledSource.checksum !== version.checksum || checksum(target) !== checksum(compiledTarget.payload)) changed();
    await assertFieldBinding(tx, fresh, definition.id, source);
    const targetMetadata = await registry.resolve(fresh, target.entity), policy = entityDetailsSchema.parse(targetMetadata.details).record?.migrationSnapshot;
    if (!policy) throw new Error("This field owner has not approved reviewed conversions.");
    const query = registry.describe(policy.query.id, policy.query.version);
    const sealed = sealFieldMigrationIntent({ schemaVersion: 1, id: randomUUID(), organisationId: fresh.organisationId,
      definitionId: definition.id, definitionRevision: definition.revision, principal: authority.principal,
      source: { versionId: version.id, versionChecksum: version.checksum, payload: source },
      target: { draftId: draft.id, draftRevision: draft.revision, compiledChecksum: compiledTarget.checksum, payload: target },
      conversion: conversion(request.conversion, target), ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } });
    const prepared = await preflight(authority, registry, sealed.intent);
    const snapshot = snapshotSchema.parse(await registry.invokeQueryInTransaction(context, sealed.intent.ownerQuery,
      { mode: "snapshot", limit: request.limit, ...(request.cursor ? { cursor: request.cursor } : {}) }));
    if (snapshot.organisationId !== fresh.organisationId || snapshot.entityId !== source.entity.id || snapshot.records.length > request.limit
      || snapshot.records.some((row, i) => row.organisationId !== fresh.organisationId || (i > 0 && row.recordId <= snapshot.records[i - 1].recordId)
        || (request.cursor !== undefined && row.recordId <= request.cursor))
      || (snapshot.next !== null && (snapshot.records.length !== request.limit || snapshot.next !== snapshot.records.at(-1)?.recordId))) changed();
    const pageCounts = { valid: 0, invalid: 0, lossy: 0 };
    const examples = [];
    for (const [index, anchor] of snapshot.records.entries()) {
      // Original inspector independently approves the exact native revision and
      // all current/written/reference grants. The second shared source read is
      // inside this SAME snapshot, using those pins, not a duplicate decoder.
      const result = await inspectFieldMigrationRecord(context, registry, company, sealed.intent, anchor);
      const before = await readObservedMigrationSource(context, registry, company, definition.id, source, anchor, 1);
      const issue = result.observation.result.kind === "invalid" ? result.observation.result.code : null;
      const lossy = result.observation.result.kind === "valid" && result.observation.result.lossy;
      if (issue) pageCounts.invalid++; else pageCounts.valid++;
      if (lossy) pageCounts.lossy++;
      examples.push({ label: `Record ${index + 1}`, before: before.storageValid ? before.decoded : null,
        after: result.convertedValue, beforeDisplay: before.storageValid ? display(source, before.decoded) : "Unavailable value",
        afterDisplay: issue ? "Needs review" : display(target, result.convertedValue), result: issue ? "invalid" as const : lossy ? "loss" as const : "ready" as const, issue });
    }
    return additionalFieldMigrationPreviewSchema.parse({ definitionId: definition.id, definitionRevision: definition.revision,
      draftRevision: draft.revision, sourceVersionId: version.id, fieldLabel: target.field.label, affectedCount: prepared.count,
      countsScope: "this_page", pageCounts, examples, nextCursor: snapshot.next, impact: impact(source, target),
      notice: "Preview only. Collect and seal the complete review before publishing." });
  });
}

/** Status/classifications only. Current genuine actor may differ from creator;
 * original immutable intent is never rewritten or used to borrow old grants.
 * No live examples are replayed against terminal/historical source state. */
export async function readAdditionalFieldMigrationDetail(session: Session, principal: FieldMigrationPrincipal, input: unknown) {
  const request = additionalFieldMigrationDetailRequestSchema.parse(input);
  return withFieldMigrationAuthority(session, principal, async authority => {
    const { session: fresh, transaction: tx, company } = authority, registry = studioRegistry();
    const where = { id: request.preparationId, definitionId: request.definitionId, organisationId: fresh.organisationId };
    await lockBoundFieldEntityInTransaction(tx, fresh.organisationId, request.definitionId);
    await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${request.preparationId}::uuid
      AND "definitionId"=${request.definitionId}::uuid AND "organisationId"=${fresh.organisationId} FOR SHARE`;
    const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where, include: { review: true } });
    if (!preparation) changed();
    const stored = readStoredFieldMigrationIntent(preparation, fresh.organisationId);
    if (stored.intent.schemaVersion !== 1) throw new Error("Conditional field changes are not supported by this detail view yet. Their existing reviewed workflow remains required.");
    const intent = stored.intent, source = intent.source.payload, target = intent.target.payload;
    if (intent.definitionId !== request.definitionId || preparation.entityId !== source.entity.id || preparation.sourceVersionId !== intent.source.versionId
      || preparation.sourceGenerationId !== source.storageGeneration || preparation.targetGenerationId !== target.storageGeneration || preparation.draftId !== intent.target.draftId) changed();
    // Inspect the original sealed version without asserting today's active head:
    // legitimate later native/value/configuration changes must not erase history.
    const version = await tx.studioDefinitionVersion.findFirst({ where: { id: intent.source.versionId, definitionId: request.definitionId, organisationId: fresh.organisationId } });
    if (!version || version.checksum !== intent.source.versionChecksum || checksum(version.payload) !== checksum(source)) changed();
    inspectSealedFieldVersion(registry, version, fresh.organisationId, request.definitionId);
    const currentDefinition = await tx.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: fresh.organisationId,
      kind: "customField" }, include: { activeVersion: true } });
    const currentVersion = currentDefinition?.activeVersion;
    if (!currentVersion || currentDefinition.activeVersionId !== currentVersion.id) changed();
    const currentPayload = closed(currentVersion.payload);
    inspectSealedFieldVersion(registry, currentVersion, fresh.organisationId, request.definitionId);
    assertFieldMigrationPolicies(fresh, company, currentPayload, source);
    assertFieldMigrationPolicies(fresh, company, currentPayload, target);
    const compiledCurrent = await compileFieldMigrationMetadata({ session: fresh, transaction: tx }, registry, company, request.definitionId, currentPayload);
    const compiledSource = await compileFieldMigrationMetadata({ session: fresh, transaction: tx }, registry, company, request.definitionId, source);
    if (compiledCurrent.checksum !== currentVersion.checksum || compiledSource.checksum !== intent.source.versionChecksum) changed();
    const compiledTarget = await compileFieldMigrationMetadata({ session: fresh, transaction: tx }, registry, company, request.definitionId, target);
    if (compiledTarget.checksum !== intent.target.compiledChecksum) changed();
    const prepared = await preflight(authority, registry, intent);
    let review = null;
    if (preparation.review) {
      const sealed = readStoredFieldMigrationReview(preparation.review, fresh.organisationId);
      if (sealed.review.schemaVersion !== 1 || checksum(fieldMigrationIntentFromReview(sealed.review)) !== stored.checksum) changed();
      review = { checksum: sealed.checksum, affectedCount: sealed.review.cohort.recordCount,
        valid: sealed.review.summary.validCount, invalid: sealed.review.summary.invalidCount, lossy: sealed.review.summary.lossyCount };
    } else if (preparation.state === "REVIEWED") changed();
    const archive = await tx.studioFieldMigrationObservation.findMany({ where: { preparationId: preparation.id,
      definitionId: request.definitionId, organisationId: fresh.organisationId, ...(request.cursor ? { recordId: { gt: request.cursor } } : {}) },
      orderBy: { recordId: "asc" }, take: request.limit + 1 });
    const rows = [];
    for (const [index, row] of archive.slice(0, request.limit).entries()) {
      if (row.organisationId !== fresh.organisationId || row.definitionId !== request.definitionId || row.preparationId !== preparation.id
        || row.entityId !== source.entity.id || row.sourceGenerationId !== source.storageGeneration) changed();
      const observed = fieldMigrationObservationSchema.parse(row.observation);
      if (observed.recordId !== row.recordId || observed.nativeRevision !== row.nativeRevision) changed();
      await registry.authoriseRecord(prepared.context, source.entity, { recordId: row.recordId, intent: "read" });
      const writtenId = observed.extension?.slot?.value?.versionId;
      if (writtenId) {
        const writtenVersion = await tx.studioDefinitionVersion.findFirst({ where: { id: writtenId, definitionId: request.definitionId, organisationId: fresh.organisationId } });
        if (!writtenVersion) changed();
        const written = closed(writtenVersion.payload);
        inspectSealedFieldVersion(registry, writtenVersion, fresh.organisationId, request.definitionId);
        assertFieldMigrationPolicies(fresh, company, currentPayload, written);
        assertFieldMigrationPolicies(fresh, company, source, written);
        await compileFieldMigrationMetadata(prepared.context, registry, company, request.definitionId, written);
      }
      rows.push({ label: `Record ${index + 1}`, result: observed.result.kind === "invalid" ? "invalid" : observed.result.lossy ? "loss" : "ready",
        issue: observed.result.kind === "invalid" ? observed.result.code : null });
    }
    return additionalFieldMigrationDetailSchema.parse({ definitionId: request.definitionId, preparationId: preparation.id,
      revision: preparation.revision, state: preparation.state, fieldLabel: target.field.label,
      currentAffectedCount: prepared.count, review, rows, countsScope: "sealed_review_or_unavailable",
      nextCursor: archive.length > request.limit ? archive[request.limit - 1].recordId : null, impact: impact(source, target) });
  });
}

/** Authorised metadata only. CAP.edit matches target saving; actual live-data
 * preview remains a separate CAP.publish/customer-or-support operation. Labels,
 * defaults and choice ordinals never grant data or migration authority. */
export async function readAdditionalFieldMigrationSetup(actor: Session, targetOrganisationId: string | undefined, input: unknown) {
  const request = additionalFieldMigrationSetupRequestSchema.parse(input);
  return withStudioAuthoringAuthority(actor, STUDIO_CAPABILITIES.edit, targetOrganisationId, async authority => {
    const { session, transaction: tx, registry } = authority;
    await lockBoundFieldEntityInTransaction(tx, session.organisationId, request.definitionId);
    await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
      WHERE d.id=${request.definitionId}::uuid AND d."organisationId"=${session.organisationId} FOR SHARE OF d,draft`;
    const definition = await tx.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: session.organisationId,
      kind: "customField", retiredAt: null }, include: { activeVersion: true, draft: true } });
    const version = definition?.activeVersion, draft = definition?.draft;
    if (!definition || !version || !draft || definition.activeVersionId !== version.id || version.definitionId !== definition.id
      || version.organisationId !== session.organisationId || draft.definitionId !== definition.id || draft.organisationId !== session.organisationId) changed();
    const source = closed(version.payload), target = closed(draft.payload);
    if (source.entity.id !== target.entity.id || source.field.key !== target.field.key) changed();
    inspectSealedFieldVersion(registry, version, session.organisationId, definition.id);
    for (const payload of [source, target]) {
      assertFieldAccess(session, payload.field, "write");
      const owner = await registry.resolve(session, payload.entity), record = entityDetailsSchema.parse(owner.details).record;
      if (!record?.fieldPolicy) changed();
      assertCapability(session, record.writeCapability);
      await authoriseFieldMigrationReference({ session, transaction: tx }, registry, payload, payload.field.defaultValue ?? null);
    }
    const compiledSource = await compileCustomField(session, source, registry), compiledTarget = await compileCustomField(session, target, registry);
    if (compiledSource.checksum !== version.checksum || checksum(compiledTarget.payload) !== checksum(target)) changed();
    await assertFieldBinding(tx, session, definition.id, source);
    const sourceOwner = await registry.resolve(session, source.entity), targetOwner = await registry.resolve(session, target.entity);
    const sourcePolicy = entityDetailsSchema.parse(sourceOwner.details).record!.fieldPolicy!, targetPolicy = entityDetailsSchema.parse(targetOwner.details).record!.fieldPolicy!;
    const sourceChoices = source.field.storage.type === "enum" || source.field.storage.type === "multi_enum" ? source.field.storage.options : [];
    const targetChoices = target.field.storage.type === "enum" || target.field.storage.type === "multi_enum" ? target.field.storage.options : [];
    return additionalFieldMigrationSetupSchema.parse({ definitionId: definition.id, definitionRevision: definition.revision,
      draftRevision: draft.revision, sourceVersionId: version.id,
      source: projectAdditionalFieldSetup(source, sourcePolicy.referenceEntities.map(id => ({ id }))),
      target: projectAdditionalFieldSetup(target, targetPolicy.referenceEntities.map(id => ({ id }))),
      sourceChoiceLabels: sourceChoices.map(choice => choice.label),
      targetChoiceSourceIndexes: targetChoices.map(choice => { const index = sourceChoices.findIndex(previous => previous.id === choice.id); return index < 0 ? null : index; }),
    });
  });
}
