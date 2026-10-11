import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { readStudioRuntimeFeatureEvidence, STUDIO_PROFILE_FEATURE, STUDIO_RECORD_TYPE_FORM_FEATURE } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { createDraft, updateDraft, publishDraft, activateVersion } from "../../src/core/studio/definitions/service";
import { customFieldPayloadSchema, type CustomFieldPayload } from "../../src/core/studio/fields/schema";
import { readCurrentFieldValue } from "../../src/core/studio/fields/runtime-read";
import { writeFieldValue, writeFieldValueInTransaction, initialiseFieldValueInTransaction } from "../../src/core/studio/fields/runtime-write";
import { fieldRuntimeAuthorityInTransaction } from "../../src/core/studio/fields/runtime-authority";
import { assignRecordTypeInTransaction, assignInitialRecordTypeInTransaction } from "../../src/core/studio/record-types/assignment";
import { recordTypeAssignmentProvenanceSchema } from "../../src/core/studio/record-types/assignment-contract";
import { resolveRecordProfileInTransaction } from "../../src/core/studio/record-types/runtime-profile";
import { validateCandidateRecordProfileCoverage } from "../../src/core/studio/record-types/coverage";
import { entityProfilePayloadSchema, recordTypePayloadSchema, configurationReferenceSchema, type ConfigurationReference } from "../../src/core/studio/record-types/schema";
import { createTicketWithFieldInitialisation } from "../../src/core/service-work/studio-create";
import { withValidatedTicketMutation } from "../../src/core/service-work/studio-enforcement";
import { workScope } from "../../src/core/service-work/access";
import { workNumber, workEvent, lockWork } from "../../src/core/service-work/engine";
import { ticketFieldFormManifestInTransaction, stageTicketFieldFormPacket, ticketNativeFormChecksum } from "../../src/core/service-work/field-forms";
import { stageTicketCreationType } from "../../src/core/service-work/record-type-creation";
import { completeTicketFormInTransaction, replayTicketFormInTransaction } from "../../src/core/service-work/form-receipt";
import { ticketFormReceiptKey, ticketFormReceiptSchema, type TicketFormRequest } from "../../src/core/service-work/form-receipt-contract";
import { raceAtFieldEntityLock } from "./check-field-concurrency";

const cap = { read: "tickets.field.profile_read", write: "tickets.field.profile_write" };
type Published = { definitionId: string; pin: ConfigurationReference };
type Field = { definitionId: string; versionId: string; payload: CustomFieldPayload };

/** Original both-lock release driver only. Real central owner/SQL probes;
 * source/type tests are not runtime acceptance. Feature evidence closes fixture
 * writes until BOTH actual current/rollback readers support record profiles. */
export async function checkRecordProfiles(base: string, managerUserId: string, creatorUserId: string, cleanupCompanyIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert.notEqual(managerUserId, creatorUserId);
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence?.features.includes(STUDIO_PROFILE_FEATURE)) {
    console.log("DEFERRED record-profile acceptance: this sealed current/rollback pair has not enabled recordProfiles.v1; no profile fixture writes performed.");
    return;
  }
  const releases = dirname(root); assert.equal(basename(root), revision); assert(basename(releases).endsWith("-releases"));
  const current = realpathSync(join(dirname(releases), `${basename(releases).slice(0, -9)}-current`));
  if (base.startsWith("http://127.0.0.1:")) assert.equal(basename(current), evidence.rollbackRevision); else assert.equal(current, root);
  assert.deepEqual(verifyStudioRuntimeFeaturePair(root, join(releases, evidence.rollbackRevision), revision), evidence);
  assert.equal(z.object({ revision: z.string() }).parse(await (await fetch(`${base}/api/health/release`)).json()).revision, revision);
  const users = await db.user.findMany({ where: { id: { in: [managerUserId, creatorUserId] }, platformAdmin: null,
    email: { startsWith: "studio-check-", endsWith: "@example.test" } } });
  assert.equal(users.length, 2);
  const originalMemberships = await db.membership.findMany({ where: { userId: { in: [managerUserId, creatorUserId] } }, orderBy: { id: "asc" } });
  const companies: string[] = [], memberships: string[] = [];
  const managerGrants = [...Object.values(STUDIO_CAPABILITIES), "tickets.ticket.read", "tickets.ticket.manage", "tickets.ticket.create", "tickets.ticket.watch", ...Object.values(cap)];
  const creatorGrants = ["tickets.ticket.create", ...Object.values(cap)];
  try {
    async function company(suffix: string) {
      const row = await db.organisation.create({ data: { name: `Studio record profile acceptance ${suffix}`,
        slug: `studio-check-profiles-${suffix}-${randomUUID()}`, kind: "CUSTOMER", status: "ACTIVE", isTest: true } });
      cleanupCompanyIds.push(row.id); companies.push(row.id);
      assert(await db.organisation.findFirst({ where: { id: row.id, kind: "CUSTOMER", status: "ACTIVE", isTest: true,
        archivedAt: null, slug: { startsWith: "studio-check-profiles-" } } }));
      await db.moduleState.createMany({ data: ["tickets", "studio"].map(moduleId => ({ organisationId: row.id, moduleId, enabled: true, entitled: true })) });
      const member = await db.membership.create({ data: { organisationId: row.id, userId: managerUserId, grantedCapabilities: managerGrants } }); memberships.push(member.id);
      const queue = await db.serviceQueue.create({ data: { organisationId: row.id, name: "Profile acceptance private queue", prefix: "STUPRF", restricted: true, department: "Acceptance" } });
      await db.serviceQueueMember.create({ data: { organisationId: row.id, queueId: queue.id, userId: managerUserId } });
      return { ...row, memberId: member.id, queueId: queue.id };
    }
    const a = await company("a"), b = await company("b");
    const creatorMember = await db.membership.create({ data: { organisationId: a.id, userId: creatorUserId, grantedCapabilities: creatorGrants } }); memberships.push(creatorMember.id);
    await db.serviceQueueMember.create({ data: { organisationId: a.id, queueId: a.queueId, userId: creatorUserId } });
    const session = async (organisationId = a.id, userId = managerUserId): Promise<Session> => {
      const value = await sessionForUser(organisationId, userId); assert(value);
      assert.equal(value.organisationId, organisationId); assert.equal(value.userId, userId);
      assert(![...value.capabilities].some(c => c.startsWith("atlas."))); return value;
    };
    const metadata = studioRegistry().describe("tickets.ticket", 9);
    const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
    const snapshot = async () => {
      const where = { organisationId: { in: companies } };
      return { native: await db.serviceWorkItem.findMany({ where, orderBy: { id: "asc" } }), entries: await db.serviceWorkEntry.findMany({ where, orderBy: { id: "asc" } }),
        sequences: await db.serviceSequence.findMany({ where, orderBy: [{ organisationId: "asc" }, { prefix: "asc" }] }), outbox: await db.domainOutbox.findMany({ where, orderBy: { id: "asc" } }),
        audit: await db.auditEntry.findMany({ where, orderBy: { id: "asc" } }), definitions: await db.studioDefinition.findMany({ where, orderBy: { id: "asc" } }),
        drafts: await db.studioDraft.findMany({ where, orderBy: { id: "asc" } }), versions: await db.studioDefinitionVersion.findMany({ where, orderBy: { id: "asc" } }),
        edges: await db.studioConfigurationDependency.findMany({ where, orderBy: [{ versionId: "asc" }, { targetVersionId: "asc" }] }),
        bindings: await db.studioProfileBinding.findMany({ where, orderBy: { definitionId: "asc" } }),
        fieldBindings: await db.studioFieldBinding.findMany({ where, orderBy: { definitionId: "asc" } }), generations: await db.studioFieldGeneration.findMany({ where, orderBy: { id: "asc" } }),
        extensions: await db.studioExtensionRecord.findMany({ where, orderBy: { id: "asc" } }), assignments: await db.studioRecordTypeAssignment.findMany({ where, orderBy: { id: "asc" } }),
        slots: await db.studioFieldSlot.findMany({ where, orderBy: { id: "asc" } }), values: await db.studioFieldValue.findMany({ where, orderBy: { id: "asc" } }),
        windows: await db.studioFieldMigrationPublication.findMany({ where, orderBy: { preparationId: "asc" } }), cutovers: await db.studioFieldMigrationCutover.findMany({ where, orderBy: { preparationId: "asc" } }) };
    };
    async function rejected(operation: () => Promise<unknown>, pattern: RegExp) {
      const before = await snapshot(); await assert.rejects(operation, pattern); assert.deepEqual(await snapshot(), before);
    }
    async function publish(definitionId: string, organisationId = a.id): Promise<Published> {
      const author = await session(organisationId), draft = await db.studioDraft.findFirstOrThrow({ where: { definitionId, organisationId } });
      const published = await publishDraft(author, { definitionId, revision: draft.revision, acknowledgeWarnings: true });
      const version = await db.studioDefinitionVersion.findFirstOrThrow({ where: { id: published.versionId, definitionId, organisationId }, include: { definition: true } });
      return { definitionId, pin: configurationReferenceSchema.parse({ kind: version.definition.kind, definitionId, versionId: version.id, schemaVersion: version.schemaVersion, checksum: version.checksum }) };
    }
    async function activate(published: Published, organisationId = a.id) {
      const row = await db.studioDefinition.findFirstOrThrow({ where: { id: published.definitionId, organisationId } });
      return activateVersion(await session(organisationId), { definitionId: row.id, versionId: published.pin.versionId, revision: row.revision });
    }
    async function field(key: string, type: "integer" | "boolean" | "string", organisationId = a.id): Promise<Field> {
      const author = await session(organisationId), payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: randomUUID(),
        field: { key, label: `Profile ${key}`, classification: "confidential", readCapability: cap.read, writeCapability: cap.write, storage: { type } } });
      const draft = await createDraft(author, { key: `tickets.ticket.${key}`, name: payload.field.label, kind: "customField", payload });
      const saved = await db.studioDraft.findFirstOrThrow({ where: { definitionId: draft.id, organisationId } });
      const published = await publishDraft(author, { definitionId: draft.id, revision: saved.revision, acknowledgeWarnings: true });
      const current = await db.studioDefinition.findFirstOrThrow({ where: { id: draft.id, organisationId } });
      await activateVersion(author, { definitionId: draft.id, versionId: published.versionId, revision: current.revision });
      return { definitionId: draft.id, versionId: published.versionId, payload };
    }
    const zero = await field("zero", "integer"), answer = await field("answer", "boolean"), special = await field("special", "string");
    async function pin(value: Field) { const row = await db.studioDefinitionVersion.findFirstOrThrow({ where: { id: value.versionId, definitionId: value.definitionId, organisationId: a.id } });
      return { kind: "customField" as const, definitionId: value.definitionId, versionId: value.versionId, schemaVersion: 1 as const, checksum: row.checksum }; }
    const baseDraft = await createDraft(await session(), { key: "tickets.ticket.base_profile", name: "Ticket business setup", kind: "entityProfile",
      payload: entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: {} }) });
    const emptyBase = await publish(baseDraft.id); await activate(emptyBase);
    assert.equal(emptyBase.pin.kind, "entityProfile");
    const typeDraft = await createDraft(await session(), { key: `record_type.${randomUUID()}`, name: "Special work", kind: "recordType",
      payload: recordTypePayloadSchema.parse({ schemaVersion: 1, entity, baseProfile: emptyBase.pin, label: "Special work", overlay: { requiredFields: [await pin(special)] } }) });
    const type = await publish(typeDraft.id); await activate(type);
    async function writeRequest(author: Session, configured: Field, recordId: string, value: unknown) {
      const read = await readCurrentFieldValue(author, { definitionId: configured.definitionId, recordId });
      return { operationId: randomUUID(), definitionId: configured.definitionId, versionId: read.versionId, generationId: read.generationId,
        definitionRevision: read.definitionRevision, recordId, recordRevision: read.recordRevision, extensionRevision: read.extensionRevision,
        slotRevision: read.slotRevision, valueRevision: read.valueRevision, value };
    }
    async function create(organisationId = a.id, userId = managerUserId, values: readonly [Field, unknown][] = [], selected?: ConfigurationReference) {
      const actor = await session(organisationId, userId);
      return db.$transaction(tx => withValidatedTicketMutation({ session: actor, transaction: tx }, "tickets.ticket.create", async current => {
        const result = await createTicketWithFieldInitialisation({ session: current, transaction: tx }, { organisationId, kind: "TICKET",
          requesterUserId: current.userId, queueId: organisationId === a.id ? a.queueId : b.queueId,
          number: await workNumber(tx, organisationId, "STUPRF"), subject: "Exact Test profile owning creation" }, async (authority, work, proof) => {
          for (const [configured, value] of values) {
            const definition = await tx.studioDefinition.findFirstOrThrow({ where: { id: configured.definitionId, organisationId } });
            const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId, entityId: entity.id, recordId: work.id } });
            await initialiseFieldValueInTransaction(authority, { operationId: randomUUID(), definitionId: definition.id, versionId: configured.versionId,
              generationId: configured.payload.storageGeneration, definitionRevision: definition.revision, recordId: work.id, recordRevision: 1,
              extensionRevision: extension?.revision ?? null, slotRevision: null, valueRevision: null, value }, proof);
          }
          if (selected) {
            const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId, entityId: entity.id, recordId: work.id } });
            await assignInitialRecordTypeInTransaction(current, tx, { operationId: randomUUID(), entity, recordId: work.id,
              recordRevision: 1, extensionRevision: extension?.revision ?? null, recordType: selected }, proof);
          }
        });
        await workEvent(tx, current, result.work, "CREATED", "Exact Test profile owning engine acceptance"); return result.work.id;
      }), { isolationLevel: "Serializable", timeout: 20_000 });
    }
    const assignedId = await create(), plainId = await create();
    async function assignment(recordId: string, recordType: ConfigurationReference | null = type.pin) {
      const work = await db.serviceWorkItem.findFirstOrThrow({ where: { id: recordId, organisationId: a.id, kind: "TICKET" } });
      const extension = await db.studioExtensionRecord.findFirst({ where: { organisationId: a.id, entityId: entity.id, recordId } });
      return { operationId: randomUUID(), entity, recordId, recordRevision: work.version, extensionRevision: extension?.revision ?? null, recordType };
    }
    const assign = async (input: Awaited<ReturnType<typeof assignment>>, actor?: Session) => {
      const current = actor ?? await session();
      return db.$transaction(tx => assignRecordTypeInTransaction(current, tx, input), { isolationLevel: "Serializable", timeout: 20_000 });
    };
    await rejected(async () => assign(await assignment(assignedId)), /is required/);
    await writeFieldValue(await session(), await writeRequest(await session(), special, assignedId, "Approved special work"));
    const assignedRequest = await assignment(assignedId), assigned = await assign(assignedRequest);
    assert(!assigned.replayed); const replayBefore = await snapshot(); assert((await assign(assignedRequest)).replayed); assert.deepEqual(await snapshot(), replayBefore);
    assert.equal(await db.auditEntry.count({ where: { organisationId: a.id, action: "studio.record_type.assigned", entityId: assigned.operationId } }), 1);
    const resolved = await db.$transaction(async tx => resolveRecordProfileInTransaction(await fieldRuntimeAuthorityInTransaction(await session(), tx),
      { entity, recordId: assignedId, expectedRevision: 1 }), { isolationLevel: "Serializable" });
    assert.equal(resolved.recordType?.definitionId, type.definitionId); assert.equal(resolved.baseProfile?.versionId, emptyBase.pin.versionId);
    const baseSaved = await db.studioDraft.findFirstOrThrow({ where: { definitionId: baseDraft.id, organisationId: a.id } });
    await updateDraft(await session(), { definitionId: baseDraft.id, revision: baseSaved.revision,
      payload: entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { requiredFields: [await pin(zero), await pin(answer)] } }) });
    const strongerBase = await publish(baseDraft.id);
    await rejected(() => activate(strongerBase), /is required/);
    await writeFieldValue(await session(), await writeRequest(await session(), zero, plainId, 0));
    await writeFieldValue(await session(), await writeRequest(await session(), answer, plainId, false));
    await activate(strongerBase);
    const coverage = await db.$transaction(async tx => {
      const row = await tx.studioDefinition.findFirstOrThrow({ where: { id: baseDraft.id, organisationId: a.id } });
      return validateCandidateRecordProfileCoverage(await session(), tx, { definitionId: row.id, versionId: strongerBase.pin.versionId, definitionRevision: row.revision });
    }, { isolationLevel: "Serializable", timeout: 20_000 });
    assert.equal(coverage.recordCount, 2); assert.equal(coverage.affectedRecordCount, 1);
    const retained = await db.$transaction(async tx => resolveRecordProfileInTransaction(await fieldRuntimeAuthorityInTransaction(await session(), tx),
      { entity, recordId: assignedId, expectedRevision: 1 }), { isolationLevel: "Serializable" });
    assert.equal(retained.baseProfile?.versionId, emptyBase.pin.versionId);
    const creator = await session(a.id, creatorUserId);
    assert(creator.capabilities.has("tickets.ticket.create"));
    for (const c of ["tickets.ticket.read", "tickets.ticket.manage", ...Object.values(STUDIO_CAPABILITIES)]) assert(!creator.capabilities.has(c));
    await rejected(() => create(a.id, creatorUserId), /is required/);
    const privateId = await create(a.id, creatorUserId, [[zero, 0], [answer, false], [special, "Initial special work"]], type.pin);
    assert.equal(await db.studioRecordTypeAssignment.count({ where: { organisationId: a.id, recordId: privateId, createdBy: creatorUserId } }), 1);
    await db.serviceQueueMember.deleteMany({ where: { organisationId: a.id, queueId: a.queueId, userId: managerUserId } });
    await rejected(async () => assign(await assignment(privateId)), /FORBIDDEN|unavailable|not found/i);
    await db.serviceQueueMember.create({ data: { organisationId: a.id, queueId: a.queueId, userId: managerUserId } });
    const staleSession = await session();
    await db.membership.update({ where: { id: a.memberId, organisationId: a.id }, data: { active: false, sessionVersion: { increment: 1 } } });
    await rejected(async () => assign(await assignment(assignedId), staleSession), /FORBIDDEN|revoked|session/i);
    await db.membership.update({ where: { id: a.memberId, organisationId: a.id }, data: { active: true, grantedCapabilities: managerGrants } });
    await db.membership.update({ where: { id: a.memberId, organisationId: a.id }, data: { grantedCapabilities: managerGrants.filter(c => c !== cap.read) } });
    await rejected(() => assign(assignedRequest), /FORBIDDEN/);
    await db.membership.update({ where: { id: a.memberId, organisationId: a.id }, data: { grantedCapabilities: managerGrants } });
    await rejected(async () => assign({ ...await assignment(assignedId), extensionRevision: 999 }), /CONFLICT/);
    const fieldRequest = await writeRequest(await session(), special, assignedId, null);
    await rejected(async () => { const actor = await session(); return db.$transaction(tx => withValidatedTicketMutation({ session: actor, transaction: tx }, "tickets.ticket.watch", async current => {
      await writeFieldValueInTransaction(await fieldRuntimeAuthorityInTransaction(current, tx), fieldRequest);
      const work = await tx.serviceWorkItem.findFirstOrThrow({ where: { AND: [workScope(current), { id: assignedId }] } });
      await lockWork(tx, current, work.id, work.version, { watcherIds: [creatorUserId] }); await workEvent(tx, current, work, "WATCH_CHANGED", "Exact Test profile atomic rejection");
    }), { isolationLevel: "Serializable", timeout: 20_000 }); }, /is required/);
    const stored = await db.studioRecordTypeAssignment.findFirstOrThrow({ where: { id: assigned.operationId, organisationId: a.id } });
    const auditFailureRequest = await assignment(assignedId), failureName = `studio_profile_fail_${randomUUID().replaceAll("-", "")}`;
    for (const value of [failureName, a.id, auditFailureRequest.operationId]) assert(/^[a-zA-Z0-9_-]+$/.test(value));
    let failureFunction = false, failureTrigger = false;
    try {
      await db.$executeRawUnsafe(`CREATE FUNCTION "${failureName}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        IF NEW."organisationId"='${a.id}' AND NEW.action='studio.record_type.assigned' AND NEW."entityId"='${auditFailureRequest.operationId}'
        THEN RAISE EXCEPTION 'Exact Test profile Audit failure'; END IF; RETURN NEW; END $$`); failureFunction = true;
      await db.$executeRawUnsafe(`CREATE TRIGGER "${failureName}" BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION "${failureName}"()`); failureTrigger = true;
      await rejected(() => assign(auditFailureRequest), /Exact Test profile Audit failure/);
    } finally {
      try { if (failureTrigger) await db.$executeRawUnsafe(`DROP TRIGGER "${failureName}" ON audit_entries`); }
      finally { if (failureFunction) await db.$executeRawUnsafe(`DROP FUNCTION "${failureName}"()`); }
    }
    await rejected(() => db.$executeRaw`UPDATE studio_record_type_assignments SET checksum=${"0".repeat(64)} WHERE id=${stored.id}::uuid AND "organisationId"=${a.id}`, /immutable|modified|history/i);
    await rejected(() => db.$executeRaw`DELETE FROM audit_entries WHERE "organisationId"=${a.id} AND action='studio.record_type.assigned' AND "entityId"=${stored.id}`, /immutable/i);
    await rejected(() => db.$executeRaw`UPDATE audit_entries SET action='studio.test.renamed' WHERE "organisationId"=${a.id} AND action='studio.record_type.assigned' AND "entityId"=${stored.id}`, /immutable/i);
    await rejected(() => db.$transaction(async tx => {
      await tx.$executeRaw`SET LOCAL atlas.test_wipe='on'`;
      assert.equal(await tx.$executeRaw`DELETE FROM audit_entries WHERE "organisationId"=${a.id}
        AND action='studio.record_type.assigned' AND "entityId"=${stored.id}`, 1);
      const ordinary = await tx.auditEntry.create({ data: { organisationId: a.id, actorUserId: managerUserId,
        action: "studio.profile.privacy_probe", entityType: "Contact", entityId: randomUUID(), before: { name: "Exact Test contact metadata" } } });
      await tx.auditEntry.update({ where: { id: ordinary.id, organisationId: a.id }, data: { before: Prisma.DbNull, after: Prisma.DbNull } });
      // Positive original Test wipe/scrub permission, then intentional rollback;
      // never commit deletion of retained evidence or native business records.
      throw new Error("Exact Test profile wipe and ordinary scrub rollback");
    }), /Exact Test profile wipe and ordinary scrub rollback/);
    await rejected(() => db.$executeRaw`UPDATE studio_extension_records SET "recordTypeAssignmentId"=NULL, revision=revision+1 WHERE id=${stored.extensionId}::uuid AND "organisationId"=${a.id}`, /unassignment|evidence|head/i);
    await rejected(async () => db.$transaction(async tx => {
      const operationId = randomUUID(), head = await tx.studioExtensionRecord.findFirstOrThrow({ where: { id: stored.extensionId, organisationId: a.id } });
      const request = { operationId, entity, recordId: assignedId, recordRevision: 1, extensionRevision: head.revision, recordType: type.pin };
      const provenance = recordTypeAssignmentProvenanceSchema.parse({ ...stored.provenance as object, operationId, extensionRevision: head.revision + 1,
        previousExtensionRevision: head.revision, previousAssignmentId: head.recordTypeAssignmentId, requestChecksum: checksum(request) });
      await tx.studioRecordTypeAssignment.create({ data: { ...stored, id: operationId, extensionRevision: head.revision + 1,
        previousAssignmentId: head.recordTypeAssignmentId, provenance, requestChecksum: checksum(request), checksum: checksum(provenance) } });
      assert.equal((await tx.studioExtensionRecord.updateMany({ where: { id: head.id, organisationId: a.id, revision: head.revision },
        data: { recordTypeAssignmentId: operationId, revision: { increment: 1 } } })).count, 1);
      // Intentionally omit only paired Audit: actual SQL deferred guard must
      // reject this otherwise valid raw Test assignment/head at commit.
    }, { isolationLevel: "Serializable" }), /Audit|commit together/i);
    const raceField = await field("race", "integer", b.id);
    const raceVersion = await db.studioDefinitionVersion.findFirstOrThrow({ where: { id: raceField.versionId, organisationId: b.id } });
    const raceDraft = await createDraft(await session(b.id), { key: "tickets.ticket.base_profile", name: "Race business setup", kind: "entityProfile",
      payload: entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { requiredFields: [{ kind: "customField", definitionId: raceField.definitionId,
        versionId: raceField.versionId, schemaVersion: 1, checksum: raceVersion.checksum }] } }) });
    const raceProfile = await publish(raceDraft.id, b.id);
    const results = await raceAtFieldEntityLock(b.id, [() => activate(raceProfile, b.id), () => create(b.id)]);
    for (const result of results) if (result.status === "rejected") {
      assert(result.reason instanceof Error);
      if (result.reason instanceof Prisma.PrismaClientKnownRequestError && result.reason.code === "P2034") continue;
      assert.match(result.reason.message, /CONFLICT:|is required|could not serialize access|serialization failure|40001/i, "Do not hide an unrelated race rejection with a retry.");
    }
    assert(results.filter(value => value.status === "fulfilled").length <= 1);
    const raceState = await db.studioDefinition.findFirstOrThrow({ where: { id: raceDraft.id, organisationId: b.id } });
    const raceNative = await db.serviceWorkItem.findMany({ where: { organisationId: b.id, kind: "TICKET" } });
    assert(raceNative.length <= 1); assert(!(raceState.activeVersionId && raceNative.length), "Missing-value creation and required profile activation cannot both commit.");
    assert.equal(Boolean(raceState.activeVersionId), results[0].status === "fulfilled"); assert.equal(raceNative.length, results[1].status === "fulfilled" ? 1 : 0);
    if (!raceState.activeVersionId) {
      if (raceNative.length) await writeFieldValue(await session(b.id), await writeRequest(await session(b.id), raceField, raceNative[0].id, 0));
      await activate(raceProfile, b.id);
    }
    await rejected(() => create(b.id), /is required/);
    const foreignTypeDraft = await createDraft(await session(b.id), { key: `record_type.${randomUUID()}`, name: "Other business work", kind: "recordType",
      payload: recordTypePayloadSchema.parse({ schemaVersion: 1, entity, baseProfile: raceProfile.pin, label: "Other business work", overlay: {} }) });
    const foreignType = await publish(foreignTypeDraft.id, b.id); await activate(foreignType, b.id);
    const foreignId = await create(b.id, managerUserId, [[raceField, 0]], foreignType.pin);
    await rejected(() => assign({ ...assignedRequest, operationId: randomUUID(), recordId: foreignId }), /FORBIDDEN|unavailable|not found/i);
    await rejected(() => assign({ ...assignedRequest, operationId: randomUUID(), recordType: foreignType.pin }), /CONFLICT|unavailable|DEPENDENCY/);
    const foreignAssignment = await db.studioRecordTypeAssignment.findFirstOrThrow({ where: { organisationId: b.id, recordId: foreignId } });
    await rejected(() => db.$executeRaw`UPDATE studio_extension_records SET "recordTypeAssignmentId"=${foreignAssignment.id}::uuid, revision=revision+1
      WHERE id=${stored.extensionId}::uuid AND "organisationId"=${a.id}`, /matching|head|foreign key|constraint/i);
    // Receipt2 support is independently sealed for this actual current/rollback
    // pair. The existing profile fixture runs on the earlier bridge unchanged.
    if (!evidence.features.includes(STUDIO_RECORD_TYPE_FORM_FEATURE)) {
      console.log("DEFERRED creation business-type acceptance: the actual pair does not enable recordTypeForms.v1; no creation selector effects exercised.");
    } else {
      async function formIntent(): Promise<TicketFormRequest> {
        return db.$transaction(async tx => {
          const current = await fieldRuntimeAuthorityInTransaction(await session(a.id, creatorUserId), tx);
          const manifest = await ticketFieldFormManifestInTransaction(current, { operation: "create" });
          assert(manifest?.recordTypes); assert(manifest.recordTypes.choices.some(choice => choice.definitionId === type.definitionId));
          const raw = new FormData(); raw.set("kind", "TICKET"); raw.set("queueId", a.queueId);
          raw.set("subject", "Initial selected business type receipt"); raw.set("description", "Exact Test creation protocol");
          const selection = { schemaVersion: 1 as const, manifestChecksum: manifest.recordTypes.manifestChecksum, definitionId: type.definitionId };
          raw.set("studioRecordType", JSON.stringify(selection));
          return { operation: "create", nativeRequestChecksum: ticketNativeFormChecksum(raw, "create"), typeSelection: selection,
            packet: { schemaVersion: 1, operationId: manifest.operationId, manifestChecksum: manifest.manifestChecksum, extensionRevision: null,
              fields: manifest.fields.map(control => ({ operationId: control.operationId, definitionId: control.definitionId,
                definitionRevision: control.definitionRevision, versionId: control.versionId, generationId: control.generationId,
                slotRevision: null, valueRevision: null, value: control.definitionId === zero.definitionId ? { type: "integer", value: 0 }
                  : control.definitionId === answer.definitionId ? { type: "boolean", value: false } : { type: "string", value: "Initial selected type details" } })) } };
        }, { isolationLevel: "Serializable", timeout: 20_000 });
      }
      async function owningForm(request: TicketFormRequest) {
        const creator = await session(a.id, creatorUserId);
        return db.$transaction(async tx => {
          const existing = await replayTicketFormInTransaction(creator, tx, request); if (existing) return existing;
          const manifest = await ticketFieldFormManifestInTransaction(await fieldRuntimeAuthorityInTransaction(creator, tx), { operation: "create" });
          const native = await withValidatedTicketMutation({ session: creator, transaction: tx }, "tickets.ticket.create", async current => {
            const created = await createTicketWithFieldInitialisation({ session: current, transaction: tx }, { organisationId: a.id, kind: "TICKET",
              requesterUserId: current.userId, queueId: a.queueId, number: await workNumber(tx, a.id, "STUPRF"),
              subject: "Initial selected business type receipt", description: "Exact Test creation protocol" }, async (authority, work, proof) => {
              assert(request.operation === "create" && request.typeSelection);
              const defaults = await stageTicketFieldFormPacket(authority, manifest, request.packet, work.id, 1, proof); assert.equal(defaults.length, 0);
              await stageTicketCreationType(authority, request.typeSelection, request.packet, work.id, 1, proof);
            });
            await workEvent(tx, current, created.work, "CREATED", "Exact Test initial selected type owning receipt"); return created.work;
          });
          return completeTicketFormInTransaction(creator, tx, request, { recordId: native.id, recordRevision: 1, fieldRecordRevision: 1 });
        }, { isolationLevel: "Serializable", timeout: 20_000 });
      }
      const form = await formIntent(), initial = await owningForm(form); assert(!initial.replayed);
      const saved = await db.auditEntry.findFirstOrThrow({ where: { id: ticketFormReceiptKey(form.packet.operationId), organisationId: a.id, actorUserId: creatorUserId } });
      const receipt2 = ticketFormReceiptSchema.parse(saved.after); assert.equal(receipt2.schemaVersion, 2);
      if (receipt2.schemaVersion !== 2) throw new Error("Expected selected type receipt2");
      assert.equal(receipt2.typeSelection.definitionId, type.definitionId); assert.equal(receipt2.typeAssignment.extensionRevision, form.packet.fields.length + 1);
      assert.deepEqual(receipt2.fields.map(field => field.extensionRevision), Array.from({ length: form.packet.fields.length }, (_, i) => i + 1));
      const replaySnapshot = await snapshot(); assert((await owningForm(form)).replayed); assert.deepEqual(await snapshot(), replaySnapshot);
      await rejected(() => owningForm({ ...form, operation: "create", typeSelection: { ...receipt2.typeSelection, definitionId: null } }), /CONFLICT/);
      const typeSaved = await db.studioDraft.findFirstOrThrow({ where: { definitionId: type.definitionId, organisationId: a.id } });
      const typePayload = recordTypePayloadSchema.parse(typeSaved.payload);
      await updateDraft(await session(), { definitionId: type.definitionId, revision: typeSaved.revision,
        payload: { ...typePayload, help: "Current cosmetic guidance after original creation" } });
      const changed = await publish(type.definitionId); await activate(changed);
      const changedSnapshot = await snapshot(); assert((await owningForm(form)).replayed); assert.deepEqual(await snapshot(), changedSnapshot);
      for (const revoked of [cap.read, cap.write]) {
        await db.membership.update({ where: { id: creatorMember.id, organisationId: a.id }, data: { grantedCapabilities: creatorGrants.filter(c => c !== revoked) } });
        await rejected(() => owningForm(form), /FORBIDDEN/);
        await db.membership.update({ where: { id: creatorMember.id, organisationId: a.id }, data: { grantedCapabilities: creatorGrants } });
      }
      // Receipt guard rejects old-record fabrication with a fresh whole op; no
      // historical native row or retained assignment is inserted in this TX.
      const forgedOperation = randomUUID();
      await rejected(() => db.auditEntry.create({ data: { id: ticketFormReceiptKey(forgedOperation), organisationId: a.id,
        actorUserId: creatorUserId, action: saved.action, entityType: saved.entityType, entityId: saved.entityId,
        after: { ...receipt2, operationId: forgedOperation } } }), /assignment|creation|receipt|initial|INSERT|native/i);
      const retry = await formIntent(), receiptFailure = `studio_type_form_fail_${randomUUID().replaceAll("-", "")}`;
      for (const value of [receiptFailure, a.id, ticketFormReceiptKey(retry.packet.operationId)]) assert(/^[a-zA-Z0-9_:-]+$/.test(value));
      let functionCreated = false, triggerCreated = false;
      try {
        await db.$executeRawUnsafe(`CREATE FUNCTION "${receiptFailure}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
          IF NEW."organisationId"='${a.id}' AND NEW.id='${ticketFormReceiptKey(retry.packet.operationId)}'
          THEN RAISE EXCEPTION 'Exact Test initial type completion Audit failure'; END IF; RETURN NEW; END $$`); functionCreated = true;
        await db.$executeRawUnsafe(`CREATE TRIGGER "${receiptFailure}" BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION "${receiptFailure}"()`); triggerCreated = true;
        await rejected(() => owningForm(retry), /Exact Test initial type completion Audit failure/);
      } finally {
        try { if (triggerCreated) await db.$executeRawUnsafe(`DROP TRIGGER "${receiptFailure}" ON audit_entries`); }
        finally { if (functionCreated) await db.$executeRawUnsafe(`DROP FUNCTION "${receiptFailure}"()`); }
      }
      assert(!(await owningForm(retry)).replayed); const recoveredSnapshot = await snapshot(); assert((await owningForm(retry)).replayed);
      assert.deepEqual(await snapshot(), recoveredSnapshot);
      console.log("STUDIO CREATION TYPE FORMS PASS: genuine Create-only manifest, actual INSERT field→assignment→complete owning validator→receipt2, zero/false anchors, exact read-only replay after current type change, current/retained grant denial, real assignment/native SQL guard and completion Audit rollback/recovery. Browser selector rendering and HTTP are separate gates.");
    }
    console.log("STUDIO RECORD PROFILES PASS: original publisher/activation, complete actual owner cohort, stronger required activation atomic failure and zero/false, exact retained base/current stable type, actual same-TX association/head/Audit/CAS and readonly replay, private/revoked/field/foreign denials, genuine Create-only INSERT and native resulting-state rollback, targeted SQL immutable/head/deferred Audit guards and real same-key activation/creation race. Browser layout/selection and broader record-type UI remain separate gates.");
  } finally {
    if (memberships.length) await db.membership.updateMany({ where: { id: { in: memberships }, organisationId: { in: companies } }, data: { active: false, sessionVersion: { increment: 1 } } });
    if (companies.length) await db.organisation.updateMany({ where: { id: { in: companies }, isTest: true, kind: "CUSTOMER", slug: { startsWith: "studio-check-profiles-" } }, data: { status: "SUSPENDED" } });
    assert.deepEqual(await db.membership.findMany({ where: { userId: { in: [managerUserId, creatorUserId] }, id: { in: originalMemberships.map(m => m.id) } }, orderBy: { id: "asc" } }), originalMemberships);
  }
}
