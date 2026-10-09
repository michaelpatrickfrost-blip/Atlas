import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { Prisma } from "../../src/generated/prisma/client";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { activeDefinition, activateVersion, createDraft, getDefinition, publishDraft, updateDraft, validateDraft } from "../../src/core/studio/definitions/service";
import { retireFieldDefinition } from "../../src/core/studio/fields/retirement";
import { createFieldConverter, analyseFieldEvolution } from "../../src/core/studio/fields/evolution";
import { decodeStoredFieldValue } from "../../src/core/studio/fields/codec";
import { customFieldPayloadSchema, type CustomFieldPayload } from "../../src/core/studio/fields/schema";
import { checksum } from "../../src/core/studio/registry/contracts";

/** Privileged schema acceptance, not the unfinished owner-authorised value API. */
export async function checkFieldStorage(actor: Session, other: Session) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const session of [actor, other]) assert(await db.organisation.findFirst({ where: { id: session.organisationId, isTest: true, slug: { startsWith: "studio-check-" } } }));
  await db.moduleState.updateMany({ where: { organisationId: actor.organisationId, moduleId: "tickets" }, data: { enabled: true, entitled: true } });
  const ticket = await db.serviceWorkItem.findFirstOrThrow({ where: { organisationId: actor.organisationId, kind: "TICKET" } });
  const { id, version, schemaHash, contractHash } = studioRegistry().describe("tickets.ticket", 2);
  const entity = { id, version, schemaHash, contractHash };
  async function publishField(key: string, storage: unknown, extra: Record<string, unknown> = {}, session = actor) {
    const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: crypto.randomUUID(), field: { key, label: key, classification: "confidential", storage, ...extra } });
    const definition = await createDraft(session, { key: `${entity.id}.${key}`, name: `Storage acceptance ${key}`, kind: "customField", payload });
    const published = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
    return { definitionId: definition.id, versionId: published.versionId, payload, draftRevision: published.revision };
  }
  const decimal = await publishField("schema_decimal", { type: "decimal", precision: 28, scale: 0 }, { unique: true, required: true });
  const binding = await db.studioFieldBinding.findFirstOrThrow({ where: { definitionId: decimal.definitionId, organisationId: actor.organisationId } });
  assert.equal(binding.initialGenerationId, decimal.payload.storageGeneration);
  assert.equal(await db.studioFieldGeneration.count({ where: { definitionId: decimal.definitionId, organisationId: actor.organisationId } }), 1);
  let def = await getDefinition(actor, decimal.definitionId); assert(def); assert.equal(def.activeVersionId, null);
  await activateVersion(actor, { definitionId: def.id, versionId: decimal.versionId, revision: def.revision });
  await assert.rejects(() => activateVersion(other, { definitionId: def!.id, versionId: decimal.versionId, revision: 0 }), /unavailable/);
  await updateDraft(actor, { definitionId: def.id, revision: decimal.draftRevision, payload: { ...decimal.payload, field: { ...decimal.payload.field, label: "Renamed safely" } } });
  const cosmetic = await publishDraft(actor, { definitionId: def.id, revision: decimal.draftRevision + 1, acknowledgeWarnings: true });
  assert.equal(await db.studioFieldGeneration.count({ where: { definitionId: def.id, organisationId: actor.organisationId } }), 1);
  const before = await getDefinition(actor, def.id); assert(before?.draft);
  await updateDraft(actor, { definitionId: def.id, revision: before.draft.revision, payload: { ...decimal.payload, field: { ...decimal.payload.field, storage: { type: "string", minLength: 0, maxLength: 50, multiline: false } } } });
  const changed = await getDefinition(actor, def.id); assert(changed?.draft);
  await assert.rejects(() => publishDraft(actor, { definitionId: def!.id, revision: changed.draft!.revision, acknowledgeWarnings: true }), /MIGRATION_REQUIRED|generation/);
  assert.equal((await getDefinition(actor, def.id))?.latestVersion, 2, "Failed evolution rolls back the entire publication");
  assert.equal(await db.studioDefinitionVersion.count({ where: { definitionId: def.id, organisationId: actor.organisationId } }), 2);
  await assert.rejects(() => db.studioFieldBinding.update({ where: { definitionId: def!.id }, data: { fieldKey: "recycled" } }), /immutable/);
  await assert.rejects(() => db.studioFieldGeneration.delete({ where: { id: decimal.payload.storageGeneration } }), /immutable/);
  const foreign = await publishField("schema_decimal", { type: "decimal", precision: 28, scale: 0 }, {}, other);
  await assert.rejects(() => db.studioFieldGeneration.create({ data: { id: crypto.randomUUID(), definitionId: foreign.definitionId, organisationId: actor.organisationId, entityId: entity.id, valueType: "decimal", originVersionId: decimal.versionId } }), /origin|schema|foreign key/i);

  const extension = await db.studioExtensionRecord.create({ data: { organisationId: actor.organisationId, entityId: entity.id, recordId: ticket.id, revision: 1 } });
  const fingerprint = checksum({ amount: "9999999999999999999999999999" });
  async function store(field: { definitionId: string; versionId: string; payload: CustomFieldPayload }, typed: Partial<Prisma.StudioFieldValueUncheckedCreateInput>, marker: string | null, extensionId = extension.id) {
    return db.$transaction(async tx => {
      const slot = await tx.studioFieldSlot.create({ data: { organisationId: actor.organisationId, entityId: entity.id, extensionId, definitionId: field.definitionId, generationId: field.payload.storageGeneration } });
      const value = await tx.studioFieldValue.create({ data: { organisationId: actor.organisationId, definitionId: field.definitionId, generationId: field.payload.storageGeneration, slotId: slot.id, versionId: field.versionId, revision: 1, valueType: field.payload.field.storage.type, fingerprint, createdBy: actor.userId, ...typed } });
      await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { activeValueId: value.id, revision: 1, uniqueToken: marker } });
      return value;
    });
  }
  await assert.rejects(() => store(decimal, { decimalValue: "1.5" }, fingerprint), /exact schema/);
  await assert.rejects(() => store(decimal, { isNull: true }, null), /required/);
  await assert.rejects(() => store(decimal, { decimalValue: "1", textValue: "wrong family" }, fingerprint), /typed_family|check constraint/);
  await assert.rejects(() => store(decimal, { decimalValue: "1" }, null), /uniqueness marker/);
  assert.equal(await db.studioFieldSlot.count({ where: { extensionId: extension.id } }), 0, "Every rejected value rolls back slot/value/pointer");
  const value = await store(decimal, { decimalValue: "9999999999999999999999999999" }, fingerprint);
  assert.equal(value.decimalValue?.toFixed(0), "9999999999999999999999999999", "All 28 declared digits preserved exactly");
  assert.deepEqual(decodeStoredFieldValue(decimal.payload.field, value), { type: "decimal", value: "9999999999999999999999999999" });
  await assert.rejects(() => db.studioFieldValue.update({ where: { id: value.id }, data: { decimalValue: "2" } }), /immutable/);
  await assert.rejects(() => db.studioFieldValue.delete({ where: { id: value.id } }), /immutable/);
  const second = await db.studioExtensionRecord.create({ data: { organisationId: actor.organisationId, entityId: entity.id, recordId: `schema-check-${crypto.randomUUID()}`, revision: 1 } });
  await assert.rejects(() => store(decimal, { decimalValue: "9999999999999999999999999999" }, fingerprint, second.id), /Unique constraint|unique constraint/);
  assert.equal(await db.studioFieldSlot.count({ where: { extensionId: second.id } }), 0);
  const money = await publishField("schema_money", { type: "money", precision: 10, scale: 2, currencies: ["GBP"] });
  await assert.rejects(() => store(money, { decimalValue: "12.34", currency: "USD" }, null), /currency/);
  await assert.rejects(() => store(money, { decimalValue: "12.34", textValue: "GBP" }, null), /typed_family|check constraint/);
  const storedMoney = await store(money, { decimalValue: "12.34", currency: "GBP" }, null);
  assert.equal(storedMoney.currency, "GBP"); assert.equal(storedMoney.decimalValue?.toFixed(2), "12.34");
  assert.deepEqual(decodeStoredFieldValue(money.payload.field, storedMoney), { type: "money", value: { amount: "12.34", currency: "GBP" } });
  def = await getDefinition(actor, decimal.definitionId); assert(def);
  await activateVersion(actor, { definitionId: def.id, versionId: cosmetic.versionId, revision: def.revision });
  def = await getDefinition(actor, decimal.definitionId); assert(def);
  await activateVersion(actor, { definitionId: def.id, versionId: decimal.versionId, revision: def.revision });
  // Exercise pure conversion rules on real decoded storage, without migrating it.
  const converted = createFieldConverter(decimal.payload, { ...decimal.payload, storageGeneration: crypto.randomUUID(), field: { ...decimal.payload.field, storage: { type: "decimal", precision: 28, scale: 0 } } }, { kind: "same_type" })(value.decimalValue!.toFixed(0));
  assert.deepEqual(converted, { value: { type: "decimal", value: "9999999999999999999999999999" }, lossy: false });
  assert.equal(analyseFieldEvolution(decimal.payload, { ...decimal.payload, field: { ...decimal.payload.field, label: "New display name" } }).kind, "cosmetic");
  def = await getDefinition(actor, decimal.definitionId); assert(def?.draft);
  const retainedValues = await db.studioFieldValue.findMany({ where: { definitionId: def.id, organisationId: actor.organisationId }, orderBy: { id: "asc" } });
  const retainedGenerations = await db.studioFieldGeneration.findMany({ where: { definitionId: def.id, organisationId: actor.organisationId }, orderBy: { id: "asc" } });
  const auditBefore = await db.auditEntry.count({ where: { organisationId: actor.organisationId, action: "studio.field.retired", entityId: def.id } });
  await assert.rejects(() => retireFieldDefinition({ ...actor, capabilities: new Set(["studio.definition.edit"]) }, { definitionId: def!.id, revision: def!.revision }), /FORBIDDEN/);
  await assert.rejects(() => retireFieldDefinition(other, { definitionId: def!.id, revision: def!.revision }), /CONFLICT/);
  await assert.rejects(() => retireFieldDefinition(actor, { definitionId: def!.id, revision: def!.revision + 1 }), /CONFLICT/);
  // Deliberate audit storage fault in this internal Test call: PostgreSQL text
  // cannot store NUL. Real authenticated actor IDs never contain it. Prove the
  // preceding metadata mutation rolls back when its audit INSERT fails.
  await assert.rejects(() => retireFieldDefinition({ ...actor, userId: `${actor.userId}${String.fromCharCode(0)}` }, { definitionId: def!.id, revision: def!.revision }), /UTF8|0x00|invalid byte|zero byte|NUL/i);
  const afterAuditFault = await getDefinition(actor, def.id); assert(afterAuditFault);
  assert.equal(afterAuditFault.retiredAt, null); assert.equal(afterAuditFault.revision, def.revision);
  assert.equal(await db.auditEntry.count({ where: { organisationId: actor.organisationId, action: "studio.field.retired", entityId: def.id } }), auditBefore);
  const race = await Promise.allSettled([retireFieldDefinition(actor, { definitionId: def.id, revision: def.revision }), retireFieldDefinition(actor, { definitionId: def.id, revision: def.revision })]);
  assert.equal(race.filter(result => result.status === "fulfilled").length, 1);
  const rejected = race.find(result => result.status === "rejected"); assert(rejected?.status === "rejected"); assert.match(String(rejected.reason), /CONFLICT/);
  const retired = await getDefinition(actor, def.id); assert(retired?.retiredAt);
  assert.equal(retired.revision, def.revision + 1); assert.equal(retired.activeVersionId, def.activeVersionId);
  assert.equal(retired.latestVersion, def.latestVersion); assert.deepEqual(retired.versions, def.versions);
  assert.equal(await activeDefinition(actor, def.id), null);
  await assert.rejects(() => updateDraft(actor, { definitionId: def!.id, revision: def!.draft!.revision, payload: decimal.payload }), /CONFLICT/);
  await assert.rejects(() => validateDraft(actor, def!.id, def!.draft!.revision), /CONFLICT/);
  await assert.rejects(() => publishDraft(actor, { definitionId: def!.id, revision: def!.draft!.revision, acknowledgeWarnings: true }), /CONFLICT/);
  await assert.rejects(() => activateVersion(actor, { definitionId: def!.id, versionId: decimal.versionId, revision: retired.revision }), /CONFLICT/);
  await assert.rejects(() => createDraft(actor, { key: `${entity.id}.${decimal.payload.field.key}`, name: "Cannot recycle", kind: "customField", payload: { ...decimal.payload, storageGeneration: crypto.randomUUID() } }), /Unique constraint/i);
  assert.equal(await db.auditEntry.count({ where: { organisationId: actor.organisationId, action: "studio.field.retired", entityId: def.id } }), auditBefore + 1);
  assert.deepEqual(await db.studioFieldValue.findMany({ where: { definitionId: def.id, organisationId: actor.organisationId }, orderBy: { id: "asc" } }), retainedValues);
  assert.deepEqual(await db.studioFieldGeneration.findMany({ where: { definitionId: def.id, organisationId: actor.organisationId }, orderBy: { id: "asc" } }), retainedGenerations);
  assert.deepEqual(await db.serviceWorkItem.findUniqueOrThrow({ where: { id: ticket.id } }), ticket, "Schema acceptance does not mutate canonical ticket data");
  console.log("PASS exact conversion analysis and real field retirement: tenant/publish/CAS race, one atomic audit, no editing/activation/key recycling, last active policy/versions/generations/typed history retained");
  console.log("PASS field publication/binding, cosmetic history and rollback, atomic failed evolution, tenant FKs, typed decimal/money, required values, immutable history, current pointers and scalar uniqueness (privileged schema fixture only; value API pending)");
}
