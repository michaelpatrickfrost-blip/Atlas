import type { Prisma } from "@/generated/prisma/client";
import type { RecordAnchor, RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { checksum } from "../../registry/contracts";
import { customFieldPayloadSchema, type FieldValue } from "../schema";
import { versionedFieldPayloadSchema, type VersionedFieldPayload } from "../required-contract";
import { decodeStoredFieldValue } from "../codec";
import { compileFieldMigrationMetadata } from "./metadata";
import { assertFieldMigrationPolicies, assertVersionedFieldMigrationPolicies, authoriseFieldMigrationReference } from "./access";
import { FieldMigrationReviewError, type FieldMigrationObservation } from "./contracts";

type SourceObservation = Pick<FieldMigrationObservation, "recordId" | "nativeRevision" | "extension" | "result">;
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** One shared source decoder. Current native/field/metadata preflight belongs to
 * the caller. Written metadata/policy precedes columns; independent references
 * precede fingerprint classification. Protocol1 keeps its original semantics;
 * protocol2 additionally checks the written native anchor and version identity.
 * No writes or raw business values leave the server-owned transaction. */
export async function readObservedMigrationSource(context: RecordContext & { transaction: Prisma.TransactionClient }, registry: CapabilityRegistry,
  company: Parameters<typeof assertFieldMigrationPolicies>[1], definitionId: string, current: VersionedFieldPayload, anchor: RecordAnchor, protocol: 1 | 2) {
  const { session, transaction: tx } = context;
  await tx.$queryRaw`SELECT id FROM studio_extension_records WHERE "organisationId"=${session.organisationId}
    AND "entityId"=${current.entity.id} AND "recordId"=${anchor.recordId} FOR SHARE`;
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: current.entity.id, recordId: anchor.recordId },
    select: { id: true, revision: true, slots: { where: { organisationId: session.organisationId, definitionId: definitionId, generationId: current.storageGeneration },
      select: { id: true, revision: true, activeValueId: true } } } });
  if (extension && extension.slots.length > 1) changed();
  const slot = extension?.slots[0];
  if (slot) await tx.$queryRaw`SELECT id FROM studio_field_slots WHERE id=${slot.id}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  let decoded: FieldValue | null = null;
  const observation: SourceObservation = { recordId: anchor.recordId, nativeRevision: anchor.revision,
    extension: extension ? { id: extension.id, revision: extension.revision, slot: slot ? { id: slot.id, revision: slot.revision, value: null } : null } : null,
    result: { kind: "invalid", code: "FIELD_STORAGE_INVALID" } };
  if (slot?.activeValueId) {
    // Pointer/schema metadata first: do not fetch value columns until the written
    // policy has been authorised alongside the current policy.
    const where = { id: slot.activeValueId, organisationId: session.organisationId, definitionId: definitionId,
      generationId: current.storageGeneration, slotId: slot.id, revision: slot.revision };
    const metadata = await tx.studioFieldValue.findFirst({ where, select: { id: true, revision: true, versionId: true, fingerprint: true,
      schemaVersion: { select: { id: true, definitionId: true, organisationId: true, schemaVersion: true, payload: true, compiledPlan: true, checksum: true } } } });
    if (!metadata) changed();
    const written = protocol === 1 ? customFieldPayloadSchema.parse(metadata.schemaVersion.payload) : versionedFieldPayloadSchema.parse(metadata.schemaVersion.payload);
    if (written.storageGeneration !== current.storageGeneration) changed();
    if (protocol === 1) assertFieldMigrationPolicies(session, company, current, written);
    else assertVersionedFieldMigrationPolicies(session, company, current, written);
    const compiled = await compileFieldMigrationMetadata(context, registry, company, definitionId, written);
    if (metadata.schemaVersion.checksum !== checksum(metadata.schemaVersion.compiledPlan) || compiled.checksum !== metadata.schemaVersion.checksum) changed();
    if (protocol === 2) {
      if (metadata.schemaVersion.id !== metadata.versionId || metadata.schemaVersion.definitionId !== definitionId
        || metadata.schemaVersion.organisationId !== session.organisationId || metadata.schemaVersion.schemaVersion !== written.schemaVersion) changed();
      const writtenAnchor = await registry.authoriseRecord(context, written.entity, { recordId: anchor.recordId, intent: "read" });
      if (writtenAnchor.recordId !== anchor.recordId || writtenAnchor.organisationId !== session.organisationId || writtenAnchor.revision !== anchor.revision) changed();
    }
    observation.extension!.slot!.value = { id: metadata.id, revision: metadata.revision, versionId: metadata.versionId, fingerprint: metadata.fingerprint };
    const value = await tx.studioFieldValue.findFirst({ where: { ...where, versionId: metadata.versionId, fingerprint: metadata.fingerprint } });
    if (!value) changed();
    try {
      decoded = decodeStoredFieldValue(written.field, value);
    } catch {
      // A malformed reference cannot establish target authority. Abort rather
      // than classifying an inaccessible reference as a reviewable failure row.
      if (written.field.storage.type === "reference") changed();
      return { observation, decoded: null, storageValid: false };
    } // Pure decoder only, no access checks in this catch.
    await authoriseFieldMigrationReference(context, registry, written, decoded);
    await authoriseFieldMigrationReference(context, registry, current, decoded);
    if (checksum(decoded) !== metadata.fingerprint) return { observation, decoded: null, storageValid: false };
  } else if (slot && slot.revision !== 0) changed();
  return { observation, decoded, storageValid: true };
}
