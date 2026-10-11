import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { resolveFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "../../src/core/studio/fields/required-contract";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { readCurrentFieldValue } from "../../src/core/studio/fields/runtime-read";
import { writeFieldValue } from "../../src/core/studio/fields/runtime-write";
import { retireFieldDefinition } from "../../src/core/studio/fields/retirement";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { compileFieldMigrationMetadata } from "../../src/core/studio/fields/migrations/metadata";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { cancelFieldMigrationPublication } from "../../src/core/studio/fields/migrations/cancellation";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { workScope } from "../../src/core/service-work/access";
import { lockWork, workEvent } from "../../src/core/service-work/engine";
import { createTicketWithFieldInitialisation } from "../../src/core/service-work/studio-create";
import { withValidatedTicketMutation } from "../../src/core/service-work/studio-enforcement";
import { raceAtFieldEntityLock } from "./check-field-concurrency";

/** Exact original Test driver only. Normal reviewed services create retained
 * closed1/closed2 windows. Successful native probes intentionally roll back; the
 * concurrent ordinary saves commit through the public value service. Neither
 * fixture seeding nor this checker constitutes customer conditional authoring. */
export async function checkFieldNativeWindows(actor: Session, principal: FieldMigrationPrincipal,
  customerUserId: string, parentId: string, peerId: string, ordinaryDefinitionId: string,
  capabilities: { sourceRead: string; targetRead: string; write: string }) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  const organisationId = actor.organisationId, scope = { organisationId };
  const company = await db.organisation.findFirstOrThrow({ where: { id: organisationId, isTest: true,
    kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, slug: { startsWith: "studio-check-" } } });
  assert(await db.user.findFirst({ where: { id: customerUserId,
    email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } }));
  const customerMember = await db.membership.findFirstOrThrow({ where: { organisationId, userId: customerUserId, active: true } });
  const staffMember = await db.membership.findFirstOrThrow({ where: { id: actor.membershipId, organisationId, userId: actor.userId, active: true } });
  const parent = await db.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId, kind: "TICKET" } });
  assert(await db.serviceWorkItem.findFirst({ where: { id: peerId, organisationId, kind: "TICKET" } }));
  const otherWrite = "tickets.field.native_window_other_write";
  const extra = ["tickets.ticket.watch", "tickets.ticket.create"];
  const grants = [...new Set([...customerMember.grantedCapabilities, ...extra])];
  const definitions: string[] = [];
  try {
    await db.membership.update({ where: { id: customerMember.id, organisationId }, data: {
      grantedCapabilities: grants, deniedCapabilities: customerMember.deniedCapabilities.filter(cap => !extra.includes(cap)),
    } });
    await db.membership.update({ where: { id: staffMember.id, organisationId },
      data: { grantedCapabilities: [...new Set([...staffMember.grantedCapabilities, otherWrite])] } });
    const author = await resolveFieldMigrationPrincipal(principal), resolvedCustomer = await sessionForUser(organisationId, customerUserId); assert(resolvedCustomer);
    const customer: Session = resolvedCustomer;
    for (const cap of ["studio.definition.read", "studio.definition.edit", "studio.definition.publish", otherWrite]) assert(!customer.capabilities.has(cap));
    const registry = studioRegistry(), reference = (version: number) => {
      const m = registry.describe("tickets.ticket", version);
      return { id: m.id, version: m.version, schemaHash: m.schemaHash, contractHash: m.contractHash };
    };
    async function source(key: string, writeCapability: string) {
      const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: reference(2), storageGeneration: randomUUID(),
        field: { key, label: `Exact Test ${key}`, classification: "confidential", readCapability: capabilities.sourceRead,
          writeCapability, storage: { type: "integer" } } });
      const definition = await createDraft(author, { key: `tickets.ticket.${key}`, name: payload.field.label, kind: "customField", payload });
      definitions.push(definition.id);
      const published = await publishDraft(author, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
      const current = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definition.id } });
      await activateVersion(author, { definitionId: definition.id, versionId: published.versionId, revision: current.revision });
      return { definitionId: definition.id, payload };
    }
    const first = await source("native_window_one", capabilities.write), second = await source("native_window_two", otherWrite);
    await writeFieldValue(customer, await request(first.definitionId, parentId, 2));
    async function publishedTarget(field: typeof first, conditional: boolean) {
      const current = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: field.definitionId }, include: { draft: true } }); assert(current.draft);
      let draftRevision: number;
      if (conditional) {
        // Exact Test-only saved-draft seed, identical to the existing closed2
        // acceptance path. Real reviewed operations below own all publication.
        draftRevision = await withFieldMigrationAuthority(author, principal, async ({ session, transaction: tx }) => {
          const payload = conditionalFieldPayloadSchema.parse({ ...field.payload, schemaVersion: 2, entity: reference(9),
            storageGeneration: randomUUID(), field: { ...field.payload.field, readCapability: capabilities.targetRead,
              storage: { type: "decimal", precision: 28, scale: 10 } },
            requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "absent" }] } });
          const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, field.definitionId, payload);
          assert.equal((await tx.studioDraft.updateMany({ where: { id: current.draft!.id, organisationId, revision: current.draft!.revision },
            data: { payload: compiled.payload, revision: { increment: 1 }, validation: Prisma.DbNull } })).count, 1);
          await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "studio.native_window.test_draft_seeded",
            entityType: "StudioDefinition", entityId: field.definitionId } });
          return current.draft!.revision + 1;
        });
      } else {
        const payload = customFieldPayloadSchema.parse({ ...field.payload, entity: reference(5), storageGeneration: randomUUID(),
          field: { ...field.payload.field, readCapability: capabilities.targetRead, storage: { type: "decimal" } } });
        draftRevision = (await updateDraft(author, { definitionId: field.definitionId, revision: current.draft.revision, payload })).revision;
      }
      const prepared = await startFieldMigrationPreparation(author, principal, { operationId: randomUUID(), definitionId: field.definitionId,
        definitionRevision: current.revision, draftRevision, conversion: { kind: "integer_to_decimal" } });
      let batch = await collectFieldMigrationBatch(author, { preparationId: prepared.id, revision: prepared.revision, limit: 2 });
      for (let page = 0; !batch.cursorExhausted; page++) { assert(page < 100); batch = await collectFieldMigrationBatch(author, { preparationId: prepared.id, revision: batch.revision, limit: 2 }); }
      const review = await sealFieldMigrationPreparation(author, { preparationId: prepared.id, revision: batch.revision }); assert.equal(review.summary.invalidCount, 0);
      const publication = await publishReviewedFieldMigration(author, { preparationId: prepared.id, revision: review.revision,
        reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
      return { field, id: prepared.id, review, publication };
    }
    type Published = Awaited<ReturnType<typeof publishedTarget>>;
    async function cutover(published: Published) {
      let execution = await startFieldMigrationExecution(author, { preparationId: published.id,
        publicationRevision: published.publication.publicationRevision, reviewChecksum: published.review.checksum });
      for (let page = 0; execution.state !== "READY"; page++) { assert(page < 100); execution = await executeFieldMigrationBatch(author, { preparationId: published.id, revision: execution.revision, limit: 2 }); }
      const current = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: published.field.definitionId } });
      await cutoverReviewedFieldMigration(author, { preparationId: published.id, reviewChecksum: published.review.checksum,
        definitionRevision: current.revision, publicationRevision: published.publication.publicationRevision, executionRevision: execution.revision });
    }
    const a = await publishedTarget(first, false); await cutover(a);
    const b = await publishedTarget(second, true);
    const snapshot = async () => ({
      native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
      events: await db.serviceWorkEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      cases: await db.serviceCase.findMany({ where: scope, orderBy: { id: "asc" } }),
      entries: await db.serviceEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      audit: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      outbox: await db.domainOutbox.findMany({ where: scope, orderBy: { id: "asc" } }),
      definitions: await db.studioDefinition.findMany({ where: scope, orderBy: { id: "asc" } }),
      drafts: await db.studioDraft.findMany({ where: scope, orderBy: { id: "asc" } }),
      versions: await db.studioDefinitionVersion.findMany({ where: scope, orderBy: { id: "asc" } }),
      dependencies: await db.studioDependency.findMany({ where: scope, orderBy: { id: "asc" } }),
      bindings: await db.studioFieldBinding.findMany({ where: scope, orderBy: { definitionId: "asc" } }),
      generations: await db.studioFieldGeneration.findMany({ where: scope, orderBy: { id: "asc" } }),
      extensions: await db.studioExtensionRecord.findMany({ where: scope, orderBy: { id: "asc" } }),
      slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }),
      values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }),
      preparations: await db.studioFieldMigrationPreparation.findMany({ where: scope, orderBy: { id: "asc" } }),
      observations: await db.studioFieldMigrationObservation.findMany({ where: scope, orderBy: [{ preparationId: "asc" }, { recordId: "asc" }] }),
      publications: await db.studioFieldMigrationPublication.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      receipts: await db.studioFieldMigrationCutover.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      executions: await db.studioFieldMigrationExecution.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      outcomes: await db.studioFieldMigrationOutcome.findMany({ where: scope, orderBy: [{ preparationId: "asc" }, { recordId: "asc" }] }),
    });
    async function request(definitionId: string, recordId: string, value: unknown) {
      const read = await readCurrentFieldValue(customer, { definitionId, recordId });
      return { operationId: randomUUID(), definitionId, versionId: read.versionId, generationId: read.generationId,
        definitionRevision: read.definitionRevision, recordId, recordRevision: read.recordRevision,
        extensionRevision: read.extensionRevision, slotRevision: read.slotRevision, valueRevision: read.valueRevision, value };
    }
    async function native(tx: Prisma.TransactionClient, create = false) {
      await withValidatedTicketMutation({ session: customer, transaction: tx }, create ? "tickets.ticket.create" : "tickets.ticket.watch", async current => {
        if (create) {
          const created = await createTicketWithFieldInitialisation({ session: current, transaction: tx }, {
            organisationId, kind: "TICKET", queueId: parent.queueId, requesterUserId: customerUserId,
            number: `STUDIO-WINDOW-${randomUUID()}`, subject: "Exact Test window creation rollback probe",
          }, async () => undefined);
          await workEvent(tx, current, created.work, "CREATED", "Exact Test window creation");
        } else {
          const work = await tx.serviceWorkItem.findFirstOrThrow({ where: { AND: [workScope(current), { id: parentId }] } });
          await lockWork(tx, current, work.id, work.version, { watcherIds: [...new Set([...work.watcherIds, customerUserId])] });
          await workEvent(tx, current, work, "WATCH_CHANGED", "Exact Test window rollback probe");
        }
      });
    }
    const requestResult = await request(ordinaryDefinitionId, parentId, "45"), mixed = await snapshot();
    await assert.rejects(() => writeFieldValue(customer, requestResult), /FIELD_MIGRATION_IN_PROGRESS/);
    assert.deepEqual(await snapshot(), mixed);
    async function frozenNative(create: boolean) {
      await assert.rejects(() => db.$transaction(tx => native(tx, create), { isolationLevel: "Serializable", timeout: 30_000 }), /FIELD_MIGRATION_IN_PROGRESS/);
      assert.deepEqual(await snapshot(), mixed);
    }
    await frozenNative(false); await frozenNative(true);
    await cancelFieldMigrationPublication(author, principal, { preparationId: b.id, revision: b.publication.publicationRevision });
    assert.equal((await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { ...scope, preparationId: b.id } })).state, "CANCELLED");
    const b2 = await publishedTarget(second, true); await cutover(b2);
    const two = await snapshot(), ids = [a.id, b2.id];
    for (const id of ids) assert.equal(two.receipts.find(row => row.preparationId === id)?.state, "ACTIVATED");
    // Both actual finalizations and native/event/outbox effects occur before
    // rollback. This deliberately preserves the driver's original native rows.
    const marker = new Error("STUDIO_NATIVE_WINDOWS_ROLLBACK");
    await assert.rejects(() => db.$transaction(async tx => {
      await native(tx);
      for (const id of ids) {
        const receipt = await tx.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: id } });
        assert.equal(receipt.state, "FINALIZED"); assert.equal(receipt.settledBy, customerUserId);
        assert.equal((await tx.studioFieldMigrationPublication.findFirstOrThrow({ where: { ...scope, preparationId: id } })).state, "COMPLETED");
        assert.equal(await tx.auditEntry.count({ where: { ...scope, entityId: id, actorUserId: customerUserId, action: "studio.field.migration.finalized" } }), 1);
      }
      assert.equal((await tx.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: parentId } })).version, parent.version + 1);
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
      throw marker;
    }, { isolationLevel: "Serializable", timeout: 30_000 }), error => error === marker);
    assert.deepEqual(await snapshot(), two);
    // Force the SECOND settlement Audit to fail after the first finalizer; all
    // receipts/native/events/support/value effects must remain unchanged.
    const laterId = [a, b2].sort((left, right) => left.field.definitionId.localeCompare(right.field.definitionId))[1].id;
    const trigger = `studio_native_windows_${randomUUID().replaceAll("-", "")}`;
    for (const value of [trigger, organisationId, laterId]) assert(/^[a-zA-Z0-9_-]+$/.test(value));
    try {
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${organisationId}' AND NEW."entityId"='${laterId}' AND NEW.action='studio.field.migration.finalized' THEN RAISE EXCEPTION 'Exact Test native window Audit failure'; END IF; RETURN NEW; END $$;`);
      await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
      await assert.rejects(() => db.$transaction(tx => native(tx), { isolationLevel: "Serializable", timeout: 30_000 }), /Exact Test native window Audit failure/);
      assert.deepEqual(await snapshot(), two);
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`);
      await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`);
    }
    const requests = [await request(first.definitionId, parentId, "1.2"), await request(first.definitionId, peerId, "2.3")];
    const results = await raceAtFieldEntityLock(organisationId, [() => writeFieldValue(customer, requests[0]), () => writeFieldValue(customer, requests[1])]);
    assert.equal(results.filter(row => row.status === "fulfilled").length, 1);
    for (const row of results) if (row.status === "rejected") assert.match(String(row.reason), /CONFLICT|changed|serializ/i);
    for (const [index, row] of results.entries()) if (row.status === "rejected") await writeFieldValue(customer, await request(first.definitionId, requests[index].recordId, requests[index].value));
    for (const id of ids) {
      const receipt = await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: id } });
      assert.equal(receipt.state, "FINALIZED"); assert.equal(receipt.settledBy, customerUserId);
      assert.equal(await db.auditEntry.count({ where: { ...scope, entityId: id, action: "studio.field.migration.finalized" } }), 1);
    }
    const after = await snapshot();
    assert.deepEqual(after.native, two.native); assert.deepEqual(after.events, two.events);
    const sourceGenerations = [first.payload.storageGeneration, second.payload.storageGeneration];
    assert.deepEqual(after.values.filter(value => sourceGenerations.includes(value.generationId)),
      two.values.filter(value => sourceGenerations.includes(value.generationId)));
    // Retire ONLY these exact new Test definitions after windows settle. Reset
    // the Test-seeded conditional draft first through its genuine owning context.
    await withFieldMigrationAuthority(author, principal, async ({ session, transaction: tx }) => {
      const draft = await tx.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: second.definitionId } });
      assert.equal((await tx.studioDraft.updateMany({ where: { id: draft.id, organisationId, revision: draft.revision },
        data: { payload: second.payload, revision: { increment: 1 }, validation: Prisma.DbNull } })).count, 1);
      await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "studio.native_window.test_draft_restored", entityType: "StudioDefinition", entityId: second.definitionId } });
    });
    for (const id of definitions) {
      const current = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id } });
      await retireFieldDefinition(author, { definitionId: id, revision: current.revision });
    }
    console.log("STUDIO NATIVE WINDOWS PASS: mixed real closed1 CUTOVER/closed2 PUBLISHED freezes unrelated ordinary save and actual native write/creation with unchanged snapshots; normal cancellation and second reviewed cutover; two actual native window finalizers and settlement Audits before intentional rollback, actual Audit failure atomic rollback; concurrent different-record PUBLIC ordinary saves wait on real advisory lock then finalize both once, fresh loser retry; source/target history retained, native rows/events unchanged. Native HTTP forms and additional publication races remain separate evidence.");
  } finally {
    await db.membership.update({ where: { id: customerMember.id, organisationId }, data: { grantedCapabilities: customerMember.grantedCapabilities, deniedCapabilities: customerMember.deniedCapabilities } });
    await db.membership.update({ where: { id: staffMember.id, organisationId }, data: { grantedCapabilities: staffMember.grantedCapabilities } });
  }
}
