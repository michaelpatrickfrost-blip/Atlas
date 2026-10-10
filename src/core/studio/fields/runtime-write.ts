import { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { writeAudit } from "@/core/audit/log";
import { compileCustomField } from "../compiler/fields";
import { encodeFieldValue } from "./codec";
import { readFieldContextInTransaction, readFieldPlanInTransaction, readFieldValueInTransaction } from "./runtime-read";
import { withFieldRuntimeAuthority } from "./runtime-authority";
import { fieldWriteRequestSchema, fieldWriteRequestChecksum, fieldWriteAuditSchema } from "./runtime-write-contract";
import { closeFieldWriteWindow } from "./runtime-write-window";
function conflict(): never { throw new Error("CONFLICT: this record, field or value changed. Refresh before saving."); }

/** Internal server service. An owning native form must invoke this (or the same
 * transaction primitive) with required-field coverage, never arbitrary native
 * columns. No client endpoint is enabled by this service alone. */
export async function writeFieldValue(authenticated: Session, input: unknown) {
  const request = fieldWriteRequestSchema.parse(input);
  try {
    return await withFieldRuntimeAuthority(authenticated, async authority => {
      const { session, transaction: tx, registry } = authority;
      // Serialize configuration and value CAS against activation/retirement.
      await tx.$queryRaw`SELECT id FROM studio_definitions WHERE id=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
      const { definition, payload, extension } = await readFieldContextInTransaction(authority, request, false);
      await compileCustomField(session, payload, registry);
      const context = { session, transaction: tx };
      const existing = await tx.studioFieldValue.findFirst({ where: { id: request.operationId, organisationId: session.organisationId, definitionId: request.definitionId }, include: { schemaVersion: true, slot: { include: { extension: true } } } });
      if (existing) {
        if (existing.createdBy !== session.userId || existing.slot.extension.recordId !== request.recordId || existing.slot.extension.entityId !== payload.entity.id
          || existing.versionId !== request.versionId || existing.generationId !== request.generationId) conflict();
        const written = await readFieldPlanInTransaction(authority, existing.schemaVersion, definition.id);
        await compileCustomField(session, written, registry);
        const encoded = encodeFieldValue(written.field, request.value), requestChecksum = fieldWriteRequestChecksum(request, encoded.fingerprint);
        const audit = await tx.auditEntry.findFirst({ where: { organisationId: session.organisationId, actorUserId: session.userId, entityId: existing.id,
          entityType: "StudioFieldValue", action: "studio.field.value.saved" }, select: { after: true } });
        const saved = fieldWriteAuditSchema.safeParse(audit?.after);
        if (!saved.success || saved.data.requestChecksum !== requestChecksum || saved.data.fingerprint !== existing.fingerprint || saved.data.versionId !== existing.versionId
          || saved.data.generationId !== existing.generationId || saved.data.slotId !== existing.slotId || saved.data.valueRevision !== existing.revision
          || saved.data.slotRevision !== existing.revision || saved.data.extensionId !== existing.slot.extensionId
          || saved.data.slotRevision !== (request.slotRevision ?? 0) + 1 || saved.data.extensionRevision !== (request.extensionRevision ?? 0) + 1) conflict();
        await readFieldValueInTransaction(authority, payload, definition.id, existing.generationId, existing.slotId, request.recordId, existing);
        return { operationId: existing.id, replayed: true, ...saved.data };
      }
      if (definition.revision !== request.definitionRevision || definition.activeVersionId !== request.versionId || payload.storageGeneration !== request.generationId) conflict();
      await registry.authoriseRecord(context, payload.entity, { recordId: request.recordId, intent: "extend", expectedRevision: request.recordRevision });
      if ((extension?.revision ?? null) !== request.extensionRevision) conflict();
      if (extension && extension.revision >= 2147483647) conflict();
      const slot = extension && await tx.studioFieldSlot.findFirst({ where: { organisationId: session.organisationId, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration }, include: { activeValue: { include: { schemaVersion: true } } } });
      if ((slot?.revision ?? null) !== request.slotRevision || (slot?.activeValue?.revision ?? null) !== request.valueRevision) conflict();
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
    });
  } catch (error) {
    // No conflicting tenant's ID/value or duplicate fingerprint is disclosed.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") conflict();
    throw error;
  }
}
