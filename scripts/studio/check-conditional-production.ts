import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import jwt from "jsonwebtoken";
import { expect, type Browser, type Locator } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { encodeWire, decodeWire } from "../../src/core/desktop/wire";
import { STUDIO_CAPABILITIES, STUDIO_DATA_CAPABILITIES } from "../../src/core/studio/permissions";
import { readStudioRuntimeFeatureEvidence, STUDIO_CONDITIONAL_FIELD_FEATURE } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { createdTicketUrl } from "./ticket-urls";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { createDraft, publishDraft, activateVersion } from "../../src/core/studio/definitions/service";
import { withFieldRuntimeAuthority } from "../../src/core/studio/fields/runtime-authority";
import { readAdditionalFieldRequirementEvolutionInTransaction, saveAdditionalFieldRequirementEvolutionDraftInTransaction } from "../../src/core/studio/authoring/field-requirement-authoring";
import { captureCustomerFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { rollbackReviewedFieldMigration, finalizeReviewedFieldMigration } from "../../src/core/studio/fields/migrations/settlement";
import { fieldMigrationCutoverPinSchema } from "../../src/core/studio/fields/migrations/cutover-contract";
import { fieldFormPacketSchema } from "../../src/core/studio/fields/form-packet";

const cap = { read: "tickets.field.production_read", write: "tickets.field.production_write" };
const responseSchema = z.object({ error: z.string().optional(), redirect: z.string().optional(), value: z.unknown().optional() });
type Entries = [string, string][];

/** Original both-lock backed-up candidate/public driver only. A NEW synthetic
 * production-shaped company proves the actual non-Test boundary, never toggles
 * an existing tenant. Retained records/history are suspended, not wiped. No raw
 * native/value inserts, privileged conditional draft seed or engine bypass. */
export async function checkConditionalProduction(base: string, browser: Browser, existingSyntheticUserId: string, cleanupCompanyIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence?.features.includes(STUDIO_CONDITIONAL_FIELD_FEATURE)) {
    console.log("DEFERRED production conditional acceptance: exact compatible runtime pair is not enabled; no fixture writes."); return;
  }
  const releases = dirname(root); assert.equal(basename(root), revision); assert(basename(releases).endsWith("-releases"));
  const current = realpathSync(join(dirname(releases), `${basename(releases).slice(0, -9)}-current`));
  if (base.startsWith("http://127.0.0.1:")) assert.equal(basename(current), evidence.rollbackRevision); else assert.equal(current, root);
  assert.deepEqual(verifyStudioRuntimeFeaturePair(root, join(releases, evidence.rollbackRevision), revision), evidence);
  assert.equal(z.object({ revision: z.string() }).parse(await (await fetch(`${base}/api/health/release`)).json()).revision, revision);
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const user = await db.user.findFirstOrThrow({ where: { id: existingSyntheticUserId, platformAdmin: null,
    email: { startsWith: "studio-check-", endsWith: "@example.test" } } });
  const originalMemberships = await db.membership.findMany({ where: { userId: user.id }, orderBy: { id: "asc" } });
  const slug = `studio-check-production-${randomUUID()}`;
  const company = await db.organisation.create({ data: { name: "Synthetic production conditional acceptance", slug,
    kind: "CUSTOMER", status: "ACTIVE", isTest: false } });
  cleanupCompanyIds.push(company.id); // Original driver knows BEFORE any more effects.
  const organisationId = company.id, scope = { organisationId };
  let membershipId: string | undefined, settlerMembershipId: string | undefined, settlerUserId: string | undefined;
  let context: Awaited<ReturnType<Browser["newContext"]>> | undefined;
  try {
    assert(await db.organisation.findFirst({ where: { id: organisationId, slug, kind: "CUSTOMER", status: "ACTIVE", isTest: false, archivedAt: null } }));
    await db.moduleState.createMany({ data: ["tickets", "studio"].map(moduleId => ({ organisationId, moduleId, enabled: true, entitled: true })) });
    const nativeGrants = ["tickets.ticket.create", "tickets.ticket.read", "tickets.ticket.manage", ...Object.values(cap)];
    const setupGrants = [...nativeGrants, ...Object.values(STUDIO_CAPABILITIES), STUDIO_DATA_CAPABILITIES.liveTest];
    const membership = await db.membership.create({ data: { organisationId, userId: user.id, grantedCapabilities: setupGrants } }); membershipId = membership.id;
    const settler = await db.user.create({ data: { name: "Synthetic current conditional settler", email: `studio-check-production-settler-${randomUUID()}@example.test`, passwordHash: "!acceptance-login-disabled" } }); settlerUserId = settler.id;
    const settlerMembership = await db.membership.create({ data: { organisationId, userId: settler.id, grantedCapabilities: setupGrants } }); settlerMembershipId = settlerMembership.id;
    const fresh = async (id = user.id) => { const session = await sessionForUser(organisationId, id); assert(session);
      assert(![...session.capabilities].some(value => value.startsWith("atlas."))); return session; };
    const queue = await db.serviceQueue.create({ data: { organisationId, name: "Exact production acceptance team", prefix: "STUPROD", department: "Acceptance", restricted: true } });
    await db.serviceQueueMember.createMany({ data: [user.id, settler.id].map(userId => ({ organisationId, queueId: queue.id, userId })) });
    context = await browser.newContext({ baseURL: base, viewport: { width: 390, height: 844 } });
    await context.addCookies([{ name: "atlas_session", value: jwt.sign({ userId: user.id, organisationId, authVersion: user.authVersion, sessionVersion: membership.sessionVersion },
      process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" }), url: base, secure: base.startsWith("https"), httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage(), errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    const metadata = studioRegistry().describe("tickets.ticket", 9), entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
    async function install(key: string, label: string, type: "integer" | "boolean", required: boolean) {
      const actor = await fresh(), payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: randomUUID(),
        field: { key, label, classification: "confidential", readCapability: cap.read, writeCapability: cap.write, required, storage: { type } } });
      const draft = await createDraft(actor, { key: `tickets.ticket.${key}`, name: label, kind: "customField", payload });
      const saved = await db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: draft.id } });
      const published = await publishDraft(actor, { definitionId: draft.id, revision: saved.revision, acknowledgeWarnings: true });
      const definition = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: draft.id } });
      await activateVersion(actor, { definitionId: draft.id, versionId: published.versionId, revision: definition.revision }); return draft.id;
    }
    const definitionId = await install("production_condition", "Production conditional count", "integer", false);
    await install("production_boolean", "Production required answer", "boolean", true);
    const snapshot = async () => ({
      native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
      entries: await db.serviceWorkEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      sequence: await db.serviceSequence.findMany({ where: scope, orderBy: { prefix: "asc" } }),
      audits: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }), outbox: await db.domainOutbox.findMany({ where: scope, orderBy: { id: "asc" } }),
      definitions: await db.studioDefinition.findMany({ where: scope, include: { draft: true }, orderBy: { id: "asc" } }),
      extensions: await db.studioExtensionRecord.findMany({ where: scope, orderBy: { id: "asc" } }),
      slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }), values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }),
      preparations: await db.studioFieldMigrationPreparation.findMany({ where: scope, orderBy: { id: "asc" } }),
      observations: await db.studioFieldMigrationObservation.findMany({ where: scope, orderBy: [{ preparationId: "asc" }, { recordId: "asc" }] }),
      outcomes: await db.studioFieldMigrationOutcome.findMany({ where: scope, orderBy: [{ preparationId: "asc" }, { recordId: "asc" }] }),
      publications: await db.studioFieldMigrationPublication.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
      cutovers: await db.studioFieldMigrationCutover.findMany({ where: scope, orderBy: { preparationId: "asc" } }),
    });
    async function reviewed(conditional: boolean, count: number) {
      const actor = await fresh();
      const editor = await withFieldRuntimeAuthority(actor, authority => readAdditionalFieldRequirementEvolutionInTransaction(authority, { definitionId })); assert(editor.editable);
      let preparation: { id: string; revision: number };
      if (conditional) {
        // Genuine plain-language browser Save→Prepare route, not only helper APIs.
        await page.goto(`/design-studio/setup/${definitionId}/requirements`, { waitUntil: "networkidle" });
        await page.getByLabel("Also require it when a rule matches", { exact: true }).check();
        await page.getByLabel("Which detail?", { exact: true }).selectOption("native:status");
        await page.getByLabel("Condition", { exact: true }).selectOption("equals");
        await page.getByLabel("Value", { exact: true }).selectOption("NEW");
        await page.getByRole("button", { name: "Save rule draft", exact: true }).click();
        await expect(page.getByText("Rules saved as a draft. Review all existing records before making them live.", { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Prepare saved change", exact: true }).click();
        await expect(page).toHaveURL(/\?review=[a-f0-9-]{36}$/);
        const id = z.uuid().parse(new URL(page.url()).searchParams.get("review"));
        preparation = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { ...scope, id, definitionId }, select: { id: true, revision: true } });
      } else {
        const saved = await withFieldRuntimeAuthority(actor, authority => saveAdditionalFieldRequirementEvolutionDraftInTransaction(authority, {
          definitionId, revision: editor.revision, definitionRevision: editor.definitionRevision, sourceVersionId: editor.sourceVersionId,
          requirement: { always: false, when: null },
        }));
        const principal = await captureCustomerFieldMigrationPrincipal(actor);
        preparation = await startFieldMigrationPreparation(actor, principal, { operationId: randomUUID(), definitionId,
          definitionRevision: saved.definitionRevision, draftRevision: saved.revision, conversion: { kind: "same_type" } });
      }
      const batch = await collectFieldMigrationBatch(actor, { preparationId: preparation.id, revision: preparation.revision, limit: 2 });
      assert(batch.cursorExhausted);
      const review = await sealFieldMigrationPreparation(actor, { preparationId: preparation.id, revision: batch.revision });
      assert.equal(review.summary.validCount, count); assert.equal(review.summary.invalidCount, 0);
      const publication = await publishReviewedFieldMigration(actor, { preparationId: preparation.id, revision: review.revision,
        reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
      return { actor, preparation, review, publication };
    }
    async function ready(migration: Awaited<ReturnType<typeof reviewed>>) {
      let execution = await startFieldMigrationExecution(migration.actor, { preparationId: migration.preparation.id,
        publicationRevision: migration.publication.publicationRevision, reviewChecksum: migration.review.checksum });
      for (let page = 0; execution.state !== "READY"; page++) { assert(page < 3); execution = await executeFieldMigrationBatch(migration.actor,
        { preparationId: migration.preparation.id, revision: execution.revision, limit: 2 }); }
      const definition = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definitionId } });
      return { preparationId: migration.preparation.id, reviewChecksum: migration.review.checksum, definitionRevision: definition.revision,
        publicationRevision: migration.publication.publicationRevision, executionRevision: execution.revision };
    }
    async function auditFailure(action: string, operation: () => Promise<unknown>) {
      const trigger = `studio_production_${randomUUID().replaceAll("-", "")}`;
      assert(/^[a-zA-Z0-9_-]+$/.test(organisationId)); assert(/^[a-z_.]+$/.test(action)); const before = await snapshot();
      try {
        await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${organisationId}' AND NEW.action='${action}' THEN RAISE EXCEPTION 'Exact production acceptance Audit failure'; END IF; RETURN NEW; END $$;`);
        await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
        await operation(); // Caller asserts its original HTTP or service error.
        assert.deepEqual(await snapshot(), before);
      } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    }
    const first = await reviewed(true, 0), request = await ready(first);
    await auditFailure("studio.field.migration.cutover", () => assert.rejects(() => cutoverReviewedFieldMigration(first.actor, request), /Exact production acceptance Audit failure/));
    const activated = await cutoverReviewedFieldMigration(first.actor, request); assert.equal(activated.replayed, false);
    const cutoverSnapshot = await snapshot(); assert.deepEqual(await cutoverReviewedFieldMigration(first.actor, request), { ...activated, replayed: true }); assert.deepEqual(await snapshot(), cutoverSnapshot);
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: nativeGrants } });
    const customer = await fresh(); assert(![...customer.capabilities].some(value => value.startsWith("studio.")));
    const entries = (form: Locator): Promise<Entries> => form.evaluate(element => Array.from(new FormData(element as HTMLFormElement).entries()).map(([key, value]) => { if (typeof value !== "string") throw new Error("Unexpected binary form fixture."); return [key, value]; }));
    function formData(values: Entries) { const form = new FormData(); values.forEach(([key, value]) => form.append(key, value)); return form; }
    async function call(operation: "createWork" | "updateWork", values: Entries) {
      const payload = JSON.stringify({ action: `src/core/service-work/actions:${operation}`, args: await encodeWire([formData(values)]) });
      const response = await page.evaluate(async body => { const response = await fetch("/api/desktop/action", { method: "POST", headers: { "content-type": "application/json", "x-atlas-client": "desktop" }, body }); return response.json(); }, payload);
      const body = responseSchema.parse(response), value = body.value === undefined ? undefined : decodeWire(body.value as Awaited<ReturnType<typeof encodeWire>>);
      const feedback = z.object({ error: z.string() }).safeParse(value); return { error: body.error ?? (feedback.success ? feedback.data.error : undefined), redirect: body.redirect };
    }
    async function denied(values: Entries, operation: "createWork" | "updateWork", pattern: RegExp) { const before = await snapshot(); const response = await call(operation, values); assert(response.error); assert.match(response.error, pattern); assert.deepEqual(await snapshot(), before); }
    await page.goto("/tickets/create", { waitUntil: "networkidle" });
    const create = page.locator("form").filter({ has: page.getByRole("button", { name: "Create ticket", exact: true }) });
    await create.getByLabel("Subject", { exact: true }).fill("Synthetic production required zero and false");
    await create.getByLabel("Details and requested action", { exact: true }).fill("Exact isolated production-shaped acceptance.");
    await create.locator('[name="queueId"]').selectOption(queue.id);
    await create.getByRole("spinbutton", { name: /^Production conditional count/ }).fill("0");
    await create.getByRole("combobox", { name: /^Production required answer/ }).selectOption("no");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const submitted = await entries(create), missing = submitted.map(([key, value]): [string, string] => {
      if (key !== "studioFields") return [key, value]; const packet = fieldFormPacketSchema.parse(JSON.parse(value)); packet.fields = packet.fields.filter(field => field.definitionId !== definitionId); return [key, JSON.stringify(packet)]; });
    await denied(missing, "createWork", /required/);
    await auditFailure("tickets.form.completed", async () => { const response = await call("createWork", submitted); assert(response.error); });
    await create.getByRole("button", { name: "Create ticket", exact: true }).click(); await expect(page).toHaveURL(createdTicketUrl(base));
    const recordId = new URL(page.url()).pathname.split("/").at(-1)!;
    assert.equal((await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: recordId } })).status, "NEW");
    assert.equal(await db.studioFieldValue.count({ where: { ...scope, definitionId, integerValue: 0 } }), 1);
    assert.equal(await db.studioFieldValue.count({ where: { ...scope, booleanValue: false } }), 1);
    assert.equal((await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: first.preparation.id } })).state, "FINALIZED");
    const committed = await snapshot(), replay = await call("createWork", submitted); assert.equal(replay.error, undefined); assert.equal(replay.redirect, `/tickets/${recordId}`); assert.deepEqual(await snapshot(), committed);
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: setupGrants } });
    // Real source2→target1 removal, then current independent actor restores source2.
    const second = await reviewed(false, 1);
    const edit = () => page.locator("form").filter({ has: page.getByRole("button", { name: "Update work", exact: true }) });
    await edit().getByLabel("Status", { exact: true }).selectOption("IN_PROGRESS");
    await edit().getByRole("button", { name: "Clear Production conditional count", exact: true }).click();
    await denied(await entries(edit()), "updateWork", /temporarily frozen|FIELD_MIGRATION_IN_PROGRESS/);
    const nativeBeforeConversion = await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } });
    const retainedBeforeConversion = await db.studioFieldValue.findMany({ where: { ...scope, definitionId }, orderBy: { id: "asc" } });
    const secondRequest = await ready(second), target = await cutoverReviewedFieldMigration(second.actor, secondRequest);
    assert.deepEqual(await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }), nativeBeforeConversion);
    const receipt = await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: second.preparation.id } }), pin = fieldMigrationCutoverPinSchema.parse(receipt.pin);
    const confirmation = { preparationId: second.preparation.id, cutoverChecksum: receipt.pinChecksum, cutoverRevision: 0,
      definitionRevision: pin.definitionRevision + 1, publicationRevision: pin.publication.revision + 1 };
    const currentActor = await fresh(settler.id), principal = await captureCustomerFieldMigrationPrincipal(currentActor);
    const rollback = () => rollbackReviewedFieldMigration(currentActor, principal, confirmation);
    for (const capability of [STUDIO_DATA_CAPABILITIES.liveTest, "tickets.ticket.manage", cap.read, cap.write]) {
      const before = await snapshot(); await db.membership.update({ where: { id: settlerMembership.id, organisationId }, data: { deniedCapabilities: [capability] } });
      try { await assert.rejects(rollback, /FORBIDDEN/); assert.deepEqual(await snapshot(), before); }
      finally { await db.membership.update({ where: { id: settlerMembership.id, organisationId }, data: { deniedCapabilities: [] } }); }
    }
    const privateMember = await db.serviceQueueMember.findFirstOrThrow({ where: { organisationId, queueId: queue.id, userId: settler.id } });
    await db.serviceQueueMember.delete({ where: { id: privateMember.id, organisationId } });
    try { const before = await snapshot(); await assert.rejects(rollback, /MIGRATION_ACCESS_REQUIRED/); assert.deepEqual(await snapshot(), before); }
    finally { await db.serviceQueueMember.create({ data: privateMember }); }
    for (const action of ["studio.definition.activated", "studio.field.migration.rolled_back"]) await auditFailure(action, () => assert.rejects(rollback, /Exact production acceptance Audit failure/));
    const sourceValues = await db.studioFieldValue.findMany({ where: { ...scope, definitionId, generationId: pin.publication.sourceGenerationId }, orderBy: { id: "asc" } });
    assert.deepEqual(sourceValues, retainedBeforeConversion.filter(value => value.generationId === pin.publication.sourceGenerationId));
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { active: false } });
    let rolled: Awaited<ReturnType<typeof rollbackReviewedFieldMigration>>;
    try { rolled = await rollback(); }
    finally { await db.membership.update({ where: { id: membership.id, organisationId }, data: { active: true } }); }
    assert.equal(rolled.replayed, false); assert.equal(rolled.sourceVersionId, target.sourceVersionId);
    assert.deepEqual(await db.studioFieldValue.findMany({ where: { ...scope, definitionId, generationId: pin.publication.sourceGenerationId }, orderBy: { id: "asc" } }), sourceValues);
    const rolledSnapshot = await snapshot(); assert.deepEqual(await rollback(), { ...rolled, replayed: true }); assert.deepEqual(await snapshot(), rolledSnapshot);
    await assert.rejects(() => finalizeReviewedFieldMigration(currentActor, principal, confirmation), /changed|stale/i);
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { grantedCapabilities: nativeGrants } });
    await page.reload({ waitUntil: "networkidle" }); await edit().getByLabel("Status", { exact: true }).selectOption("IN_PROGRESS");
    await edit().getByRole("button", { name: "Clear Production conditional count", exact: true }).click();
    const finalEntries = await entries(edit());
    await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [cap.read] } });
    try { await denied(finalEntries, "updateWork", /FORBIDDEN|do not have access/); }
    finally { await db.membership.update({ where: { id: membership.id, organisationId }, data: { deniedCapabilities: [] } }); }
    await edit().getByRole("button", { name: "Update work", exact: true }).click(); await expect(edit().getByRole("status")).toHaveText("Saved.");
    assert.equal((await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: recordId } })).status, "IN_PROGRESS");
    await page.reload({ waitUntil: "networkidle" }); await expect(edit().getByRole("spinbutton", { name: /^Production conditional count/ })).toHaveValue("");
    assert.deepEqual(errors, []);
    console.log("PASS synthetic non-Test conditional lifecycle: genuine liveTest reviewed2 cutover, native required zero/false and final-state clear, whole-form readonly replay, publication freeze, paired Audit atomicity, independent current source2 rollback and private/native/field/liveTest denial; retained native/source history preserved.");
  } finally {
    // Attempt EVERY exact-fixture revocation/suspension even when browser close
    // or one access cleanup fails; the original driver's Test-only cleanup cannot
    // substitute for this non-Test fixture's retained-history boundary.
    const cleanup = await Promise.allSettled([
      context?.close() ?? Promise.resolve(),
      ...[membershipId, settlerMembershipId].filter((value): value is string => Boolean(value)).map(id =>
        db.membership.updateMany({ where: { id, organisationId }, data: { active: false, sessionVersion: { increment: 1 } } })),
      ...(settlerUserId ? [db.user.updateMany({ where: { id: settlerUserId, email: { startsWith: "studio-check-production-settler-", endsWith: "@example.test" }, platformAdmin: null }, data: { authVersion: { increment: 1 } } })] : []),
      db.organisation.updateMany({ where: { id: organisationId, slug, kind: "CUSTOMER", isTest: false }, data: { status: "SUSPENDED" } }),
    ]);
    assert.deepEqual(await db.membership.findMany({ where: { userId: user.id, id: { not: membershipId } }, orderBy: { id: "asc" } }), originalMemberships);
    for (const result of cleanup) if (result.status === "rejected") throw result.reason;
  }
}
