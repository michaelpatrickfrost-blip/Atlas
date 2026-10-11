import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { expect, type Browser } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import { sessionForUser, sessionAuthorityStamp, type Session } from "../../src/core/auth/session";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { customFieldPayloadSchema, type CustomFieldPayload } from "../../src/core/studio/fields/schema";
import { writeFieldValue } from "../../src/core/studio/fields/runtime-write";
import { encodeFieldValue } from "../../src/core/studio/fields/codec";
import { fieldSearchRequestSchema, type FieldSearchRequest } from "../../src/core/studio/fields/search-contract";
import { captureCustomerFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";

const cap = { read: "tickets.field.search_read", written: "tickets.field.search_written", write: "tickets.field.search_write" };
const projection = z.strictObject({ id: z.string(), revision: z.number().int().positive(), href: z.string(),
  fields: z.strictObject({ number: z.string(), subject: z.string(), status: z.string(), type: z.string(), priority: z.string(),
    created_at: z.iso.datetime(), updated_at: z.iso.datetime() }) });
const resultSchema = z.strictObject({ records: z.array(projection).max(50), next: z.strictObject({ after: z.string(), checksum: z.string().regex(/^[a-f0-9]{64}$/) }).nullable() });
type Field = { definitionId: string; payload: CustomFieldPayload };
const userSelect = { id: true, name: true, email: true, authVersion: true, createdAt: true, updatedAt: true } as const;

/** Source-only helper for the original locked central release driver. All native
 * records use actual browser creation and typed values use the existing writer;
 * no direct business-value insertion, new users/credentials, dumps or local DB.
 * Actual query/index/runtime evidence is printed only when this function runs.
 * Two exact Test companies retain history; only their new access is suspended. */
export async function checkFieldSearch(base: string, browser: Browser, existingSyntheticUserId: string, cleanupCompanyIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const synthetic = { platformAdmin: null, email: { startsWith: "studio-check-", endsWith: "@example.test" } };
  const owner = await db.user.findFirstOrThrow({ where: { id: existingSyntheticUserId, ...synthetic }, select: userSelect });
  const reader = await db.user.findFirst({ where: { ...synthetic, id: { not: owner.id }, memberships: { some: {
    organisation: { kind: "CUSTOMER", isTest: true, slug: { startsWith: "studio-check-" } } } } }, select: userSelect, orderBy: { id: "asc" } });
  assert(reader, "Configured search acceptance requires a second EXISTING non-admin studio-check-*@example.test Test identity; no user or credentials were created.");
  const userIds = [owner.id, reader.id], originalUsers = await db.user.findMany({ where: { id: { in: userIds } }, select: userSelect, orderBy: { id: "asc" } });
  const originalMemberships = await db.membership.findMany({ where: { userId: { in: userIds } }, orderBy: { id: "asc" } });
  const companies: { id: string; slug: string }[] = [], memberships: { id: string; organisationId: string; userId: string }[] = [];
  const contexts: Awaited<ReturnType<Browser["newContext"]>>[] = [], browserErrors: string[] = [];
  try {
    for (const suffix of ["a", "b"]) {
      const company = await db.organisation.create({ data: { name: `Studio configured search ${suffix}`, slug: `studio-check-search-${suffix}-${randomUUID()}`,
        kind: "CUSTOMER", status: "ACTIVE", isTest: true }, select: { id: true, slug: true } });
      cleanupCompanyIds.push(company.id); companies.push(company);
      assert(await db.organisation.findFirst({ where: { id: company.id, slug: company.slug, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } }));
      await db.moduleState.createMany({ data: ["studio", "tickets"].map(moduleId => ({ organisationId: company.id, moduleId, enabled: true, entitled: true })) });
    }
    const [a, b] = companies;
    const authorGrants = [...Object.values(STUDIO_CAPABILITIES), "tickets.ticket.create", "tickets.ticket.manage", "tickets.ticket.read", ...Object.values(cap)];
    const readerGrants = ["tickets.ticket.read", cap.read, cap.written];
    for (const [organisationId, userId, grantedCapabilities] of [[a.id, owner.id, authorGrants], [a.id, reader.id, readerGrants], [b.id, owner.id, authorGrants]] as const) {
      const member = await db.membership.create({ data: { organisationId, userId, grantedCapabilities: [...grantedCapabilities] }, select: { id: true, organisationId: true, userId: true } });
      memberships.push(member);
    }
    const fresh = async (organisationId = a.id, userId = owner.id) => {
      const session = await sessionForUser(organisationId, userId); assert(session); assert(sessionAuthorityStamp(session));
      const member = memberships.find(value => value.organisationId === organisationId && value.userId === userId); assert(member);
      assert.equal(session.membershipId, member.id); assert(![...session.capabilities].some(value => value.startsWith("atlas."))); return session;
    };
    const readSession = async () => { const session = await fresh(a.id, reader.id);
      assert(session.capabilities.has("tickets.ticket.read")); assert(!session.capabilities.has(cap.write));
      assert(![...session.capabilities].some(value => value.startsWith("studio."))); return session; };
    const privateQueue = await db.serviceQueue.create({ data: { organisationId: a.id, name: "Search inaccessible private queue", prefix: "STUSPR", department: "Acceptance", restricted: true } });
    const publicQueue = await db.serviceQueue.create({ data: { organisationId: a.id, name: "Search permitted public queue", prefix: "STUSPU", department: "Acceptance", restricted: false } });
    const foreignQueue = await db.serviceQueue.create({ data: { organisationId: b.id, name: "Search isolated foreign queue", prefix: "STUSFR", department: "Acceptance", restricted: false } });
    await db.serviceQueueMember.createMany({ data: [
      { organisationId: a.id, queueId: privateQueue.id, userId: owner.id }, { organisationId: a.id, queueId: publicQueue.id, userId: owner.id },
      { organisationId: a.id, queueId: publicQueue.id, userId: reader.id }, { organisationId: b.id, queueId: foreignQueue.id, userId: owner.id },
    ] });
    const metadata = studioRegistry().describe("tickets.ticket", 9);
    const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
    const descriptor = studioRegistry().describe("tickets.ticket.field_search", 1);
    const query = { id: descriptor.id, version: descriptor.version, schemaHash: descriptor.schemaHash, contractHash: descriptor.contractHash };
    async function install(key: string, storage: CustomFieldPayload["field"]["storage"], organisationId = a.id): Promise<Field> {
      const session = await fresh(organisationId), payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: randomUUID(), field: {
        key, label: `Search ${key}`, classification: "confidential", indexed: true, readCapability: cap.written, writeCapability: cap.write, storage } });
      const definition = await createDraft(session, { key: `tickets.ticket.${key}`, name: `Search ${key}`, kind: "customField", payload });
      const draft = await db.studioDraft.findFirstOrThrow({ where: { organisationId, definitionId: definition.id } });
      const publication = await publishDraft(session, { definitionId: definition.id, revision: draft.revision, acknowledgeWarnings: true });
      const current = await db.studioDefinition.findFirstOrThrow({ where: { organisationId, id: definition.id } });
      await activateVersion(session, { definitionId: definition.id, versionId: publication.versionId, revision: current.revision });
      return { definitionId: definition.id, payload };
    }
    const integer = await install("count", { type: "integer" }), answer = await install("answer", { type: "boolean" });
    const decimal = await install("decimal", { type: "decimal", precision: 28, scale: 10 }), date = await install("date", { type: "date" });
    const money = await install("price", { type: "money", precision: 28, scale: 10, currencies: ["GBP", "USD"] });
    const reference = await install("linked", { type: "reference", entity }), foreignInteger = await install("count", { type: "integer" }, b.id);
    async function create(organisationId: string, queueId: string, subjects: string[]) {
      const member = await db.membership.findFirstOrThrow({ where: { organisationId, userId: owner.id, active: true } });
      const context = await browser.newContext({ baseURL: base, viewport: { width: 1280, height: 900 } }); contexts.push(context);
      const token = jwt.sign({ userId: owner.id, organisationId, authVersion: owner.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET!,
        { algorithm: "HS256", expiresIn: "30m" });
      await context.addCookies([{ name: "atlas_session", value: token, url: base, secure: base.startsWith("https"), httpOnly: true, sameSite: "Lax" }]);
      const page = await context.newPage(); page.on("pageerror", error => browserErrors.push(error.message)); const ids: string[] = [];
      for (const subject of subjects) {
        await page.goto("/tickets/create", { waitUntil: "networkidle" });
        const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Create ticket", exact: true }) });
        await form.getByLabel("Receiving team", { exact: true }).selectOption(queueId);
        await form.getByLabel("Subject", { exact: true }).fill(subject);
        await form.getByLabel("Details and requested action", { exact: true }).fill("Actual configured-search central Test fixture; no manual native/value insert.");
        await form.getByRole("button", { name: "Create ticket", exact: true }).click(); await expect(page).toHaveURL(/\/tickets\/[a-zA-Z0-9_-]+$/);
        const id = new URL(page.url()).pathname.split("/").at(-1)!;
        assert(await db.serviceWorkItem.findFirst({ where: { id, organisationId, queueId, kind: "TICKET", requesterUserId: owner.id, version: 1 } })); ids.push(id);
      }
      return ids;
    }
    const records = (await create(a.id, publicQueue.id, ["Search public one", "Search public two", "Search public three"])).sort();
    const [privateId] = await create(a.id, privateQueue.id, ["Search private native record"]), [foreignId] = await create(b.id, foreignQueue.id, ["Search foreign native record"]);
    async function save(field: Field, recordId: string, value: unknown, organisationId = a.id) {
      const session = await fresh(organisationId), definition = await db.studioDefinition.findFirstOrThrow({ where: { organisationId, id: field.definitionId }, include: { activeVersion: true } });
      assert(definition.activeVersion); const payload = customFieldPayloadSchema.parse(definition.activeVersion.payload);
      const native = await db.serviceWorkItem.findFirstOrThrow({ where: { organisationId, id: recordId, kind: "TICKET" } });
      const extension = await db.studioExtensionRecord.findFirst({ where: { organisationId, entityId: entity.id, recordId } });
      const slot = extension ? await db.studioFieldSlot.findFirst({ where: { organisationId, extensionId: extension.id, definitionId: field.definitionId,
        generationId: payload.storageGeneration }, include: { activeValue: true } }) : null;
      return writeFieldValue(session, { operationId: randomUUID(), definitionId: field.definitionId, definitionRevision: definition.revision,
        versionId: definition.activeVersionId, generationId: payload.storageGeneration, recordId, recordRevision: native.version,
        extensionRevision: extension?.revision ?? null, slotRevision: slot?.revision ?? null, valueRevision: slot?.activeValue?.revision ?? null, value });
    }
    for (const [index, value] of [8, 9, 0].entries()) await save(integer, records[index], value);
    await save(integer, privateId, 0); await save(foreignInteger, foreignId, 0, b.id);
    for (const [field, values] of [
      [answer, [true, null, false]], [decimal, ["0.0000000001", "0.0000000003", null]],
      [date, ["2026-10-01", null, "2026-10-20"]], [money, [{ amount: "1.10", currency: "GBP" }, { amount: "2.20", currency: "USD" }, { amount: "3.30", currency: "GBP" }]],
    ] as const) for (const [index, value] of values.entries()) await save(field, records[index], value);
    await save(reference, records[2], privateId);
    const tenantIds = companies.map(company => company.id), scope = { organisationId: { in: tenantIds } };
    const snapshot = async () => ({ native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
      nativeEntries: await db.serviceWorkEntry.findMany({ where: scope, orderBy: { id: "asc" } }), audits: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      outbox: await db.domainOutbox.findMany({ where: scope, orderBy: { id: "asc" } }), definitions: await db.studioDefinition.findMany({ where: scope, orderBy: { id: "asc" } }),
      extensions: await db.studioExtensionRecord.findMany({ where: scope, orderBy: { id: "asc" } }), slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }),
      values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }), publications: await db.studioFieldMigrationPublication.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      cutovers: await db.studioFieldMigrationCutover.findMany({ where: scope, orderBy: { preparationId: "asc" } }) });
    async function request(field: Field, filter: FieldSearchRequest["filter"], organisationId = a.id, limit = 50): Promise<FieldSearchRequest> {
      const definition = await db.studioDefinition.findFirstOrThrow({ where: { organisationId, id: field.definitionId }, include: { activeVersion: true } });
      assert(definition.activeVersion); const payload = customFieldPayloadSchema.parse(definition.activeVersion.payload);
      return fieldSearchRequestSchema.parse({ definitionId: field.definitionId, definitionRevision: definition.revision, versionId: definition.activeVersionId,
        generationId: payload.storageGeneration, filter, limit });
    }
    async function invoke(session: Session, input: unknown) {
      const before = await snapshot(), result = resultSchema.parse(await studioRegistry().invoke(session, query, input));
      assert.deepEqual(await snapshot(), before, "Configured search must be readonly, including migration windows.");
      assert(result.records.length <= 50); for (const record of result.records) { assert.equal(record.href, `/tickets/${record.id}`);
        assert(!Object.keys(record).some(key => /Value|organisation|generation|definition/.test(key))); }
      return result;
    }
    async function denied(session: Session, input: unknown, pattern: RegExp) {
      const before = await snapshot(); await assert.rejects(() => studioRegistry().invoke(session, query, input), pattern);
      assert.deepEqual(await snapshot(), before, "Denied search cannot mutate native/typed/configuration state or windows.");
    }
    const zero = await request(integer, { operator: "equals", value: { type: "integer", value: 0 } }, a.id, 2), customer = await readSession();
    const first = await invoke(customer, zero); assert.deepEqual(first.records, []); assert(first.next); assert.equal(first.next.after, records[1]);
    const next = await invoke(customer, { ...zero, cursor: first.next }); assert.deepEqual(next.records.map(row => row.id), [records[2]]); assert.equal(next.next, null);
    const falseResult = await invoke(customer, await request(answer, { operator: "equals", value: { type: "boolean", value: false } }));
    assert.deepEqual(falseResult.records.map(row => row.id), [records[2]]);
    const nullResult = await invoke(await fresh(), await request(answer, { operator: "equals", value: null }));
    assert.deepEqual(nullResult.records.map(row => row.id), [records[1]], "Explicit null matches; private native row with absent slot does not.");
    const ranges: [Field, FieldSearchRequest["filter"], string[]][] = [
      [integer, { operator: "gte", value: { type: "integer", value: 9 } }, [records[1]]],
      [decimal, { operator: "gte", value: { type: "decimal", value: "0.0000000002" } }, [records[1]]],
      [date, { operator: "gte", value: { type: "date", value: "2026-10-10" } }, [records[2]]],
      [money, { operator: "gte", value: { type: "money", value: { amount: "1.50", currency: "GBP" } } }, [records[2]]],
      [money, { operator: "gte", value: { type: "money", value: { amount: "1.50", currency: "USD" } } }, [records[1]]],
    ];
    for (const [field, filter, ids] of ranges) assert.deepEqual((await invoke(customer, await request(field, filter))).records.map(row => row.id), ids);
    const allZero = await invoke(customer, { ...zero, limit: 50 }); assert.deepEqual(allZero.records.map(row => row.id), [records[2]]);
    assert(!JSON.stringify(allZero).includes(privateId)); assert(!JSON.stringify(allZero).includes(foreignId));
    await denied(customer, { ...zero, cursor: first.next, filter: { operator: "equals", value: { type: "integer", value: 8 } } }, /CONFLICT/);
    await denied(await fresh(), { ...zero, cursor: first.next }, /CONFLICT/); // different genuinely issued actor
    await denied(await fresh(b.id), zero, /FIELD_UNAVAILABLE/);
    const ownerCursor = (await invoke(await fresh(), zero)).next; assert(ownerCursor);
    await denied(await fresh(b.id), { ...await request(foreignInteger, zero.filter, b.id, 2), cursor: ownerCursor }, /CONFLICT/);
    assert.deepEqual((await invoke(await fresh(b.id), await request(foreignInteger, zero.filter, b.id))).records.map(row => row.id), [foreignId]);
    await denied(customer, await request(reference, { operator: "equals", value: { type: "reference", value: privateId } }), /unavailable|FORBIDDEN/i);
    assert.deepEqual((await invoke(await fresh(), await request(reference, { operator: "equals", value: { type: "reference", value: privateId } }))).records.map(row => row.id), [records[2]]);
    // Legal same-generation label/help publication leaves current values written
    // under the original immutable version. Its Read grant remains the same.
    const author = await fresh(), draft = await db.studioDraft.findFirstOrThrow({ where: { organisationId: a.id, definitionId: integer.definitionId } });
    await updateDraft(author, { definitionId: integer.definitionId, revision: draft.revision,
      payload: { ...integer.payload, field: { ...integer.payload.field, label: "Search count clarified", help: "Same generation, retained written schema." } } });
    const publication = await publishDraft(author, { definitionId: integer.definitionId, revision: draft.revision + 1, acknowledgeWarnings: true });
    const definition = await db.studioDefinition.findFirstOrThrow({ where: { organisationId: a.id, id: integer.definitionId } });
    await activateVersion(author, { definitionId: integer.definitionId, versionId: publication.versionId, revision: definition.revision });
    await denied(customer, zero, /CONFLICT/);
    const currentZero = await request(integer, zero.filter);
    await denied({ ...customer }, currentZero, /FORBIDDEN|genuine/i);
    await denied(customer, { ...currentZero, cursor: first.next }, /CONFLICT/);
    const retained = await db.studioFieldSlot.findFirstOrThrow({ where: { organisationId: a.id, definitionId: integer.definitionId,
      extension: { organisationId: a.id, recordId: records[2] }, generationId: integer.payload.storageGeneration }, include: { activeValue: true } });
    assert(retained.activeValue); assert.notEqual(retained.activeValue.versionId, currentZero.versionId);
    assert.deepEqual((await invoke(await readSession(), currentZero)).records.map(row => row.id), [records[2]]);
    const readMember = memberships.find(value => value.organisationId === a.id && value.userId === reader.id)!;
    await db.membership.update({ where: { id: readMember.id, organisationId: a.id }, data: { deniedCapabilities: [cap.written] } });
    try { await denied(customer, currentZero, /FORBIDDEN/); }
    finally { await db.membership.update({ where: { id: readMember.id, organisationId: a.id }, data: { deniedCapabilities: [] } }); }
    await db.moduleState.updateMany({ where: { organisationId: a.id, moduleId: "tickets" }, data: { enabled: false } });
    try { await denied(customer, currentZero, /DEPENDENCY_BROKEN|unavailable/i); }
    finally { await db.moduleState.updateMany({ where: { organisationId: a.id, moduleId: "tickets" }, data: { enabled: true } }); }
    await db.membership.update({ where: { id: readMember.id, organisationId: a.id }, data: { sessionVersion: { increment: 1 } } });
    await denied(customer, currentZero, /FORBIDDEN/); const refreshed = await readSession();
    await db.membership.update({ where: { id: readMember.id, organisationId: a.id }, data: { active: false } });
    try { await denied(refreshed, currentZero, /FORBIDDEN/); }
    finally { await db.membership.update({ where: { id: readMember.id, organisationId: a.id }, data: { active: true } }); }
    // One representative reviewed generation narrows the constraint to valid
    // 0..1000 for this actual complete cohort, using the existing lifecycle only.
    const active = await db.studioDefinition.findFirstOrThrow({ where: { organisationId: a.id, id: integer.definitionId }, include: { activeVersion: true, draft: true } });
    assert(active.activeVersion && active.draft);
    const activePayload = customFieldPayloadSchema.parse(active.activeVersion.payload);
    const target = customFieldPayloadSchema.parse({ ...activePayload, storageGeneration: randomUUID(),
      field: { ...activePayload.field, readCapability: cap.read, storage: { type: "integer", min: 0, max: 1000 } } });
    const migrationAuthor = await fresh(); await updateDraft(migrationAuthor, { definitionId: integer.definitionId, revision: active.draft.revision, payload: target });
    const changedDraft = await db.studioDraft.findFirstOrThrow({ where: { organisationId: a.id, definitionId: integer.definitionId } });
    const principal = await captureCustomerFieldMigrationPrincipal(migrationAuthor);
    const preparation = await startFieldMigrationPreparation(migrationAuthor, principal, { operationId: randomUUID(), definitionId: integer.definitionId,
      definitionRevision: active.revision, draftRevision: changedDraft.revision, conversion: { kind: "same_type" } });
    let collection = await collectFieldMigrationBatch(migrationAuthor, { preparationId: preparation.id, revision: preparation.revision, limit: 2 });
    for (let page = 0; !collection.cursorExhausted; page++) { assert(page < 3); collection = await collectFieldMigrationBatch(migrationAuthor, { preparationId: preparation.id, revision: collection.revision, limit: 2 }); }
    const review = await sealFieldMigrationPreparation(migrationAuthor, { preparationId: preparation.id, revision: collection.revision });
    assert.equal(review.summary.validCount, 4); assert.equal(review.summary.invalidCount, 0);
    const migrated = await publishReviewedFieldMigration(migrationAuthor, { preparationId: preparation.id, revision: review.revision, reviewChecksum: review.checksum,
      acknowledgeWarnings: true, acknowledgeLoss: false });
    let execution = await startFieldMigrationExecution(migrationAuthor, { preparationId: preparation.id, publicationRevision: migrated.publicationRevision, reviewChecksum: review.checksum });
    for (let page = 0; execution.state !== "READY"; page++) { assert(page < 3); execution = await executeFieldMigrationBatch(migrationAuthor, { preparationId: preparation.id, revision: execution.revision, limit: 2 }); }
    const latest = await db.studioDefinition.findFirstOrThrow({ where: { organisationId: a.id, id: integer.definitionId } });
    await cutoverReviewedFieldMigration(migrationAuthor, { preparationId: preparation.id, reviewChecksum: review.checksum, definitionRevision: latest.revision,
      publicationRevision: migrated.publicationRevision, executionRevision: execution.revision });
    const newZero = await request(integer, zero.filter); assert.notEqual(newZero.generationId, zero.generationId);
    assert.deepEqual((await invoke(await readSession(), newZero)).records.map(row => row.id), [records[2]]);
    await save(integer, records[2], 7); assert.deepEqual((await invoke(await readSession(), newZero)).records, []);
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { organisationId: a.id, preparationId: preparation.id } })).state, "FINALIZED");
    assert.equal((await db.studioFieldValue.findFirstOrThrow({ where: { id: retained.activeValue.id, organisationId: a.id } })).integerValue, 0n);
    for (const capability of [cap.read, "tickets.ticket.read"]) {
      await db.membership.update({ where: { id: readMember.id, organisationId: a.id }, data: { deniedCapabilities: [capability] } });
      try { await denied(await fresh(a.id, reader.id), newZero, /FORBIDDEN/); }
      finally { await db.membership.update({ where: { id: readMember.id, organisationId: a.id }, data: { deniedCapabilities: [] } }); }
    }
    await denied(await readSession(), { ...newZero, limit: 51 }, /50|maximum|Too big|invalid/i);
    await denied(await readSession(), { ...newZero, organisationId: b.id }, /Unrecognized|unknown|invalid/i);
    await denied(await readSession(), await request(answer, { operator: "gte", value: { type: "boolean", value: false } }), /FIELD_SEARCH_UNSUPPORTED/);
    // EXPLAIN probes below are bounded exact Test predicates, not forced claims
    // about the planner's chosen production plan. No business column is changed.
    const explain = async (field: Field, predicate: Prisma.Sql, indexName: string) => {
      const definition = await db.studioDefinition.findFirstOrThrow({ where: { organisationId: a.id, id: field.definitionId }, include: { activeVersion: true } });
      assert(definition.activeVersion); const payload = customFieldPayloadSchema.parse(definition.activeVersion.payload);
      const slots = await db.studioFieldSlot.findMany({ where: { organisationId: a.id, definitionId: field.definitionId, generationId: payload.storageGeneration,
        extension: { organisationId: a.id, recordId: { in: records } }, activeValueId: { not: null } }, select: { id: true, activeValueId: true }, take: 4 });
      assert(slots.length > 0 && slots.length <= records.length);
      const pairs = Prisma.join(slots.map(slot => Prisma.sql`(v.id=${slot.activeValueId}::uuid AND v."slotId"=${slot.id}::uuid)`), " OR ");
      const prefix = Prisma.sql`v."organisationId"=${a.id} AND v."definitionId"=${field.definitionId}::uuid AND v."generationId"=${payload.storageGeneration}::uuid`;
      const actualPlan = await db.$queryRaw<unknown[]>(Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT v.* FROM studio_field_values v
        WHERE ${prefix} AND (${pairs}) AND ${predicate} LIMIT 50`);
      console.log(`Configured-search genuine bounded active-ID ${indexName} predicate plan (tiny fixture may choose SeqScan):`, JSON.stringify(actualPlan));
      const rollback = new Error("Exact Test EXPLAIN local-settings rollback");
      await assert.rejects(() => db.$transaction(async tx => {
        await tx.$executeRaw`SET LOCAL enable_seqscan=off`;
        // Remove only the already bounded active-ID shortlist to isolate the
        // existing scalar index prefix. This is eligibility, not the actual plan.
        const plans = await tx.$queryRaw<unknown[]>(Prisma.sql`EXPLAIN (FORMAT JSON) SELECT v.id FROM studio_field_values v
          WHERE ${prefix} AND ${predicate} LIMIT 50`);
        assert(JSON.stringify(plans).includes(indexName), `Existing ${indexName} must be eligible for its tenant/definition/generation scalar prefix.`);
        console.log(`Configured-search ${indexName} ELIGIBILITY ONLY (local seqscan disabled; rolled back):`, JSON.stringify(plans));
        throw rollback;
      }), error => error === rollback);
    };
    const current = await db.studioDefinition.findFirstOrThrow({ where: { organisationId: a.id, id: integer.definitionId }, include: { activeVersion: true } }); assert(current.activeVersion);
    const fingerprint = encodeFieldValue(customFieldPayloadSchema.parse(current.activeVersion.payload).field, 7).fingerprint;
    await explain(integer, Prisma.sql`v.fingerprint=${fingerprint}`, "studio_field_fingerprint_idx");
    await explain(integer, Prisma.sql`NOT v."isNull" AND v."integerValue">=${9n}`, "studio_field_integer_idx");
    await explain(decimal, Prisma.sql`NOT v."isNull" AND v."decimalValue">=${new Prisma.Decimal("0.0000000002")}`, "studio_field_decimal_idx");
    await explain(money, Prisma.sql`NOT v."isNull" AND v.currency=${"GBP"} AND v."decimalValue">=${new Prisma.Decimal("1.50")}`, "studio_field_decimal_idx");
    await explain(date, Prisma.sql`NOT v."isNull" AND v."dateValue">=${"2026-10-10"}::date`, "studio_field_date_idx");
    assert.equal(await db.serviceWorkItem.count({ where: scope }), 5); assert.deepEqual(browserErrors, []);
    assert.deepEqual(await db.user.findMany({ where: { id: { in: userIds } }, select: userSelect, orderBy: { id: "asc" } }), originalUsers);
    assert.deepEqual(await db.membership.findMany({ where: { userId: { in: userIds }, organisationId: { notIn: tenantIds } }, orderBy: { id: "asc" } }), originalMemberships);
    console.log("PASS configured Ticket field search: genuine readonly native projections, zero/false/null + ranges/currency, empty continuation, actor/tenant/config cursor, native private/current+written/reference Read, module/stale session denial, reviewed current-generation/history and labelled actual/index-eligible SQL plans");
  } finally {
    // Attempt every independent exact fixture cleanup even if one fails. The
    // original driver also owns registered-company recovery; never touch old
    // memberships/identities or delete the retained native/typed history.
    const cleanup = [
      ...await Promise.allSettled(contexts.map(context => context.close())),
      ...await Promise.allSettled(memberships.map(member => db.membership.updateMany({ where: { ...member },
        data: { active: false, grantedCapabilities: [], deniedCapabilities: [], sessionVersion: { increment: 1 } } }))),
      ...await Promise.allSettled(companies.map(company => db.organisation.updateMany({ where: { id: company.id, slug: company.slug,
        kind: "CUSTOMER", isTest: true }, data: { status: "SUSPENDED" } }))),
    ];
    const failures = cleanup.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failures.length) throw new AggregateError(failures.map(result => result.reason), "Configured-search exact Test cleanup needs recovery through the original registered-company driver.");
  }
}
