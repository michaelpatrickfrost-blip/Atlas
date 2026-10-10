import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { decodeStoredFieldValue } from "../../src/core/studio/fields/codec";
import { createDraft, publishDraft, activateVersion, updateDraft, activeDefinition } from "../../src/core/studio/definitions/service";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { cancelFieldMigrationPublication } from "../../src/core/studio/fields/migrations/cancellation";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch, FieldMigrationExecutionError } from "../../src/core/studio/fields/migrations/execution-batch";
import { inspectFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-inspection";
import { writeFieldMigrationRepresentation } from "../../src/core/studio/fields/migrations/representation";
import { fieldMigrationOutcomePinSchema } from "../../src/core/studio/fields/migrations/execution-contract";
const child = promisify(execFile);

/** Actual conversion on only the acceptance driver's isolated Test companies.
 * Native rows are read/owner-approved, never directly mutated by conversion. */
export async function checkFieldExecution(session: Session, principal: FieldMigrationPrincipal, parentId: string, finalId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [session.organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  const nativeWhere = { organisationId: { in: [session.organisationId, otherOrganisationId] } };
  const nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  const registry = studioRegistry();
  const ref = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: crypto.randomUUID(),
    field: { key: "execution_service", label: "Exact Test conversion", classification: "confidential", storage: { type: "integer" } } });
  const definition = await createDraft(session, { key: "tickets.ticket.execution_service", name: "Exact Test conversion", kind: "customField", payload });
  const source = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
  const initialState = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(initialState.draft);
  await activateVersion(session, { definitionId: definition.id, versionId: source.versionId, revision: initialState.revision });
  await withFieldMigrationAuthority(session, principal, async ({ session: fresh, transaction: tx }) => {
    const context = { session: fresh, transaction: tx }, anchor = await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "read" });
    await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "extend", expectedRevision: anchor.revision });
    const scope = { organisationId: fresh.organisationId, entityId: payload.entity.id, recordId: parentId };
    const extension = await tx.studioExtensionRecord.findFirst({ where: scope }) ?? await tx.studioExtensionRecord.create({ data: scope });
    const slot = await tx.studioFieldSlot.create({ data: { organisationId: fresh.organisationId, entityId: payload.entity.id, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration } });
    const value = await tx.studioFieldValue.create({ data: { organisationId: fresh.organisationId, definitionId: definition.id, generationId: payload.storageGeneration,
      slotId: slot.id, versionId: source.versionId, revision: 1, valueType: "integer", integerValue: 9007199254740991n,
      fingerprint: checksum({ type: "integer", value: 9007199254740991 }), createdBy: fresh.userId } });
    await tx.studioExtensionRecord.update({ where: { id: extension.id }, data: { revision: extension.revision + 1 } });
    await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { revision: 1, activeValueId: value.id } });
  });
  const target = customFieldPayloadSchema.parse({ ...payload, entity: ref(5), storageGeneration: crypto.randomUUID(), field: { ...payload.field, storage: { type: "decimal" } } });
  await updateDraft(session, { definitionId: definition.id, revision: initialState.draft.revision, payload: target });
  const current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(current.draft);
  const prepared = await startFieldMigrationPreparation(session, principal, { operationId: crypto.randomUUID(), definitionId: definition.id, definitionRevision: current.revision,
    draftRevision: current.draft.revision, conversion: { kind: "integer_to_decimal" } });
  let collected = await collectFieldMigrationBatch(session, { preparationId: prepared.id, revision: prepared.revision, limit: 2 });
  for (let n = 0; !collected.cursorExhausted; n++) { assert(n < 20); collected = await collectFieldMigrationBatch(session, { preparationId: prepared.id, revision: collected.revision, limit: 2 }); }
  const review = await sealFieldMigrationPreparation(session, { preparationId: prepared.id, revision: collected.revision });
  const published = await publishReviewedFieldMigration(session, { preparationId: prepared.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
  const scope = { preparationId: prepared.id, organisationId: session.organisationId }, fieldScope = { definitionId: definition.id, organisationId: session.organisationId };
  const startRequest = { preparationId: prepared.id, publicationRevision: published.publicationRevision, reviewChecksum: review.checksum };
  const operation = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: prepared.id, organisationId: session.organisationId } });
  const { sealFieldMigrationIntent } = await import("../../src/core/studio/fields/migrations/contracts");
  const intent = sealFieldMigrationIntent(operation.intent).intent;
  const observations = await db.studioFieldMigrationObservation.findMany({ where: scope, orderBy: { recordId: "asc" } }); assert(observations.length >= 3);
  const sourceValues = await db.studioFieldValue.findMany({ where: { ...fieldScope, generationId: payload.storageGeneration }, orderBy: { id: "asc" } });
  const sourceSlots = await db.studioFieldSlot.findMany({ where: { ...fieldScope, generationId: payload.storageGeneration }, orderBy: { id: "asc" } });
  const execution = () => db.studioFieldMigrationExecution.findFirstOrThrow({ where: scope });
  const outcomes = () => db.studioFieldMigrationOutcome.findMany({ where: scope, orderBy: { recordId: "asc" } });
  const targets = () => db.studioFieldValue.findMany({ where: { ...fieldScope, generationId: target.storageGeneration }, orderBy: { id: "asc" } });
  const auditCount = (action: string) => db.auditEntry.count({ where: { organisationId: session.organisationId, entityId: prepared.id, action } });
  const trigger = `studio_execution_test_${crypto.randomUUID().replaceAll("-", "")}`;
  for (const value of [trigger, session.organisationId, session.userId, prepared.id, target.storageGeneration, observations[1].recordId]) assert(/^[a-zA-Z0-9_-]+$/.test(value));
  async function withTrigger(table: "audit_entries" | "studio_field_values", body: string, action: () => Promise<void>) {
    await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN ${body} RETURN NEW; END $$;`);
    try { await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${trigger}();`); await action(); }
    finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON ${table};`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
  }
  await withTrigger("audit_entries", `IF NEW."organisationId"='${session.organisationId}' AND NEW."entityId"='${prepared.id}' AND NEW.action='studio.field.migration.execution_started' THEN RAISE EXCEPTION 'Exact Test start Audit failure'; END IF;`, async () => {
    await assert.rejects(() => startFieldMigrationExecution(session, startRequest), /Exact Test start Audit failure/);
    assert.equal(await db.studioFieldMigrationExecution.count({ where: scope }), 0);
  });
  const started = await startFieldMigrationExecution(session, startRequest);
  assert.deepEqual(await startFieldMigrationExecution(session, startRequest), { ...started, replayed: true }); assert.equal(await auditCount("studio.field.migration.execution_started"), 1);
  const initialExecution = await execution(); assert.equal(checksum(initialExecution.pin), initialExecution.pinChecksum);
  const finalObservation = observations.find(o => o.recordId === finalId); assert(finalObservation);
  await withFieldMigrationAuthority(session, principal, async authority => {
    const context = { session: authority.session, transaction: authority.transaction };
    await assert.rejects(() => registry.authoriseRecord(context, target.entity, { recordId: finalId, intent: "extend", expectedRevision: finalObservation.nativeRevision }), /Reopen active ticket work before changing extension values/);
    const approval = registry.describe("tickets.ticket.field_representation", 1);
    assert.deepEqual(await registry.invokeQueryInTransaction(context, approval, { preparationId: prepared.id, observationId: finalObservation.id }), {
      organisationId: session.organisationId, recordId: finalId, revision: finalObservation.nativeRevision, preparationId: prepared.id, observationId: finalObservation.id, representationOnly: true });
  });
  await assert.rejects(() => startFieldMigrationExecution({ ...session, organisationId: otherOrganisationId }, startRequest), /stale|changed/i);
  await assert.rejects(() => startFieldMigrationExecution(session, { ...startRequest, organisationId: otherOrganisationId }));
  await assert.rejects(() => db.studioFieldMigrationExecution.update({ where: { preparationId: prepared.id }, data: { pinChecksum: "f".repeat(64) } }), /immutable|CAS/);
  await assert.rejects(() => db.studioFieldMigrationExecution.delete({ where: { preparationId: prepared.id } }), /immutable|history|retained/i);
  // Real deferred commit proof: an authorised row cannot be committed alone.
  await assert.rejects(() => withFieldMigrationAuthority(session, principal, async authority => {
    const inspected = await inspectFieldMigrationExecution(authority, intent);
    await writeFieldMigrationRepresentation(authority, inspected, observations[0].id);
  }), /progress must commit together|execution progress|exact completed/i);
  assert.deepEqual(await execution(), initialExecution); assert.equal((await outcomes()).length, 0); assert.equal((await targets()).length, 0);
  await withTrigger("studio_field_values", `IF NEW."organisationId"='${session.organisationId}' AND NEW."generationId"='${target.storageGeneration}' AND EXISTS (SELECT 1 FROM studio_field_slots s JOIN studio_extension_records e ON e.id=s."extensionId" AND e."organisationId"=s."organisationId" WHERE s.id=NEW."slotId" AND e."recordId"='${observations[1].recordId}') THEN RAISE EXCEPTION 'Exact Test mid-batch target failure'; END IF;`, async () => {
    await assert.rejects(() => executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: started.revision, limit: 2 }), e => e instanceof FieldMigrationExecutionError && e.code === "WRITE_FAILED" && e.failureRecorded);
    assert.equal((await outcomes()).length, 0); assert.equal((await targets()).length, 0);
    assert.equal((await execution()).state, "FAILED"); assert.equal((await execution()).processedCount, 0);
  });
  let state = await execution();
  const first = await executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: state.revision, limit: 1 });
  assert.equal(first.processedCount, 1); assert.equal(first.state, "RUNNING");
  const firstSnapshot = await outcomes(); const committed = await execution(); const firstTargets = await targets();
  const childPath = resolve("scripts/studio/field-execution-process-check.ts");
  await assert.rejects(() => child(process.execPath, ["--import", "tsx", childPath, "abort-before-commit", session.organisationId, prepared.id, String(first.revision)], { env: process.env, timeout: 30000 }),
    e => typeof e === "object" && e !== null && "signal" in e && e.signal === "SIGKILL");
  assert.deepEqual(await execution(), committed); assert.deepEqual(await outcomes(), firstSnapshot); assert.deepEqual(await targets(), firstTargets);
  const resumed = await child(process.execPath, ["--import", "tsx", childPath, "resume", session.organisationId, prepared.id, String(first.revision)], { env: process.env, timeout: 30000 });
  assert.equal(JSON.parse(resumed.stdout.trim()).processedCount, 2);
  const afterRestart = await execution();
  assert.deepEqual(await publishReviewedFieldMigration(session, { preparationId: prepared.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false }), { ...published, replayed: true });
  const replay = await executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: first.revision, limit: 2 });
  assert.equal(replay.replayed, true); assert.equal(replay.appended, 0); assert.equal(replay.revision, afterRestart.revision);
  const parent = await db.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId: session.organisationId } });
  const member = await db.serviceQueueMember.findFirstOrThrow({ where: { organisationId: session.organisationId, queueId: parent.queueId, userId: session.userId } });
  await db.serviceQueueMember.delete({ where: { id: member.id, organisationId: session.organisationId } });
  try {
    await assert.rejects(() => executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: afterRestart.revision, limit: 1 }), e => e instanceof FieldMigrationExecutionError && e.code === "ACCESS_CHANGED");
    assert.equal((await outcomes()).length, 2); assert.equal((await execution()).processedCount, 2);
  } finally { await db.serviceQueueMember.create({ data: member }); }
  state = await execution();
  await withTrigger("audit_entries", `IF NEW."organisationId"='${session.organisationId}' AND NEW."entityId"='${prepared.id}' AND NEW.action IN ('studio.field.migration.execution_batched','studio.field.migration.execution_failed') THEN RAISE EXCEPTION 'Exact Test batch and recovery Audit failure'; END IF;`, async () => {
    const before = await execution(), targetBefore = await targets(), outcomeBefore = await outcomes();
    await assert.rejects(() => executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: state.revision, limit: 1 }), e => e instanceof FieldMigrationExecutionError && !e.failureRecorded);
    assert.deepEqual(await execution(), before); assert.deepEqual(await targets(), targetBefore); assert.deepEqual(await outcomes(), outcomeBefore);
  });
  for (let n = 0; state.state !== "READY"; n++) { assert(n < 20); await executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: state.revision, limit: 2 }); state = await execution(); }
  const success = await outcomes(), values = await targets(); assert.equal(success.length, observations.length); assert.equal(values.length, observations.length);
  assert.equal(state.processedCount, observations.length);
  for (const done of success) {
    const pin = fieldMigrationOutcomePinSchema.parse(done.outcome); assert.equal(pin.observationChecksum, checksum(observations.find(o => o.id === done.observationId)!.observation));
    const value = values.find(v => v.id === done.targetValueId); assert(value); assert.equal(value.fingerprint, done.targetFingerprint);
    assert.deepEqual(decodeStoredFieldValue(target.field, value), done.recordId === parentId ? { type: "decimal", value: "9007199254740991" } : null);
    assert.equal(value.jsonValue, null);
  }
  const ready = await executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: state.revision, limit: 2 }); assert.equal(ready.replayed, true); assert.equal(ready.appended, 0);
  await assert.rejects(() => db.studioFieldMigrationOutcome.update({ where: { observationId: success[0].observationId }, data: { targetFingerprint: "f".repeat(64) } }), /immutable|history|retained/i);
  await assert.rejects(() => db.studioFieldMigrationOutcome.delete({ where: { observationId: success[0].observationId } }), /immutable|history|retained/i);
  await assert.rejects(() => db.studioFieldMigrationExecution.update({ where: { preparationId: prepared.id }, data: { state: "RUNNING", revision: state.revision + 1 } }), /immutable|CAS/);
  const finalDefinition = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId } });
  assert.equal(finalDefinition.activeVersionId, source.versionId); assert.equal((await activeDefinition(session, definition.id))?.versionId, source.versionId);
  await assert.rejects(() => activateVersion(session, { definitionId: definition.id, versionId: published.targetVersionId, revision: finalDefinition.revision }), /completed conversion|explicit cutover/i);
  assert.deepEqual(await db.studioFieldValue.findMany({ where: { ...fieldScope, generationId: payload.storageGeneration }, orderBy: { id: "asc" } }), sourceValues);
  assert.deepEqual(await db.studioFieldSlot.findMany({ where: { ...fieldScope, generationId: payload.storageGeneration }, orderBy: { id: "asc" } }), sourceSlots);
  await cancelFieldMigrationPublication(session, principal, { preparationId: prepared.id, revision: published.publicationRevision });
  assert.equal((await execution()).state, "CANCELLED"); assert.deepEqual(await outcomes(), success); assert.deepEqual(await targets(), values);
  await assert.rejects(() => executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: (state.revision + 1), limit: 1 }), e => e instanceof FieldMigrationExecutionError && !e.failureRecorded);
  assert.deepEqual(await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }), nativeBefore);
  console.log("PASS actual reviewed execution: owner-approved final/empty/typed rows, exact precision and immutable lineage; real start/mid-batch/Audit/deferred-progress rollback, forced process death then fresh-process resume and lost-response replay; private/tenant/CAS/history denial, source retained/readable, target activation blocked and cancellation retains outcomes. Both native tenant snapshots unchanged.");
}
