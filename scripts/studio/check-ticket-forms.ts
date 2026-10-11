import { createdTicketUrl } from "./ticket-urls";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { expect, type Browser, type Locator } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import { encodeWire, decodeWire } from "../../src/core/desktop/wire";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { customFieldPayloadSchema, type CustomFieldPayload } from "../../src/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "../../src/core/studio/fields/required-contract";
import { captureCustomerFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { compileFieldMigrationMetadata } from "../../src/core/studio/fields/migrations/metadata";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { fieldFormPacketSchema, type FieldFormPacket } from "../../src/core/studio/fields/form-packet";
import { ticketFormReceiptKey, ticketFormReceiptSchema } from "../../src/core/service-work/form-receipt-contract";

const responseSchema = z.object({ error: z.string().optional(), redirect: z.string().optional(), value: z.unknown().optional() });
const cap = { read: "tickets.field.forms_read", written: "tickets.field.forms_written", write: "tickets.field.forms_write" };
type Entries = [string, string][];
const action = "src/core/service-work/actions:";
const label = { zero: "Form zero count", false: "Form false answer", conditional: "Form conditional estimate", reference: "Form linked ticket" };

/** Original combined driver only. Real central Test services, browser forms and
 * authenticated owning HTTP actions. No separate DB, dumps, action mocks, direct
 * native/value insertion or permission bypass. Source/static checks do not mean
 * these SQL/HTTP/browser probes passed. All immutable history is retained. */
export async function checkTicketForms(base: string, browser: Browser, existingSyntheticUserId: string, cleanupCompanyIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const user = await db.user.findFirstOrThrow({ where: { id: existingSyntheticUserId, platformAdmin: null,
    email: { startsWith: "studio-check-", endsWith: "@example.test" } } });
  const originalMemberships = await db.membership.findMany({ where: { userId: user.id }, orderBy: { id: "asc" } });
  const company = await db.organisation.create({ data: { name: "Studio owning Ticket form acceptance",
    slug: `studio-check-forms-${randomUUID()}`, kind: "CUSTOMER", status: "ACTIVE", isTest: true } });
  cleanupCompanyIds.push(company.id); // Before ANY further fixture operation.
  const organisationId = company.id, scope = { organisationId };
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  let membershipId: string | undefined;
  try {
    assert(await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null,
      isTest: true, slug: { startsWith: "studio-check-forms-" } } }));
    await db.moduleState.createMany({ data: ["studio", "tickets"].map(moduleId => ({ organisationId, moduleId, enabled: true, entitled: true })) });
    const nativeGrants = ["tickets.ticket.create", "tickets.ticket.read", "tickets.ticket.manage", ...Object.values(cap)];
    const setupGrants = [...Object.values(STUDIO_CAPABILITIES), ...nativeGrants];
    const membership = await db.membership.create({ data: { organisationId, userId: user.id, grantedCapabilities: setupGrants } });
    membershipId = membership.id;
    const fresh = async () => { const session = await sessionForUser(organisationId, user.id); assert(session);
      assert.equal(session.membershipId, membership.id); assert(![...session.capabilities].some(value => value.startsWith("atlas."))); return session; };
    const author = await fresh();
    const queue = await db.serviceQueue.create({ data: { organisationId, name: "Exact form private queue", prefix: "STUFORM", department: "Acceptance", restricted: true } });
    const queueMember = await db.serviceQueueMember.create({ data: { organisationId, queueId: queue.id, userId: user.id } });
    const metadata = studioRegistry().describe("tickets.ticket", 9);
    const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
    async function install(key: string, title: string, storage: CustomFieldPayload["field"]["storage"], required = false, readCapability = cap.read) {
      const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: randomUUID(), field: {
        key, label: title, classification: "confidential", readCapability, writeCapability: cap.write, required, storage } });
      const created = await createDraft(author, { key: `tickets.ticket.${key}`, name: title, kind: "customField", payload });
      const saved = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: created.id } });
      const publication = await publishDraft(author, { definitionId: created.id, revision: saved.revision, acknowledgeWarnings: true });
      const current = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: created.id } });
      await activateVersion(author, { definitionId: created.id, versionId: publication.versionId, revision: current.revision });
      return { definitionId: created.id, payload, versionId: publication.versionId };
    }
    // Real zero-cohort required activation, before the first native INSERT.
    assert.equal(await db.serviceWorkItem.count({ where: scope }), 0);
    const zero = await install("form_zero", label.zero, { type: "integer" }, true, cap.written);
    await install("form_false", label.false, { type: "boolean" }, true);
    const conditional = await install("form_conditional", label.conditional, { type: "integer" });
    const reference = await install("form_reference", label.reference, { type: "reference", entity });
    const principal = await captureCustomerFieldMigrationPrincipal(author);
    async function reviewedMigration(session: Session, definitionId: string, definitionRevision: number, draftRevision: number,
      conversion: { kind: "same_type" | "integer_to_decimal" }, expectedCount: number) {
      const principal = await captureCustomerFieldMigrationPrincipal(session);
      const preparation = await startFieldMigrationPreparation(session, principal, { operationId: randomUUID(), definitionId,
        definitionRevision, draftRevision, conversion });
      let collected = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: preparation.revision, limit: 2 });
      for (let pages = 0; !collected.cursorExhausted; pages++) { assert(pages < 3);
        collected = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: collected.revision, limit: 2 }); }
      const review = await sealFieldMigrationPreparation(session, { preparationId: preparation.id, revision: collected.revision });
      assert.equal(review.summary.validCount, expectedCount); assert.equal(review.summary.invalidCount, 0);
      const publication = await publishReviewedFieldMigration(session, { preparationId: preparation.id, revision: review.revision,
        reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
      let execution = await startFieldMigrationExecution(session, { preparationId: preparation.id, publicationRevision: publication.publicationRevision, reviewChecksum: review.checksum });
      for (let pages = 0; execution.state !== "READY"; pages++) { assert(pages < 3);
        execution = await executeFieldMigrationBatch(session, { preparationId: preparation.id, revision: execution.revision, limit: 2 }); }
      assert.equal(execution.processedCount, expectedCount);
      const current = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definitionId } });
      await cutoverReviewedFieldMigration(session, { preparationId: preparation.id, reviewChecksum: review.checksum,
        definitionRevision: current.revision, publicationRevision: publication.publicationRevision, executionRevision: execution.revision });
      return preparation;
    }
    const seeded = await withFieldMigrationAuthority(author, principal, async ({ session, transaction: tx }) => {
      const current = await tx.studioDefinition.findFirstOrThrow({ where: { ...scope, id: conditional.definitionId }, include: { draft: true } }); assert(current.draft);
      const target = conditionalFieldPayloadSchema.parse({ ...conditional.payload, schemaVersion: 2, storageGeneration: randomUUID(),
        field: { ...conditional.payload.field, storage: { type: "decimal", precision: 28, scale: 10 } },
        requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "NEW" } }] } });
      const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, studioRegistry(), company, conditional.definitionId, target);
      assert.equal((await tx.studioDraft.updateMany({ where: { id: current.draft.id, ...scope, revision: current.draft.revision },
        data: { payload: compiled.payload, revision: { increment: 1 }, validation: Prisma.DbNull } })).count, 1);
      await tx.auditEntry.create({ data: { ...scope, actorUserId: user.id, action: "studio.ticket_forms.test_draft_seeded", entityType: "StudioDefinition", entityId: current.id } });
      return { definitionRevision: current.revision, draftRevision: current.draft.revision + 1 };
    });
    const preparation = await reviewedMigration(author, conditional.definitionId, seeded.definitionRevision, seeded.draftRevision, { kind: "integer_to_decimal" }, 0);
    // Ordinary native customer forms possess no Studio editing/publishing grant.
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: nativeGrants } });
    const customer = await fresh(); assert(![...customer.capabilities].some(value => value.startsWith("studio.")));
    const token = jwt.sign({ userId: user.id, organisationId, authVersion: user.authVersion, sessionVersion: membership.sessionVersion },
      process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" });
    await context.addCookies([{ name: "atlas_session", value: token, url: base, secure: base.startsWith("https"), httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();
    const browserErrors: string[] = []; page.on("pageerror", error => browserErrors.push(error.message));
    const snapshot = async () => ({
      native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
      entries: await db.serviceWorkEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      sequences: await db.serviceSequence.findMany({ where: scope, orderBy: { prefix: "asc" } }),
      audits: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      outbox: await db.domainOutbox.findMany({ where: scope, orderBy: { id: "asc" } }),
      definitions: await db.studioDefinition.findMany({ where: scope, orderBy: { id: "asc" } }),
      extensions: await db.studioExtensionRecord.findMany({ where: scope, orderBy: { id: "asc" } }),
      slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }),
      values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }),
      publications: await db.studioFieldMigrationPublication.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      cutovers: await db.studioFieldMigrationCutover.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
    });
    const entries = async (form: Locator): Promise<Entries> => form.evaluate(element => Array.from(new FormData(element as HTMLFormElement).entries())
      .map(([key, value]) => { if (typeof value !== "string") throw new Error("Unexpected binary form fixture."); return [key, value]; }));
    const formData = (values: Entries) => { const form = new FormData(); for (const [key, value] of values) form.append(key, value); return form; };
    const packet = (values: Entries) => fieldFormPacketSchema.parse(JSON.parse(values.find(([key]) => key === "studioFields")![1]));
    const replacePacket = (values: Entries, value: FieldFormPacket): Entries => values.map(([key, current]) => [key, key === "studioFields" ? JSON.stringify(value) : current]);
    async function call(name: string, args: unknown[]) {
      const payload = { action: name, args: await encodeWire(args) };
      // Browser fetch retains real Secure session on the candidate loopback URL.
      const response = await page.evaluate(async body => {
        const response = await fetch("/api/desktop/action", { method: "POST", headers: { "content-type": "application/json", "x-atlas-client": "desktop" }, body });
        return { status: response.status, body: await response.json() as unknown };
      }, JSON.stringify(payload));
      const body = responseSchema.parse(response.body), decoded = body.value === undefined ? undefined : decodeWire(body.value as Awaited<ReturnType<typeof encodeWire>>);
      const feedback = z.object({ error: z.string() }).safeParse(decoded);
      return { status: response.status, redirect: body.redirect, value: decoded, error: body.error ?? (feedback.success ? feedback.data.error : undefined) };
    }
    async function denied(values: Entries, operation: "create" | "update", expected?: RegExp) {
      const before = await snapshot(), response = await call(`${action}${operation === "create" ? "createWork" : "updateWork"}`, [formData(values)]);
      assert(response.error, "Rejected form must return explicit feedback."); if (expected) assert.match(response.error, expected);
      assert.deepEqual(await snapshot(), before, "Rejected whole form must preserve native/typed/sequence/Audit/outbox/window state.");
    }
    await page.goto("/tickets/create", { waitUntil: "networkidle" });
    const createForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create ticket", exact: true }) });
    await expect(createForm.getByRole("heading", { name: "Additional details", exact: true })).toBeVisible();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(createForm.getByRole("spinbutton", { name: /^Form zero count/ })).toBeVisible();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Configured Ticket form overflows at ${width}px.`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await createForm.getByLabel("Subject", { exact: true }).fill("Exact Studio form browser ticket");
    await createForm.getByLabel("Details and requested action", { exact: true }).fill("Guarded central Test form acceptance.");
    await createForm.getByRole("spinbutton", { name: /^Form zero count/ }).fill("0");
    await createForm.getByRole("combobox", { name: /^Form false answer/ }).selectOption("no");
    await createForm.getByLabel(label.conditional, { exact: true }).fill("12.5");
    const originalCreate = await entries(createForm), originalPacket = packet(originalCreate);
    assert.equal(originalPacket.fields.length, 3);
    const missing = structuredClone(originalPacket); missing.fields = missing.fields.filter(field => field.definitionId !== conditional.definitionId);
    await denied(replacePacket(originalCreate, missing), "create", /required/);
    await expect(createForm.getByLabel(label.conditional, { exact: true })).toHaveValue("12.5");
    await createForm.getByRole("button", { name: "Create ticket", exact: true }).click();
    await expect(page).toHaveURL(createdTicketUrl(base));
    const recordId = new URL(page.url()).pathname.split("/").at(-1)!;
    const created = await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: recordId } });
    assert.equal(created.version, 1); assert.equal(created.status, "NEW"); assert.equal(created.requesterUserId, user.id);
    const receipt = await db.auditEntry.findFirstOrThrow({ where: { ...scope, id: ticketFormReceiptKey(originalPacket.operationId) } });
    const savedReceipt = ticketFormReceiptSchema.parse(receipt.after); assert.equal(savedReceipt.fields.length, 3); assert.equal(savedReceipt.recordId, recordId);
    assert.equal(await db.studioFieldValue.count({ where: { ...scope, definitionId: zero.definitionId, integerValue: 0 } }), 1);
    assert.equal(await db.studioFieldValue.count({ where: { ...scope, booleanValue: false } }), 1);
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: preparation.id } })).state, "FINALIZED");
    const afterCreate = await snapshot(), retried = await call(`${action}createWork`, [formData(originalCreate)]);
    assert.equal(retried.error, undefined); assert.equal(retried.redirect, `/tickets/${recordId}`);
    assert.deepEqual(await snapshot(), afterCreate, "Lost-response replay is read-only and returns original native ID.");
    const subset = structuredClone(originalPacket); subset.fields.pop(); await denied(replacePacket(originalCreate, subset), "create", /CONFLICT/);
    await denied(originalCreate.map(([key, value]) => [key, key === "subject" ? "Conflicting retry" : value]), "create", /CONFLICT/);
    await page.reload({ waitUntil: "networkidle" });
    const edit = () => page.locator("form").filter({ has: page.getByRole("button", { name: "Update work", exact: true }) });
    await expect(edit().getByRole("spinbutton", { name: /^Form zero count/ })).toHaveValue("0");
    await expect(edit().getByRole("combobox", { name: /^Form false answer/ })).toHaveValue("no");
    await expect(edit().getByLabel(label.conditional, { exact: true })).toHaveValue("12.5");
    // Same-form conditional clear uses resulting status, not pre-CAS NEW facts.
    await edit().getByLabel("Status", { exact: true }).selectOption("IN_PROGRESS");
    await edit().getByRole("button", { name: `Clear ${label.conditional}`, exact: true }).click();
    await edit().getByLabel(`Search ${label.reference}`, { exact: true }).fill(created.number);
    await edit().getByRole("button", { name: "Search", exact: true }).click();
    await edit().getByRole("button", { name: `Choose ${created.number} · ${created.subject}`, exact: true }).click();
    const updateEntries = await entries(edit());
    await edit().getByRole("button", { name: "Update work", exact: true }).click();
    await expect(edit().getByRole("status")).toHaveText("Saved.");
    const progressed = await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: recordId } }); assert.equal(progressed.version, 2); assert.equal(progressed.status, "IN_PROGRESS");
    const updateReceipt = await db.auditEntry.findFirstOrThrow({ where: { ...scope, id: ticketFormReceiptKey(packet(updateEntries).operationId) } });
    assert.equal(ticketFormReceiptSchema.parse(updateReceipt.after).fieldRecordRevision, 1);
    const afterUpdate = await snapshot(); assert.equal((await call(`${action}updateWork`, [formData(updateEntries)])).error, undefined);
    assert.deepEqual(await snapshot(), afterUpdate);
    const stale = structuredClone(packet(updateEntries)); stale.operationId = randomUUID(); stale.fields.forEach(field => field.operationId = randomUUID());
    await denied(replacePacket(updateEntries, stale), "update", /CONFLICT/);
    await page.reload({ waitUntil: "networkidle" }); await expect(edit().getByLabel(label.conditional, { exact: true })).toHaveValue("");
    const requiredNull = await entries(edit()), nullPacket = packet(requiredNull), integer = zero.definitionId;
    // Untrusted packet null cannot waive an unconditional required field.
    const manifestField = originalPacket.fields.find(field => field.definitionId === integer)!;
    nullPacket.fields = [{ ...manifestField, operationId: randomUUID(), slotRevision: 1, valueRevision: 1, value: null }];
    await denied(replacePacket(requiredNull, nullPacket), "update", /required/);
    // A normal resolve and reopen use distinct server staging baselines.
    await edit().getByLabel("Status", { exact: true }).selectOption("RESOLVED");
    await edit().getByLabel("Resolution / reason", { exact: true }).fill("Exact Test resolution");
    await edit().getByRole("button", { name: "Update work", exact: true }).click(); await expect(edit().getByRole("status")).toHaveText("Saved.");
    await page.reload({ waitUntil: "networkidle" });
    await edit().getByLabel("Status", { exact: true }).selectOption("IN_PROGRESS"); await edit().getByLabel("Resolution / reason", { exact: true }).fill("Exact Test reopen");
    await edit().getByRole("spinbutton", { name: /^Form zero count/ }).fill("1"); const reopen = await entries(edit());
    await edit().getByRole("button", { name: "Update work", exact: true }).click(); await expect(edit().getByRole("status")).toHaveText("Saved.");
    const reopened = await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: recordId } }); assert.equal(reopened.version, 4); assert.equal(reopened.reopenCount, 1);
    const reopenedReceipt = ticketFormReceiptSchema.parse((await db.auditEntry.findFirstOrThrow({ where: { ...scope, id: ticketFormReceiptKey(packet(reopen).operationId) } })).after);
    assert.equal(reopenedReceipt.requestRecordRevision, 3); assert.equal(reopenedReceipt.fieldRecordRevision, 4);
    const afterReopen = await snapshot(); assert.equal((await call(`${action}updateWork`, [formData(reopen)])).error, undefined); assert.deepEqual(await snapshot(), afterReopen);
    // Narrow registered reference action; explicit entity/query/tenant selection
    // and guessed foreign/unsupported definitions are not lookup authority.
    const choices = await call("src/core/service-work/field-form-actions:searchTicketFieldReferences", [{ form: { operation: "update", recordId }, definitionId: reference.definitionId, search: created.number }]);
    assert.equal(choices.error, undefined); assert(z.array(z.object({ id: z.string(), label: z.string() })).parse(choices.value).some(choice => choice.id === recordId));
    const unsupported = await call("src/core/service-work/field-form-actions:searchTicketFieldReferences", [{ form: { operation: "update", recordId }, definitionId: zero.definitionId, search: "", organisationId }]); assert(unsupported.error);
    for (const deniedCapability of [cap.read, cap.written, cap.write, "tickets.ticket.create"]) {
      await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [deniedCapability] } });
      try { await denied(originalCreate, "create", /FORBIDDEN|do not have access/); } finally { await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [] } }); }
    }
    await db.serviceQueueMember.delete({ where: { id: queueMember.id, organisationId } });
    try { await denied(reopen, "update", /FORBIDDEN|restricted|unavailable/i); }
    finally { await db.serviceQueueMember.create({ data: queueMember }); }
    // Access is structural: normal one-record reviewed evolution/new generation
    // preserves the old written schema while the current policy changes.
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: setupGrants } });
    const authorNow = await fresh(), savedDraft = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: zero.definitionId } });
    await updateDraft(authorNow, { definitionId: zero.definitionId, revision: savedDraft.revision, payload: { ...zero.payload,
      storageGeneration: randomUUID(), field: { ...zero.payload.field, readCapability: cap.read } } });
    const changedDraft = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: zero.definitionId } });
    const latest = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: zero.definitionId } });
    const policyPreparation = await reviewedMigration(authorNow, zero.definitionId, latest.revision, changedDraft.revision, { kind: "same_type" }, 1);
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: nativeGrants, deniedCapabilities: [cap.written] } });
    try { await denied(originalCreate, "create", /FORBIDDEN|do not have access/); } finally { await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [] } }); }
    // Exact-tenant completion Audit failure must roll back the native CAS, typed
    // writes, owning history/outbox and all related windows together.
    await page.reload({ waitUntil: "networkidle" }); await edit().getByRole("spinbutton", { name: /^Form zero count/ }).fill("2");
    const failing = await entries(edit()), trigger = `studio_form_audit_${randomUUID().replaceAll("-", "")}`;
    assert(/^[a-zA-Z0-9_-]+$/.test(organisationId));
    try {
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${organisationId}' AND NEW.action='tickets.form.completed' THEN RAISE EXCEPTION 'Exact Test Ticket form completion Audit failure'; END IF; RETURN NEW; END $$;`);
      await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
      await denied(failing, "update");
    } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    const recovered = await call(`${action}updateWork`, [formData(failing)]); assert.equal(recovered.error, undefined);
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: policyPreparation.id } })).state, "FINALIZED");
    const latestReceipt = ticketFormReceiptSchema.parse((await db.auditEntry.findFirstOrThrow({ where: { ...scope,
      id: ticketFormReceiptKey(packet(failing).operationId) } })).after);
    assert.equal(latestReceipt.recordRevision, 5);
    // Targeted DDL assertions execute on actual reserved receipts. Each failed
    // statement has its own transaction; unrelated Audit remains mutable.
    const ordinary = await db.auditEntry.create({ data: { ...scope, actorUserId: user.id, action: "studio.ticket_forms.test_scrub", entityType: "Party", entityId: "exact-test-party", after: { text: "Fixture only" } } });
    await db.auditEntry.update({ where: { id: ordinary.id, organisationId }, data: { after: { redacted: true } } });
    const beforeDDL = await snapshot();
    await assert.rejects(() => db.auditEntry.update({ where: { id: receipt.id, organisationId }, data: { after: {} } }), /immutable/);
    await assert.rejects(() => db.auditEntry.delete({ where: { id: receipt.id, organisationId } }), /immutable/);
    await assert.rejects(() => db.auditEntry.update({ where: { id: receipt.id, organisationId }, data: { id: `renamed-${randomUUID()}`, action: "ordinary.test", entityType: "Party" } }), /immutable/);
    await assert.rejects(() => db.auditEntry.update({ where: { id: ordinary.id, organisationId }, data: { action: "tickets.form.completed", entityType: "TicketFormReceipt" } }), /immutable/);
    for (const patch of [{ schemaVersion: 99 }, { organisationId: "foreign" }, { recordId: "foreign_native" },
      { recordRevision: 6, requestRecordRevision: 5, fieldRecordRevision: 5 }, { fields: [{ extra: true }] }]) {
      const operationId = randomUUID(), after = { ...latestReceipt, ...patch, operationId } as Prisma.InputJsonObject;
      await assert.rejects(() => db.auditEntry.create({ data: { id: ticketFormReceiptKey(operationId), ...scope, actorUserId: user.id,
        action: "tickets.form.completed", entityType: "TicketFormReceipt", entityId: recordId, after } }), /Ticket form receipt/);
    }
    assert.deepEqual(await snapshot(), beforeDDL);
    assert.deepEqual(await db.membership.findMany({ where: { userId: user.id, organisationId: { not: organisationId } }, orderBy: { id: "asc" } }), originalMemberships,
      "Existing synthetic/QA affiliations must remain unchanged.");
    assert.deepEqual(browserErrors, [], "Owning Ticket form must have no browser runtime errors.");
    console.log("PASS owning Ticket browser/HTTP forms: actual required zero/false and conditional cutover; atomic create/update/reopen; strict replay/CAS/access; completion Audit rollback; reserved SQL guards and ordinary Audit compatibility");
  } finally {
    try { await context.close(); }
    finally {
      try {
        if (membershipId) await db.membership.updateMany({ where: { id: membershipId, organisationId, userId: user.id },
          data: { active: false, grantedCapabilities: [], deniedCapabilities: [], sessionVersion: { increment: 1 } } });
      } finally {
        await db.organisation.updateMany({ where: { id: organisationId, kind: "CUSTOMER", isTest: true, slug: { startsWith: "studio-check-forms-" } }, data: { status: "SUSPENDED" } });
      }
    }
  }
}
