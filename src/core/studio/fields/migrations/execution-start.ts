import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { sealFieldMigrationIntent, FieldMigrationReviewError } from "./contracts";
import { withFieldMigrationAuthority } from "./authority";
import { inspectFieldMigrationExecution } from "./execution-inspection";
import { readFieldMigrationExecutionProgress } from "./execution-contract";

const requestSchema = z.strictObject({ preparationId: z.uuid(), publicationRevision: z.number().int().nonnegative().max(2147483647),
  reviewChecksum: z.string().regex(/^[a-f0-9]{64}$/) });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Internal exact start. Original source remains active. No target/native writes,
 * automatic execution, public endpoint or progress disclosure without reinspection. */
export async function startFieldMigrationExecution(session: Session, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = requestSchema.parse(input);
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, organisationId: session.organisationId } });
  if (!initial) changed();
  const sealed = sealFieldMigrationIntent(initial.intent), intent = sealed.intent;
  if (sealed.checksum !== initial.intentChecksum || intent.id !== initial.id || intent.organisationId !== session.organisationId) changed();
  return withFieldMigrationAuthority(session, intent.principal, async authority => {
    const inspected = await inspectFieldMigrationExecution(authority, intent);
    if (request.publicationRevision !== inspected.publication.revision || request.reviewChecksum !== inspected.stored.checksum) changed();
    if (inspected.progress) return { id: intent.id, ...inspected.progress, replayed: true };
    const execution = await authority.transaction.studioFieldMigrationExecution.create({ data: { preparationId: intent.id,
      organisationId: authority.session.organisationId, definitionId: intent.definitionId, entityId: intent.target.payload.entity.id,
      pin: inspected.pin, pinChecksum: inspected.pinChecksum } });
    const progress = readFieldMigrationExecutionProgress(inspected.pin, { state: execution.state, revision: execution.revision,
      cursor: execution.cursor, processedCount: execution.processedCount, failureCode: execution.failureCode });
    await writeAudit({ organisationId: authority.session.organisationId, actorUserId: authority.session.userId,
      action: "studio.field.migration.execution_started", entityType: "StudioFieldMigrationExecution", entityId: intent.id,
      after: { pinChecksum: inspected.pinChecksum, state: progress.state, revision: progress.revision } }, authority.transaction);
    return { id: intent.id, ...progress, replayed: false };
  });
}
