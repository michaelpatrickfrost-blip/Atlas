import type { Prisma } from "@/generated/prisma/client";
import type { RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { checksum } from "../../registry/contracts";
import { compileCustomField } from "../../compiler/fields";
import { entityDetailsSchema } from "../../registry/entities";
import { customFieldPayloadSchema } from "../schema";
import { assertFieldMigrationPolicies } from "./access";
import { sealFieldMigrationIntent, FieldMigrationReviewError, type FieldMigrationIntent } from "./contracts";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Internal coverage prerequisite. Caller supplies a refreshed/locked authority
 * transaction. No value decoding, counts, reference approval or sealed review.
 */
export async function validateFieldMigrationSourceCoverage(context: RecordContext & { transaction: Prisma.TransactionClient }, registry: CapabilityRegistry,
  company: Parameters<typeof assertFieldMigrationPolicies>[1], serverIntent: FieldMigrationIntent): Promise<void> {
  const sealed = sealFieldMigrationIntent(serverIntent), intent = sealed.intent, session = context.session, tx = context.transaction;
  if (!tx || intent.organisationId !== session.organisationId || intent.principal.userId !== session.userId || intent.principal.membershipId !== session.membershipId) changed();
  assertFieldMigrationPolicies(session, company, intent.source.payload); assertFieldMigrationPolicies(session, company, intent.target.payload);
  const current = await compileCustomField(session, intent.source.payload, registry), target = await compileCustomField(session, intent.target.payload, registry);
  if (current.checksum !== intent.source.versionChecksum || target.checksum !== intent.target.compiledChecksum) changed();
  const owner = await registry.resolve(session, intent.target.payload.entity), policy = entityDetailsSchema.parse(owner.details).record?.migrationSnapshot;
  const query = await registry.resolve(session, intent.ownerQuery);
  if (!policy || !policy.sourceVersions.includes(intent.source.payload.entity.version) || policy.query.id !== intent.ownerQuery.id || policy.query.version !== intent.ownerQuery.version
    || query.kind !== "query" || query.details.transaction !== "required" || query.ownerModuleId !== owner.ownerModuleId) changed();
  await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const fresh = await tx.$queryRaw<Array<{ fresh: boolean }>>`SELECT atlas_studio_migration_fresh(p) AS fresh
    FROM studio_field_migration_preparations p WHERE p.id=${intent.id}::uuid AND p."organisationId"=${session.organisationId}
      AND p."intentChecksum"=${sealed.checksum} AND p.state IN ('PREPARING','REVIEWED')`;
  if (fresh.length !== 1 || fresh[0].fresh !== true) changed();
  // Owner rejects incomplete native/private access before any archive count/IDs.
  await registry.invokeQueryInTransaction(context, intent.ownerQuery, { mode: "coverage", preparationId: intent.id });
  await tx.$queryRaw`SELECT count(*)::text FROM (SELECT e.id FROM studio_extension_records e WHERE e."organisationId"=${session.organisationId} AND e."entityId"=${intent.source.payload.entity.id}
    AND EXISTS (SELECT 1 FROM studio_field_migration_observations o WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=e."organisationId" AND o."recordId"=e."recordId") FOR SHARE OF e) locked`;
  await tx.$queryRaw`SELECT count(*)::text FROM (SELECT s.id FROM studio_field_slots s WHERE s."organisationId"=${session.organisationId} AND s."definitionId"=${intent.definitionId}::uuid
    AND s."generationId"=${intent.source.payload.storageGeneration}::uuid
    AND EXISTS (SELECT 1 FROM studio_field_migration_observations o WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=s."organisationId" AND o."extensionId"=s."extensionId") FOR SHARE OF s) locked`;
  const source = await tx.$queryRaw<Array<{ changed: boolean }>>`SELECT EXISTS (
    SELECT 1 FROM studio_field_migration_observations o
    LEFT JOIN studio_extension_records e ON e."organisationId"=o."organisationId" AND e."entityId"=o."entityId" AND e."recordId"=o."recordId"
    LEFT JOIN studio_field_slots s ON s."organisationId"=o."organisationId" AND s."extensionId"=e.id AND s."definitionId"=o."definitionId" AND s."generationId"=o."sourceGenerationId"
    LEFT JOIN studio_field_values v ON v.id=s."activeValueId" AND v."organisationId"=o."organisationId" AND v."slotId"=s.id
    WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=${session.organisationId} AND (
      e.id IS DISTINCT FROM o."extensionId" OR e.revision IS DISTINCT FROM o."extensionRevision"
      OR s.id IS DISTINCT FROM o."slotId" OR s.revision IS DISTINCT FROM o."slotRevision" OR s."activeValueId" IS DISTINCT FROM o."valueId"
      OR (o."valueId" IS NOT NULL AND (v.id IS NULL OR v.revision IS DISTINCT FROM s.revision
        OR v."definitionId" IS DISTINCT FROM o."definitionId" OR v."generationId" IS DISTINCT FROM o."sourceGenerationId"
        OR v."versionId"::text IS DISTINCT FROM o.observation->'extension'->'slot'->'value'->>'versionId'
        OR v.fingerprint IS DISTINCT FROM o.observation->'extension'->'slot'->'value'->>'fingerprint'))
    )) AS changed`;
  if (source.length !== 1 || source[0].changed !== false) changed();
  // Immutable schema metadata only; never fetch business columns to establish
  // the written policy. Reference target checks remain the final sealer's duty.
  const versions = await tx.$queryRaw<Array<{ versionId: string }>>`SELECT DISTINCT v."versionId" FROM studio_field_values v
    JOIN studio_field_migration_observations o ON o."valueId"=v.id AND o."organisationId"=v."organisationId"
    WHERE o."preparationId"=${intent.id}::uuid AND v."organisationId"=${session.organisationId}
      AND v."definitionId"=${intent.definitionId}::uuid AND v."generationId"=${intent.source.payload.storageGeneration}::uuid`;
  const schemas = await tx.studioDefinitionVersion.findMany({ where: { id: { in: versions.map(row => row.versionId) }, organisationId: session.organisationId, definitionId: intent.definitionId },
    select: { id: true, payload: true, checksum: true, compiledPlan: true } });
  if (schemas.length !== versions.length) changed();
  for (const row of schemas) {
    const written = customFieldPayloadSchema.parse(row.payload);
    if (written.storageGeneration !== intent.source.payload.storageGeneration) changed();
    assertFieldMigrationPolicies(session, company, intent.source.payload, written);
    const compiled = await compileCustomField(session, written, registry);
    if (compiled.checksum !== row.checksum || checksum(row.compiledPlan) !== row.checksum) changed();
  }
}
