import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { Client } from "pg";
import { z } from "zod";
import { Prisma } from "../../src/generated/prisma/client";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { entityDetailsSchema } from "../../src/core/studio/registry/entities";
import { checksum } from "../../src/core/studio/registry/contracts";
import { assertCapability } from "../../src/core/permissions/check";
import { conditionalFieldPayloadSchema } from "../../src/core/studio/fields/required-contract";
import { lockFieldEntitiesInTransaction } from "../../src/core/studio/fields/entity-lock";
import { captureCustomerFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { compileFieldMigrationMetadata } from "../../src/core/studio/fields/migrations/metadata";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { cancelFieldMigrationPublication } from "../../src/core/studio/fields/migrations/cancellation";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "../../src/core/studio/fields/migrations/stored-protocol";
import { requiredFieldMigrationObservationSchema } from "../../src/core/studio/fields/migrations/required-contracts";
import { FieldMigrationReviewError } from "../../src/core/studio/fields/migrations/contracts";
import { readCurrentFieldValue } from "../../src/core/studio/fields/runtime-read";
import { writeFieldValue } from "../../src/core/studio/fields/runtime-write";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { retireFieldDefinition } from "../../src/core/studio/fields/retirement";
import { createDraft, publishDraft, activateVersion } from "../../src/core/studio/definitions/service";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { createTicketWithFieldInitialisation } from "../../src/core/service-work/studio-create";
import { withValidatedTicketMutation } from "../../src/core/service-work/studio-enforcement";
import { workEvent } from "../../src/core/service-work/engine";

async function exactTestCompany(organisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1", "Explicit central Test acceptance only.");
  assert(await db.organisation.findFirst({ where: { id: organisationId, isTest: true, kind: "CUSTOMER", status: "ACTIVE",
    archivedAt: null, slug: { startsWith: "studio-check-" } } }), "The advisory barrier requires an active exact synthetic CUSTOMER company.");
}

/** Actual PostgreSQL barrier shared only by guarded central acceptance checkers.
 * No source/policy substitution or altered application transaction. Both real
 * participants must have an MVCC snapshot and be waiting on the exact compact
 * JSON/seed0 tenant/entity advisory key before control releases it. Credentials
 * stay in the existing environment and are never returned or printed. */
export async function raceAtFieldEntityLock<A, B>(organisationId: string,
  operations: readonly [() => Promise<A>, () => Promise<B>]): Promise<readonly [PromiseSettledResult<A>, PromiseSettledResult<B>]> {
  await exactTestCompany(organisationId); assert(process.env.DATABASE_URL);
  const control = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3_000,
    query_timeout: 3_000, statement_timeout: 3_000, application_name: "studio-check-field-barrier",
    options: "-c idle_in_transaction_session_timeout=15000" });
  let opened = false, controlFailure: Error | undefined;
  let participants: Promise<[PromiseSettledResult<A>, PromiseSettledResult<B>]> | undefined;
  control.on("error", error => { controlFailure = error; });
  try {
    await control.connect(); await control.query("BEGIN"); opened = true;
    const key = JSON.stringify([organisationId, "tickets.ticket"]);
    const identity = (await control.query<{ pid: number; hash: string; database_oid: string }>(
      "SELECT pg_backend_pid() AS pid, hashtextextended($1,0)::text AS hash, (SELECT oid::text FROM pg_database WHERE datname=current_database()) AS database_oid", [key])).rows;
    assert.equal(identity.length, 1);
    const { pid, database_oid: databaseOid } = identity[0], hash = BigInt.asUintN(64, BigInt(identity[0].hash));
    const classId = (hash >> 32n).toString(), objectId = (hash & 0xffffffffn).toString();
    await control.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))::text", [key]);
    let leftDone = false, rightDone = false;
    const settle = <T>(operation: () => Promise<T>, done: () => void): Promise<PromiseSettledResult<T>> => Promise.resolve().then(operation).then(
      value => { done(); return { status: "fulfilled", value }; }, reason => { done(); return { status: "rejected", reason }; });
    participants = Promise.all([settle(operations[0], () => { leftDone = true; }), settle(operations[1], () => { rightDone = true; })]);
    const deadline = Date.now() + 4_000;
    let observed = false;
    for (let attempt = 0; attempt < 80 && Date.now() < deadline; attempt++) {
      assert(!controlFailure, "The PostgreSQL barrier connection failed.");
      assert(!leftDone && !rightDone, "A participant completed before BOTH real lock waits were observed.");
      // PostgreSQL caches current-query activity within a transaction. Clear
      // ONLY this control connection's statistics cache before each observation;
      // the business snapshots/locks and cumulative counters remain unchanged.
      // https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-STATS-VIEWS
      await control.query("SELECT pg_stat_clear_snapshot()");
      const waiters = (await control.query<{ pid: number; snapshot: string; wait_event: string; wait_event_type: string }>(`
        SELECT waiting.pid, activity.backend_xmin::text AS snapshot, activity.wait_event, activity.wait_event_type
        FROM pg_locks waiting JOIN pg_stat_activity activity ON activity.pid=waiting.pid
        WHERE waiting.locktype='advisory' AND waiting.classid=$1::oid AND waiting.objid=$2::oid AND waiting.objsubid=1
          AND waiting.database=$3::oid AND NOT waiting.granted AND waiting.pid<>$4
          AND activity.datname=current_database() AND activity.state='active' AND activity.xact_start IS NOT NULL
          AND activity.backend_xmin IS NOT NULL AND activity.wait_event_type='Lock' AND activity.wait_event='advisory'
          AND activity.query LIKE '%pg_advisory_xact_lock%' AND $4=ANY(pg_blocking_pids(waiting.pid))
        ORDER BY waiting.pid`, [classId, objectId, databaseOid, pid])).rows;
      assert(waiters.length <= 2, "Unexpected extra participant on the exact synthetic coordination key.");
      if (waiters.length === 2) {
        assert.notEqual(waiters[0].pid, waiters[1].pid);
        for (const waiter of waiters) { assert.match(waiter.snapshot, /^\d+$/); assert.equal(waiter.wait_event, "advisory"); assert.equal(waiter.wait_event_type, "Lock"); }
        observed = true; break;
      }
      // Pacing only. Success depends on the PostgreSQL rows above, not elapsed time.
      await pause(50);
    }
    assert(observed, "Timed out without TWO actual same-key lock waits and MVCC snapshots; concurrency gate not established.");
    await control.query("COMMIT"); opened = false;
    return await participants;
  } finally {
    try { if (opened) await control.query("ROLLBACK"); }
    finally {
      try { await control.end(); }
      finally { if (participants) await participants; } // Never abandon pending native/publication work after barrier failure.
    }
  }
}

const sqlFailure = z.object({ code: z.string().optional(),
  driverAdapterError: z.object({ cause: z.object({ originalCode: z.string().optional() }).optional() }).optional() });
function assertPermittedRaceFailure(result: PromiseSettledResult<unknown>, domainMessages: readonly string[]) {
  if (result.status !== "rejected") return;
  const error: unknown = result.reason; assert(error instanceof Error, "Unexpected non-Error race rejection.");
  if (domainMessages.includes(error.message) || error.message.startsWith("CONFLICT:")) return;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") return; // Existing Prisma transaction-conflict contract.
    const metadata = sqlFailure.safeParse(error.meta);
    if (error.code === "P2010" && metadata.success &&
      (metadata.data.code ?? metadata.data.driverAdapterError?.cause?.originalCode) === "40001") return;
  }
  assert.match(error.message, /could not serialize access|serialization failure/i, "Race rejected for an unexpected reason; do not hide it with a fresh retry.");
}

/** Dedicated central Test tenant only. Register its ID in the original driver's
 * cleanup list before any further fixture mutations; retain all immutable history,
 * revoke this synthetic membership and suspend the company on every exit. Actual
 * publication/activation are the existing separate normal service transactions.
 * Native probes use the owning engine boundary, not HTTP/form/SLA acceptance. */
export async function checkFieldConcurrency(customerUserId: string, cleanupCompanyIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(await db.user.findFirst({ where: { id: customerUserId, platformAdmin: null,
    email: { startsWith: "studio-check-", endsWith: "@example.test" } } }));
  const company = await db.organisation.create({ data: { name: "Studio exact field concurrency acceptance",
    slug: `studio-check-concurrency-${randomUUID()}`, kind: "CUSTOMER", status: "ACTIVE", isTest: true } });
  cleanupCompanyIds.push(company.id); // Original driver's finally must know BEFORE module/membership/native mutations.
  const organisationId = company.id;
  let membershipId: string | undefined;
  try {
    await exactTestCompany(organisationId);
    await db.moduleState.createMany({ data: ["studio", "tickets"].map(moduleId => ({ organisationId, moduleId, enabled: true, entitled: true })) });
    const grants = [...Object.values(STUDIO_CAPABILITIES), "tickets.ticket.read", "tickets.ticket.manage", "tickets.ticket.create"];
    membershipId = (await db.membership.create({ data: { organisationId, userId: customerUserId, active: true, grantedCapabilities: grants } })).id;
    const fresh = async () => { const session = await sessionForUser(organisationId, customerUserId); assert(session);
      assert.equal(session.membershipId, membershipId); assert(![...session.capabilities].some(value => value.startsWith("atlas.")));
      for (const value of grants) assert(session.capabilities.has(value)); return session; };
    const queue = await db.serviceQueue.create({ data: { organisationId, name: "Exact concurrency private queue", prefix: "STURACE", department: "Acceptance", restricted: true } });
    await db.serviceQueueMember.create({ data: { organisationId, queueId: queue.id, userId: customerUserId } });
    const metadata = studioRegistry().describe("tickets.ticket", 9);
    const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
    const policy = entityDetailsSchema.parse(metadata.details).record?.fieldPolicy; assert(policy); assert.equal(policy.maxFields, 100);
    const scope = { organisationId };
    const bindings = () => db.studioFieldBinding.count({ where: { ...scope, entityId: entity.id } });
    async function snapshot() { return {
      native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
      entries: await db.serviceWorkEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      audits: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
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
      reviews: await db.studioFieldMigrationReview.findMany({ where: scope, orderBy: { id: "asc" } }),
      publications: await db.studioFieldMigrationPublication.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      executions: await db.studioFieldMigrationExecution.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      outcomes: await db.studioFieldMigrationOutcome.findMany({ where: scope, orderBy: [{ preparationId: "asc" }, { recordId: "asc" }] }),
      cutovers: await db.studioFieldMigrationCutover.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
    }; }
    async function draft(key: string, required = false) {
      const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: randomUUID(),
        field: { key, label: `Exact Test ${key}`, classification: "confidential", required, storage: { type: "string" } } });
      return { ...(await createDraft(await fresh(), { key: `${entity.id}.${key}`, name: payload.field.label, kind: "customField", payload })), payload };
    }
    async function publish(definitionId: string) {
      const saved = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId } });
      return publishDraft(await fresh(), { definitionId, revision: saved.revision, acknowledgeWarnings: true });
    }
    async function activate(definitionId: string, versionId: string) {
      const saved = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definitionId } });
      return activateVersion(await fresh(), { definitionId, versionId, revision: saved.revision });
    }
    async function createNative() {
      const session = await fresh();
      return db.$transaction(tx => withValidatedTicketMutation({ session, transaction: tx }, "tickets.ticket.create", async current => {
        const created = await createTicketWithFieldInitialisation({ session: current, transaction: tx }, { organisationId, kind: "TICKET",
          queueId: queue.id, requesterUserId: customerUserId, number: `STUDIO-RACE-${randomUUID()}`, subject: "Exact Test required activation race" }, async () => undefined);
        await workEvent(tx, current, created.work, "CREATED", "Exact Test concurrency owning engine probe");
        return created.work.id;
      }), { isolationLevel: "Serializable", timeout: 15_000 });
    }
    const first = await draft("first_required", true);
    assert.equal(await db.serviceWorkItem.count({ where: { ...scope, kind: "TICKET" } }), 0); assert.equal(await bindings(), 0);
    const firstResults = await raceAtFieldEntityLock(organisationId, [async () => {
      const published = await publish(first.id); await activate(first.id, published.versionId); return published;
    }, createNative]);
    for (const result of firstResults) assertPermittedRaceFailure(result, ["Exact Test first_required is required."]);
    assert(firstResults.filter(result => result.status === "fulfilled").length <= 1, "Required activation and missing-value native creation must not both succeed.");
    let state = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: first.id } });
    let count = await db.serviceWorkItem.count({ where: { ...scope, kind: "TICKET" } });
    assert(count <= 1); assert(!(state.activeVersionId && count), "Committed required pointer cannot coexist with a missing-value Ticket.");
    assert.equal(Boolean(state.activeVersionId), firstResults[0].status === "fulfilled");
    assert.equal(count, firstResults[1].status === "fulfilled" ? 1 : 0);
    const versions = await db.studioDefinitionVersion.findMany({ where: { ...scope, definitionId: first.id } });
    assert(versions.length <= 1); assert.equal(await bindings(), versions.length);
    assert.equal(state.latestVersion, versions.length); assert.equal(state.revision, versions.length + (state.activeVersionId ? 1 : 0));
    if (state.activeVersionId) assert.equal(state.activeVersionId, versions[0].id);
    assert.equal((await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: first.id } })).revision, versions.length);
    assert.equal(await db.studioFieldGeneration.count({ where: { ...scope, definitionId: first.id } }), versions.length);
    assert.equal(await db.auditEntry.count({ where: { ...scope, entityId: first.id, action: "studio.definition.published" } }), versions.length);
    assert.equal(await db.auditEntry.count({ where: { ...scope, entityId: first.id, action: "studio.definition.activated" } }), state.activeVersionId ? 1 : 0);
    assert.equal(await db.serviceWorkEntry.count({ where: scope }), count);
    assert.equal(await db.auditEntry.count({ where: { ...scope, action: "service.work.created" } }), count);
    assert.equal(await db.domainOutbox.count({ where: scope }), count);
    assert.equal(await db.studioFieldValue.count({ where: scope }), 0);
    assert.equal(await db.studioExtensionRecord.count({ where: scope }), 0); assert.equal(await db.studioFieldSlot.count({ where: scope }), 0);
    for (const work of await db.serviceWorkItem.findMany({ where: scope })) {
      assert.equal(work.kind, "TICKET"); assert.equal(work.requesterUserId, customerUserId); assert.equal(work.queueId, queue.id);
      assert.equal(work.status, "NEW"); assert.equal(work.version, 1);
    }
    // A valid SSI outcome may abort both high-level operations (publication and
    // activation are separate commits). Recover a fresh empty-cohort activation,
    // then prove the newly required creator cannot commit without its value.
    let versionId = versions[0]?.id;
    if (!versionId) versionId = (await publish(first.id)).versionId;
    if (!count && !state.activeVersionId) await activate(first.id, versionId);
    const afterRace = await snapshot();
    if (count) await assert.rejects(() => activate(first.id, versionId), /Exact Test first_required is required/);
    else await assert.rejects(createNative, /Exact Test first_required is required/);
    assert.deepEqual(await snapshot(), afterRace, "Fresh losing operation must fail without native/metadata/Audit changes.");
    state = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: first.id } });
    await retireFieldDefinition(await fresh(), { definitionId: first.id, revision: state.revision });
    if (!count) { await createNative(); count = 1; }
    assert.equal(await db.serviceWorkItem.count({ where: { ...scope, kind: "TICKET" } }), count);

    const nonempty = await draft("nonempty_required", true), nonemptyPublished = await publish(nonempty.id);
    const beforeDeniedActivation = await snapshot();
    await assert.rejects(() => activate(nonempty.id, nonemptyPublished.versionId), /Exact Test nonempty_required is required/);
    assert.deepEqual(await snapshot(), beforeDeniedActivation, "Nonempty required activation must retain exact pointer/revision/history/Audit.");
    const nonemptyState = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: nonempty.id } });
    assert.equal(nonemptyState.activeVersionId, null);
    await retireFieldDefinition(await fresh(), { definitionId: nonempty.id, revision: nonemptyState.revision });
    const optional = await draft("first_optional"), optionalPublished = await publish(optional.id);
    const beforeOptional = await snapshot();
    await activate(optional.id, optionalPublished.versionId);
    const afterOptional = await snapshot();
    assert.deepEqual(afterOptional.native, beforeOptional.native); assert.deepEqual(afterOptional.values, beforeOptional.values);
    assert.deepEqual(afterOptional.entries, beforeOptional.entries); assert.deepEqual(afterOptional.outbox, beforeOptional.outbox);
    assert.equal(afterOptional.audits.length, beforeOptional.audits.length + 1);
    assert.equal(await db.auditEntry.count({ where: { ...scope, entityId: optional.id, action: "studio.definition.activated" } }), 1);
    assert.equal((await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: optional.id } })).activeVersionId, optionalPublished.versionId);
    assert(await db.studioFieldBinding.count({ where: { ...scope, entityId: entity.id, definition: { retiredAt: { not: null } } } }) >= 1);

    // REVIEWED but UNPUBLISHED closed2 races. No existing PUBLISHED freeze may
    // mask publication freshness against a new canonical row or the complete
    // cohort's shared extension revision changing through another field.
    const changedMessage = new FieldMigrationReviewError("REVIEW_CHANGED").message;
    const cohortChangedMessage = "MIGRATION_COHORT_CHANGED: review the current ticket set again.";
    const frozenMessage = "FIELD_MIGRATION_IN_PROGRESS: this field is temporarily frozen while an approved change completes.";
    const other = await draft("review_race_other"), otherPublished = await publish(other.id);
    await activate(other.id, otherPublished.versionId);
    const existingTicket = await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, kind: "TICKET", status: "NEW", mergedIntoId: null }, orderBy: { id: "asc" } });
    async function otherRequest(value: string) {
      const read = await readCurrentFieldValue(await fresh(), { definitionId: other.id, recordId: existingTicket.id });
      return { operationId: randomUUID(), definitionId: other.id, versionId: read.versionId, generationId: read.generationId,
        definitionRevision: read.definitionRevision, recordId: existingTicket.id, recordRevision: read.recordRevision,
        extensionRevision: read.extensionRevision, slotRevision: read.slotRevision, valueRevision: read.valueRevision, value };
    }
    // Ensure the second race tests revision drift of an EXISTING extension,
    // independently of the source field's absent slot/value.
    await writeFieldValue(await fresh(), await otherRequest("Before reviewed-publication race"));
    async function reviewedTarget() {
      assert.equal(await db.studioFieldMigrationPublication.count({ where: { ...scope, state: { in: ["PUBLISHED", "CUTOVER"] } } }), 0);
      const author = await fresh(), principal = await captureCustomerFieldMigrationPrincipal(author);
      assert.equal(principal.authority, "customer"); assert.equal(principal.membershipId, membershipId);
      const saved = await withFieldMigrationAuthority(author, principal, async ({ session, transaction: tx, company: currentCompany }) => {
        assertCapability(session, STUDIO_CAPABILITIES.edit); assert(currentCompany.isTest);
        await lockFieldEntitiesInTransaction(tx, organisationId, [entity.id]);
        const definition = await tx.studioDefinition.findFirstOrThrow({ where: { ...scope, id: optional.id }, include: { draft: true, activeVersion: true } });
        assert(definition.draft && definition.activeVersion); assert.equal(definition.activeVersionId, optionalPublished.versionId);
        const source = customFieldPayloadSchema.parse(definition.activeVersion.payload);
        assert.equal(source.entity.version, 9); assert.equal(source.field.storage.type, "string");
        const proposed = conditionalFieldPayloadSchema.parse({ ...source, schemaVersion: 2, storageGeneration: randomUUID(),
          requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "absent" }] } });
        const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, studioRegistry(), currentCompany, optional.id, proposed);
        // Exact privileged Test seed only; real preparation/publication below
        // receive the saved canonical payload/revisions, never fabricated packets.
        assert.equal((await tx.studioDraft.updateMany({ where: { id: definition.draft.id, ...scope, revision: definition.draft.revision },
          data: { payload: compiled.payload, revision: { increment: 1 }, validation: Prisma.DbNull } })).count, 1);
        await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "studio.concurrency.test_draft_seeded",
          entityType: "StudioDefinition", entityId: optional.id } });
        return { definitionRevision: definition.revision, draftRevision: definition.draft.revision + 1,
          generationId: compiled.payload.storageGeneration, targetChecksum: compiled.checksum };
      });
      const prepared = await startFieldMigrationPreparation(author, principal, { operationId: randomUUID(), definitionId: optional.id,
        definitionRevision: saved.definitionRevision, draftRevision: saved.draftRevision, conversion: { kind: "same_type" } });
      let batch = await collectFieldMigrationBatch(author, { preparationId: prepared.id, revision: prepared.revision, limit: 2 });
      for (let page = 0; !batch.cursorExhausted; page++) {
        assert(page < 10, "Dedicated reviewed-race cohort exceeded its finite collection bound.");
        batch = await collectFieldMigrationBatch(author, { preparationId: prepared.id, revision: batch.revision, limit: 2 });
      }
      const review = await sealFieldMigrationPreparation(author, { preparationId: prepared.id, revision: batch.revision });
      assert.equal(review.summary.invalidCount, 0); assert.equal(review.summary.lossyCount, 0);
      assert.equal(review.cohort.recordCount, await db.serviceWorkItem.count({ where: { ...scope, kind: "TICKET" } }));
      const preparation = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { ...scope, id: prepared.id } });
      const intent = readStoredFieldMigrationIntent(preparation, organisationId).intent; assert.equal(intent.schemaVersion, 2);
      const stored = readStoredFieldMigrationReview(await db.studioFieldMigrationReview.findFirstOrThrow({ where: { ...scope, id: prepared.id } }), organisationId);
      assert.equal(stored.review.schemaVersion, 2); assert.equal(stored.checksum, review.checksum);
      assert.equal(intent.target.payload.storageGeneration, saved.generationId); assert.equal(intent.target.compiledChecksum, saved.targetChecksum);
      assert.equal(intent.ownerQuery.id, "tickets.ticket.field_migration"); assert.equal(intent.ownerQuery.version, 4);
      assert.equal(intent.source.versionId, optionalPublished.versionId); assert.deepEqual(intent.principal, principal);
      for (const observation of await db.studioFieldMigrationObservation.findMany({ where: { ...scope, preparationId: prepared.id } })) {
        const recorded = requiredFieldMigrationObservationSchema.parse(observation.observation);
        assert.equal(recorded.requirement.targetRequired, false); assert.equal(recorded.result.kind, "valid"); assert(recorded.result.isNull);
        assert.equal(observation.sourceGenerationId, optional.payload.storageGeneration);
        assert.equal(recorded.extension?.slot ?? null, null); // Only C owns a slot; source remains absent.
        if (observation.recordId === existingTicket.id) {
          const extension = await db.studioExtensionRecord.findFirstOrThrow({ where: { ...scope, entityId: entity.id, recordId: existingTicket.id } });
          assert.equal(recorded.extension?.id, extension.id); assert.equal(recorded.extension?.revision, extension.revision);
        }
      }
      assert.equal(await db.studioFieldMigrationPublication.count({ where: { ...scope, state: { in: ["PUBLISHED", "CUTOVER"] } } }), 0);
      return { ...saved, preparationId: prepared.id, principal,
        request: { preparationId: prepared.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false } };
    }
    async function reviewedRace(kind: "native" | "other_field") {
      const target = await reviewedTarget();
      const request = kind === "other_field" ? await otherRequest("After reviewed-publication race") : null;
      const mutation = async () => request ? writeFieldValue(await fresh(), request) : createNative();
      const publication = async () => publishReviewedFieldMigration(await fresh(), target.request);
      const before = await snapshot();
      const results = await raceAtFieldEntityLock(organisationId, [publication, mutation]);
      assertPermittedRaceFailure(results[0], kind === "native" ? [changedMessage, cohortChangedMessage] : [changedMessage]);
      assertPermittedRaceFailure(results[1], [frozenMessage]);
      assert(results.filter(result => result.status === "fulfilled").length <= 1, "Reviewed publication and cohort/extension mutation must not both commit.");
      const published = results[0].status === "fulfilled", mutated = results[1].status === "fulfilled", after = await snapshot();
      // Retained preparation/review/observations are immutable through either
      // outcome. This is not an execution/cutover or converted-value race.
      for (const key of ["preparations", "observations", "reviews", "executions", "outcomes", "cutovers", "bindings"] as const)
        assert.deepEqual(after[key], before[key], `${kind}: immutable ${key} changed.`);
      if (!published) {
        for (const key of ["definitions", "drafts", "versions", "generations", "dependencies", "publications"] as const)
          assert.deepEqual(after[key], before[key], `${kind}: rejected publication left ${key}.`);
      } else {
        const receipt = results[0]; assert.equal(receipt.status, "fulfilled"); assert(!receipt.value.replayed);
        assert.equal(after.publications.length, before.publications.length + 1);
        const row = after.publications.find(item => item.preparationId === target.preparationId); assert(row);
        assert.equal(row.state, "PUBLISHED"); assert.equal(row.targetVersionId, receipt.value.targetVersionId);
        assert.equal(row.reviewChecksum, target.request.reviewChecksum); assert.equal(row.targetGenerationId, target.generationId);
        assert.equal(row.sourceGenerationId, optional.payload.storageGeneration); assert.equal(row.publisherUserId, customerUserId);
        assert.equal(after.versions.length, before.versions.length + 1); assert.equal(after.generations.length, before.generations.length + 1);
        const version = after.versions.find(item => item.id === row.targetVersionId); assert(version);
        assert.equal(version.definitionId, optional.id); assert.equal(version.organisationId, organisationId);
        assert.equal(version.schemaVersion, 2); assert.equal(version.checksum, target.targetChecksum);
        assert.equal(row.targetChecksum, version.checksum); assert.equal(row.targetVersionNumber, version.version);
        assert.equal(row.revision, receipt.value.publicationRevision); assert.equal(row.acknowledgedLoss, false);
        assert.equal(checksum(version.compiledPlan), version.checksum);
        const generation = after.generations.find(item => item.id === target.generationId); assert(generation);
        assert.equal(generation.originVersionId, version.id); assert.equal(generation.definitionId, optional.id); assert.equal(generation.entityId, entity.id);
        const previous = before.definitions.find(item => item.id === optional.id), current = after.definitions.find(item => item.id === optional.id); assert(previous && current);
        assert.equal(current.activeVersionId, optionalPublished.versionId); assert.equal(current.latestVersion, previous.latestVersion + 1); assert.equal(current.revision, previous.revision + 1);
        const previousDraft = before.drafts.find(item => item.definitionId === optional.id), currentDraft = after.drafts.find(item => item.definitionId === optional.id); assert(previousDraft && currentDraft);
        assert.equal(currentDraft.revision, previousDraft.revision + 1); assert.equal(currentDraft.baseVersionId, version.id);
        assert.deepEqual(currentDraft.payload, previousDraft.payload); assert.deepEqual(version.payload, previousDraft.payload);
        assert.deepEqual(current, { ...previous, latestVersion: previous.latestVersion + 1, revision: previous.revision + 1, updatedAt: current.updatedAt });
        assert.deepEqual(currentDraft, { ...previousDraft, revision: previousDraft.revision + 1, baseVersionId: version.id,
          validation: currentDraft.validation, updatedAt: currentDraft.updatedAt });
        for (const key of ["versions", "generations", "dependencies"] as const)
          assert.deepEqual(after[key].filter(item => before[key].some(old => old.id === item.id)), before[key], `${kind}: retained ${key} changed.`);
        for (const key of ["definitions", "drafts", "versions", "generations", "dependencies"] as const)
          assert.deepEqual(after[key].filter(item => ("definitionId" in item ? item.definitionId : item.id) !== optional.id),
            before[key].filter(item => ("definitionId" in item ? item.definitionId : item.id) !== optional.id));
        assert.deepEqual(after.publications.filter(item => item.preparationId !== target.preparationId), before.publications);
      }
      const newAudits = after.audits.filter(item => !before.audits.some(old => old.id === item.id));
      assert.deepEqual(after.audits.filter(item => before.audits.some(old => old.id === item.id)), before.audits);
      assert.equal(newAudits.length, published ? 2 : mutated ? 1 : 0);
      assert.deepEqual(newAudits.map(item => item.action).sort(), published ? ["studio.definition.published", "studio.field.migration.published"]
        : mutated ? [kind === "native" ? "service.work.created" : "studio.field.value.saved"] : []);
      for (const audit of newAudits) { assert.equal(audit.actorUserId, customerUserId); assert.equal(audit.organisationId, organisationId); }
      if (published) {
        assert.equal(newAudits.find(item => item.action === "studio.definition.published")?.entityId, optional.id);
        assert.equal(newAudits.find(item => item.action === "studio.field.migration.published")?.entityId, target.preparationId);
      }
      if (mutated && kind === "native") {
        const native = after.native.filter(item => !before.native.some(old => old.id === item.id)); assert.equal(native.length, 1);
        assert.equal(native[0].kind, "TICKET"); assert.equal(native[0].status, "NEW"); assert.equal(native[0].version, 1); assert.equal(native[0].queueId, queue.id);
        assert.equal(native[0].requesterUserId, customerUserId); assert.equal(results[1].status, "fulfilled"); assert.equal(results[1].value, native[0].id);
        assert.deepEqual(after.native.filter(item => item.id !== native[0].id), before.native);
        assert.equal(after.entries.length, before.entries.length + 1); assert.equal(after.outbox.length, before.outbox.length + 1);
        const entry = after.entries.find(item => !before.entries.some(old => old.id === item.id)); assert(entry);
        const event = after.outbox.find(item => !before.outbox.some(old => old.id === item.id)); assert(event);
        assert.equal(entry.workId, native[0].id); assert.equal(entry.kind, "CREATED"); assert.equal(newAudits[0].entityId, native[0].id);
        assert.deepEqual(newAudits[0].after, { entryId: entry.id, kind: "CREATED" });
        assert.equal(event.eventName, "ticket.created"); assert.equal(event.eventKey, `service-work:${entry.id}`);
        assert.deepEqual(event.payload, { workId: native[0].id, entryId: entry.id, parentCaseId: null, parentId: null });
        assert.deepEqual(after.entries.filter(item => before.entries.some(old => old.id === item.id)), before.entries);
        assert.deepEqual(after.outbox.filter(item => before.outbox.some(old => old.id === item.id)), before.outbox);
      } else {
        assert.deepEqual(after.native, before.native); assert.deepEqual(after.entries, before.entries); assert.deepEqual(after.outbox, before.outbox);
      }
      if (mutated && request) {
        const extension = before.extensions.find(item => item.recordId === existingTicket.id && item.entityId === entity.id); assert(extension);
        const current = after.extensions.find(item => item.id === extension.id); assert(current); assert.equal(current.revision, extension.revision + 1);
        const slot = before.slots.find(item => item.extensionId === extension.id && item.definitionId === other.id); assert(slot);
        const currentSlot = after.slots.find(item => item.id === slot.id); assert(currentSlot);
        assert.equal(currentSlot.revision, slot.revision + 1); assert.equal(currentSlot.activeValueId, request.operationId);
        assert.equal(after.values.length, before.values.length + 1);
        const value = after.values.find(item => item.id === request.operationId); assert(value);
        assert.equal(value.slotId, slot.id); assert.equal(value.versionId, otherPublished.versionId); assert.equal(value.textValue, request.value);
        assert.equal(value.definitionId, other.id); assert.equal(value.generationId, other.payload.storageGeneration);
        assert.equal(value.createdBy, customerUserId); assert.equal(value.isNull, false); assert.equal(value.valueType, "string");
        assert.equal(value.revision, currentSlot.revision); assert.equal(newAudits[0].entityId, value.id);
        assert.deepEqual(current, { ...extension, revision: extension.revision + 1, updatedAt: current.updatedAt });
        assert.deepEqual(currentSlot, { ...slot, revision: slot.revision + 1, activeValueId: value.id });
        assert.deepEqual(after.extensions.filter(item => item.id !== extension.id), before.extensions.filter(item => item.id !== extension.id));
        assert.deepEqual(after.slots.filter(item => item.id !== slot.id), before.slots.filter(item => item.id !== slot.id));
        assert.deepEqual(after.values.filter(item => item.id !== request.operationId), before.values);
      } else for (const key of ["extensions", "slots", "values"] as const) assert.deepEqual(after[key], before[key]);
      if (published) {
        await assert.rejects(mutation, error => error instanceof Error && error.message === frozenMessage);
        assert.deepEqual(await snapshot(), after, "Fresh mutation against winning publication must freeze atomically.");
        const receipt = results[0]; assert.equal(receipt.status, "fulfilled");
        await cancelFieldMigrationPublication(await fresh(), target.principal, { preparationId: target.preparationId, revision: receipt.value.publicationRevision });
        assert.equal((await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { ...scope, preparationId: target.preparationId } })).state, "CANCELLED");
      } else {
        // Both-aborted SSI is permitted only after checking each real failure.
        // Establish a fresh actual mutation, then prove retained review staleness.
        if (!mutated) await mutation();
        const committed = await snapshot();
        await assert.rejects(publication, error => (error instanceof FieldMigrationReviewError && error.code === "REVIEW_CHANGED")
          || (kind === "native" && error instanceof Error && error.message === cohortChangedMessage));
        assert.deepEqual(await snapshot(), committed, "Fresh stale review publication must leave no target/generation/receipt/Audit.");
      }
      assert.equal(await db.studioFieldMigrationPublication.count({ where: { ...scope, state: { in: ["PUBLISHED", "CUTOVER"] } } }), 0);
    }
    await reviewedRace("native");
    await reviewedRace("other_field");

    // Real owner bound, real retained bindings, normal inactive publications.
    // Do not lower maxFields, replace registry policy or populate fake bindings.
    let bound = await bindings(); assert(bound < policy.maxFields - 1);
    for (; bound < policy.maxFields - 1; bound++) { const field = await draft(`capacity_${String(bound).padStart(3, "0")}`); await publish(field.id); }
    assert.equal(await bindings(), policy.maxFields - 1);
    const left = await draft("last_capacity_left"), right = await draft("last_capacity_right");
    const beforeCapacity = await snapshot();
    const capacityResults = await raceAtFieldEntityLock(organisationId, [() => publish(left.id), () => publish(right.id)]);
    for (const result of capacityResults) assertPermittedRaceFailure(result, ["This entity has reached its owner-approved field limit, including retained retired fields."]);
    assert.equal(capacityResults.filter(result => result.status === "fulfilled").length, 1, "Exactly one distinct first publisher may take the last real owner slot.");
    assert.equal(await bindings(), policy.maxFields);
    for (const [index, field] of [left, right].entries()) {
      const committed = capacityResults[index].status === "fulfilled", expected = committed ? 1 : 0;
      const definition = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: field.id } });
      const saved = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: field.id } });
      assert.equal(definition.latestVersion, expected); assert.equal(definition.revision, expected); assert.equal(saved.revision, expected);
      assert.equal(definition.activeVersionId, null); assert.equal(Boolean(saved.baseVersionId), committed);
      assert.equal(await db.studioDefinitionVersion.count({ where: { ...scope, definitionId: field.id } }), expected);
      assert.equal(await db.studioFieldBinding.count({ where: { ...scope, definitionId: field.id } }), expected);
      assert.equal(await db.studioFieldGeneration.count({ where: { ...scope, definitionId: field.id } }), expected);
      assert.equal(await db.studioDependency.count({ where: { ...scope, definitionId: field.id } }), expected);
      assert.equal(await db.auditEntry.count({ where: { ...scope, entityId: field.id, action: "studio.definition.published" } }), expected);
    }
    const afterCapacity = await snapshot();
    assert.equal(afterCapacity.versions.length, beforeCapacity.versions.length + 1);
    assert.equal(afterCapacity.generations.length, beforeCapacity.generations.length + 1);
    assert.equal(afterCapacity.bindings.length, beforeCapacity.bindings.length + 1);
    assert.equal(afterCapacity.audits.length, beforeCapacity.audits.length + 1);
    assert.deepEqual(afterCapacity.native, beforeCapacity.native); assert.deepEqual(afterCapacity.entries, beforeCapacity.entries);
    assert.deepEqual(afterCapacity.outbox, beforeCapacity.outbox); assert.deepEqual(afterCapacity.values, beforeCapacity.values);
    const loser = capacityResults[0].status === "rejected" ? left : right;
    await assert.rejects(() => publish(loser.id), /owner-approved field limit, including retained retired fields/);
    assert.deepEqual(await snapshot(), afterCapacity, "Fresh capacity denial must leave no orphan version/generation/dependency/Audit.");
    console.log("STUDIO FIELD CONCURRENCY PASS: actual pg_locks/pg_stat_activity same-key barrier and snapshots; zero-cohort/no-binding normal publish→activate versus owning engine creation cannot both commit invalid state; fresh missing-required loser denial; nonempty required activation unchanged and optional activation works; true owner100 capacity retains retired bindings, different normal publishers commit exactly one with no loser orphan rows/Audit and fresh capacity denial. reviewed-unpublished closed2 publication versus actual native phantom/another-field shared-extension save commits at most one, retains immutable review/source, proves fresh stale-review or publication-freeze denial and normal cancellation. HTTP/open-window/retirement races are separate gates.");
  } finally {
    try {
      if (membershipId) await db.membership.updateMany({ where: { id: membershipId, organisationId, userId: customerUserId },
        data: { active: false, sessionVersion: { increment: 1 } } });
    } finally {
      await db.organisation.updateMany({ where: { id: organisationId, isTest: true, kind: "CUSTOMER", slug: { startsWith: "studio-check-concurrency-" } }, data: { status: "SUSPENDED" } });
    }
  }
}
