import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { Prisma } from "../../src/generated/prisma/client";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { activateVersion, createDraft, getDefinition, publishDraft, updateDraft } from "../../src/core/studio/definitions/service";
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
  def = await getDefinition(actor, decimal.definitionId); assert(def);
  await activateVersion(actor, { definitionId: def.id, versionId: cosmetic.versionId, revision: def.revision });
  def = await getDefinition(actor, decimal.definitionId); assert(def);
  await activateVersion(actor, { definitionId: def.id, versionId: decimal.versionId, revision: def.revision });
  assert.deepEqual(await db.serviceWorkItem.findUniqueOrThrow({ where: { id: ticket.id } }), ticket, "Schema acceptance does not mutate canonical ticket data");
  console.log("PASS field publication/binding, cosmetic history and rollback, atomic failed evolution, tenant FKs, typed decimal/money, required values, immutable history, current pointers and scalar uniqueness (privileged schema fixture only; value API pending)");
}
