import { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { writeAudit } from "@/core/audit/log";
import { compileCustomField, compileCustomFieldForInitialisation } from "../compiler/fields";
import { encodeFieldValue } from "./codec";
import { readFieldContextInTransaction, readFieldPlanInTransaction, readFieldValueInTransaction,
  readInitialFieldContextInTransaction, readInitialFieldPlanInTransaction, readInitialFieldValueInTransaction } from "./runtime-read";
import { withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "./runtime-authority";
import { fieldWriteRequestSchema, fieldWriteRequestChecksum, fieldWriteAuditSchema } from "./runtime-write-contract";
import { closeFieldWriteWindow } from "./runtime-write-window";
import { lockBoundFieldEntityInTransaction } from "./entity-lock";
function conflict(): never { throw new Error("CONFLICT: this record, field or value changed. Refresh before saving."); }
function throwWriteError(error: unknown): never {
  // No conflicting tenant's ID/value or duplicate fingerprint is disclosed.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") conflict();
  throw error;
}

/** Internal server service. An owning native form must invoke this (or the same
 * transaction primitive) with required-field coverage, never arbitrary native
 * columns. No client endpoint is enabled by this service alone. */
export async function writeFieldValue(authenticated: Session, input: unknown) {
  const request = fieldWriteRequestSchema.parse(input);
  try { return await withFieldRuntimeAuthority(authenticated, authority => writeFieldValueInTransaction(authority, request)); }
  catch (error) { throwWriteError(error); }
}

/** Trusted owning transaction primitive. Authority comes from the existing genuine
 * runtime bridge; callers retain native/config ordering and must validate all
 * resulting field requirements before committing their staged native/value state.
 * This does not open a transaction or grant native/field access. An error must
 * propagate so the caller rolls back values, windows, native changes and Audits.
 * Closed1 behaviour is retained until native enforcement enables newer writes. */
export async function writeFieldValueInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  return writeInTransaction(authority, input);
}

/** Actual owning INSERT callback only. The opaque proof grants no existing-record
 * access; field/reference rights and the native owner's current creation facts
 * remain mandatory. Conditional initial writes await all-active enforcement. */
export async function initialiseFieldValueInTransaction(authority: FieldRuntimeAuthority, input: unknown, proof: object) {
  if (!proof || typeof proof !== "object") throw new Error("FORBIDDEN: owning creation proof is required.");
  return writeInTransaction(authority, input, proof);
}

async function writeInTransaction(authority: FieldRuntimeAuthority, input: unknown, proof?: object) {
  const request = fieldWriteRequestSchema.parse(input);
  if (proof && (request.recordRevision !== 1 || request.slotRevision !== null || request.valueRevision !== null)) conflict();
  try {
    const { session, transaction: tx, registry } = authority;
    await lockBoundFieldEntityInTransaction(tx, session.organisationId, request.definitionId);
    // Serialize configuration and value CAS against activation/retirement.
    await tx.$queryRaw`SELECT id FROM studio_definitions WHERE id=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
    const { definition, payload, extension } = proof
      ? await readInitialFieldContextInTransaction(authority, { ...request, expectedRevision: request.recordRevision }, proof)
      : await readFieldContextInTransaction(authority, request, false);
    if (payload.schemaVersion !== 1) throw new Error("FIELD_UNAVAILABLE: conditional initial writes await owning required-field enforcement.");
    const context = { session, transaction: tx };
    if (proof) {
      await compileCustomFieldForInitialisation(session, payload, registry, "write");
      // The proof's immutable INSERT anchor alone does not establish that a
      // later operation in this callback left the actual native row unchanged.
      await registry.invokeInitialRecordFacts(context, payload.entity, proof);
      if (definition.revision !== request.definitionRevision || definition.activeVersionId !== request.versionId || payload.storageGeneration !== request.generationId) conflict();
    } else await compileCustomField(session, payload, registry);
    const existing = await tx.studioFieldValue.findFirst({ where: { id: request.operationId, organisationId: session.organisationId, definitionId: request.definitionId }, include: { schemaVersion: true, slot: { include: { extension: true } } } });
    if (existing) {
      if (existing.createdBy !== session.userId || existing.slot.extension.recordId !== request.recordId || existing.slot.extension.entityId !== payload.entity.id
        || existing.versionId !== request.versionId || existing.generationId !== request.generationId) conflict();
      if (proof && (!extension || existing.slot.extensionId !== extension.id || existing.slot.extension.id !== extension.id
        || existing.slot.extension.organisationId !== session.organisationId || existing.slot.organisationId !== session.organisationId
        || existing.slot.id !== existing.slotId || existing.slot.entityId !== payload.entity.id || existing.slot.definitionId !== definition.id || existing.slot.generationId !== request.generationId
        || existing.slot.activeValueId !== existing.id || existing.slot.revision !== existing.revision)) conflict();
      const written = proof ? await readInitialFieldPlanInTransaction(authority, existing.schemaVersion, definition.id)
        : await readFieldPlanInTransaction(authority, existing.schemaVersion, definition.id);
      if (proof) {
        if (written.schemaVersion !== 1) conflict();
        await compileCustomFieldForInitialisation(session, written, registry, "write");
      } else await compileCustomField(session, written, registry);
      const encoded = encodeFieldValue(written.field, request.value), requestChecksum = fieldWriteRequestChecksum(request, encoded.fingerprint);
      const audit = await tx.auditEntry.findFirst({ where: { organisationId: session.organisationId, actorUserId: session.userId, entityId: existing.id,
        entityType: "StudioFieldValue", action: "studio.field.value.saved" }, select: { after: true } });
      const saved = fieldWriteAuditSchema.safeParse(audit?.after);
      if (!saved.success || saved.data.requestChecksum !== requestChecksum || saved.data.fingerprint !== existing.fingerprint || saved.data.versionId !== existing.versionId
        || saved.data.generationId !== existing.generationId || saved.data.slotId !== existing.slotId || saved.data.valueRevision !== existing.revision
        || saved.data.slotRevision !== existing.revision || saved.data.extensionId !== existing.slot.extensionId
        || saved.data.slotRevision !== (request.slotRevision ?? 0) + 1 || saved.data.extensionRevision !== (request.extensionRevision ?? 0) + 1) conflict();
      if (proof) await readInitialFieldValueInTransaction(authority, payload, definition.id, existing.generationId, existing.slotId, request.recordId, existing, proof);
      else await readFieldValueInTransaction(authority, payload, definition.id, existing.generationId, existing.slotId, request.recordId, existing);
      return { operationId: existing.id, replayed: true, ...saved.data };
    }
    if (definition.revision !== request.definitionRevision || definition.activeVersionId !== request.versionId || payload.storageGeneration !== request.generationId) conflict();
    if (!proof) await registry.authoriseRecord(context, payload.entity, { recordId: request.recordId, intent: "extend", expectedRevision: request.recordRevision });
    if ((extension?.revision ?? null) !== request.extensionRevision) conflict();
    if (extension && extension.revision >= 2147483647) conflict();
    const slot = extension && await tx.studioFieldSlot.findFirst({ where: { organisationId: session.organisationId, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration }, include: { activeValue: { include: { schemaVersion: true } } } });
    if ((proof && slot) || (slot?.revision ?? null) !== request.slotRevision || (slot?.activeValue?.revision ?? null) !== request.valueRevision) conflict();
    if (slot && (!slot.activeValue || slot.activeValueId !== slot.activeValue.id || slot.revision !== slot.activeValue.revision || slot.revision >= 2147483647)) conflict();
    if (slot?.activeValue) {
      const written = await readFieldPlanInTransaction(authority, slot.activeValue.schemaVersion, definition.id);
      await compileCustomField(session, written, registry);
      await registry.authoriseRecord(context, written.entity, { recordId: request.recordId, intent: "extend", expectedRevision: request.recordRevision });
      await readFieldValueInTransaction(authority, payload, definition.id, payload.storageGeneration, slot.id, request.recordId, slot.activeValue);
    }
    const encoded = encodeFieldValue(payload.field, request.value), requestChecksum = fieldWriteRequestChecksum(request, encoded.fingerprint);
    if (encoded.referenceValue !== null && payload.field.storage.type === "reference")
      await registry.authoriseRecord(context, payload.field.storage.entity, { recordId: encoded.referenceValue, intent: "read" });
    // All owner/reference/constraint/CAS guards run before either settlement or
    // value mutation. Settlement, typed history, pointer and paired Audit commit
    // together; any failure leaves rollback eligibility and values unchanged.
    await closeFieldWriteWindow(authority, request);
    const nativeExtension = extension ?? await tx.studioExtensionRecord.create({ data: { organisationId: session.organisationId, entityId: payload.entity.id, recordId: request.recordId } });
    const nativeSlot = slot ?? await tx.studioFieldSlot.create({ data: { organisationId: session.organisationId, entityId: payload.entity.id,
      extensionId: nativeExtension.id, definitionId: definition.id, generationId: payload.storageGeneration } });
    const valueRevision = nativeSlot.revision + 1;
    const value = await tx.studioFieldValue.create({ data: { ...encoded,
      jsonValue: encoded.jsonValue === null ? Prisma.DbNull : encoded.jsonValue as Prisma.InputJsonValue,
      id: request.operationId, organisationId: session.organisationId, definitionId: definition.id, generationId: payload.storageGeneration,
      slotId: nativeSlot.id, versionId: request.versionId, revision: valueRevision, createdBy: session.userId } });
    if ((await tx.studioFieldSlot.updateMany({ where: { id: nativeSlot.id, organisationId: session.organisationId, revision: nativeSlot.revision },
      data: { revision: valueRevision, activeValueId: value.id, uniqueToken: payload.field.unique && !encoded.isNull ? encoded.fingerprint : null } })).count !== 1) conflict();
    const extensionRevision = nativeExtension.revision + 1;
    if ((await tx.studioExtensionRecord.updateMany({ where: { id: nativeExtension.id, organisationId: session.organisationId, revision: nativeExtension.revision }, data: { revision: extensionRevision } })).count !== 1) conflict();
    const after = { requestChecksum, versionId: request.versionId, generationId: payload.storageGeneration, extensionId: nativeExtension.id, extensionRevision,
      slotId: nativeSlot.id, slotRevision: valueRevision, valueRevision, fingerprint: encoded.fingerprint };
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "studio.field.value.saved", entityType: "StudioFieldValue", entityId: value.id,
      before: { definitionRevision: request.definitionRevision, recordRevision: request.recordRevision, extensionRevision: request.extensionRevision, slotRevision: request.slotRevision, valueRevision: request.valueRevision }, after }, tx);
    return { operationId: value.id, replayed: false, ...after };
  } catch (error) {
    throwWriteError(error);
  }
}
