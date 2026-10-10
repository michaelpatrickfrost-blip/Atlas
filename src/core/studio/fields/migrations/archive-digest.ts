import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldMigrationIntent } from "./contracts";
import { FieldMigrationReviewError } from "./contracts";

const count = z.string().regex(/^(?:0|[1-9][0-9]*)$/).transform(Number).refine(Number.isSafeInteger);
const resultSchema = z.strictObject({ recordCount: count, validCount: count, invalidCount: count, lossyCount: count,
  observationDigest: z.string().regex(/^[a-f0-9]{64}$/), duplicateTarget: z.boolean() });

/** Internal aggregate only, after refreshed authority and exact source/owner/
 * written-schema coverage. Mirrored immutable columns reconstruct the existing
 * closed v1 canonical JSON key order; no business value is selected or copied.
 */
export async function digestFieldMigrationArchive(tx: Prisma.TransactionClient, intent: FieldMigrationIntent) {
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
      END || ',"nativeRevision":' || o."nativeRevision"::text || ',"recordId":' || to_json(o."recordId")::text || ',"result":' ||
      CASE WHEN o.observation->'result'->>'kind'='valid' THEN
        '{"isNull":' || (o.observation->'result'->>'isNull') || ',"kind":"valid","lossy":' || (o.observation->'result'->>'lossy') ||
          ',"targetFingerprint":' || (o.observation->'result'->'targetFingerprint')::text || '}'
      ELSE '{"code":' || (o.observation->'result'->'code')::text || ',"kind":"invalid"}' END || '}' AS frame
    FROM studio_field_migration_observations o WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=${intent.organisationId}
      AND o."definitionId"=${intent.definitionId}::uuid AND o."entityId"=${intent.source.payload.entity.id} AND o."sourceGenerationId"=${intent.source.payload.storageGeneration}::uuid
  ) SELECT count(*)::text AS "recordCount", count(*) FILTER (WHERE result->>'kind'='valid')::text AS "validCount",
    count(*) FILTER (WHERE result->>'kind'='invalid')::text AS "invalidCount", count(*) FILTER (WHERE result->>'kind'='valid' AND result->>'lossy'='true')::text AS "lossyCount",
    encode(sha256(convert_to(${"atlas.studio.field-observations@1\n"} || coalesce(string_agg(frame, chr(10) ORDER BY "recordId" COLLATE "C") || chr(10), ''), 'UTF8')), 'hex') AS "observationDigest",
    EXISTS (SELECT 1 FROM canonical WHERE result->>'kind'='valid' AND result->>'isNull'='false' GROUP BY result->>'targetFingerprint' HAVING count(*)>1) AS "duplicateTarget"
    FROM canonical`;
  const parsed = resultSchema.safeParse(rows[0]);
  if (rows.length !== 1 || !parsed.success || parsed.data.validCount + parsed.data.invalidCount !== parsed.data.recordCount || parsed.data.lossyCount > parsed.data.validCount)
    throw new FieldMigrationReviewError("OBSERVATION_INVALID");
  const { recordCount, observationDigest, validCount, invalidCount, lossyCount, duplicateTarget } = parsed.data;
  return { recordCount, observationDigest, summary: { validCount, invalidCount, lossyCount }, duplicateTarget };
}
