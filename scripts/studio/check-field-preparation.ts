import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { checksum } from "../../src/core/studio/registry/contracts";
import { checkFieldObservation } from "./check-field-observation";
import { checkFieldCollection } from "./check-field-collection";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { checkFieldCoverage } from "./check-field-coverage";
import { checkFieldSealing } from "./check-field-sealing";

/** Actual service proof; writes only exact Test configuration/archive, no target values. */
export async function checkFieldPreparation(session: Session, principal: FieldMigrationPrincipal, otherOrganisationId: string, ticketId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [session.organisationId, otherOrganisationId])
    assert(await db.organisation.findFirst({ where: { id, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  const registry = studioRegistry();
  const reference = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
  const sourcePayload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: reference(2), storageGeneration: crypto.randomUUID(),
    field: { key: "preparation_service", label: "Preparation service", classification: "confidential", storage: { type: "integer" } } });
  const definition = await createDraft(session, { key: "tickets.ticket.preparation_service", name: "Preparation service acceptance", kind: "customField", payload: sourcePayload });
  const source = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
  let current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } });
  await activateVersion(session, { definitionId: definition.id, versionId: source.versionId, revision: current.revision }); assert(current.draft);
  const target = customFieldPayloadSchema.parse({ ...sourcePayload, entity: reference(3), storageGeneration: crypto.randomUUID(), field: { ...sourcePayload.field, storage: { type: "decimal" } } });
  await updateDraft(session, { definitionId: definition.id, revision: current.draft.revision, payload: target });
  current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(current.draft);
  const request = { operationId: crypto.randomUUID(), definitionId: definition.id, definitionRevision: current.revision, draftRevision: current.draft.revision, conversion: { kind: "integer_to_decimal" } };
  const result = await startFieldMigrationPreparation(session, principal, request);
  assert.deepEqual(result, { id: request.operationId, revision: 0, state: "PREPARING" });
  const saved = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: result.id, organisationId: session.organisationId } });
  assert.equal(saved.sourceVersionId, source.versionId); assert.equal(saved.targetGenerationId, target.storageGeneration);
  assert.equal(saved.intentChecksum, checksum(saved.intent));
  assert.deepEqual(await startFieldMigrationPreparation(session, principal, request), result);
  assert.equal(await db.auditEntry.count({ where: { organisationId: session.organisationId, actorUserId: session.userId,
    action: "studio.field.migration.prepared", entityId: result.id } }), 1);
  await checkFieldObservation(session, principal, result.id, ticketId);
  const collectedCount = await checkFieldCollection(session, result.id, otherOrganisationId);
  await checkFieldSealing(session, result.id, otherOrganisationId);
  await checkFieldCoverage(session, result.id, ticketId);
  await assert.rejects(() => startFieldMigrationPreparation(session, principal, { ...request, organisationId: otherOrganisationId }));
  await assert.rejects(() => startFieldMigrationPreparation(session, { ...principal, organisationId: otherOrganisationId }, request), /FORBIDDEN/);
  await assert.rejects(() => startFieldMigrationPreparation(session, principal, { ...request, draftRevision: current.draft!.revision + 1 }), /stale|changed/i);
  const denied = { ...session, capabilities: new Set([...session.capabilities].filter(cap => cap !== "studio.definition.publish")) };
  await assert.rejects(() => startFieldMigrationPreparation(denied, principal, request), /FORBIDDEN/);
  // Force actual Audit failure with a temporary trigger restricted to this exact
  // operation and synthetic actor. Rollback must remove its preparation as well.
  const failingId = crypto.randomUUID(), trigger = `studio_preparation_audit_${failingId.replaceAll("-", "")}`;
  assert(/^[a-z0-9_]+$/.test(trigger) && /^[a-zA-Z0-9_-]+$/.test(session.organisationId) && /^[a-zA-Z0-9_-]+$/.test(session.userId));
  await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${session.organisationId}' AND NEW."actorUserId"='${session.userId}' AND NEW."entityId"='${failingId}' AND NEW.action='studio.field.migration.prepared' THEN RAISE EXCEPTION 'Exact Test preparation Audit failure'; END IF; RETURN NEW; END $$;`);
  try {
    await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
    await assert.rejects(() => startFieldMigrationPreparation(session, principal, { ...request, operationId: failingId }), /Exact Test preparation Audit failure/);
    assert.equal(await db.studioFieldMigrationPreparation.count({ where: { id: failingId } }), 0);
  } finally {
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`);
    await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`);
  }
  await updateDraft(session, { definitionId: definition.id, revision: current.draft.revision, payload: { ...target, field: { ...target.field, label: "Changed after preparation" } } });
  await assert.rejects(() => startFieldMigrationPreparation(session, principal, request), /stale|changed/i);
  await assert.rejects(() => collectFieldMigrationBatch(session, { preparationId: result.id, revision: collectedCount, limit: 1 }), /stale|changed/i);
  assert.equal(await db.studioFieldMigrationPreparation.count({ where: { id: result.id } }), 1);
  assert.equal(await db.studioFieldMigrationObservation.count({ where: { preparationId: result.id } }), collectedCount);
  assert.equal(await db.studioFieldGeneration.count({ where: { id: target.storageGeneration } }), 0);
  console.log("PASS actual preparation service: fresh server source/draft/owner pins, identical replay with one Audit, stale/foreign/client/publish denial, real Audit-failure atomic rollback; bounded observations checked separately, no target values/native changes.");
}
