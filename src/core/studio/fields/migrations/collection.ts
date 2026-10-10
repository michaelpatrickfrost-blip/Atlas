import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { studioRegistry } from "../../registry/runtime";
import { entityDetailsSchema, recordAnchorSchema } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { assertFieldBinding } from "../binding";
import { sealFieldMigrationIntent, FieldMigrationReviewError } from "./contracts";
import { assertFieldMigrationPolicies } from "./access";
import { withFieldMigrationAuthority } from "./authority";
import { observeFieldMigrationRecord } from "./observation";

const requestSchema = z.strictObject({ preparationId: z.uuid(), revision: z.number().int().nonnegative().max(2147483646),
  limit: z.number().int().min(1).max(50).default(25) });
const pageSchema = z.strictObject({ mode: z.literal("snapshot"), organisationId: z.string(), entityId: z.string(),
  records: z.array(recordAnchorSchema).max(50), next: z.string().nullable() });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Internal bounded append, not a public preview or execution endpoint. The
 * database owns both authority and cursor; an exhausted page is not a review.
 */
export async function collectFieldMigrationBatch(session: Session, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = requestSchema.parse(input);
  // Identity metadata only. Actual native access is refreshed under locks below.
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, organisationId: session.organisationId } });
  if (!initial) changed();
  const sealed = sealFieldMigrationIntent(initial.intent);
  if (sealed.checksum !== initial.intentChecksum || sealed.intent.id !== initial.id || sealed.intent.organisationId !== session.organisationId) changed();
  return withFieldMigrationAuthority(session, sealed.intent.principal, async ({ session: fresh, transaction: tx, company }) => {
    const scope = { id: request.preparationId, organisationId: fresh.organisationId };
    await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${request.preparationId}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: scope, include: { review: { select: { id: true } } } });
    if (!preparation || preparation.state !== "PREPARING" || preparation.review || preparation.revision > 2147483646
      || preparation.intentChecksum !== sealed.checksum || sealFieldMigrationIntent(preparation.intent).checksum !== sealed.checksum) changed();
    const intent = sealed.intent;
    const freshness = await tx.$queryRaw<Array<{ fresh: boolean }>>`SELECT atlas_studio_migration_fresh(p) AS fresh
      FROM studio_field_migration_preparations p WHERE p.id=${preparation.id}::uuid AND p."organisationId"=${fresh.organisationId}`;
    if (freshness.length !== 1 || freshness[0].fresh !== true) changed();
    assertFieldMigrationPolicies(fresh, company, intent.source.payload);
    assertFieldMigrationPolicies(fresh, company, intent.target.payload);
    const registry = studioRegistry(), compiledSource = await compileCustomField(fresh, intent.source.payload, registry),
      compiledTarget = await compileCustomField(fresh, intent.target.payload, registry);
    if (compiledSource.checksum !== intent.source.versionChecksum || compiledTarget.checksum !== intent.target.compiledChecksum) changed();
    await assertFieldBinding(tx, fresh, intent.definitionId, intent.source.payload);
    const owner = await registry.resolve(fresh, intent.target.payload.entity), record = entityDetailsSchema.parse(owner.details).record,
      policy = record?.migrationSnapshot;
    if (!record || !policy || !policy.sourceVersions.includes(intent.source.payload.entity.version)
      || policy.query.id !== intent.ownerQuery.id || policy.query.version !== intent.ownerQuery.version) changed();
    assertCapability(fresh, record.writeCapability);
    const query = await registry.resolve(fresh, intent.ownerQuery);
    if (query.kind !== "query" || query.ownerModuleId !== owner.ownerModuleId || query.details.transaction !== "required") changed();
    for (const id of [...new Set([...compiledSource.plan.dependencies, ...compiledTarget.plan.dependencies].map(ref => ref.ownerModuleId))].sort()) {
      await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${fresh.organisationId} AND "moduleId"=${id} FOR SHARE`;
      if (!await tx.moduleState.findFirst({ where: { organisationId: fresh.organisationId, moduleId: id, enabled: true, entitled: true }, select: { id: true } }))
        throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
    }
    const context = { session: fresh, transaction: tx };
    await registry.invokeQueryInTransaction(context, intent.ownerQuery, { mode: "preflight" });
    if (request.revision > preparation.revision) changed();
    // A lost-response retry must not collect the next page accidentally. Caller
    // explicitly continues with the returned revision after this no-write replay.
    if (request.revision < preparation.revision)
      return { id: preparation.id, revision: preparation.revision, state: "PREPARING" as const, replayed: true as const, appended: 0, cursorExhausted: null };
    const last = await tx.studioFieldMigrationObservation.findFirst({ where: { preparationId: preparation.id, organisationId: fresh.organisationId },
      orderBy: { recordId: "desc" }, select: { recordId: true } });
    const page = pageSchema.parse(await registry.invokeQueryInTransaction(context, intent.ownerQuery,
      { mode: "snapshot", ...(last ? { cursor: last.recordId } : {}), limit: request.limit }));
    if (page.organisationId !== fresh.organisationId || page.entityId !== intent.source.payload.entity.id || page.records.length > request.limit
      || (page.next !== null && (page.records.length !== request.limit || page.next !== page.records.at(-1)?.recordId))) changed();
    let cursor = last?.recordId;
    for (const anchor of page.records) {
      if (anchor.organisationId !== fresh.organisationId || (cursor && anchor.recordId <= cursor)) changed();
      const observation = await observeFieldMigrationRecord(context, registry, company, intent, anchor);
      const extension = observation.extension, slot = extension?.slot;
      await tx.studioFieldMigrationObservation.create({ data: { preparationId: preparation.id, organisationId: fresh.organisationId,
        definitionId: intent.definitionId, entityId: intent.source.payload.entity.id, sourceGenerationId: intent.source.payload.storageGeneration,
        recordId: observation.recordId, nativeRevision: observation.nativeRevision, extensionId: extension?.id ?? null, extensionRevision: extension?.revision ?? null,
        slotId: slot?.id ?? null, slotRevision: slot?.revision ?? null, valueId: slot?.value?.id ?? null, observation } });
      cursor = anchor.recordId;
    }
    const revision = preparation.revision + 1;
    if ((await tx.studioFieldMigrationPreparation.updateMany({ where: { ...scope, revision: preparation.revision, state: "PREPARING" }, data: { revision } })).count !== 1) changed();
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.collection_batched",
      entityType: "StudioFieldMigrationPreparation", entityId: preparation.id,
      after: { fromRevision: preparation.revision, revision, appended: page.records.length } }, tx);
    return { id: preparation.id, revision, state: "PREPARING" as const, replayed: false as const, appended: page.records.length, cursorExhausted: page.next === null };
  });
}
