import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldMigrationIntent } from "./contracts";
import { FieldMigrationReviewError } from "./contracts";
import { sealRequiredFieldMigrationIntent, type RequiredFieldMigrationIntent } from "./required-contracts";

const count = z.string().regex(/^(?:0|[1-9][0-9]*)$/).transform(Number).refine(Number.isSafeInteger);
const resultSchema = z.strictObject({ recordCount: count, validCount: count, invalidCount: count, lossyCount: count,
  observationDigest: z.string().regex(/^[a-f0-9]{64}$/), duplicateTarget: z.boolean() });

/** Internal aggregate only, after refreshed authority and exact source/owner/
 * written-schema coverage. Mirrored immutable columns reconstruct the existing
 * closed v1 canonical JSON key order; no business value is selected or copied.
 */
export async function digestFieldMigrationArchive(tx: Prisma.TransactionClient, intent: FieldMigrationIntent) {
  return digestArchive(tx, intent, 1);
}

/** Explicit internal format2 entry after owner/current coverage. Require the
 * actual parent intent/identity/hash before aggregating its immutable archive;
 * a caller's format argument alone cannot change the canonical digest frame. */
export async function digestRequiredFieldMigrationArchive(tx: Prisma.TransactionClient, input: RequiredFieldMigrationIntent) {
  const sealed = sealRequiredFieldMigrationIntent(input), intent = sealed.intent;
  const parents = await tx.$queryRaw<Array<{ format: number }>>`SELECT (p.intent->>'schemaVersion')::integer AS format
    FROM studio_field_migration_preparations p WHERE p.id=${intent.id}::uuid AND p."organisationId"=${intent.organisationId}
      AND p."definitionId"=${intent.definitionId}::uuid AND p."entityId"=${intent.source.payload.entity.id}
      AND p."sourceGenerationId"=${intent.source.payload.storageGeneration}::uuid AND p."intentChecksum"=${sealed.checksum}
      AND p.intent=${JSON.stringify(intent)}::jsonb`;
  if (parents.length !== 1 || parents[0].format !== 2) throw new FieldMigrationReviewError("OBSERVATION_INVALID");
  return digestArchive(tx, intent, 2);
}

async function digestArchive(tx: Prisma.TransactionClient, intent: FieldMigrationIntent | RequiredFieldMigrationIntent, protocol: 1 | 2) {
  const rows = await tx.$queryRaw<Array<Record<keyof z.input<typeof resultSchema>, unknown>>>`WITH canonical AS (
    SELECT o."recordId", o.observation->'result' AS result,
      '{"extension":' || CASE WHEN o."extensionId" IS NULL THEN 'null' ELSE
        '{"id":' || to_json(o."extensionId")::text || ',"revision":' || o."extensionRevision"::text || ',"slot":' ||
        CASE WHEN o."slotId" IS NULL THEN 'null' ELSE
          '{"id":' || to_json(o."slotId")::text || ',"revision":' || o."slotRevision"::text || ',"value":' ||
          CASE WHEN o."valueId" IS NULL THEN 'null' ELSE
            '{"fingerprint":' || (o.observation->'extension'->'slot'->'value'->'fingerprint')::text || ',"id":' || to_json(o."valueId")::text ||
            ',"revision":' || o."slotRevision"::text || ',"versionId":' || (o.observation->'extension'->'slot'->'value'->'versionId')::text || '}'
          END || '}'
        END || '}'
      END || ',"nativeRevision":' || o."nativeRevision"::text || ',"recordId":' || to_json(o."recordId")::text ||
      CASE WHEN ${protocol}=2 THEN ',"requirement":{"sourceEvaluationChecksum":' || (o.observation->'requirement'->'sourceEvaluationChecksum')::text ||
        ',"targetEvaluationChecksum":' || (o.observation->'requirement'->'targetEvaluationChecksum')::text ||
        ',"targetRequired":' || (o.observation->'requirement'->'targetRequired')::text || '}' ELSE '' END || ',"result":' ||
      CASE WHEN o.observation->'result'->>'kind'='valid' THEN
        '{"isNull":' || (o.observation->'result'->>'isNull') || ',"kind":"valid","lossy":' || (o.observation->'result'->>'lossy') ||
          ',"targetFingerprint":' || (o.observation->'result'->'targetFingerprint')::text || '}'
      ELSE '{"code":' || (o.observation->'result'->'code')::text || ',"kind":"invalid"}' END || '}' AS frame
    FROM studio_field_migration_observations o WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=${intent.organisationId}
      AND o."definitionId"=${intent.definitionId}::uuid AND o."entityId"=${intent.source.payload.entity.id} AND o."sourceGenerationId"=${intent.source.payload.storageGeneration}::uuid
  ) SELECT count(*)::text AS "recordCount", count(*) FILTER (WHERE result->>'kind'='valid')::text AS "validCount",
    count(*) FILTER (WHERE result->>'kind'='invalid')::text AS "invalidCount", count(*) FILTER (WHERE result->>'kind'='valid' AND result->>'lossy'='true')::text AS "lossyCount",
    encode(sha256(convert_to(${`atlas.studio.field-observations@${protocol}\n`} || coalesce(string_agg(frame, chr(10) ORDER BY "recordId" COLLATE "C") || chr(10), ''), 'UTF8')), 'hex') AS "observationDigest",
    EXISTS (SELECT 1 FROM canonical WHERE result->>'kind'='valid' AND result->>'isNull'='false' GROUP BY result->>'targetFingerprint' HAVING count(*)>1) AS "duplicateTarget"
    FROM canonical`;
  const parsed = resultSchema.safeParse(rows[0]);
  if (rows.length !== 1 || !parsed.success || parsed.data.validCount + parsed.data.invalidCount !== parsed.data.recordCount || parsed.data.lossyCount > parsed.data.validCount)
    throw new FieldMigrationReviewError("OBSERVATION_INVALID");
  const { recordCount, observationDigest, validCount, invalidCount, lossyCount, duplicateTarget } = parsed.data;
  return { recordCount, observationDigest, summary: { validCount, invalidCount, lossyCount }, duplicateTarget };
}
