import { Prisma, type StudioDefinitionVersion } from "@/generated/prisma/client";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { checksum } from "@/core/studio/registry/contracts";
import { compileCustomFieldForInitialisation, compileCustomFieldForRead, compileCustomField } from "@/core/studio/compiler/fields";
import { inspectSealedFieldVersion } from "@/core/studio/fields/sealed-field";
import { assertFieldBinding, fieldDefinitionKey } from "@/core/studio/fields/binding";
import { decodeStoredFieldValue, encodeFieldValue } from "@/core/studio/fields/codec";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { lockFieldEntitiesInTransaction } from "@/core/studio/fields/entity-lock";
import { fieldWriteAuditSchema, fieldWriteRequestChecksum } from "@/core/studio/fields/runtime-write-contract";
import { workScope } from "./access";
import { TICKET_FORM_RECEIPT_ACTION as ACTION, TICKET_FORM_RECEIPT_ENTITY as ENTITY, ticketFormReceiptKey, ticketFormRequestSchema,
  ticketFormResultSchema, ticketFormReceiptSchema, ticketFormPacketChecksum, ticketFormProcessingOrder, type TicketFormReceipt,
  type TicketFormRequest, type TicketFormResult } from "./form-receipt-contract";

function conflict(): never { throw new Error("CONFLICT: this form operation or its saved receipt changed. Refresh before retrying."); }
const sqlFailure = z.object({ code: z.string().optional(), driverAdapterError: z.object({ cause: z.object({ originalCode: z.string().optional() }).optional() }).optional() });
/** Owning transaction boundary also uses this after commit-time conflict. It
 * translates a collision/SSI failure, never retries writes automatically. */
export function throwTicketFormReceiptError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const metadata = sqlFailure.safeParse(error.meta), state = metadata.success ? metadata.data.code ?? metadata.data.driverAdapterError?.cause?.originalCode : undefined;
    if (["P2002", "P2034"].includes(error.code) || (error.code === "P2010" && state !== undefined && ["40001", "40P01"].includes(state))) conflict();
  }
  throw error;
}
const identitySelect = { id: true, organisationId: true, kind: true, requesterUserId: true, version: true, queueId: true,
  queue: { select: { restricted: true } } } as const;
const valueMetadata = { id: true, organisationId: true, definitionId: true, generationId: true, slotId: true, versionId: true,
  revision: true, valueType: true, createdBy: true, schemaVersion: true,
  slot: { select: { id: true, organisationId: true, entityId: true, definitionId: true, generationId: true, extensionId: true,
    revision: true, activeValueId: true, extension: { select: { id: true, organisationId: true, entityId: true, recordId: true, revision: true } } } } } as const;
type MetadataValue = Prisma.StudioFieldValueGetPayload<{ select: typeof valueMetadata }>;

async function authority(authenticated: Session, tx: Prisma.TransactionClient, request: TicketFormRequest) {
  const current = await fieldRuntimeAuthorityInTransaction(authenticated, tx);
  assertCapability(current.session, request.operation === "create" ? "tickets.ticket.create" : "tickets.ticket.manage");
  if (!await tx.moduleState.findFirst({ where: { organisationId: current.session.organisationId, moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Tickets is unavailable.");
  await lockFieldEntitiesInTransaction(tx, current.session.organisationId, ["tickets.ticket"]);
  return current;
}
async function owningRecord(current: FieldRuntimeAuthority, operation: TicketFormRequest["operation"], id: string) {
  const { session, transaction: tx } = current;
  const row = await tx.serviceWorkItem.findFirst({ where: operation === "create"
    ? { id, organisationId: session.organisationId, kind: "TICKET", requesterUserId: session.userId }
    : { AND: [workScope(session), { id, kind: "TICKET" }] }, select: identitySelect });
  if (!row || row.id !== id || row.organisationId !== session.organisationId || row.kind !== "TICKET"
    || (operation === "create" && row.requesterUserId !== session.userId)) conflict();
  if (operation === "update" && row.queue.restricted && !await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId,
    queueId: row.queueId, userId: session.userId }, select: { id: true } })) throw new Error("FORBIDDEN: current restricted queue membership is required.");
  return row;
}
async function receiptRow(current: FieldRuntimeAuthority, request: TicketFormRequest) {
  const id = ticketFormReceiptKey(request.packet.operationId), { transaction: tx, session } = current;
  const row = await tx.auditEntry.findFirst({ where: { id, organisationId: session.organisationId, actorUserId: session.userId } });
  if (!row) {
    // Existence only: a global text key collision is never disclosed as another
    // tenant's receipt/actor/result. Detect it before any owning effects.
    if (await tx.auditEntry.findUnique({ where: { id }, select: { id: true } })) conflict();
    return null;
  }
  const parsed = ticketFormReceiptSchema.safeParse(row.after);
  if (!parsed.success) conflict();
  const receipt = parsed.data;
  if (row.id !== id || row.organisationId !== session.organisationId || row.action !== ACTION || row.entityType !== ENTITY
    || row.entityId !== receipt.recordId || row.actorUserId !== session.userId || row.before !== null
    || receipt.organisationId !== session.organisationId || receipt.actorUserId !== session.userId
    || receipt.operationId !== request.packet.operationId.toLowerCase() || receipt.operation !== request.operation
    || receipt.nativeRequestChecksum !== request.nativeRequestChecksum || receipt.packetChecksum !== ticketFormPacketChecksum(request.packet)
    || (request.operation === "update" && (receipt.recordId !== request.recordId || receipt.requestRecordRevision !== request.recordRevision))) conflict();
  return receipt;
}

/** Current and written BASE policy only. Replaying committed work is not a new
 * mutation or historical condition evaluation. Creation metadata uses current
 * Create, never a fabricated creation token or implicit native Read grant. */
async function fieldPolicy(current: FieldRuntimeAuthority, operation: TicketFormRequest["operation"], version: StudioDefinitionVersion, definitionId: string) {
  const { registry, session } = current;
  const payload = inspectSealedFieldVersion(registry, version, session.organisationId, definitionId).payload;
  if (payload.entity.id !== "tickets.ticket") conflict();
  const base = { schemaVersion: 1 as const, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field };
  if (operation === "create") {
    await compileCustomFieldForInitialisation(session, base, registry, "read");
    await compileCustomFieldForInitialisation(session, base, registry, "write");
  } else {
    await compileCustomFieldForRead(session, base, registry); await compileCustomField(session, base, registry);
  }
  await assertFieldBinding(current.transaction, session, definitionId, payload);
  return payload;
}

async function fields(current: FieldRuntimeAuthority, request: TicketFormRequest, result: TicketFormResult,
  completed: boolean, retained?: TicketFormReceipt) {
  const { session, transaction: tx, registry } = current, ordered = ticketFormProcessingOrder(request.packet);
  const ids = ordered.map(entry => entry.definitionId.toLowerCase());
  if (!ordered.length) return [];
  // All supplied current/written metadata is checked before ANY typed column.
  const definitions = await tx.studioDefinition.findMany({ where: { organisationId: session.organisationId, id: { in: ids }, kind: "customField", retiredAt: null },
    include: { activeVersion: true }, orderBy: { id: "asc" }, take: 100 });
  const rows = await tx.studioFieldValue.findMany({ where: { organisationId: session.organisationId, id: { in: ordered.map(entry => entry.operationId.toLowerCase()) } },
    select: valueMetadata, take: 100 });
  if (definitions.length !== ordered.length || rows.length !== ordered.length) conflict();
  const checked: { entry: typeof ordered[number]; row: MetadataValue; current: Awaited<ReturnType<typeof fieldPolicy>>; written: Awaited<ReturnType<typeof fieldPolicy>> }[] = [];
  for (const entry of ordered) {
    const definitionId = entry.definitionId.toLowerCase(), definition = definitions.find(row => row.id === definitionId),
      row = rows.find(row => row.id === entry.operationId.toLowerCase());
    if (!definition?.activeVersion || definition.activeVersion.id !== definition.activeVersionId || !row || row.schemaVersion.id !== row.versionId
      || definition.organisationId !== session.organisationId || row.organisationId !== session.organisationId
      || row.definitionId !== definition.id || row.versionId !== entry.versionId.toLowerCase() || row.generationId !== entry.generationId.toLowerCase()
      || row.createdBy !== session.userId || row.revision !== (entry.slotRevision ?? 0) + 1 || row.slot.id !== row.slotId
      || row.slot.definitionId !== definition.id || row.slot.generationId !== row.generationId || row.slot.organisationId !== session.organisationId
      || row.slot.extensionId !== row.slot.extension.id || row.slot.extension.organisationId !== session.organisationId
      || row.slot.entityId !== "tickets.ticket" || row.slot.extension.entityId !== "tickets.ticket" || row.slot.extension.recordId !== result.recordId) conflict();
    const latest = await fieldPolicy(current, request.operation, definition.activeVersion, definition.id),
      written = await fieldPolicy(current, request.operation, row.schemaVersion, definition.id);
    if (definition.key !== fieldDefinitionKey(latest) || written.field.key !== latest.field.key || written.storageGeneration !== row.generationId
      || written.field.storage.type !== row.valueType) conflict();
    if (completed && (definition.revision !== entry.definitionRevision || definition.activeVersionId !== row.versionId || latest.storageGeneration !== row.generationId
      || row.slot.activeValueId !== row.id || row.slot.revision !== row.revision
      || row.slot.extension.revision !== (request.packet.extensionRevision ?? 0) + ordered.length)) conflict();
    checked.push({ entry, row, current: latest, written });
  }
  if (request.operation === "update") {
    const owners = new Map(checked.flatMap(item => [item.current.entity, item.written.entity]).map(ref => [`${ref.id}@${ref.version}`, ref]));
    for (const ref of owners.values())
      await registry.authoriseRecord({ session, transaction: tx }, ref, { recordId: result.recordId, intent: "read" });
  }
  const saved: TicketFormReceipt["fields"] = [];
  for (const [index, item] of checked.entries()) {
    const { entry, row, current: latest, written } = item;
    if (entry.value !== null && entry.value.type !== written.field.storage.type) conflict();
    const encoded = encodeFieldValue(written.field, entry.value?.value ?? null);
    const extensionBefore = index === 0 ? request.packet.extensionRevision : (request.packet.extensionRevision ?? 0) + index;
    const original = { operationId: entry.operationId.toLowerCase(), definitionId: entry.definitionId.toLowerCase(), versionId: entry.versionId.toLowerCase(),
      generationId: entry.generationId.toLowerCase(), definitionRevision: entry.definitionRevision, recordId: result.recordId, recordRevision: result.fieldRecordRevision,
      extensionRevision: extensionBefore, slotRevision: entry.slotRevision, valueRevision: entry.valueRevision, value: entry.value?.value ?? null };
    const requestChecksum = fieldWriteRequestChecksum(original, encoded.fingerprint);
    const audit = await tx.auditEntry.findFirst({ where: { organisationId: session.organisationId, actorUserId: session.userId, action: "studio.field.value.saved",
      entityType: "StudioFieldValue", entityId: row.id }, select: { after: true, before: true } });
    const parsed = fieldWriteAuditSchema.safeParse(audit?.after);
    if (!parsed.success || parsed.data.requestChecksum !== requestChecksum || parsed.data.fingerprint !== encoded.fingerprint
      || parsed.data.versionId !== row.versionId || parsed.data.generationId !== row.generationId || parsed.data.slotId !== row.slotId
      || parsed.data.extensionId !== row.slot.extensionId || parsed.data.slotRevision !== row.revision || parsed.data.valueRevision !== row.revision
      || parsed.data.extensionRevision !== (request.packet.extensionRevision ?? 0) + index + 1
      || checksum(audit?.before) !== checksum({ definitionRevision: entry.definitionRevision, recordRevision: result.fieldRecordRevision,
        extensionRevision: extensionBefore, slotRevision: entry.slotRevision, valueRevision: entry.valueRevision })) conflict();
    const value = await tx.studioFieldValue.findFirst({ where: { id: row.id, organisationId: session.organisationId, definitionId: row.definitionId,
      generationId: row.generationId, slotId: row.slotId, versionId: row.versionId, revision: row.revision, createdBy: session.userId } });
    if (!value || value.fingerprint !== encoded.fingerprint || checksum(decodeStoredFieldValue(written.field, value)) !== encoded.fingerprint) conflict();
    // Original submitted reference rights still apply after a later overwrite.
    // A changed current schema does not coerce the old value into its new type.
    if (encoded.referenceValue !== null && written.field.storage.type === "reference") {
      await registry.authoriseRecord({ session, transaction: tx }, written.field.storage.entity, { recordId: encoded.referenceValue, intent: "read" });
      if (latest.field.storage.type === "reference")
        await registry.authoriseRecord({ session, transaction: tx }, latest.field.storage.entity, { recordId: encoded.referenceValue, intent: "read" });
    }
    saved.push({ operationId: row.id, definitionId: row.definitionId, definitionRevision: entry.definitionRevision, versionId: row.versionId, generationId: row.generationId,
      fingerprint: encoded.fingerprint, requestChecksum, extensionId: row.slot.extensionId, extensionRevision: parsed.data.extensionRevision,
      slotId: row.slotId, slotRevision: row.revision, valueRevision: row.revision });
  }
  if (retained && checksum(saved) !== checksum(retained.fields)) conflict();
  return saved;
}

/** INTERNAL only: lookup before owning effects. No server action, nested engine,
 * window finalisation, validation of new state, or reminted INSERT proof. */
export async function replayTicketFormInTransaction(authenticated: Session, tx: Prisma.TransactionClient, input: TicketFormRequest) {
  try { return await replay(authenticated, tx, input); } catch (error) { throwTicketFormReceiptError(error); }
}
async function replay(authenticated: Session, tx: Prisma.TransactionClient, input: TicketFormRequest) {
  const request = ticketFormRequestSchema.parse(input), current = await authority(authenticated, tx, request), receipt = await receiptRow(current, request);
  if (!receipt) {
    if (request.packet.fields.length && await tx.studioFieldValue.count({ where: { organisationId: current.session.organisationId,
      id: { in: request.packet.fields.map(field => field.operationId.toLowerCase()) } } })) conflict();
    return null;
  }
  const native = await owningRecord(current, request.operation, receipt.recordId);
  if (native.version < receipt.recordRevision) conflict();
  await fields(current, request, receipt, false, receipt);
  return { recordId: receipt.recordId, recordRevision: receipt.recordRevision, replayed: true as const };
}

/** INTERNAL trusted post-final-validator completion only. Caller supplies actual
 * INSERT/CAS result and field staging revision, never a client's created ID or a
 * claim that a validator ran. Exceptions must roll back the WHOLE owning tx. */
export async function completeTicketFormInTransaction(authenticated: Session, tx: Prisma.TransactionClient, input: TicketFormRequest, serverResult: TicketFormResult) {
  try { return await complete(authenticated, tx, input, serverResult); } catch (error) { throwTicketFormReceiptError(error); }
}
async function complete(authenticated: Session, tx: Prisma.TransactionClient, input: TicketFormRequest, serverResult: TicketFormResult) {
  const request = ticketFormRequestSchema.parse(input), result = ticketFormResultSchema.parse(serverResult), current = await authority(authenticated, tx, request);
  if (request.operation === "create" ? result.recordRevision !== 1 || result.fieldRecordRevision !== 1
    : result.recordId !== request.recordId || result.recordRevision !== request.recordRevision + 1 || ![request.recordRevision, result.recordRevision].includes(result.fieldRecordRevision)) conflict();
  if (await receiptRow(current, request)) conflict();
  const native = await owningRecord(current, request.operation, result.recordId);
  if (native.version !== result.recordRevision) conflict();
  const written = await fields(current, request, result, true);
  const receipt = ticketFormReceiptSchema.parse({ schemaVersion: 1, organisationId: current.session.organisationId, actorUserId: current.session.userId,
    operationId: request.packet.operationId.toLowerCase(), operation: request.operation, ...result,
    requestRecordRevision: request.operation === "create" ? 1 : request.recordRevision, nativeRequestChecksum: request.nativeRequestChecksum,
    packetChecksum: ticketFormPacketChecksum(request.packet), fields: written });
  await tx.auditEntry.create({ data: { id: ticketFormReceiptKey(request.packet.operationId), organisationId: current.session.organisationId,
    actorUserId: current.session.userId, action: ACTION, entityType: ENTITY, entityId: result.recordId, after: receipt } });
  return { recordId: receipt.recordId, recordRevision: receipt.recordRevision, replayed: false as const };
}
