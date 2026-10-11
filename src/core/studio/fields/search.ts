import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { fieldDefinitionKey } from "./binding";
import { encodeFieldValue } from "./codec";
import { fieldRuntimeAuthorityInTransaction, withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "./runtime-authority";
import { readVersionedFieldPlanInTransaction, readVersionedFieldValueInTransaction } from "./runtime-read";
import { fieldSearchRequestSchema, type FieldSearchRequest, type FieldSearchResult } from "./search-contract";

function invalid(): never { throw new Error("FIELD_STORAGE_INVALID: configured search is unavailable."); }
function conflict(): never { throw new Error("CONFLICT: configured search changed. Refresh before continuing."); }
/** Metadata only; never put protected value columns into the preflight query. */
const writtenMetadata = { id: true, organisationId: true, definitionId: true, generationId: true, slotId: true, versionId: true,
  revision: true, valueType: true, schemaVersion: true } as const;

function predicate(payload: Awaited<ReturnType<typeof readVersionedFieldPlanInTransaction>>, filter: FieldSearchRequest["filter"]): Prisma.StudioFieldValueWhereInput {
  const field = payload.field, storage = field.storage;
  if (!field.indexed || ["multi_enum", "address"].includes(storage.type)) throw new Error("FIELD_SEARCH_UNSUPPORTED: this field is not configured for indexed scalar search.");
  if (filter.value !== null && filter.value.type !== storage.type) throw new Error("FIELD_SEARCH_INVALID: filter type differs from this field.");
  // Searching does not select a new business value. Retired enum IDs remain
  // searchable; null means an explicit current null, not an absent slot/record.
  const queryField = { ...field, required: false, ...(storage.type === "enum" ? { storage: { ...storage, options: storage.options.map(option => ({ ...option, retired: false })) } } : {}) };
  const encoded = encodeFieldValue(queryField, filter.value?.value ?? null);
  if (filter.operator === "equals") return { fingerprint: encoded.fingerprint };
  const bound = filter.operator;
  switch (storage.type) {
    case "integer": case "duration": return { isNull: false, integerValue: { [bound]: encoded.integerValue! } };
    case "decimal": return { isNull: false, decimalValue: { [bound]: encoded.decimalValue! } };
    case "money": return { isNull: false, currency: encoded.currency, decimalValue: { [bound]: encoded.decimalValue! } };
    case "date": return { isNull: false, dateValue: { [bound]: encoded.dateValue! } };
    case "datetime": return { isNull: false, instantValue: { [bound]: encoded.instantValue! } };
    default: throw new Error("FIELD_SEARCH_UNSUPPORTED: this type supports indexed equality only.");
  }
}

/** Current owner-selected native window first; all selected written permissions
 * next; protected indexed predicates last. No caller record IDs, owner callbacks,
 * arbitrary joins/SQL, configuration-edit grant or private match counts. */
export async function searchCurrentFieldValuesInTransaction(supplied: FieldRuntimeAuthority, input: unknown, serverEntityId?: string): Promise<FieldSearchResult> {
  const request = fieldSearchRequestSchema.parse(input);
  // Even direct internal callers need the genuine current locked authority.
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  const { session, transaction: tx, registry } = authority;
  const definitionId = request.definitionId.toLowerCase();
  await tx.$queryRaw`SELECT id FROM studio_definitions WHERE id=${definitionId}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  const definition = await tx.studioDefinition.findFirst({ where: { id: definitionId, organisationId: session.organisationId, kind: "customField", retiredAt: null }, include: { activeVersion: true } });
  if (!definition?.activeVersion) throw new Error("FIELD_UNAVAILABLE: configured search is unavailable.");
  if (definition.id !== definitionId || definition.organisationId !== session.organisationId || definition.activeVersionId !== definition.activeVersion.id) invalid();
  const payload = await readVersionedFieldPlanInTransaction(authority, definition.activeVersion, definition.id);
  if (definition.key !== fieldDefinitionKey(payload)) invalid();
  if (serverEntityId !== undefined && payload.entity.id !== serverEntityId) throw new Error("FIELD_UNAVAILABLE: this field is not approved by this owning surface.");
  if (definition.revision !== request.definitionRevision || definition.activeVersionId !== request.versionId.toLowerCase()
    || payload.storageGeneration !== request.generationId.toLowerCase()) conflict();
  const whereValue = predicate(payload, request.filter);
  const cursorChecksum = checksum({ organisationId: session.organisationId, actorUserId: session.userId, definitionId: definition.id,
    definitionRevision: definition.revision, versionId: definition.activeVersionId, generationId: payload.storageGeneration, filter: request.filter });
  if (request.cursor && request.cursor.checksum !== cursorChecksum) conflict();
  const window = await registry.invokeFieldSearchWindow({ session, transaction: tx }, payload.entity,
    { ...(request.cursor ? { after: request.cursor.after } : {}), limit: request.limit });
  if (!window.records.length) return { records: [], next: null };
  const slots = await tx.studioFieldSlot.findMany({ where: { organisationId: session.organisationId, entityId: payload.entity.id,
    definitionId: definition.id, generationId: payload.storageGeneration,
    extension: { organisationId: session.organisationId, entityId: payload.entity.id, recordId: { in: window.records.map(record => record.recordId) } } },
    select: { id: true, organisationId: true, entityId: true, definitionId: true, generationId: true, revision: true, activeValueId: true,
      extensionId: true, extension: { select: { id: true, organisationId: true, entityId: true, recordId: true } }, activeValue: { select: writtenMetadata } }, take: request.limit + 1 });
  if (slots.length > window.records.length) invalid();
  const selected: { slot: typeof slots[number]; payload: typeof payload }[] = [], recordIds = new Set<string>();
  for (const slot of slots) {
    const native = window.records.find(record => record.recordId === slot.extension.recordId), row = slot.activeValue;
    if (!native || recordIds.has(native.recordId) || slot.organisationId !== session.organisationId || slot.entityId !== payload.entity.id
      || slot.definitionId !== definition.id || slot.generationId !== payload.storageGeneration || slot.extensionId !== slot.extension.id
      || slot.extension.organisationId !== session.organisationId || slot.extension.entityId !== payload.entity.id
      || (slot.activeValueId === null) !== (row === null)) invalid();
    recordIds.add(native.recordId);
    if (!row) continue;
    if (slot.activeValueId !== row.id || row.organisationId !== session.organisationId || row.definitionId !== definition.id
      || row.generationId !== payload.storageGeneration || row.slotId !== slot.id || row.versionId !== row.schemaVersion.id
      || row.revision !== slot.revision || row.valueType !== payload.field.storage.type) invalid();
    const written = await readVersionedFieldPlanInTransaction(authority, row.schemaVersion, definition.id);
    if (written.entity.id !== payload.entity.id || written.field.key !== payload.field.key || written.storageGeneration !== payload.storageGeneration
      || written.field.storage.type !== payload.field.storage.type) invalid();
    const anchor = await registry.authoriseRecord({ session, transaction: tx }, written.entity, { recordId: native.recordId, intent: "read" });
    if (anchor.revision !== native.revision) conflict();
    // Reference equality never probes whether an unreadable target is linked.
    if (request.filter.value?.type === "reference") {
      if (written.field.storage.type !== "reference" || payload.field.storage.type !== "reference") invalid();
      for (const ref of [payload.field.storage.entity, written.field.storage.entity])
        await registry.authoriseRecord({ session, transaction: tx }, ref, { recordId: request.filter.value.value, intent: "read" });
    }
    selected.push({ slot, payload: written });
  }
  // No typed columns/predicate were queried until every selected policy passed.
  const rows = selected.length ? await tx.studioFieldValue.findMany({ where: { organisationId: session.organisationId, definitionId: definition.id,
    generationId: payload.storageGeneration, OR: selected.map(({ slot }) => ({ id: slot.activeValueId!, slotId: slot.id })), ...whereValue },
    include: { schemaVersion: true }, take: request.limit }) : [];
  const matched = new Set<string>();
  for (const row of rows) {
    const item = selected.find(item => item.slot.activeValueId === row.id);
    if (!item || matched.has(item.slot.extension.recordId) || row.versionId !== item.slot.activeValue!.versionId
      || row.revision !== item.slot.revision || row.slotId !== item.slot.id || row.valueType !== item.slot.activeValue!.valueType) invalid();
    await readVersionedFieldValueInTransaction(authority, payload, definition.id, payload.storageGeneration, item.slot.id, item.slot.extension.recordId, row);
    matched.add(item.slot.extension.recordId);
  }
  return { records: window.records.filter(record => matched.has(record.recordId)), next: window.next ? { after: window.next, checksum: cursorChecksum } : null };
}

export function searchCurrentFieldValues(authenticated: Session, input: unknown) {
  return withFieldRuntimeAuthority(authenticated, authority => searchCurrentFieldValuesInTransaction(authority, input));
}
