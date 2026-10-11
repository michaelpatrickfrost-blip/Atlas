import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import { sessionForUser } from "../../src/core/auth/session";
import { workScope } from "../../src/core/service-work/access";
import { lockWork, workEvent } from "../../src/core/service-work/engine";
import { createTicketWithFieldInitialisation, authoriseNewTicketFields } from "../../src/core/service-work/studio-create";
import { withValidatedTicketMutation } from "../../src/core/service-work/studio-enforcement";
import { withTicketFieldMutation, authoriseTicketNativeValidation } from "../../src/core/service-work/studio-native";
import { compileCustomFieldForRead } from "../../src/core/studio/compiler/fields";
import { compileConditionalCustomField } from "../../src/core/studio/fields/conditional-compiler";
import { encodeFieldValue } from "../../src/core/studio/fields/codec";
import { registeredRequiredFactMetadata } from "../../src/core/studio/fields/required-owner";
import { validateNativeResultingFieldRequirements } from "../../src/core/studio/fields/required-runtime";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../../src/core/studio/fields/runtime-authority";
import { initialiseFieldValueInTransaction } from "../../src/core/studio/fields/runtime-write";

type CompiledField = Awaited<ReturnType<typeof compileCustomFieldForRead>> | Awaited<ReturnType<typeof compileConditionalCustomField>>;
type ProbeField = { definitionId: string; versionId: string; compiled: CompiledField };
const cap = { source: "tickets.field.native_source_read", target: "tickets.field.native_target_read",
  optional: "tickets.field.native_optional_read", written: "tickets.field.native_written_read", write: "tickets.field.native_write" };

/** Original central driver only. Every new permission/configuration/native/value
 * fixture is inside an intentionally rolled-back Serializable transaction. These
 * are real SQL checks when invoked on the exact synthetic Linux Test identities;
 * source/typechecking alone is not evidence that the probes have passed. */
export async function checkFieldNativeEnforcement(customerUserId: string, organisationId: string,
  otherOrganisationId: string, parentId: string, peerId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: {
    id, isTest: true, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, slug: { startsWith: "studio-check-" },
  } }));
  assert.notEqual(organisationId, otherOrganisationId); assert.notEqual(parentId, peerId);
  assert(await db.user.findFirst({ where: { id: customerUserId,
    email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } }));
  const member = await db.membership.findFirstOrThrow({ where: { organisationId, userId: customerUserId, active: true } });
  const parent = await db.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId, kind: "TICKET" } });
  assert.notEqual(parent.requesterUserId, customerUserId);
  const peerFixture = await db.serviceWorkItem.findFirstOrThrow({ where: { id: peerId, organisationId, kind: "TICKET" } });
  assert.equal(peerFixture.queueId, parent.queueId); assert.notEqual(peerFixture.requesterUserId, customerUserId);
  const foreign = await db.serviceWorkItem.findFirstOrThrow({ where: { organisationId: otherOrganisationId, kind: "TICKET" } });
  const where = { organisationId: { in: [organisationId, otherOrganisationId] } };
  const snapshot = async () => ({
    native: await db.serviceWorkItem.findMany({ where, orderBy: { id: "asc" } }),
    entries: await db.serviceWorkEntry.findMany({ where, orderBy: { id: "asc" } }),
    cases: await db.serviceCase.findMany({ where, orderBy: { id: "asc" } }),
    caseEntries: await db.serviceEntry.findMany({ where, orderBy: { id: "asc" } }),
    audits: await db.auditEntry.findMany({ where, orderBy: { id: "asc" } }),
    outbox: await db.domainOutbox.findMany({ where, orderBy: { id: "asc" } }),
    members: await db.membership.findMany({ where, orderBy: { id: "asc" } }),
    queues: await db.serviceQueue.findMany({ where, orderBy: { id: "asc" } }),
    queueMembers: await db.serviceQueueMember.findMany({ where, orderBy: { id: "asc" } }),
    definitions: await db.studioDefinition.findMany({ where, orderBy: { id: "asc" } }),
    versions: await db.studioDefinitionVersion.findMany({ where, orderBy: { id: "asc" } }),
    dependencies: await db.studioDependency.findMany({ where, orderBy: { id: "asc" } }),
    bindings: await db.studioFieldBinding.findMany({ where, orderBy: { definitionId: "asc" } }),
    generations: await db.studioFieldGeneration.findMany({ where, orderBy: { id: "asc" } }),
    extensions: await db.studioExtensionRecord.findMany({ where, orderBy: { id: "asc" } }),
    slots: await db.studioFieldSlot.findMany({ where, orderBy: { id: "asc" } }),
    values: await db.studioFieldValue.findMany({ where, orderBy: { id: "asc" } }),
    publications: await db.studioFieldMigrationPublication.findMany({ where, orderBy: { preparationId: "asc" } }),
    cutovers: await db.studioFieldMigrationCutover.findMany({ where, orderBy: { preparationId: "asc" } }),
  });
  const before = await snapshot();
  async function rolledBack(run: (tx: Prisma.TransactionClient) => Promise<void>, expected?: RegExp) {
    const marker = new Error("STUDIO_NATIVE_ENFORCEMENT_ROLLBACK");
    await assert.rejects(() => db.$transaction(async tx => {
      await run(tx);
      if (expected) assert.fail("The native mutation should have failed before committing.");
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
      throw marker;
    }, { isolationLevel: "Serializable", timeout: 30_000 }), expected ?? (error => error === marker));
    assert.deepEqual(await snapshot(), before, "Native/typed/configuration/Audit/Outbox/access changes must all roll back.");
  }
  async function principal(tx: Prisma.TransactionClient, grants: string[]) {
    const original = await sessionForUser(organisationId, customerUserId, tx); assert(original);
    const denied = [...new Set([...original.capabilities, ...member.deniedCapabilities,
      "tickets.ticket.manage", "tickets.ticket.read", "studio.definition.read", "studio.definition.edit",
      "studio.definition.publish", "studio.definition.live_test", ...Object.values(cap)])].filter(value => !grants.includes(value));
    await tx.membership.update({ where: { id: member.id, organisationId }, data: { grantedCapabilities: grants, deniedCapabilities: denied } });
    const session = await sessionForUser(organisationId, customerUserId, tx); assert(session);
    for (const value of grants) assert(session.capabilities.has(value));
    for (const value of denied) assert(!session.capabilities.has(value));
    return session;
  }
  const probe = (compiled: CompiledField): ProbeField => ({ definitionId: randomUUID(), versionId: randomUUID(), compiled });
  let fixtures: { source: ProbeField; root: ProbeField; optional: ProbeField; written: ProbeField; reference: ProbeField; initial: ProbeField[] } | undefined;
  // Compile before any owning mutation using a real current Read identity. Even
  // these temporary grants roll back, rather than leaving an elevated principal.
  await rolledBack(async tx => {
    const reader = await principal(tx, ["tickets.ticket.read", ...Object.values(cap)]);
    const { session, registry } = await fieldRuntimeAuthorityInTransaction(reader, tx);
    const reference = (version: number) => { const m = registry.describe("tickets.ticket", version);
      return { id: m.id, version: m.version, schemaHash: m.schemaHash, contractHash: m.contractHash }; };
    async function base(key: string, readCapability: string, required = false, storage: "boolean" | "string" = "string") {
      return compileCustomFieldForRead(session, { schemaVersion: 1, entity: reference(2), storageGeneration: randomUUID(),
        field: { key, label: `Exact Test ${key}`, classification: "confidential", readCapability, writeCapability: cap.write, required, storage: { type: storage } } }, registry);
    }
    const source = probe(await base("native_probe_flag", cap.source, false, "boolean"));
    const entity = reference(9), definitionId = randomUUID();
    const root = { definitionId, versionId: randomUUID(), compiled: await compileConditionalCustomField({ session, registry, definitionId, intent: "read",
      resolveMetadata: async input => input.kind === "native" ? registeredRequiredFactMetadata(session, registry, entity, input.fieldId)
        : { kind: "field", definitionId: source.definitionId, versionId: source.versionId, checksum: source.compiled.checksum,
          organisationId, entity: source.compiled.payload.entity, generationId: source.compiled.payload.storageGeneration,
          field: source.compiled.payload.field, dependencyClosure: [] } }, {
      schemaVersion: 2, entity, storageGeneration: randomUUID(),
      field: { key: "native_probe_notes", label: "Exact Test native notes", classification: "confidential", readCapability: cap.target,
        writeCapability: cap.write, storage: { type: "string" } },
      requiredIf: { match: "all", predicates: [
        { source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } },
        { source: { kind: "field", definitionId: source.definitionId, versionId: source.versionId, checksum: source.compiled.checksum },
          operator: "equals", value: { type: "boolean", value: true } },
      ] },
    }) };
    const written = { definitionId: source.definitionId, versionId: randomUUID(), compiled: await compileCustomFieldForRead(session,
      { ...source.compiled.payload, field: { ...source.compiled.payload.field, readCapability: cap.written } }, registry) };
    const referenceField = probe(await compileCustomFieldForRead(session, { schemaVersion: 1, entity: reference(2), storageGeneration: randomUUID(),
      field: { key: "native_probe_reference", label: "Exact Test native reference", classification: "confidential", required: true,
        readCapability: cap.target, writeCapability: cap.write, storage: { type: "reference", entity: reference(2) } } }, registry));
    fixtures = { source, root, written, reference: referenceField, optional: probe(await base("native_probe_private", cap.optional)),
      initial: [probe(await base("native_initial_one", cap.target, true)), probe(await base("native_initial_two", cap.target, true))] };
  });
  assert(fixtures); const fields = fixtures;
  async function version(tx: Prisma.TransactionClient, field: ProbeField, versionNumber = 1) {
    const { definitionId, versionId, compiled } = field;
    await tx.studioDefinitionVersion.create({ data: { id: versionId, definitionId, organisationId, version: versionNumber,
      semanticVersion: `${versionNumber}.0.0`, schemaVersion: compiled.plan.schemaVersion, payload: compiled.payload,
      compiledPlan: compiled.plan, checksum: compiled.checksum, createdBy: customerUserId } });
    await tx.studioDependency.createMany({ data: compiled.plan.dependencies.map(dependency => ({ definitionId, versionId, organisationId,
      ownerModuleId: dependency.ownerModuleId, contractId: dependency.id, contractVersion: dependency.version,
      schemaHash: dependency.schemaHash, contractHash: dependency.contractHash })) });
  }
  async function install(tx: Prisma.TransactionClient, installed: ProbeField[]) {
    for (const field of installed) {
      const { definitionId, versionId, compiled } = field;
      await tx.studioDefinition.create({ data: { id: definitionId, organisationId, kind: "customField", key: `tickets.ticket.${compiled.payload.field.key}`,
        name: compiled.payload.field.label, createdBy: customerUserId } });
      await version(tx, field);
      await tx.studioFieldBinding.create({ data: { definitionId, organisationId, entityId: "tickets.ticket", fieldKey: compiled.payload.field.key,
        originVersionId: versionId, initialGenerationId: compiled.payload.storageGeneration } });
      await tx.studioFieldGeneration.create({ data: { id: compiled.payload.storageGeneration, definitionId, organisationId, entityId: "tickets.ticket",
        valueType: compiled.payload.field.storage.type, originVersionId: versionId } });
      await tx.studioDefinition.update({ where: { id: definitionId, organisationId }, data: { activeVersionId: versionId, latestVersion: 1, revision: 1 } });
    }
  }
  // Fixture staging only: the actual native mutation/final validator read these
  // real encoded rows. This is not an alternative application value writer.
  async function stage(tx: Prisma.TransactionClient, field: ProbeField, recordId: string, input: unknown) {
    const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId, entityId: "tickets.ticket", recordId } })
      ?? await tx.studioExtensionRecord.create({ data: { organisationId, entityId: "tickets.ticket", recordId } });
    const slot = await tx.studioFieldSlot.create({ data: { organisationId, entityId: "tickets.ticket", extensionId: extension.id,
      definitionId: field.definitionId, generationId: field.compiled.payload.storageGeneration } });
    const encoded = encodeFieldValue(field.compiled.payload.field, input);
    const value = await tx.studioFieldValue.create({ data: { organisationId, definitionId: field.definitionId, slotId: slot.id, versionId: field.versionId,
      generationId: field.compiled.payload.storageGeneration, revision: 1, ...encoded, jsonValue: encoded.jsonValue === null ? Prisma.DbNull : encoded.jsonValue, createdBy: customerUserId } });
    await tx.studioFieldSlot.update({ where: { id: slot.id, organisationId }, data: { activeValueId: value.id, revision: 1 } });
    await tx.studioExtensionRecord.update({ where: { id: extension.id, organisationId }, data: { revision: { increment: 1 } } });
    return value;
  }
  async function visibleParent(tx: Prisma.TransactionClient, privateQueue = false) {
    await tx.serviceQueue.update({ where: { id: parent.queueId, organisationId }, data: { restricted: privateQueue } });
    await tx.serviceQueueMember.deleteMany({ where: { queueId: parent.queueId, organisationId, userId: customerUserId } });
    return tx.serviceWorkItem.update({ where: { id: parentId, organisationId }, data: { watcherIds: [customerUserId],
      requestedForUserId: null, ownerUserId: null, status: "NEW" } });
  }
  const nativeFields = [fields.source, fields.root, fields.optional];
  const narrow = ["tickets.ticket.read", "tickets.ticket.watch", "tickets.ticket.reply", cap.source, cap.target];
  // Unwatch removes ordinary visibility. The exact actual mutation proof permits
  // only resulting-state validation; optional private values impose no extra Read.
  await rolledBack(async tx => {
    const session = await principal(tx, narrow); await install(tx, nativeFields);
    const work = await visibleParent(tx); await stage(tx, fields.source, parentId, true);
    assert(await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: parentId }] } }));
    await withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.watch", async current => {
      await lockWork(tx, current, work.id, work.version, { watcherIds: [] });
      await workEvent(tx, current, work, "WATCH_CHANGED", "Exact Test unwatch rollback probe");
      assert.equal(await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(current), { id: parentId }] } }), null);
      assert(!current.capabilities.has("tickets.ticket.manage")); assert(!current.capabilities.has(cap.optional)); assert(!current.capabilities.has(cap.write));
    });
  });
  // All input policies remain mandatory even when the native condition is false.
  for (const denied of [cap.source, cap.target, cap.written]) await rolledBack(async tx => {
    const session = await principal(tx, narrow.filter(value => value !== denied)); await install(tx, nativeFields);
    const work = await visibleParent(tx);
    if (denied === cap.written) {
      await version(tx, fields.written, 2);
      await tx.studioDefinition.update({ where: { id: fields.source.definitionId, organisationId }, data: { latestVersion: 2 } });
    }
    await stage(tx, denied === cap.written ? fields.written : fields.source, parentId, true);
    await withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.watch", async current => {
      await lockWork(tx, current, work.id, work.version, { watcherIds: [] });
      await workEvent(tx, current, work, "WATCH_CHANGED", "Exact Test denied field Read rollback probe");
    });
  }, /FORBIDDEN/);
  // Existing private guard still applies BEFORE native CAS. Watch alone does not
  // grant access to a restricted queue. No proof is minted for a denied callback.
  await rolledBack(async tx => {
    const session = await principal(tx, narrow); await install(tx, nativeFields); await visibleParent(tx, true);
    await withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.watch", async current => {
      const allowed = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(current), { id: parentId }] } });
      if (!allowed) throw new Error("Exact Test private ticket unavailable.");
      assert.fail("Private native guard unexpectedly allowed a nonmember.");
    });
  }, /private ticket unavailable/);
  // Actual native + event + typed + Audit mutations must be rolled back when the
  // FINAL state newly requires an absent value. Failure must leave the transaction.
  await rolledBack(async tx => {
    const session = await principal(tx, narrow); await install(tx, nativeFields);
    const work = await visibleParent(tx); const typed = await stage(tx, fields.source, parentId, true);
    await tx.auditEntry.create({ data: { organisationId, actorUserId: customerUserId, action: "studio.field.native_probe", entityType: "StudioFieldValue", entityId: typed.id, after: { probe: true } } });
    await withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.reply", async current => {
      await lockWork(tx, current, work.id, work.version, { status: "RESOLVED" });
      await workEvent(tx, current, work, "REPLY", "Exact Test required failure rollback probe");
      assert.equal((await tx.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId } })).status, "RESOLVED");
      assert(await tx.domainOutbox.findFirst({ where: { organisationId, payload: { path: ["workId"], equals: parentId } } }));
    });
  }, /Exact Test native notes is required/);
  // The real owning token has exact affected-record/revision/operation scope and
  // expires after final validation. Generic query APIs cannot forward it.
  await rolledBack(async tx => {
    const session = await principal(tx, narrow); await install(tx, nativeFields);
    const work = await visibleParent(tx); await stage(tx, fields.source, parentId, true);
    let retained: { authority: FieldRuntimeAuthority; proof: object; revision: number } | undefined;
    await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", async current => {
      await lockWork(tx, current, parentId, work.version, { watcherIds: [] }); await workEvent(tx, current, work, "WATCH_CHANGED", "Exact Test proof rollback probe");
    }, async (authority, records, operation, proof) => {
      assert.deepEqual(records, [{ recordId: parentId, organisationId, revision: work.version + 1 }]);
      const context = { session: authority.session, transaction: tx }, request = { recordId: parentId, expectedRevision: work.version + 1 };
      retained = { authority, proof, revision: request.expectedRevision };
      assert.deepEqual(await authoriseTicketNativeValidation(context, request, operation, proof), records[0]);
      for (const bad of [{ recordId: peerId, expectedRevision: 1 }, { recordId: foreign.id, expectedRevision: foreign.version },
        { ...request, expectedRevision: request.expectedRevision + 1 }])
        await assert.rejects(() => authoriseTicketNativeValidation(context, bad, operation, proof), /FORBIDDEN/);
      await assert.rejects(() => authoriseTicketNativeValidation(context, request, "tickets.ticket.reply", proof), /FORBIDDEN/);
      await assert.rejects(() => authoriseTicketNativeValidation(context, request, operation, { ...proof }), /FORBIDDEN/);
      await assert.rejects(() => authoriseTicketNativeValidation({ session: { ...authority.session }, transaction: tx }, request, operation, proof), /FORBIDDEN/);
      const query = authority.registry.describe("tickets.ticket.native_validation_watch", 1);
      const genericContext = { ...context, nativeValidationProof: proof };
      await assert.rejects(() => authority.registry.invokeQueryInTransaction(genericContext, query, request), /FORBIDDEN/);
      const entity = fields.root.compiled.payload.entity;
      const checked = await validateNativeResultingFieldRequirements(authority, { entity, ...request }, operation, proof);
      assert.equal(checked.recordRevision, request.expectedRevision); assert(checked.fieldsChecked >= 3);
    });
    assert(retained); const expired = retained;
    await assert.rejects(() => authoriseTicketNativeValidation({ session: expired.authority.session, transaction: tx },
      { recordId: parentId, expectedRevision: expired.revision }, "tickets.ticket.watch", expired.proof), /FORBIDDEN/);
  });
  // The same event helper can update a linked Ticket repeatedly. Final proof
  // anchors must contain the ACTUAL last parent revision, not a stale first one.
  await rolledBack(async tx => {
    const session = await principal(tx, narrow); await install(tx, nativeFields);
    const work = await visibleParent(tx); await stage(tx, fields.source, parentId, true);
    const child = await tx.serviceWorkItem.update({ where: { id: peerId, organisationId },
      data: { parentId, status: "NEW", watcherIds: [customerUserId], ownerUserId: null, requestedForUserId: null } });
    assert(await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: child.id }] } }));
    const linkedBefore = await tx.serviceWorkEntry.count({ where: { organisationId, workId: parentId, kind: "LINKED_WORK_UPDATED" } });
    await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.reply", async current => {
      await lockWork(tx, current, child.id, child.version, { firstResponseAt: new Date() });
      await workEvent(tx, current, child, "REPLY", "Exact Test first linked response");
      await workEvent(tx, current, child, "COMMENT", "Exact Test second linked effect");
    }, async (authority, records, operation, proof) => {
      const expected = [{ recordId: parentId, organisationId, revision: work.version + 2 },
        { recordId: peerId, organisationId, revision: child.version + 1 }].sort((a, b) => a.recordId.localeCompare(b.recordId));
      assert.deepEqual(records, expected);
      for (const record of records) await validateNativeResultingFieldRequirements(authority,
        { entity: fields.root.compiled.payload.entity, recordId: record.recordId, expectedRevision: record.revision }, operation, proof);
      assert.equal(await tx.serviceWorkEntry.count({ where: { organisationId, workId: parentId, kind: "LINKED_WORK_UPDATED" } }), linkedBefore + 2);
    });
  });
  // Being an actual affected record is not ordinary reference-target Read.
  // Both rows are legitimately unwatched; the opaque native proof covers both,
  // while their resulting references must still use today's normal visibility.
  await rolledBack(async tx => {
    const session = await principal(tx, narrow); await install(tx, [...nativeFields, fields.reference]);
    const work = await visibleParent(tx); await stage(tx, fields.source, parentId, true);
    const peer = await tx.serviceWorkItem.update({ where: { id: peerId, organisationId },
      data: { status: "NEW", watcherIds: [customerUserId], ownerUserId: null, requestedForUserId: null } });
    assert.notEqual(peer.requesterUserId, customerUserId);
    assert(await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: peerId }] } }));
    await stage(tx, fields.reference, parentId, peerId); await stage(tx, fields.reference, peerId, parentId);
    await withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.watch", async current => {
      await lockWork(tx, current, work.id, work.version, { watcherIds: [] });
      await lockWork(tx, current, peer.id, peer.version, { watcherIds: [] });
      await workEvent(tx, current, work, "WATCH_CHANGED", "Exact Test affected reference denial");
      assert.equal(await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(current), { id: peerId }] } }), null);
    });
  }, /Ticket unavailable/);
  // Two required initial fields stage through the SAME actual writer/INSERT and
  // distinct creation token before the one final native boundary. Create grants
  // cannot borrow Ticket Read/Manage or the independent field Write permission.
  for (const omitSecond of [false, true]) await rolledBack(async tx => {
    const session = await principal(tx, ["tickets.ticket.create", cap.target, cap.write]); await install(tx, fields.initial);
    await withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.create", async current => {
      assert(!current.capabilities.has("tickets.ticket.read")); assert(!current.capabilities.has("tickets.ticket.manage"));
      const created = await createTicketWithFieldInitialisation({ session: current, transaction: tx }, {
        organisationId, kind: "TICKET", queueId: parent.queueId, requesterUserId: customerUserId,
        number: `STUDIO-NATIVE-${randomUUID()}`, subject: "Exact Test staged initial fields rollback probe",
      }, async (authority, work, proof) => {
        for (const [index, field] of fields.initial.entries()) {
          if (omitSecond && index === 1) break;
          const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId, entityId: "tickets.ticket", recordId: work.id } });
          const saved = await initialiseFieldValueInTransaction(authority, { operationId: randomUUID(), definitionId: field.definitionId,
            versionId: field.versionId, generationId: field.compiled.payload.storageGeneration, definitionRevision: 1,
            recordId: work.id, recordRevision: 1, extensionRevision: extension?.revision ?? null, slotRevision: null, valueRevision: null,
            value: `Staged ${index + 1}` }, proof);
          assert(!saved.replayed);
          assert.equal(await tx.auditEntry.count({ where: { organisationId, entityId: saved.operationId, action: "studio.field.value.saved" } }), 1);
        }
        return proof;
      });
      await assert.rejects(() => authoriseNewTicketFields({ session: current, transaction: tx }, created.result), /FORBIDDEN/);
      await workEvent(tx, current, created.work, "CREATED", "Exact Test staged creation rollback probe");
    });
  }, omitSecond ? /Exact Test native_initial_two is required/ : undefined);
  await rolledBack(async tx => {
    const session = await principal(tx, ["tickets.ticket.create", cap.target]); await install(tx, fields.initial);
    await withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.create", async current => {
      await createTicketWithFieldInitialisation({ session: current, transaction: tx }, {
        organisationId, kind: "TICKET", queueId: parent.queueId, requesterUserId: customerUserId,
        number: `STUDIO-NATIVE-${randomUUID()}`, subject: "Exact Test independent initial Write denial",
      }, async (authority, work, proof) => {
        const field = fields.initial[0];
        await initialiseFieldValueInTransaction(authority, { operationId: randomUUID(), definitionId: field.definitionId,
          versionId: field.versionId, generationId: field.compiled.payload.storageGeneration, definitionRevision: 1,
          recordId: work.id, recordRevision: 1, extensionRevision: null, slotRevision: null, valueRevision: null, value: "Denied" }, proof);
      });
    });
  }, /FORBIDDEN/);
  console.log("STUDIO NATIVE ENFORCEMENT PASS: actual Serializable owning engine/final boundary; post-unwatch exact proof and final repeated linked-parent revisions; private/foreign/unaffected/stale/copied/expired/generic denial; current+written field Read despite false conditions and independent Read for another affected reference target; optional private field skipped; final required failure rolls back native/events/typed/metadata/access/Audit/Outbox; two actual initial writer saves staged before final validation, omitted required field rolls back INSERT; independent initial Write denial. Publication concurrency remains a separate gate.");
}
