import { createdTicketUrl } from "./ticket-urls";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import jwt from "jsonwebtoken";
import { expect, type Browser, type Locator } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import { sessionForUser } from "../../src/core/auth/session";
import { encodeWire, decodeWire } from "../../src/core/desktop/wire";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { customFieldPayloadSchema, type CustomFieldPayload, type FieldValue } from "../../src/core/studio/fields/schema";
import { captureCustomerFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { fieldFormPacketSchema } from "../../src/core/studio/fields/form-packet";
import { ticketFieldDefaultOperationId } from "../../src/core/service-work/field-defaults";
import { ticketFormPacketChecksum, ticketFormReceiptKey, ticketFormReceiptSchema, type TicketFormReceipt } from "../../src/core/service-work/form-receipt-contract";

import { readStudioRuntimeFeatureEvidence, STUDIO_LITERAL_DEFAULT_FEATURE } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";

const responseSchema = z.object({ error: z.string().optional(), redirect: z.string().optional(), value: z.unknown().optional() });
const cap = { read: "tickets.field.defaults_read", written: "tickets.field.defaults_written", write: "tickets.field.defaults_write" };
const label = { zero: "Suggested count", false: "Suggested answer", reference: "Suggested linked ticket" };
const action = "src/core/service-work/actions:";
type Entries = [string, string][];

/** Original locked combined driver only. Real central Test/browser/HTTP/SQL
 * evidence; no native/value insertion, local DB, dumps, mocked grants or bypass.
 * Runtime pair readiness is checked BEFORE the first fixture write. All history
 * is retained, access is suspended, temporary failure DDL is always removed.
 * Source/type/lint checks do not claim these probes were executed. */
export async function checkTicketDefaults(base: string, browser: Browser, existingSyntheticUserId: string, cleanupCompanyIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence || !evidence.features.includes(STUDIO_LITERAL_DEFAULT_FEATURE)) {
    console.log("DEFERRED literal-default acceptance: this sealed release does not enable a compatible current/rollback pair; no default fixture writes performed.");
    return;
  }
  // The marker declares the ORIGINAL immediate rollback. Public activation may
  // precede previous-pointer update; never substitute that mutable pointer.
  const releases = dirname(root); assert.equal(basename(root), revision); assert(basename(releases).endsWith("-releases"));
  const current = realpathSync(join(dirname(releases), `${basename(releases).slice(0, -9)}-current`));
  if (base.startsWith("http://127.0.0.1:")) assert.equal(basename(current), evidence.rollbackRevision);
  else assert.equal(current, root);
  assert.deepEqual(verifyStudioRuntimeFeaturePair(root, join(releases, evidence.rollbackRevision), revision), evidence);
  const health = z.object({ revision: z.string() }).parse(await (await fetch(`${base}/api/health/release`)).json());
  assert.equal(health.revision, revision, "Probe target must be this exact sealed compatible release.");
  const user = await db.user.findFirstOrThrow({ where: { id: existingSyntheticUserId, platformAdmin: null,
    email: { startsWith: "studio-check-", endsWith: "@example.test" } } });
  const originalMemberships = await db.membership.findMany({ where: { userId: user.id }, orderBy: { id: "asc" } });
  const company = await db.organisation.create({ data: { name: "Studio literal default acceptance",
    slug: `studio-check-defaults-${randomUUID()}`, kind: "CUSTOMER", status: "ACTIVE", isTest: true } });
  cleanupCompanyIds.push(company.id);
  const organisationId = company.id, scope = { organisationId };
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  let membershipId: string | undefined;
  try {
    assert(await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null,
      isTest: true, slug: { startsWith: "studio-check-defaults-" } } }));
    await db.moduleState.createMany({ data: ["studio", "tickets"].map(moduleId => ({ organisationId, moduleId, enabled: true, entitled: true })) });
    const nativeGrants = ["tickets.ticket.create", "tickets.ticket.read", "tickets.ticket.manage", ...Object.values(cap)];
    const setupGrants = [...Object.values(STUDIO_CAPABILITIES), ...nativeGrants];
    const membership = await db.membership.create({ data: { organisationId, userId: user.id, grantedCapabilities: setupGrants } });
    membershipId = membership.id;
    const fresh = async () => { const session = await sessionForUser(organisationId, user.id); assert(session);
      assert.equal(session.membershipId, membership.id); assert(![...session.capabilities].some(value => value.startsWith("atlas."))); return session; };
    const queue = await db.serviceQueue.create({ data: { organisationId, name: "Defaults private target queue", prefix: "STUDEF", department: "Acceptance", restricted: true } });
    await db.serviceQueueMember.create({ data: { organisationId, queueId: queue.id, userId: user.id } });
    const metadata = studioRegistry().describe("tickets.ticket", 9);
    const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
    async function install(key: string, title: string, storage: CustomFieldPayload["field"]["storage"], defaultValue: FieldValue,
      required = false, readCapability = cap.read) {
      const session = await fresh(), payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: randomUUID(), field: {
        key, label: title, classification: "confidential", readCapability, writeCapability: cap.write, required, storage, defaultValue } });
      const created = await createDraft(session, { key: `tickets.ticket.${key}`, name: title, kind: "customField", payload });
      const saved = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: created.id } });
      const publication = await publishDraft(session, { definitionId: created.id, revision: saved.revision, acknowledgeWarnings: true });
      const current = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: created.id } });
      await activateVersion(session, { definitionId: created.id, versionId: publication.versionId, revision: current.revision });
      return { definitionId: created.id, payload, versionId: publication.versionId };
    }
    async function evolve(definitionId: string, payload: CustomFieldPayload, expectedCount: number) {
      await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: setupGrants } });
      const session = await fresh(), draft = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId } });
      await updateDraft(session, { definitionId, revision: draft.revision, payload });
      const changed = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId } });
      const definition = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definitionId } });
      const principal = await captureCustomerFieldMigrationPrincipal(session);
      const preparation = await startFieldMigrationPreparation(session, principal, { operationId: randomUUID(), definitionId,
        definitionRevision: definition.revision, draftRevision: changed.revision, conversion: { kind: "same_type" } });
      let collected = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: preparation.revision, limit: 2 });
      for (let pages = 0; !collected.cursorExhausted; pages++) { assert(pages < 4);
        collected = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: collected.revision, limit: 2 }); }
      const review = await sealFieldMigrationPreparation(session, { preparationId: preparation.id, revision: collected.revision });
      assert.equal(review.summary.validCount, expectedCount); assert.equal(review.summary.invalidCount, 0);
      const publication = await publishReviewedFieldMigration(session, { preparationId: preparation.id, revision: review.revision,
        reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
      let execution = await startFieldMigrationExecution(session, { preparationId: preparation.id, publicationRevision: publication.publicationRevision, reviewChecksum: review.checksum });
      for (let pages = 0; execution.state !== "READY"; pages++) { assert(pages < 4);
        execution = await executeFieldMigrationBatch(session, { preparationId: preparation.id, revision: execution.revision, limit: 2 }); }
      assert.equal(execution.processedCount, expectedCount);
      const latest = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definitionId } });
      await cutoverReviewedFieldMigration(session, { preparationId: preparation.id, reviewChecksum: review.checksum,
        definitionRevision: latest.revision, publicationRevision: publication.publicationRevision, executionRevision: execution.revision });
      await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: nativeGrants } });
      return preparation.id;
    }
    assert.equal(await db.serviceWorkItem.count({ where: scope }), 0);
    const zero = await install("default_zero", label.zero, { type: "integer" }, { type: "integer", value: 0 }, false, cap.written);
    const answer = await install("default_false", label.false, { type: "boolean" }, { type: "boolean", value: false }, true);
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: nativeGrants } });
    assert(![...(await fresh()).capabilities].some(value => value.startsWith("studio.")));
    const token = jwt.sign({ userId: user.id, organisationId, authVersion: user.authVersion, sessionVersion: membership.sessionVersion },
      process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" });
    await context.addCookies([{ name: "atlas_session", value: token, url: base, secure: base.startsWith("https"), httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage(), browserErrors: string[] = []; page.on("pageerror", error => browserErrors.push(error.message));
    const snapshot = async () => ({
      native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
      entries: await db.serviceWorkEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      sequences: await db.serviceSequence.findMany({ where: scope, orderBy: { prefix: "asc" } }),
      audits: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      outbox: await db.domainOutbox.findMany({ where: scope, orderBy: { id: "asc" } }),
      definitions: await db.studioDefinition.findMany({ where: scope, orderBy: { id: "asc" } }),
      drafts: await db.studioDraft.findMany({ where: scope, orderBy: { id: "asc" } }),
      versions: await db.studioDefinitionVersion.findMany({ where: scope, orderBy: { id: "asc" } }),
      bindings: await db.studioFieldBinding.findMany({ where: scope, orderBy: { definitionId: "asc" } }),
      generations: await db.studioFieldGeneration.findMany({ where: scope, orderBy: { id: "asc" } }),
      preparations: await db.studioFieldMigrationPreparation.findMany({ where: scope, orderBy: { id: "asc" } }),
      reviews: await db.studioFieldMigrationReview.findMany({ where: scope, orderBy: { id: "asc" } }),
      observations: await db.studioFieldMigrationObservation.findMany({ where: scope, orderBy: { id: "asc" } }),
      executions: await db.studioFieldMigrationExecution.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      outcomes: await db.studioFieldMigrationOutcome.findMany({ where: scope, orderBy: { observationId: "asc" } }),
      extensions: await db.studioExtensionRecord.findMany({ where: scope, orderBy: { id: "asc" } }),
      slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }),
      values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }),
      publications: await db.studioFieldMigrationPublication.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      cutovers: await db.studioFieldMigrationCutover.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
    });
    const entries = async (form: Locator): Promise<Entries> => form.evaluate(element => Array.from(new FormData(element as HTMLFormElement).entries())
      .map(([key, value]) => { if (typeof value !== "string") throw new Error("Unexpected binary default fixture."); return [key, value]; }));
    const formData = (values: Entries) => { const form = new FormData(); for (const [key, value] of values) form.append(key, value); return form; };
    const packet = (values: Entries) => fieldFormPacketSchema.parse(JSON.parse(values.find(([key]) => key === "studioFields")![1]));
    async function call(name: "createWork" | "updateWork", values: Entries) {
      const body = JSON.stringify({ action: `${action}${name}`, args: await encodeWire([formData(values)]) });
      const response = await page.evaluate(async body => {
        const result = await fetch("/api/desktop/action", { method: "POST", headers: { "content-type": "application/json", "x-atlas-client": "desktop" }, body });
        return { status: result.status, body: await result.json() as unknown };
      }, body);
      const parsed = responseSchema.parse(response.body), decoded = parsed.value === undefined ? undefined : decodeWire(parsed.value as Awaited<ReturnType<typeof encodeWire>>);
      const feedback = z.object({ error: z.string() }).safeParse(decoded);
      return { status: response.status, redirect: parsed.redirect, error: parsed.error ?? (feedback.success ? feedback.data.error : undefined) };
    }
    async function denied(values: Entries, operation: "createWork" | "updateWork", pattern?: RegExp) {
      const before = await snapshot(), response = await call(operation, values); assert(response.error);
      if (pattern) assert.match(response.error, pattern);
      assert.deepEqual(await snapshot(), before, "Rejected default operation must preserve every native/typed/sequence/Audit/outbox/window scalar.");
    }
    async function replay(values: Entries, recordId: string) {
      const before = await snapshot(), response = await call("createWork", values);
      assert.equal(response.error, undefined); assert.equal(response.redirect, `/tickets/${recordId}`);
      assert.deepEqual(await snapshot(), before, "Exact original packet retry must be readonly despite later defaults/generations/native or value changes.");
    }
    const createForm = () => page.locator("form").filter({ has: page.getByRole("button", { name: "Create ticket", exact: true }) });
    const editForm = () => page.locator("form").filter({ has: page.getByRole("button", { name: "Update work", exact: true }) });
    async function openCreate(subject: string, queueId = queue.id, suggestedAnswer = "no") {
      await page.goto("/tickets/create", { waitUntil: "networkidle" });
      await createForm().getByLabel("Receiving team", { exact: true }).selectOption(queueId);
      await createForm().getByLabel("Subject", { exact: true }).fill(subject);
      await createForm().getByLabel("Details and requested action", { exact: true }).fill("Bounded retained central Test literal default acceptance.");
      await expect(createForm().getByRole("combobox", { name: /^Suggested answer/ })).toHaveValue(suggestedAnswer);
      return createForm();
    }
    async function submitCreate() {
      const saved = await entries(createForm());
      await createForm().getByRole("button", { name: "Create ticket", exact: true }).click();
      await expect(page).toHaveURL(createdTicketUrl(base));
      return { values: saved, recordId: new URL(page.url()).pathname.split("/").at(-1)! };
    }
    async function receipt(values: Entries) { return ticketFormReceiptSchema.parse((await db.auditEntry.findFirstOrThrow({ where: {
      ...scope, id: ticketFormReceiptKey(packet(values).operationId) } })).after); }
    // Current generation is selected explicitly, never a historical slot.
    async function integer(recordId: string) {
      const definition = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: zero.definitionId }, include: { activeVersion: true } });
      assert(definition.activeVersion); const current = customFieldPayloadSchema.parse(definition.activeVersion.payload);
      const slot = await db.studioFieldSlot.findFirstOrThrow({ where: { ...scope, definitionId: zero.definitionId, generationId: current.storageGeneration,
        extension: { recordId, organisationId, entityId: "tickets.ticket" } }, include: { activeValue: true } });
      assert(slot.activeValue); return slot.activeValue.isNull ? null : Number(slot.activeValue.integerValue);
    }
    await openCreate("Default zero and false browser creation");
    await expect(createForm().getByRole("spinbutton", { name: /^Suggested count/ })).toHaveValue("0");
    await createForm().getByRole("button", { name: `Clear ${label.false}`, exact: true }).click();
    await denied(await entries(createForm()), "createWork", /required/i);
    await expect(createForm().getByRole("combobox", { name: /^Suggested answer/ })).toHaveValue("");
    await createForm().getByRole("button", { name: `Undo changes to ${label.false}`, exact: true }).click();
    const first = await submitCreate(); assert.deepEqual(packet(first.values).fields, []);
    const firstReceipt = await receipt(first.values); assert.equal(firstReceipt.recordId, first.recordId); assert.equal(firstReceipt.fields.length, 2);
    assert.equal(firstReceipt.packetChecksum, ticketFormPacketChecksum(packet(first.values)));
    for (const field of firstReceipt.fields) { assert.equal(field.defaulted, true);
      assert.equal(field.operationId, ticketFieldDefaultOperationId(firstReceipt.operationId, field.definitionId, field.versionId)); }
    assert.equal(await integer(first.recordId), 0);
    assert.equal(await db.studioFieldValue.count({ where: { ...scope, definitionId: answer.definitionId, booleanValue: false, isNull: false } }), 1);
    await replay(first.values, first.recordId);
    await openCreate("Explicit null must beat suggested zero");
    await createForm().getByRole("button", { name: `Clear ${label.zero}`, exact: true }).click();
    const second = await submitCreate(); assert.equal(packet(second.values).fields.length, 1); assert.equal(packet(second.values).fields[0].value, null);
    const secondReceipt = await receipt(second.values); assert.equal(secondReceipt.fields.find(field => field.definitionId === zero.definitionId)?.defaulted, undefined);
    assert.equal(await integer(second.recordId), null);
    // Native v1 and current value/schema anchors are still exact: null cannot
    // masquerade as an applied non-null literal in the actual SQL guard.
    await rejectReceipt(secondReceipt, receipt => ({ ...receipt, fields: receipt.fields.map(field => field.definitionId === zero.definitionId ? { ...field, defaulted: true } : field) }));
    await expect(editForm().getByRole("spinbutton", { name: /^Suggested count/ })).toHaveValue("");
    const untouchedEdit = await entries(editForm()); assert.deepEqual(packet(untouchedEdit).fields, []);
    await editForm().getByRole("button", { name: "Update work", exact: true }).click(); await expect(editForm().getByRole("status")).toHaveText("Saved.");
    assert.equal(await integer(second.recordId), null, "Edit omission never fills a default.");
    await openCreate("Supplied five and default false"); await createForm().getByRole("spinbutton", { name: /^Suggested count/ }).fill("5");
    const third = await submitCreate(), thirdReceipt = await receipt(third.values);
    assert.equal(await integer(third.recordId), 5);
    const untrusted = JSON.parse(JSON.stringify(packet(third.values))) as { fields: Record<string, unknown>[] };
    untrusted.fields[0].defaulted = true;
    await denied(third.values.map(([key, value]) => [key, key === "studioFields" ? JSON.stringify(untrusted) : value]), "createWork", /invalid|unrecognized|unknown|schema|configuration/i);
    assert.equal(thirdReceipt.fields.find(field => field.definitionId === zero.definitionId)?.defaulted, undefined);
    assert.equal(thirdReceipt.fields.find(field => field.definitionId === answer.definitionId)?.defaulted, true);
    assert.deepEqual(thirdReceipt.fields.map(field => field.extensionRevision), [1, 2]);
    async function rejectReceipt(original: TicketFormReceipt, patch: (receipt: TicketFormReceipt) => unknown) {
      const operationId = randomUUID(), after = patch({ ...structuredClone(original), operationId }) as Prisma.InputJsonObject;
      const before = await snapshot();
      await assert.rejects(() => db.auditEntry.create({ data: { id: ticketFormReceiptKey(operationId), ...scope, actorUserId: user.id,
        action: "tickets.form.completed", entityType: "TicketFormReceipt", entityId: original.recordId, after } }), /Ticket form receipt/);
      assert.deepEqual(await snapshot(), before);
    }
    // Native/active pointer/value anchors are still exact here: these failures
    // prove the forward default-origin guard rather than a later stale pointer.
    await rejectReceipt(thirdReceipt, receipt => ({ ...receipt, fields: receipt.fields.map(field => field.definitionId === zero.definitionId ? { ...field, defaulted: true } : field) }));
    await rejectReceipt(firstReceipt, receipt => ({ ...receipt, fields: receipt.fields.map(field => ({ ...field, defaulted: false })) }));
    // Real update receipt rejects default origin even with valid current anchors.
    await expect(editForm().getByRole("spinbutton", { name: /^Suggested count/ })).toHaveValue("5");
    await editForm().getByRole("spinbutton", { name: /^Suggested count/ }).fill("6");
    const thirdEdit = await entries(editForm()); await editForm().getByRole("button", { name: "Update work", exact: true }).click();
    await expect(editForm().getByRole("status")).toHaveText("Saved.");
    const editReceipt = await receipt(thirdEdit);
    await rejectReceipt(editReceipt, receipt => ({ ...receipt, fields: receipt.fields.map(field => ({ ...field, defaulted: true })) }));
    await replay(third.values, third.recordId);
    const changedPayload = customFieldPayloadSchema.parse({ ...zero.payload, storageGeneration: randomUUID(),
      field: { ...zero.payload.field, defaultValue: { type: "integer", value: 7 }, readCapability: cap.read } });
    const changedPreparation = await evolve(zero.definitionId, changedPayload, 3);
    assert.deepEqual(await Promise.all([first.recordId, second.recordId, third.recordId].map(integer)), [0, null, 6]);
    await replay(first.values, first.recordId);
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: changedPreparation } })).state, "ACTIVATED");
    await openCreate("New omitted field receives seven"); await expect(createForm().getByRole("spinbutton", { name: /^Suggested count/ })).toHaveValue("7");
    const fourth = await submitCreate(); assert.deepEqual(packet(fourth.values).fields, []); assert.equal(await integer(fourth.recordId), 7);
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: changedPreparation } })).state, "FINALIZED");
    const removedField = { ...changedPayload.field }; delete removedField.defaultValue;
    const removedPayload = customFieldPayloadSchema.parse({ ...changedPayload, storageGeneration: randomUUID(), field: removedField });
    const removedPreparation = await evolve(zero.definitionId, removedPayload, 4);
    assert.deepEqual(await Promise.all([first.recordId, second.recordId, third.recordId, fourth.recordId].map(integer)), [0, null, 6, 7]);
    await replay(first.values, first.recordId); await replay(fourth.values, fourth.recordId);
    for (const deniedCapability of [cap.read, cap.written, cap.write]) {
      await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [deniedCapability] } });
      try { await denied(first.values, "createWork", /FORBIDDEN|do not have access/i); }
      finally { await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [] } }); }
    }
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: setupGrants } });
    const reference = await install("default_reference", label.reference, { type: "reference", entity }, { type: "reference", value: first.recordId });
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: nativeGrants } });
    const publicQueue = await db.serviceQueue.create({ data: { organisationId, name: "Defaults visible source queue", prefix: "STUDREF", department: "Acceptance", restricted: false } });
    await db.serviceQueueMember.create({ data: { organisationId, queueId: publicQueue.id, userId: user.id } });
    await openCreate("Retained reference suggestion", publicQueue.id);
    await expect(createForm().getByRole("spinbutton", { name: /^Suggested count/ })).toHaveValue("");
    const fifth = await submitCreate(), fifthReceipt = await receipt(fifth.values); assert.deepEqual(packet(fifth.values).fields, []);
    const referenceReceipt = fifthReceipt.fields.find(field => field.definitionId === reference.definitionId); assert(referenceReceipt?.defaulted);
    const writtenRef = await db.studioFieldValue.findFirstOrThrow({ where: { ...scope, id: referenceReceipt.operationId } }); assert.equal(writtenRef.referenceValue, first.recordId);
    await editForm().getByRole("button", { name: `Clear ${label.reference}`, exact: true }).click();
    await editForm().getByRole("button", { name: "Update work", exact: true }).click(); await expect(editForm().getByRole("status")).toHaveText("Saved.");
    await replay(fifth.values, fifth.recordId);
    // Same genuine Create/field grants still permit a no-reference receipt;
    // independent canonical reference Read is required even after an overwrite.
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: ["tickets.ticket.read"] } });
    try { await replay(first.values, first.recordId); await denied(fifth.values, "createWork", /FORBIDDEN|do not have access/i); }
    finally { await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [] } }); }
    // Leave a real reviewed window open: completion Audit failure must roll its
    // automatic finalization back together with the INSERT and default values.
    const changedAnswer = customFieldPayloadSchema.parse({ ...answer.payload, storageGeneration: randomUUID(),
      field: { ...answer.payload.field, defaultValue: { type: "boolean", value: true } } });
    const auditPreparation = await evolve(answer.definitionId, changedAnswer, 5);
    await replay(first.values, first.recordId);
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: auditPreparation } })).state, "ACTIVATED");
    await openCreate("Completion Audit rollback with defaults", publicQueue.id, "yes");
    const failing = await entries(createForm()), trigger = `studio_defaults_audit_${randomUUID().replaceAll("-", "")}`;
    assert(/^[a-zA-Z0-9_-]+$/.test(organisationId));
    try {
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${organisationId}' AND NEW.action='tickets.form.completed' THEN RAISE EXCEPTION 'Exact Test default completion Audit failure'; END IF; RETURN NEW; END $$;`);
      await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
      await denied(failing, "createWork");
    } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: auditPreparation } })).state, "ACTIVATED");
    const recovered = await call("createWork", failing); assert.equal(recovered.error, undefined); assert(recovered.redirect);
    assert.equal(await db.serviceWorkItem.count({ where: scope }), 6);
    const recoveredReceipt = await receipt(failing); assert(recoveredReceipt.fields.every(field => field.defaulted));
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: removedPreparation } })).state, "FINALIZED");
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: auditPreparation } })).state, "FINALIZED");
    // Original native clients without a packet still receive authorised defaults
    // under a fresh internal operation; this API had no exact retry guarantee.
    const legacy = await call("createWork", failing.filter(([key]) => key !== "studioFields")); assert.equal(legacy.error, undefined); assert(legacy.redirect);
    assert.notEqual(legacy.redirect, recovered.redirect); assert.equal(await db.serviceWorkItem.count({ where: scope }), 7);
    const legacyId = legacy.redirect.split("/").at(-1)!;
    const legacyReceipt = ticketFormReceiptSchema.parse((await db.auditEntry.findFirstOrThrow({ where: { ...scope,
      entityId: legacyId, action: "tickets.form.completed", entityType: "TicketFormReceipt" } })).after);
    assert.equal(legacyReceipt.fields.length, 2); assert(legacyReceipt.fields.every(field => field.defaulted));
    await page.goto(`/tickets/${second.recordId}`, { waitUntil: "networkidle" });
    await expect(editForm().getByRole("spinbutton", { name: /^Suggested count/ })).toHaveValue("");
    const beforeImmutable = await snapshot();
    await assert.rejects(() => db.auditEntry.update({ where: { id: ticketFormReceiptKey(firstReceipt.operationId), organisationId }, data: { after: {} } }), /immutable/);
    assert.deepEqual(await snapshot(), beforeImmutable);
    assert.deepEqual(await db.membership.findMany({ where: { userId: user.id, organisationId: { not: organisationId } }, orderBy: { id: "asc" } }), originalMemberships);
    assert.deepEqual(browserErrors, []);
    console.log("PASS literal Ticket defaults: real zero/false suggestion + INSERT, explicit-null/edit omission, mixed staging, reviewed change/removal + retained readonly retry, current/written/reference denial, forward SQL origin guards and completion Audit atomic rollback");
  } finally {
    try { await context.close(); }
    finally {
      try { if (membershipId) await db.membership.updateMany({ where: { id: membershipId, organisationId, userId: user.id },
        data: { active: false, grantedCapabilities: [], deniedCapabilities: [], sessionVersion: { increment: 1 } } }); }
      finally { await db.organisation.updateMany({ where: { id: organisationId, kind: "CUSTOMER", isTest: true, slug: { startsWith: "studio-check-defaults-" } }, data: { status: "SUSPENDED" } }); }
    }
  }
}
