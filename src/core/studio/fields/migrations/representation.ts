import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { FieldMigrationAuthority } from "./authority";
import type { inspectFieldMigrationExecution } from "./execution-inspection";
import { FieldMigrationReviewError, fieldMigrationObservationSchema } from "./contracts";
import { canonicalJson, checksum } from "../../registry/contracts";
import { encodeFieldRepresentation } from "../codec";
import { inspectFieldMigrationRecord } from "./observation";
import { createFieldMigrationOutcomePin } from "./execution-contract";

type Inspection = Awaited<ReturnType<typeof inspectFieldMigrationExecution>>;
const approvalSchema = z.strictObject({ organisationId: z.string(), recordId: z.string(), revision: z.number().int().positive(),
  preparationId: z.uuid(), observationId: z.uuid(), representationOnly: z.literal(true) });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** One internal row after shared exact inspection. Caller must commit bounded
 * progress and Audit in this same transaction. Deferred database guards forbid a
 * target/outcome commit without progress; this never mutates native business rows. */
export async function writeFieldMigrationRepresentation(authority: FieldMigrationAuthority, inspected: Inspection, serverObservationId: string) {
  const { session, transaction: tx, company } = authority, { intent, registry, pin } = inspected;
  if (!inspected.existing || !inspected.progress || inspected.progress.state !== "RUNNING"
    || intent.organisationId !== session.organisationId || intent.principal.userId !== session.userId || intent.principal.membershipId !== session.membershipId
    || inspected.pinChecksum !== checksum(pin)) changed();
  const where = { id: serverObservationId, preparationId: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId,
    entityId: intent.source.payload.entity.id, sourceGenerationId: intent.source.payload.storageGeneration };
  const row = await tx.studioFieldMigrationObservation.findFirst({ where });
  if (!row) changed();
  const stored = fieldMigrationObservationSchema.parse(row.observation);
  if (stored.result.kind !== "valid" || stored.recordId !== row.recordId || stored.nativeRevision !== row.nativeRevision) changed();
  // Exact owner query locks and approves the native row, including historical
  // representation policy, before any Studio business-value columns are read.
  const approved = approvalSchema.parse(await registry.invokeQueryInTransaction({ session, transaction: tx }, pin.ownerApproval,
    { preparationId: intent.id, observationId: row.id }));
  if (approved.organisationId !== session.organisationId || approved.recordId !== row.recordId || approved.revision !== row.nativeRevision
    || approved.preparationId !== intent.id || approved.observationId !== row.id) changed();
  const current = await inspectFieldMigrationRecord({ session, transaction: tx }, registry, company, intent,
    { recordId: approved.recordId, organisationId: approved.organisationId, revision: approved.revision });
  if (canonicalJson(current.observation) !== canonicalJson(stored)) changed();
  const encoded = encodeFieldRepresentation(intent.target.payload.field, current.convertedValue);
  if (encoded.fingerprint !== stored.result.targetFingerprint || encoded.isNull !== stored.result.isNull
    || (stored.result.lossy && !pin.publication.acknowledgedLoss)) changed();
  const outcome = createFieldMigrationOutcomePin(pin, { id: row.id, preparationId: row.preparationId, organisationId: row.organisationId,
    definitionId: row.definitionId, entityId: row.entityId, sourceGenerationId: row.sourceGenerationId, recordId: row.recordId,
    nativeRevision: row.nativeRevision, observation: stored }, { extensionId: stored.extension?.id ?? randomUUID(), slotId: randomUUID(), valueId: randomUUID() });
  // Claim first: deferred target FKs and commit guards permit only this exact
  // target to be inserted. A subsequent error rolls the claim back as well.
  await tx.studioFieldMigrationOutcome.create({ data: { observationId: outcome.observationId, preparationId: outcome.preparationId,
    organisationId: outcome.organisationId, definitionId: outcome.definitionId, entityId: outcome.entityId, recordId: outcome.recordId,
    nativeRevision: outcome.nativeRevision, sourceGenerationId: outcome.sourceGenerationId, targetGenerationId: outcome.targetGenerationId,
    targetVersionId: outcome.targetVersionId, executionChecksum: outcome.executionChecksum, observationChecksum: outcome.observationChecksum,
    extensionId: outcome.target.extensionId, extensionRevision: outcome.target.extensionRevision, targetSlotId: outcome.target.slotId,
    targetValueId: outcome.target.valueId, targetFingerprint: outcome.target.fingerprint, targetIsNull: outcome.target.isNull, outcome } });
  if (stored.extension) {
    if ((await tx.studioExtensionRecord.updateMany({ where: { id: stored.extension.id, organisationId: session.organisationId,
      entityId: intent.source.payload.entity.id, recordId: stored.recordId, revision: stored.extension.revision },
      data: { revision: outcome.target.extensionRevision } })).count !== 1) changed();
  } else await tx.studioExtensionRecord.create({ data: { id: outcome.target.extensionId, organisationId: session.organisationId,
    entityId: intent.source.payload.entity.id, recordId: stored.recordId, revision: 1 } });
  const scope = { organisationId: session.organisationId, definitionId: intent.definitionId, generationId: intent.target.payload.storageGeneration };
  await tx.studioFieldSlot.create({ data: { ...scope, id: outcome.target.slotId, entityId: intent.target.payload.entity.id, extensionId: outcome.target.extensionId } });
  await tx.studioFieldValue.create({ data: { ...scope, ...encoded, id: outcome.target.valueId, slotId: outcome.target.slotId,
    versionId: pin.publication.targetVersionId, revision: 1, createdBy: session.userId,
    jsonValue: encoded.jsonValue === null ? Prisma.DbNull : encoded.jsonValue as Prisma.InputJsonValue } });
  if ((await tx.studioFieldSlot.updateMany({ where: { ...scope, id: outcome.target.slotId, extensionId: outcome.target.extensionId,
    revision: 0, activeValueId: null, uniqueToken: null }, data: { revision: 1, activeValueId: outcome.target.valueId,
      uniqueToken: intent.target.payload.field.unique && !encoded.isNull ? encoded.fingerprint : null } })).count !== 1) changed();
  return { observationId: row.id, recordId: row.recordId };
}
