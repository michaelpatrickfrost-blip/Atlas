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
import { entityDetailsSchema, recordAnchorSchema, supportsFieldMigrationIntent, supportsFieldMigrationQueryIntent } from "../registry/entities";
import { customFieldPayloadSchema, type FieldValue } from "../fields/schema";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { assertFieldBinding } from "../fields/binding";
import { lockBoundFieldEntityInTransaction } from "../fields/entity-lock";
import { analyseFieldEvolution, analyseRequiredFieldEvolution, fieldConversionSchema, type FieldConversion } from "../fields/evolution";
import { compileFieldMigrationMetadata } from "../fields/migrations/metadata";
import { assertFieldAccess } from "../fields/validation";
import { versionedFieldPayloadSchema, type VersionedFieldPayload } from "../fields/required-contract";
import { sealRequiredFieldMigrationIntent, requiredFieldMigrationIntentFromReview, requiredFieldMigrationObservationSchema, type RequiredFieldMigrationIntent } from "../fields/migrations/required-contracts";
import { createRequiredMetadataProvider } from "../fields/required-source";
import { compileConditionalCustomField } from "../fields/conditional-compiler";
import { compileCustomField } from "../compiler/fields";
import { projectAdditionalFieldSetup } from "./field-setup-projection";
import { assertFieldMigrationPolicies, assertVersionedFieldMigrationPolicies, authoriseFieldMigrationReference } from "../fields/migrations/access";
import { sealFieldMigrationIntent, fieldMigrationIntentFromReview, fieldMigrationObservationSchema, FieldMigrationReviewError,
  type FieldMigrationIntent } from "../fields/migrations/contracts";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "../fields/migrations/stored-protocol";
import { inspectFieldMigrationRecord, inspectRequiredFieldMigrationRecord } from "../fields/migrations/observation";
import { readObservedMigrationSource } from "../fields/migrations/observation-source";
import type { FriendlyFieldConversion } from "./field-evolution-contract";
import { additionalFieldMigrationPreviewRequestSchema, additionalFieldMigrationPreviewSchema,
  additionalFieldMigrationDetailRequestSchema, additionalFieldMigrationDetailSchema,
  additionalFieldMigrationSetupRequestSchema, additionalFieldMigrationSetupSchema } from "./field-migration-contract";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
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
function conversion(rule: FriendlyFieldConversion, target: VersionedFieldPayload): FieldConversion {
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
function display(payload: VersionedFieldPayload, value: FieldValue | null) {
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
function impact(source: VersionedFieldPayload, target: VersionedFieldPayload) {
  const analysis = source.schemaVersion === 1 && target.schemaVersion === 1 ? analyseFieldEvolution(source, target) : analyseRequiredFieldEvolution(source, target);
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
export async function preflightAdditionalFieldMigration(authority: FieldMigrationAuthority, registry: CapabilityRegistry, intent: FieldMigrationIntent | RequiredFieldMigrationIntent, mode: "current" | "history" = "current") {
  const { session, transaction: tx, company } = authority, context = { session, transaction: tx };
  const policies = intent.schemaVersion === 1 ? assertFieldMigrationPolicies : assertVersionedFieldMigrationPolicies;
  policies(session, company, intent.source.payload); policies(session, company, intent.target.payload);
  const source = await registry.resolve(session, intent.source.payload.entity), target = await registry.resolve(session, intent.target.payload.entity);
  const sr = entityDetailsSchema.parse(source.details).record, tr = entityDetailsSchema.parse(target.details).record;
  const policy = tr?.migrationSnapshot;
  if (!sr?.fieldPolicy || !tr?.fieldPolicy || !policy || !supportsFieldMigrationIntent(policy, intent.schemaVersion)
    || !policy.sourceVersions.includes(source.version) || source.id !== target.id || policy.query.id !== intent.ownerQuery.id
    || policy.query.version !== intent.ownerQuery.version) changed();
  assertCapability(session, sr.writeCapability); assertCapability(session, tr.writeCapability);
  const query = await registry.resolve(session, intent.ownerQuery);
  if (query.kind !== "query" || query.ownerModuleId !== target.ownerModuleId || query.details.transaction !== "required") changed();
  if (intent.schemaVersion === 2 && (query.capability !== tr.writeCapability || !supportsFieldMigrationQueryIntent(query, target.id, "snapshot", 2))) changed();
  // Fresh conditional graphs are compiled before counts. Historical input graphs
  // stay sealed; only current owning/base/reference rights remain prerequisites.
  const compile = (payload: VersionedFieldPayload) => mode === "history" && payload.schemaVersion === 2
    ? compileCustomField(session, customFieldPayloadSchema.parse({ schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }), registry)
    : compileFieldMigrationMetadata(context, registry, company, intent.definitionId, payload);
  const compiled = intent.schemaVersion === 2 ? [await compile(intent.source.payload), await compile(intent.target.payload)] : [];
  // Retained schema1 dependencies contain only the owning/reference entities.
  const modules = new Set([source.ownerModuleId, target.ownerModuleId, query.ownerModuleId, ...compiled.flatMap(plan => plan.plan.dependencies.map(ref => ref.ownerModuleId))]);
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

/** Current rights for every immutable typed-version lineage contributing to
 * retained review totals. Complete native/private preflight is the caller's
 * prerequisite; this reads metadata IDs only, never typed columns/default values. */
export async function authoriseAdditionalFieldMigrationWrittenMetadata(authority: FieldMigrationAuthority, registry: CapabilityRegistry, intent: FieldMigrationIntent | RequiredFieldMigrationIntent, current: VersionedFieldPayload) {
  const { session, transaction: tx, company } = authority, context = { session, transaction: tx };
  const ids = await tx.$queryRaw<Array<{ versionId: string }>>`SELECT DISTINCT v."versionId" FROM studio_field_values v
    WHERE v."organisationId"=${session.organisationId} AND v."definitionId"=${intent.definitionId}::uuid AND (
      EXISTS (SELECT 1 FROM studio_field_migration_observations o WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=v."organisationId" AND o."valueId"=v.id)
      OR EXISTS (SELECT 1 FROM studio_field_migration_outcomes outcome WHERE outcome."preparationId"=${intent.id}::uuid AND outcome."organisationId"=v."organisationId" AND outcome."targetValueId"=v.id))`;
  if (new Set(ids.map(row => row.versionId)).size !== ids.length) changed();
  const versions = await tx.studioDefinitionVersion.findMany({ where: { id: { in: ids.map(row => row.versionId) }, organisationId: session.organisationId, definitionId: intent.definitionId } });
  if (versions.length !== ids.length || new Set(versions.map(version => version.id)).size !== versions.length) changed();
  for (const version of versions) {
    if (!ids.some(row => row.versionId === version.id)) changed();
    const written = versionedFieldPayloadSchema.parse(version.payload);
    inspectSealedFieldVersion(registry, version, session.organisationId, intent.definitionId);
    if (written.entity.id !== intent.source.payload.entity.id || written.field.key !== intent.source.payload.field.key
      || ![intent.source.payload.storageGeneration, intent.target.payload.storageGeneration].includes(written.storageGeneration)) changed();
    const policies = intent.schemaVersion === 1 ? assertFieldMigrationPolicies : assertVersionedFieldMigrationPolicies;
    policies(session, company, current, written);
    const compiled = intent.schemaVersion === 2 && written.schemaVersion === 2
      ? await compileCustomField(session, customFieldPayloadSchema.parse({ schemaVersion: 1, entity: written.entity, storageGeneration: written.storageGeneration, field: written.field }), registry)
      : await compileFieldMigrationMetadata(context, registry, company, intent.definitionId, written);
    if (intent.schemaVersion === 1 && compiled.checksum !== version.checksum) changed();
    const owner = await registry.resolve(session, written.entity), record = entityDetailsSchema.parse(owner.details).record;
    if (!record?.fieldPolicy) changed(); assertCapability(session, record.writeCapability);
    for (const moduleId of [...new Set(compiled.plan.dependencies.map(ref => ref.ownerModuleId))].sort()) {
      await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
      if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
        throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
    }
  }
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
    const source = versionedFieldPayloadSchema.parse(version.payload), target = versionedFieldPayloadSchema.parse(draft.payload);
    inspectSealedFieldVersion(registry, version, fresh.organisationId, definition.id);
    const context: Context = { session: fresh, transaction: tx };
    const compiledSource = await compileFieldMigrationMetadata(context, registry, company, definition.id, source);
    const compiledTarget = await compileFieldMigrationMetadata(context, registry, company, definition.id, target);
    if (compiledSource.checksum !== version.checksum || checksum(target) !== checksum(compiledTarget.payload)) changed();
    await assertFieldBinding(tx, fresh, definition.id, source);
    const targetMetadata = await registry.resolve(fresh, target.entity), policy = entityDetailsSchema.parse(targetMetadata.details).record?.migrationSnapshot;
    if (!policy) throw new Error("This field owner has not approved reviewed conversions.");
    const query = registry.describe(policy.query.id, policy.query.version);
    const protocol = source.schemaVersion === 1 && target.schemaVersion === 1 ? 1 : 2;
    const sealed = (protocol === 1 ? sealFieldMigrationIntent : sealRequiredFieldMigrationIntent)({ schemaVersion: protocol, id: randomUUID(), organisationId: fresh.organisationId,
      definitionId: definition.id, definitionRevision: definition.revision, principal: authority.principal,
      source: { versionId: version.id, versionChecksum: version.checksum, payload: source },
      target: { draftId: draft.id, draftRevision: draft.revision, compiledChecksum: compiledTarget.checksum, payload: target },
      conversion: conversion(request.conversion, target), ownerQuery: { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash } });
    const prepared = await preflightAdditionalFieldMigration(authority, registry, sealed.intent);
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
      const result = sealed.intent.schemaVersion === 1 ? await inspectFieldMigrationRecord(context, registry, company, sealed.intent, anchor)
        : await inspectRequiredFieldMigrationRecord(context, sealed.intent, anchor);
      const before = await readObservedMigrationSource(context, registry, company, definition.id, source, anchor, protocol);
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
    const currentPayload = versionedFieldPayloadSchema.parse(currentVersion.payload);
    inspectSealedFieldVersion(registry, currentVersion, fresh.organisationId, request.definitionId);
    const policies = intent.schemaVersion === 1 ? assertFieldMigrationPolicies : assertVersionedFieldMigrationPolicies;
    policies(fresh, company, currentPayload, source); policies(fresh, company, currentPayload, target);
    const publication = intent.schemaVersion === 2 ? await tx.studioFieldMigrationPublication.findFirst({ where: {
      preparationId: intent.id, definitionId: request.definitionId, organisationId: fresh.organisationId } }) : null;
    if (publication && (publication.preparationId !== intent.id || publication.definitionId !== request.definitionId
      || publication.organisationId !== fresh.organisationId)) changed();
    const historical = intent.schemaVersion === 2 && publication !== null && publication.state !== "PUBLISHED";
    const base = (payload: VersionedFieldPayload) => customFieldPayloadSchema.parse({ schemaVersion: 1, entity: payload.entity,
      storageGeneration: payload.storageGeneration, field: payload.field });
    const compile = (payload: VersionedFieldPayload) => historical
      ? compileCustomField(fresh, base(payload), registry)
      : compileFieldMigrationMetadata({ session: fresh, transaction: tx }, registry, company, request.definitionId, payload);
    const compiledCurrent = await compile(currentPayload), compiledSource = await compile(source), compiledTarget = await compile(target);
    if (!historical && (compiledCurrent.checksum !== currentVersion.checksum || compiledSource.checksum !== intent.source.versionChecksum
      || compiledTarget.checksum !== intent.target.compiledChecksum)) changed();
    if (historical) {
      const targetVersion = await tx.studioDefinitionVersion.findFirst({ where: { id: publication!.targetVersionId,
        definitionId: request.definitionId, organisationId: fresh.organisationId } });
      if (!targetVersion || targetVersion.id !== publication!.targetVersionId || targetVersion.checksum !== intent.target.compiledChecksum
        || checksum(targetVersion.payload) !== checksum(target)) changed();
      inspectSealedFieldVersion(registry, targetVersion, fresh.organisationId, request.definitionId);
    }
    const prepared = await preflightAdditionalFieldMigration(authority, registry, intent, historical ? "history" : "current");
    await authoriseAdditionalFieldMigrationWrittenMetadata(authority, registry, intent, currentPayload);
    let review = null;
    if (preparation.review) {
      const sealed = readStoredFieldMigrationReview(preparation.review, fresh.organisationId);
      if (sealed.review.schemaVersion !== intent.schemaVersion || checksum(sealed.review.schemaVersion === 1 ? fieldMigrationIntentFromReview(sealed.review) : requiredFieldMigrationIntentFromReview(sealed.review)) !== stored.checksum) changed();
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
      const observed = intent.schemaVersion === 1 ? fieldMigrationObservationSchema.parse(row.observation) : requiredFieldMigrationObservationSchema.parse(row.observation);
      if (observed.recordId !== row.recordId || observed.nativeRevision !== row.nativeRevision) changed();
      await registry.authoriseRecord(prepared.context, source.entity, { recordId: row.recordId, intent: "read" });
      const writtenId = observed.extension?.slot?.value?.versionId;
      if (writtenId) {
        const writtenVersion = await tx.studioDefinitionVersion.findFirst({ where: { id: writtenId, definitionId: request.definitionId, organisationId: fresh.organisationId } });
        if (!writtenVersion) changed();
        const written = versionedFieldPayloadSchema.parse(writtenVersion.payload);
        inspectSealedFieldVersion(registry, writtenVersion, fresh.organisationId, request.definitionId);
        policies(fresh, company, currentPayload, written); policies(fresh, company, source, written);
        if (historical) await compileCustomField(fresh, base(written), registry);
        else await compileFieldMigrationMetadata(prepared.context, registry, company, request.definitionId, written);
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
    const source = versionedFieldPayloadSchema.parse(version.payload), target = versionedFieldPayloadSchema.parse(draft.payload);
    if (source.entity.id !== target.entity.id || source.field.key !== target.field.key) changed();
    inspectSealedFieldVersion(registry, version, session.organisationId, definition.id);
    for (const payload of [source, target]) {
      assertFieldAccess(session, payload.field, "write");
      const owner = await registry.resolve(session, payload.entity), record = entityDetailsSchema.parse(owner.details).record;
      if (!record?.fieldPolicy) changed();
      assertCapability(session, record.writeCapability);
      await authoriseFieldMigrationReference({ session, transaction: tx }, registry, payload, payload.field.defaultValue ?? null);
    }
    const compile = async (payload: VersionedFieldPayload) => {
      if (payload.schemaVersion === 1) return compileCustomField(session, payload, registry);
      const provider = await createRequiredMetadataProvider(session, tx, definition.id, payload.entity);
      return compileConditionalCustomField({ session: provider.authority.session, registry: provider.authority.registry,
        definitionId: definition.id, resolveMetadata: provider.resolveMetadata }, payload);
    };
    const compiledSource = await compile(source), compiledTarget = await compile(target);
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
