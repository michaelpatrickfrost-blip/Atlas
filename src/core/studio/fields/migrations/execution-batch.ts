import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { checksum } from "../../registry/contracts";
import { sealFieldMigrationIntent, FieldMigrationReviewError, type FieldMigrationIntent } from "./contracts";
import { withFieldMigrationAuthority } from "./authority";
import { inspectFieldMigrationExecution } from "./execution-inspection";
import { writeFieldMigrationRepresentation } from "./representation";
import { fieldMigrationExecutionBatchSchema, fieldMigrationExecutionFailureSchema, fieldMigrationExecutionPinSchema, readFieldMigrationExecutionProgress } from "./execution-contract";
import type { z } from "zod";

type Failure = z.infer<typeof fieldMigrationExecutionFailureSchema>;
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function failureCode(error: unknown): Failure {
  if (error instanceof FieldMigrationReviewError) return "REVIEW_CHANGED";
  if (error instanceof Error && /^(FORBIDDEN|MIGRATION_ACCESS_REQUIRED|DEPENDENCY_BROKEN)/.test(error.message)) return "ACCESS_CHANGED";
  if (error instanceof Error && /^(FIELD_STORAGE_INVALID|MIGRATION_INVALID_VALUES|MIGRATION_UNIQUENESS_CONFLICT)/.test(error.message)) return "INTEGRITY_CHANGED";
  return "WRITE_FAILED";
}
export class FieldMigrationExecutionError extends Error {
  constructor(public readonly code: Failure, public readonly failureRecorded: boolean) {
    super("The field conversion batch did not commit. Refresh access and review the operation before retrying.");
    this.name = "FieldMigrationExecutionError";
  }
}

/** Sparse recovery only. Metadata permission never grants native data access;
 * no counts, cursor, native identifiers or values are returned or audited here. */
async function recordFailure(session: Session, intent: FieldMigrationIntent, revision: number, code: Failure): Promise<boolean> {
  try { return await withFieldMigrationAuthority(session, intent.principal, async ({ session: fresh, transaction: tx }) => {
    const scope = { preparationId: intent.id, organisationId: fresh.organisationId, definitionId: intent.definitionId };
    await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${intent.id}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_executions WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    const publication = await tx.studioFieldMigrationPublication.findFirst({ where: { ...scope, state: "PUBLISHED", publisherUserId: fresh.userId }, select: { preparationId: true, reviewChecksum: true } });
    const execution = await tx.studioFieldMigrationExecution.findFirst({ where: { ...scope, state: "RUNNING", revision } });
    if (!publication || !execution) return false;
    const pin = fieldMigrationExecutionPinSchema.safeParse(execution.pin);
    if (!pin.success || checksum(pin.data) !== execution.pinChecksum || pin.data.publication.preparationId !== intent.id
      || pin.data.publication.organisationId !== fresh.organisationId || pin.data.publication.definitionId !== intent.definitionId
      || pin.data.publication.reviewChecksum !== publication.reviewChecksum || pin.data.publication.publisherUserId !== fresh.userId) return false;
    if ((await tx.studioFieldMigrationExecution.updateMany({ where: { ...scope, state: "RUNNING", revision, pinChecksum: execution.pinChecksum },
      data: { state: "FAILED", revision: revision + 1, failureCode: code } })).count !== 1) return false;
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.execution_failed",
      entityType: "StudioFieldMigrationExecution", entityId: intent.id, after: { pinChecksum: execution.pinChecksum, state: "FAILED", revision: revision + 1, code } }, tx);
    return true;
  }); } catch { return false; } // Original batch has rolled back; never fabricate a recovery write.
}

/** Internal bounded execution. No timer/worker, client tenant, target IDs or pin.
 * Each invocation refreshes initiating authority. Lost responses cannot silently
 * advance another page; all target values/outcomes/progress/Audit are atomic. */
export async function executeFieldMigrationBatch(session: Session, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = fieldMigrationExecutionBatchSchema.parse(input);
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, organisationId: session.organisationId } });
  if (!initial) changed();
  const sealed = sealFieldMigrationIntent(initial.intent), intent = sealed.intent;
  if (sealed.checksum !== initial.intentChecksum || intent.id !== initial.id || intent.organisationId !== session.organisationId) changed();
  try { return await withFieldMigrationAuthority(session, intent.principal, async authority => {
    const { session: fresh, transaction: tx } = authority, inspected = await inspectFieldMigrationExecution(authority, intent);
    if (!inspected.existing || !inspected.progress) changed();
    const prior = inspected.progress;
    if (request.revision > prior.revision) changed();
    if (request.revision < prior.revision || prior.state === "READY") return { id: intent.id, ...prior, replayed: true, appended: 0 };
    if (prior.revision > 2147483646 || !["RUNNING", "FAILED"].includes(prior.state)) changed();
    const scope = { preparationId: intent.id, organisationId: fresh.organisationId, definitionId: intent.definitionId };
    const resumed = prior.state === "FAILED";
    let runningRevision = prior.revision;
    if (resumed) {
      // SQL requires an explicit FAILED→RUNNING transition, before any row claim.
      if (prior.revision > 2147483645 || (await tx.studioFieldMigrationExecution.updateMany({ where: { ...scope, revision: prior.revision,
        state: "FAILED", pinChecksum: inspected.pinChecksum }, data: { state: "RUNNING", revision: prior.revision + 1, failureCode: null } })).count !== 1) changed();
      runningRevision++;
      inspected.progress = { ...prior, state: "RUNNING", revision: runningRevision, failureCode: null };
    }
    const rows = await tx.$queryRaw<Array<{ id: string; recordId: string }>>`SELECT id,"recordId" FROM studio_field_migration_observations
      WHERE "preparationId"=${intent.id}::uuid AND "organisationId"=${fresh.organisationId} AND "definitionId"=${intent.definitionId}::uuid
        AND (${prior.cursor}::text IS NULL OR "recordId" COLLATE "C">${prior.cursor}::text COLLATE "C")
      ORDER BY "recordId" COLLATE "C" LIMIT ${request.limit}`;
    if (rows.length > request.limit || prior.processedCount + rows.length > inspected.pin.cohort.recordCount) changed();
    let cursor = prior.cursor;
    for (const row of rows) {
      if (cursor !== null && row.recordId <= cursor) changed();
      const written = await writeFieldMigrationRepresentation(authority, inspected, row.id);
      if (written.observationId !== row.id || written.recordId !== row.recordId) changed();
      cursor = row.recordId;
    }
    const processedCount = prior.processedCount + rows.length, complete = processedCount === inspected.pin.cohort.recordCount;
    if (rows.length === 0 && !complete) changed();
    const progress = readFieldMigrationExecutionProgress(inspected.pin, { state: complete ? "READY" : "RUNNING", revision: runningRevision + 1,
      cursor, processedCount, failureCode: null });
    if ((await tx.studioFieldMigrationExecution.updateMany({ where: { ...scope, state: "RUNNING", revision: runningRevision, pinChecksum: inspected.pinChecksum }, data: progress })).count !== 1) changed();
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.execution_batched",
      entityType: "StudioFieldMigrationExecution", entityId: intent.id,
      after: { pinChecksum: inspected.pinChecksum, fromRevision: prior.revision, revision: progress.revision, state: progress.state, resumed } }, tx);
    return { id: intent.id, ...progress, replayed: false, appended: rows.length };
  }); } catch (error) {
    const code = failureCode(error), recorded = await recordFailure(session, intent, request.revision, code);
    throw new FieldMigrationExecutionError(code, recorded);
  }
}
