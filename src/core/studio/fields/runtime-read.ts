import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { StudioDefinitionVersion, StudioFieldValue } from "@/generated/prisma/client";
import { compileCustomFieldForRead, compileCustomFieldForInitialisation, compileCustomFieldForNativeValidation } from "../compiler/fields";
import { checksum } from "../registry/contracts";
import { assertFieldBinding, fieldDefinitionKey } from "./binding";
import { decodeStoredFieldValue } from "./codec";
import { withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "./runtime-authority";
import type { CustomFieldPayload, FieldValue } from "./schema";
import { inspectSealedFieldVersion } from "./sealed-field";
import type { ConditionalFieldPayload } from "./required-contract";

import type { NativeFieldValidationAccess } from "./native-validation-access";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const currentRequest = z.strictObject({ definitionId: z.uuid(), recordId });
const historyRequest = currentRequest.extend({ generationId: z.uuid(), beforeRevision: z.number().int().positive().max(2147483647).optional(), limit: z.number().int().min(1).max(50).default(20) });
type WrittenValue = StudioFieldValue & { schemaVersion: StudioDefinitionVersion };
type FieldPayload = CustomFieldPayload | ConditionalFieldPayload;
type PlanReader<P extends FieldPayload> = (authority: FieldRuntimeAuthority, version: StudioDefinitionVersion, definitionId: string) => Promise<P>;
function unavailable(): never { throw new Error("FIELD_UNAVAILABLE: this field or its retained history is unavailable."); }
function corrupt(): never { throw new Error("FIELD_STORAGE_INVALID: stored field does not match its published schema."); }

export async function readFieldPlanInTransaction(authority: FieldRuntimeAuthority, version: StudioDefinitionVersion, definitionId: string) {
  if (version.definitionId !== definitionId || version.organisationId !== authority.session.organisationId || version.schemaVersion !== 1) corrupt();
  const compiled = await compileCustomFieldForRead(authority.session, version.payload, authority.registry);
  if (compiled.checksum !== version.checksum || checksum(version.compiledPlan) !== compiled.checksum) corrupt();
  await assertFieldBinding(authority.transaction, authority.session, definitionId, compiled.payload);
  return compiled.payload;
}

/** Versioned base-policy reader. Viewing an authorised value does not evaluate
 * its own rule or read private condition inputs. The closed v1 aliases remain
 * available to the ordinary writer until its owning enforcement enables v2. */
export async function readVersionedFieldPlanInTransaction(authority: FieldRuntimeAuthority, version: StudioDefinitionVersion, definitionId: string): Promise<FieldPayload> {
  if (version.schemaVersion === 1) return readFieldPlanInTransaction(authority, version, definitionId);
  const plan = inspectSealedFieldVersion(authority.registry, version, authority.session.organisationId, definitionId), payload = plan.payload;
  const base = await compileCustomFieldForRead(authority.session, { schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }, authority.registry);
  await assertFieldBinding(authority.transaction, authority.session, definitionId, base.payload);
  return payload;
}
export async function readInitialFieldPlanInTransaction(authority: FieldRuntimeAuthority, version: StudioDefinitionVersion, definitionId: string): Promise<FieldPayload> {
  const plan = inspectSealedFieldVersion(authority.registry, version, authority.session.organisationId, definitionId), payload = plan.payload;
  const base = await compileCustomFieldForInitialisation(authority.session, { schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }, authority.registry, "read");
  await assertFieldBinding(authority.transaction, authority.session, definitionId, base.payload);
  return payload;
}

export async function readNativeFieldPlanInTransaction(authority: FieldRuntimeAuthority, version: StudioDefinitionVersion, definitionId: string, access: NativeFieldValidationAccess): Promise<FieldPayload> {
  const plan = inspectSealedFieldVersion(authority.registry, version, authority.session.organisationId, definitionId), payload = plan.payload;
  const base = await compileCustomFieldForNativeValidation(authority, { schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }, access);
  await assertFieldBinding(authority.transaction, authority.session, definitionId, base.payload);
  return payload;
}

/** Server-only resolver. Native access is checked before any extension/value
 * lookup; schema resolution never grants business-record or reference access. */
async function readContext<P extends FieldPayload>(authority: FieldRuntimeAuthority, request: z.infer<typeof currentRequest> & { expectedRevision?: number }, history: boolean, reader: PlanReader<P>, proof?: object, candidateVersionId?: string, native?: NativeFieldValidationAccess) {
  const { session, transaction: tx, registry } = authority;
  await tx.$queryRaw`SELECT id FROM studio_definitions WHERE id=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  const definition = await tx.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: session.organisationId, kind: "customField", ...(history ? {} : { retiredAt: null }) }, include: { activeVersion: true } });
  if (!definition) unavailable();
  const version = candidateVersionId ? await tx.studioDefinitionVersion.findFirst({ where: { id: candidateVersionId, definitionId: definition.id, organisationId: session.organisationId } }) : definition.activeVersion;
  if (!version) unavailable();
  const payload = await reader(authority, version, definition.id);
  if (definition.key !== fieldDefinitionKey(payload)) corrupt();
  const anchor = native ? (await registry.resolveNativeValidationFieldPolicy({ session, transaction: tx }, payload.entity, native.request, native.operation, native.proof)).anchor : proof ? await registry.authoriseCurrentFieldInitialisation({ session, transaction: tx }, payload.entity, proof)
    : await registry.authoriseRecord({ session, transaction: tx }, payload.entity, { recordId: request.recordId, intent: "read" });
  if (anchor.recordId !== request.recordId || anchor.organisationId !== session.organisationId) corrupt();
  if (request.expectedRevision !== undefined && anchor.revision !== request.expectedRevision) throw new Error("CONFLICT: this native record changed. Refresh before saving.");
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: payload.entity.id, recordId: request.recordId } });
  return { definition, version, payload, anchor, extension };
}
export const readNativeFieldContextInTransaction = (authority: FieldRuntimeAuthority, request: z.infer<typeof currentRequest> & { expectedRevision: number }, access: NativeFieldValidationAccess) => {
  if (request.recordId !== access.request.recordId || request.expectedRevision !== access.request.expectedRevision) corrupt();
  return readContext(authority, request, false, (a, v, id) => readNativeFieldPlanInTransaction(a, v, id, access), undefined, undefined, access);
};
export const readFieldContextInTransaction = (authority: FieldRuntimeAuthority, request: z.infer<typeof currentRequest>, history: boolean) => readContext(authority, request, history, readFieldPlanInTransaction);
export const readVersionedFieldContextInTransaction = (authority: FieldRuntimeAuthority, request: z.infer<typeof currentRequest> & { expectedRevision?: number }) => readContext(authority, request, false, readVersionedFieldPlanInTransaction);
export const readVersionedFieldHistoryContextInTransaction = (authority: FieldRuntimeAuthority, request: z.infer<typeof currentRequest>) => readContext(authority, request, true, readVersionedFieldPlanInTransaction);
export const readInitialFieldContextInTransaction = (authority: FieldRuntimeAuthority, request: z.infer<typeof currentRequest> & { expectedRevision?: number }, proof: object) => readContext(authority, request, false, readInitialFieldPlanInTransaction, proof);
/** Internal publication/activation coverage reads an immutable candidate, not
 * the current active schema. Keep the real activation pointer intact; caller
 * must establish complete canonical coverage and its publication authority. */
export const readCandidateFieldContextInTransaction = (authority: FieldRuntimeAuthority, request: z.infer<typeof currentRequest> & { expectedRevision: number }, versionId: string) =>
  readContext(authority, request, false, readVersionedFieldPlanInTransaction, undefined, z.uuid().parse(versionId));

async function readValue(authority: FieldRuntimeAuthority, current: FieldPayload, definitionId: string, generationId: string, slotId: string, recordId: string, row: WrittenValue, reader: PlanReader<FieldPayload>, proof?: object, native?: NativeFieldValidationAccess): Promise<FieldValue | null> {
  if (row.organisationId !== authority.session.organisationId || row.definitionId !== definitionId || row.generationId !== generationId || row.slotId !== slotId
    || row.versionId !== row.schemaVersion.id || !Number.isSafeInteger(row.revision) || row.revision < 1) corrupt();
  const written = await reader(authority, row.schemaVersion, definitionId);
  if (written.entity.id !== current.entity.id || written.field.key !== current.field.key || written.storageGeneration !== generationId || written.field.storage.type !== row.valueType) corrupt();
  const context = { session: authority.session, transaction: authority.transaction };
  // An older written owner contract may impose independent current native access.
  if (native) {
    if (native.request.recordId !== recordId) corrupt();
    await authority.registry.resolveNativeValidationFieldPolicy(context, written.entity, native.request, native.operation, native.proof);
  } else if (proof) {
    const anchor = await authority.registry.authoriseCurrentFieldInitialisation(context, written.entity, proof);
    if (anchor.recordId !== recordId || anchor.organisationId !== authority.session.organisationId) corrupt();
  } else await authority.registry.authoriseRecord(context, written.entity, { recordId, intent: "read" });
  const value = decodeStoredFieldValue(written.field, row);
  if (checksum(value) !== row.fingerprint) corrupt();
  if (value?.type === "reference") {
    if (written.field.storage.type !== "reference") corrupt();
    await authority.registry.authoriseRecord(context, written.field.storage.entity, { recordId: value.value, intent: "read" });
    if (current.storageGeneration === generationId && current.field.storage.type === "reference")
      await authority.registry.authoriseRecord(context, current.field.storage.entity, { recordId: value.value, intent: "read" });
  }
  return value;
}
export const readFieldValueInTransaction = (authority: FieldRuntimeAuthority, current: CustomFieldPayload, definitionId: string, generationId: string, slotId: string, recordId: string, row: WrittenValue) => readValue(authority, current, definitionId, generationId, slotId, recordId, row, readFieldPlanInTransaction);
export const readVersionedFieldValueInTransaction = (authority: FieldRuntimeAuthority, current: FieldPayload, definitionId: string, generationId: string, slotId: string, recordId: string, row: WrittenValue) => readValue(authority, current, definitionId, generationId, slotId, recordId, row, readVersionedFieldPlanInTransaction);
export const readInitialFieldValueInTransaction = (authority: FieldRuntimeAuthority, current: FieldPayload, definitionId: string, generationId: string, slotId: string, recordId: string, row: WrittenValue, proof: object) => readValue(authority, current, definitionId, generationId, slotId, recordId, row, readInitialFieldPlanInTransaction, proof);

/** Written metadata preflight contains no protected value columns. */
export async function preflightNativeWrittenFieldInTransaction(authority: FieldRuntimeAuthority, current: FieldPayload, definitionId: string, generationId: string, slotId: string,
  row: Pick<StudioFieldValue, "id" | "organisationId" | "definitionId" | "generationId" | "slotId" | "versionId" | "revision" | "valueType"> & { schemaVersion: StudioDefinitionVersion }, access: NativeFieldValidationAccess) {
  if (row.organisationId !== authority.session.organisationId || row.definitionId !== definitionId || row.generationId !== generationId || row.slotId !== slotId
    || row.versionId !== row.schemaVersion.id || !Number.isSafeInteger(row.revision) || row.revision < 1) corrupt();
  const written = await readNativeFieldPlanInTransaction(authority, row.schemaVersion, definitionId, access);
  if (written.entity.id !== current.entity.id || written.field.key !== current.field.key || written.storageGeneration !== generationId || written.field.storage.type !== row.valueType) corrupt();
}

export const readNativeFieldValueInTransaction = (authority: FieldRuntimeAuthority, current: FieldPayload, definitionId: string, generationId: string, slotId: string, recordId: string, row: WrittenValue, access: NativeFieldValidationAccess) =>
  readValue(authority, current, definitionId, generationId, slotId, recordId, row, (a, v, id) => readNativeFieldPlanInTransaction(a, v, id, access), undefined, access);

/** No client organisation, draft, schema or permission input; ordinary current
 * value follows the active generation. Retired/obsolete storage is never current. */
export async function readCurrentFieldValue(authenticated: Session, input: unknown) {
  const request = currentRequest.parse(input);
  return withFieldRuntimeAuthority(authenticated, async authority => {
    const { definition, payload, anchor, extension } = await readVersionedFieldContextInTransaction(authority, request);
    const slot = extension && await authority.transaction.studioFieldSlot.findFirst({ where: { organisationId: authority.session.organisationId, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration }, include: { activeValue: { include: { schemaVersion: true } } } });
    if (slot && ((slot.activeValueId === null) !== (slot.activeValue === null))) corrupt();
    if (slot?.activeValue && slot.activeValueId !== slot.activeValue.id) corrupt();
    const value = slot?.activeValue ? await readVersionedFieldValueInTransaction(authority, payload, definition.id, payload.storageGeneration, slot.id, request.recordId, slot.activeValue) : null;
    return { definitionId: definition.id, definitionRevision: definition.revision, versionId: definition.activeVersion!.id, generationId: payload.storageGeneration,
      recordRevision: anchor.revision, extensionRevision: extension?.revision ?? null, slotRevision: slot?.revision ?? null, valueRevision: slot?.activeValue?.revision ?? null,
      state: slot?.activeValue ? "set" as const : "missing" as const, value };
  });
}

/** Bounded authorised history, including retired fields and obsolete generations.
 * Every returned written policy and reference is checked under today's access. */
export async function readFieldValueHistory(authenticated: Session, input: unknown) {
  const request = historyRequest.parse(input);
  return withFieldRuntimeAuthority(authenticated, async authority => {
    const { definition, payload, anchor, extension } = await readVersionedFieldHistoryContextInTransaction(authority, request), tx = authority.transaction;
    const generation = await tx.studioFieldGeneration.findFirst({ where: { id: request.generationId, organisationId: authority.session.organisationId, definitionId: definition.id, entityId: payload.entity.id, binding: { fieldKey: payload.field.key } }, include: { originVersion: true } });
    if (!generation) unavailable();
    const origin = await readVersionedFieldPlanInTransaction(authority, generation.originVersion, definition.id);
    if (origin.storageGeneration !== generation.id || origin.field.key !== payload.field.key || origin.entity.id !== payload.entity.id) corrupt();
    const slot = extension && await tx.studioFieldSlot.findFirst({ where: { organisationId: authority.session.organisationId, extensionId: extension.id, definitionId: definition.id, generationId: generation.id } });
    const rows = slot ? await tx.studioFieldValue.findMany({ where: { organisationId: authority.session.organisationId, definitionId: definition.id, generationId: generation.id, slotId: slot.id, ...(request.beforeRevision === undefined ? {} : { revision: { lt: request.beforeRevision } }) }, orderBy: { revision: "desc" }, take: request.limit + 1, include: { schemaVersion: true } }) : [];
    const checked = [];
    for (const row of rows) checked.push({ id: row.id, revision: row.revision, versionId: row.versionId, createdAt: row.createdAt.toISOString(), value: await readVersionedFieldValueInTransaction(authority, payload, definition.id, generation.id, slot!.id, request.recordId, row) });
    const items = checked.slice(0, request.limit);
    return { definitionId: definition.id, generationId: generation.id, recordRevision: anchor.revision, retired: definition.retiredAt !== null,
      currentGeneration: generation.id === payload.storageGeneration, items, nextBeforeRevision: checked.length > request.limit ? items.at(-1)!.revision : null };
  });
}
