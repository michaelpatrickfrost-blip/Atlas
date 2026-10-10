import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import type { RecordAnchor, RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { checksum } from "../../registry/contracts";
import { entityDetailsSchema, recordAnchorSchema } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { customFieldPayloadSchema, type FieldValue } from "../schema";
import { decodeStoredFieldValue } from "../codec";
import { createFieldConverter, FieldConversionError } from "../evolution";
import { assertFieldMigrationPolicies, authoriseFieldMigrationReference } from "./access";
import { sealFieldMigrationIntent, fieldMigrationObservationSchema, FieldMigrationReviewError,
  type FieldMigrationIntent, type FieldMigrationObservation } from "./contracts";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** One server-only row. Caller refreshes/locks principal and source/draft for the
 * batch; this rechecks native anchor and both field policies before decoding.
 * Converted values are internal to the shared transaction; the archive wrapper
 * below returns only references and fingerprints, never execution authority.
 */
export async function inspectFieldMigrationRecord(context: RecordContext & { transaction: Prisma.TransactionClient }, registry: CapabilityRegistry,
  company: Parameters<typeof assertFieldMigrationPolicies>[1], serverIntent: FieldMigrationIntent, serverAnchor: RecordAnchor): Promise<{ observation: FieldMigrationObservation; convertedValue: FieldValue | null }> {
  const intent = sealFieldMigrationIntent(serverIntent).intent, anchor = recordAnchorSchema.parse(serverAnchor), session = context.session, tx = context.transaction;
  if (!tx || intent.organisationId !== session.organisationId || anchor.organisationId !== session.organisationId
    || intent.principal.userId !== session.userId || intent.principal.membershipId !== session.membershipId) changed();
  const current = intent.source.payload, target = intent.target.payload;
  assertFieldMigrationPolicies(session, company, current); assertFieldMigrationPolicies(session, company, target);
  const native = await registry.resolve(session, current.entity), record = entityDetailsSchema.parse(native.details).record;
  if (!record?.fieldPolicy) changed(); assertCapability(session, record.writeCapability);
  const targetNative = await registry.resolve(session, target.entity), targetRecord = entityDetailsSchema.parse(targetNative.details).record;
  const policy = targetRecord?.migrationSnapshot;
  if (!targetRecord || !policy || !policy.sourceVersions.includes(current.entity.version)
    || policy.query.id !== intent.ownerQuery.id || policy.query.version !== intent.ownerQuery.version) changed();
  assertCapability(session, targetRecord.writeCapability);
  const query = await registry.resolve(session, intent.ownerQuery);
  if (query.kind !== "query" || query.details.transaction !== "required" || query.ownerModuleId !== targetNative.ownerModuleId) changed();
  const actual = await registry.authoriseRecord(context, current.entity, { recordId: anchor.recordId, intent: "read" });
  if (actual.revision !== anchor.revision) changed();
  const convert = createFieldConverter(current, target, intent.conversion);
  await tx.$queryRaw`SELECT id FROM studio_extension_records WHERE "organisationId"=${session.organisationId}
    AND "entityId"=${current.entity.id} AND "recordId"=${anchor.recordId} FOR SHARE`;
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: current.entity.id, recordId: anchor.recordId },
    select: { id: true, revision: true, slots: { where: { organisationId: session.organisationId, definitionId: intent.definitionId, generationId: current.storageGeneration },
      select: { id: true, revision: true, activeValueId: true } } } });
  if (extension && extension.slots.length > 1) changed();
  const slot = extension?.slots[0];
  if (slot) await tx.$queryRaw`SELECT id FROM studio_field_slots WHERE id=${slot.id}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  let decoded: FieldValue | null = null;
  const observation: FieldMigrationObservation = { recordId: anchor.recordId, nativeRevision: anchor.revision,
    extension: extension ? { id: extension.id, revision: extension.revision, slot: slot ? { id: slot.id, revision: slot.revision, value: null } : null } : null,
    result: { kind: "invalid", code: "FIELD_STORAGE_INVALID" } };
  if (slot?.activeValueId) {
    // Pointer/schema metadata first: do not fetch value columns until the written
    // policy has been authorised alongside the current policy.
    const where = { id: slot.activeValueId, organisationId: session.organisationId, definitionId: intent.definitionId,
      generationId: current.storageGeneration, slotId: slot.id, revision: slot.revision };
    const metadata = await tx.studioFieldValue.findFirst({ where, select: { id: true, revision: true, versionId: true, fingerprint: true,
      schemaVersion: { select: { payload: true, compiledPlan: true, checksum: true } } } });
    if (!metadata) changed();
    const written = customFieldPayloadSchema.parse(metadata.schemaVersion.payload);
    if (written.storageGeneration !== current.storageGeneration) changed();
    assertFieldMigrationPolicies(session, company, current, written);
    const compiled = await compileCustomField(session, written, registry);
    if (metadata.schemaVersion.checksum !== checksum(metadata.schemaVersion.compiledPlan) || compiled.checksum !== metadata.schemaVersion.checksum) changed();
    observation.extension!.slot!.value = { id: metadata.id, revision: metadata.revision, versionId: metadata.versionId, fingerprint: metadata.fingerprint };
    const value = await tx.studioFieldValue.findFirst({ where: { ...where, versionId: metadata.versionId, fingerprint: metadata.fingerprint } });
    if (!value) changed();
    try {
      decoded = decodeStoredFieldValue(written.field, value);
    } catch {
      // A malformed reference cannot establish target authority. Abort rather
      // than classifying an inaccessible reference as a reviewable failure row.
      if (written.field.storage.type === "reference") changed();
      return { observation: fieldMigrationObservationSchema.parse(observation), convertedValue: null };
    } // Pure decoder only, no access checks in this catch.
    await authoriseFieldMigrationReference(context, registry, written, decoded);
    await authoriseFieldMigrationReference(context, registry, current, decoded);
    if (checksum(decoded) !== metadata.fingerprint) return { observation: fieldMigrationObservationSchema.parse(observation), convertedValue: null };
  } else if (slot && slot.revision !== 0) changed();
  let converted: ReturnType<typeof convert>;
  try { converted = convert(decoded?.value ?? null); }
  catch (error) {
    if (!(error instanceof FieldConversionError)) throw error;
    observation.result = { kind: "invalid", code: error.code };
    return { observation: fieldMigrationObservationSchema.parse(observation), convertedValue: null };
  }
  await authoriseFieldMigrationReference(context, registry, target, converted.value);
  observation.result = { kind: "valid", targetFingerprint: checksum(converted.value), isNull: converted.value === null, lossy: converted.lossy };
  return { observation: fieldMigrationObservationSchema.parse(observation), convertedValue: converted.value };
}

/** Archive callers receive only references/fingerprints, preserving the existing
 * observation contract. Values stay inside the server-owned conversion transaction. */
export async function observeFieldMigrationRecord(...args: Parameters<typeof inspectFieldMigrationRecord>): Promise<FieldMigrationObservation> {
  return (await inspectFieldMigrationRecord(...args)).observation;
}
