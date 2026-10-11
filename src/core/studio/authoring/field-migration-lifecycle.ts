import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { resolveAdditionalFieldMigrationContext } from "./field-migration-preview";
import { prepareAdditionalFieldMigrationSchema, collectAdditionalFieldMigrationSchema, sealAdditionalFieldMigrationSchema,
  additionalFieldMigrationPreparedSchema, additionalFieldMigrationCollectedSchema, additionalFieldMigrationSealedSchema } from "./field-migration-lifecycle-contract";
import { withFieldMigrationAuthority, type FieldMigrationAuthority } from "../fields/migrations/authority";
import { startFieldMigrationPreparation } from "../fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../fields/migrations/sealing";
import { readStoredFieldMigrationIntent } from "../fields/migrations/stored-protocol";
import { FieldMigrationReviewError } from "../fields/migrations/contracts";
import { assertFieldMigrationPolicies, authoriseFieldMigrationReference } from "../fields/migrations/access";
import { compileFieldMigrationMetadata } from "../fields/migrations/metadata";
import { customFieldPayloadSchema, type CustomFieldPayload } from "../fields/schema";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { assertFieldBinding } from "../fields/binding";
import { lockBoundFieldEntityInTransaction } from "../fields/entity-lock";
import { entityDetailsSchema } from "../registry/entities";
import { checksum } from "../registry/contracts";
import { studioRegistry } from "../registry/runtime";
import { createFieldConverter, fieldConversionSchema, type FieldConversion } from "../fields/evolution";
import type { FriendlyFieldConversion } from "./field-evolution-contract";
import type { FieldMigrationPrincipal } from "../fields/principal-contract";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function unsupported(): never { throw new Error("Conditional field changes are not supported by this visual review yet. Their existing reviewed workflow remains required."); }
function field(input: unknown): CustomFieldPayload {
  const header = z.object({ schemaVersion: z.number() }).parse(input);
  if (header.schemaVersion !== 1) unsupported();
  return customFieldPayloadSchema.parse(input);
}
function resolveConversion(rule: FriendlyFieldConversion, target: CustomFieldPayload): FieldConversion {
  if (rule.kind !== "string_to_enum") return fieldConversionSchema.parse(rule);
  if (target.field.storage.type !== "enum") changed();
  const choices = target.field.storage.options;
  return fieldConversionSchema.parse({ ...rule, mapping: rule.mapping.map(({ from, toChoice }) => {
    const option = choices[toChoice];
    if (!option || option.retired) throw new Error("Choose an available target choice for each mapped text.");
    return { from, to: option.id };
  }) });
}
/** Current independent source/target/default/native/module metadata guards. No
 * business value/count/ID query and no principal or raw metadata returned to UI. */
async function authoriseMetadata(authority: FieldMigrationAuthority, definitionId: string, source: CustomFieldPayload, target: CustomFieldPayload) {
  const { session, transaction: tx, company } = authority, context = { session, transaction: tx }, registry = studioRegistry();
  assertFieldMigrationPolicies(session, company, source); assertFieldMigrationPolicies(session, company, target);
  if (source.entity.id !== target.entity.id || source.field.key !== target.field.key) changed();
  for (const payload of [source, target]) {
    const owner = await registry.resolve(session, payload.entity), record = entityDetailsSchema.parse(owner.details).record;
    if (!record?.fieldPolicy) changed();
    assertCapability(session, record.writeCapability);
    await authoriseFieldMigrationReference(context, registry, payload, payload.field.defaultValue ?? null);
  }
  const compiledSource = await compileFieldMigrationMetadata(context, registry, company, definitionId, source),
    compiledTarget = await compileFieldMigrationMetadata(context, registry, company, definitionId, target);
  return { registry, compiledSource, compiledTarget };
}
/** A refreshed support opening has its own Audit ID. An identical retry must
 * retain the ORIGINAL server-stored purpose Audit so the immutable intent stays
 * identical. Actual stamp/authority equality is mandatory, and the original
 * engine independently refreshes that old purpose Audit and TODAY's grants. */
function replayPrincipal(current: FieldMigrationPrincipal, retained: FieldMigrationPrincipal) {
  for (const key of ["authority", "organisationId", "userId", "membershipId", "authVersion", "sessionVersion"] as const)
    if (current[key] !== retained[key]) changed();
  return retained;
}

/** Every call is an explicit UI action. Metadata resolution ends before the
 * original engine opens its own transaction and repeats freshness/owner checks. */
export async function prepareAdditionalFieldMigration(actor: Session, targetOrganisationId: string | undefined, input: unknown) {
  const request = prepareAdditionalFieldMigrationSchema.parse(input);
  const context = await resolveAdditionalFieldMigrationContext(actor, targetOrganisationId);
  const resolved = await withFieldMigrationAuthority(context.session, context.principal, async authority => {
    const { session, transaction: tx } = authority;
    await lockBoundFieldEntityInTransaction(tx, session.organisationId, request.definitionId);
    await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
      WHERE d.id=${request.definitionId}::uuid AND d."organisationId"=${session.organisationId} FOR SHARE OF d,draft`;
    const definition = await tx.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: session.organisationId,
      kind: "customField", retiredAt: null, revision: request.definitionRevision }, include: { activeVersion: true, draft: true } });
    const version = definition?.activeVersion, draft = definition?.draft;
    if (!definition || !version || !draft || definition.activeVersionId !== request.sourceVersionId || version.id !== request.sourceVersionId
      || version.definitionId !== definition.id || version.organisationId !== session.organisationId || draft.definitionId !== definition.id
      || draft.organisationId !== session.organisationId || draft.revision !== request.draftRevision) changed();
    const source = field(version.payload), target = field(draft.payload);
    const compiled = await authoriseMetadata(authority, definition.id, source, target);
    inspectSealedFieldVersion(compiled.registry, version, session.organisationId, definition.id);
    if (compiled.compiledSource.checksum !== version.checksum || checksum(compiled.compiledTarget.payload) !== checksum(target)) changed();
    await assertFieldBinding(tx, session, definition.id, source);
    const conversion = resolveConversion(request.conversion, target);
    createFieldConverter(source, target, conversion);
    const existing = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: request.operationId, definitionId: definition.id, organisationId: session.organisationId } });
    let principal = authority.principal;
    if (existing) {
      const stored = readStoredFieldMigrationIntent(existing, session.organisationId);
      if (stored.intent.schemaVersion !== 1 || stored.intent.definitionId !== definition.id) changed();
      principal = replayPrincipal(authority.principal, stored.intent.principal);
    }
    return { principal, conversion };
  });
  // No draft.validation/preview persistence; the original engine seals the exact
  // conversion with its own actual source/draft and owns all writes/Audit/CAS.
  const result = await startFieldMigrationPreparation(context.session, resolved.principal, { operationId: request.operationId,
    definitionId: request.definitionId, definitionRevision: request.definitionRevision, draftRevision: request.draftRevision, conversion: resolved.conversion });
  return additionalFieldMigrationPreparedSchema.parse({ preparationId: result.id, revision: result.revision, state: result.state });
}

type PreparationRequest = { definitionId: string; preparationId: string; revision: number; expectedState: "PREPARING" | "REVIEWED" };
async function authorisePreparation(context: { session: Session; principal: FieldMigrationPrincipal }, request: PreparationRequest, mode: "collect" | "seal") {
  await withFieldMigrationAuthority(context.session, context.principal, async authority => {
    const { session, transaction: tx } = authority;
    await lockBoundFieldEntityInTransaction(tx, session.organisationId, request.definitionId);
    await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${request.preparationId}::uuid
      AND "definitionId"=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
    const row = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, definitionId: request.definitionId, organisationId: session.organisationId } });
    if (!row) changed();
    const sealed = readStoredFieldMigrationIntent(row, session.organisationId), intent = sealed.intent;
    if (intent.schemaVersion !== 1) unsupported();
    if (intent.definitionId !== request.definitionId || row.entityId !== intent.source.payload.entity.id || row.sourceVersionId !== intent.source.versionId
      || row.sourceGenerationId !== intent.source.payload.storageGeneration || row.targetGenerationId !== intent.target.payload.storageGeneration || row.draftId !== intent.target.draftId) changed();
    // Same original creator/current stamp, never borrow a different author's
    // grants. Fresh support Audit need not equal the original immutable one.
    replayPrincipal(authority.principal, intent.principal);
    await authoriseMetadata(authority, request.definitionId, intent.source.payload, intent.target.payload);
    if (mode === "collect" ? row.state !== "PREPARING" : !["PREPARING", "REVIEWED"].includes(row.state)) changed();
    if (request.expectedState === "REVIEWED" && row.state !== "REVIEWED") changed();
    // PREPARING→REVIEWED lost-response replay is legitimate. The original seal
    // service rechecks the complete retained review and exact source freshness.
    if (request.revision > row.revision) changed();
  });
}
export async function collectAdditionalFieldMigration(actor: Session, targetOrganisationId: string | undefined, input: unknown) {
  const request = collectAdditionalFieldMigrationSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, targetOrganisationId);
  await authorisePreparation(context, request, "collect");
  const result = await collectFieldMigrationBatch(context.session, { preparationId: request.preparationId, revision: request.revision, limit: request.limit });
  return additionalFieldMigrationCollectedSchema.parse({ preparationId: result.id, revision: result.revision, state: result.state,
    replayed: result.replayed, appended: result.appended, cursorExhausted: result.cursorExhausted });
}
export async function sealAdditionalFieldMigration(actor: Session, targetOrganisationId: string | undefined, input: unknown) {
  const request = sealAdditionalFieldMigrationSchema.parse(input), context = await resolveAdditionalFieldMigrationContext(actor, targetOrganisationId);
  await authorisePreparation(context, request, "seal");
  const result = await sealFieldMigrationPreparation(context.session, { preparationId: request.preparationId, revision: request.revision });
  return additionalFieldMigrationSealedSchema.parse({ preparationId: result.id, revision: result.revision, state: result.state,
    reviewChecksum: result.checksum, affectedCount: result.cohort.recordCount, valid: result.summary.validCount,
    invalid: result.summary.invalidCount, lossy: result.summary.lossyCount, indexImpact: result.indexImpact, rollbackLimit: result.rollbackLimit, replayed: result.replayed });
}
