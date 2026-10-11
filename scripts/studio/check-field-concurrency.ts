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
    console.log("STUDIO FIELD CONCURRENCY PASS: actual pg_locks/pg_stat_activity same-key barrier and snapshots; zero-cohort/no-binding normal publish→activate versus owning engine creation cannot both commit invalid state; fresh missing-required loser denial; nonempty required activation unchanged and optional activation works; true owner100 capacity retains retired bindings, different normal publishers commit exactly one with no loser orphan rows/Audit and fresh capacity denial. HTTP, reviewed/open-window/retirement races are separate gates.");
  } finally {
    try {
      if (membershipId) await db.membership.updateMany({ where: { id: membershipId, organisationId, userId: customerUserId },
        data: { active: false, sessionVersion: { increment: 1 } } });
    } finally {
      await db.organisation.updateMany({ where: { id: organisationId, isTest: true, kind: "CUSTOMER", slug: { startsWith: "studio-check-concurrency-" } }, data: { status: "SUSPENDED" } });
    }
  }
}
