import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { sessionAuthorityStamp, type Session } from "../../src/core/auth/session";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { STUDIO_PAGE_FEATURE, STUDIO_PROFILE_FEATURE, STUDIO_RECORD_TYPE_FORM_FEATURE, readStudioRuntimeFeatureEvidence } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { pagePayloadSchema } from "../../src/core/studio/pages/schema";
import { entityProfilePayloadSchema, recordTypePayloadSchema } from "../../src/core/studio/record-types/schema";
import { ticketFormReceiptSchema, ticketFormReceiptKey } from "../../src/core/service-work/form-receipt-contract";
import { fieldFormPacketSchema } from "../../src/core/studio/fields/form-packet";
import { recordTypeAssignmentProvenanceSchema } from "../../src/core/studio/record-types/assignment-contract";
import { readRecordDefaultCustomerPage } from "../../src/core/studio/pages/record-default";
import { checksum } from "../../src/core/studio/registry/contracts";
import { createdTicketUrl } from "./ticket-urls";

export type VisualRecordLayoutFixture = {
  organisationId: string; slug: string; userId: string; membershipId: string; grantedCapabilities: readonly string[];
  foreignOrganisationId: string;
  freshSession: (organisationId?: string) => Promise<Session>;
  call: (action: string, args: unknown[]) => Promise<{ value?: unknown; redirect?: string }>;
};
const requiredGrants = ["tickets.ticket.read", "tickets.ticket.manage", "tickets.ticket.create", "tickets.queue.manage",
  STUDIO_CAPABILITIES.read, STUDIO_CAPABILITIES.edit, STUDIO_CAPABILITIES.publish];

/** Called ONLY inside the original visual checker after its fixture/session is
 * established. Extra caller grants ticketCreate+queueManage; studio+tickets
 * modules must already be enabled. No new companies/users/contexts/fixture engine.
 * All design/setup/native creation uses actual UI or a closed known owning action.
 * Reads inspect retained SQL evidence; exact newly registered membership grants
 * alone are temporarily changed and restored. Local tests prove pre-fixture gates,
 * never browser/SQL/permission/atomicity acceptance. No screenshots or dumps. */
export async function checkVisualRecordLayouts(base: string, page: Page, fixture: VisualRecordLayoutFixture) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence || ![STUDIO_PAGE_FEATURE, STUDIO_PROFILE_FEATURE, STUDIO_RECORD_TYPE_FORM_FEATURE].every(feature => evidence.features.includes(feature))) {
    console.log("DEFERRED visual record layouts: actual Page/profile/creation-selector current and rollback support is incomplete; no fixture or browser access.");
    return null;
  }
  const releases = dirname(root); assert.equal(basename(root), revision); assert(basename(releases).endsWith("-releases"));
  const current = realpathSync(join(dirname(releases), `${basename(releases).slice(0, -9)}-current`));
  if (base.startsWith("http://127.0.0.1:")) assert.equal(basename(current), evidence.rollbackRevision); else assert.equal(current, root);
  assert.deepEqual(verifyStudioRuntimeFeaturePair(root, join(releases, evidence.rollbackRevision), revision), evidence);
  assert.equal(z.object({ revision: z.string() }).parse(await (await fetch(`${base}/api/health/release`)).json()).revision,
    revision, "Record-layout checks must target the exact sealed compatible release.");
  assert.notEqual(fixture.organisationId, fixture.foreignOrganisationId);
  assert(fixture.slug.startsWith("studio-check-visual-"));
  for (const grant of requiredGrants) assert(fixture.grantedCapabilities.includes(grant), `Original visual fixture needs ${grant}.`);
  const company = await db.organisation.findFirstOrThrow({ where: { id: fixture.organisationId, slug: fixture.slug,
    kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } });
  assert.equal(company.id, fixture.organisationId);
  assert(await db.organisation.findFirst({ where: { id: fixture.foreignOrganisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null,
    isTest: true, slug: { startsWith: "studio-check-visual-" } } }));
  assert(await db.user.findFirst({ where: { id: fixture.userId, platformAdmin: null, email: { startsWith: "studio-check-", endsWith: "@example.test" } } }));
  const membership = await db.membership.findFirstOrThrow({ where: { id: fixture.membershipId, organisationId: fixture.organisationId, userId: fixture.userId, active: true } });
  assert.deepEqual(membership.grantedCapabilities, [...fixture.grantedCapabilities]);
  assert.equal(await db.moduleState.count({ where: { organisationId: fixture.organisationId, moduleId: { in: ["studio", "tickets"] }, enabled: true, entitled: true } }), 2);
  assert.equal(await db.studioProfileBinding.count({ where: { organisationId: fixture.organisationId, entityId: "tickets.ticket" } }), 0, "This owned visual journey requires the original unconfigured Ticket fixture.");
  const scope = { organisationId: fixture.organisationId }, originals = await db.membership.findMany({ where: { userId: fixture.userId }, orderBy: { id: "asc" } });
  async function fresh(organisationId = fixture.organisationId) {
    const actor = await fixture.freshSession(organisationId), stamp = sessionAuthorityStamp(actor);
    assert(stamp && actor.userId === fixture.userId && actor.organisationId === organisationId && stamp.userId === actor.userId && stamp.organisationId === actor.organisationId);
    if (organisationId === fixture.organisationId) assert.equal(actor.membershipId, fixture.membershipId);
    assert(![...actor.capabilities].some(capability => capability.startsWith("atlas."))); return actor;
  }
  await fresh();
  const marker = randomUUID().slice(0, 8), baseName = `Team ticket layout ${marker}`, typeName = `Customer issue layout ${marker}`, businessType = `Customer issue ${marker}`;
  const draft = (id: string) => db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: id } });
  const definition = (id: string) => db.studioDefinition.findFirstOrThrow({ where: { ...scope, id } });
  async function publishPage() {
    await page.getByRole("button", { name: "Review & publish", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Make this design live?" }); await expect(dialog).toBeVisible();
    if (await dialog.getByRole("checkbox").count()) await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Go live", exact: true }).click();
    await expect(page.getByText("Your reviewed design is now live for this business.", { exact: true })).toBeVisible();
  }
  async function createLayout(name: string) {
    await page.goto(`${base}/design-studio`);
    const form = page.locator("form").filter({ has: page.locator('input[name="layout"][value="ticket_record"]') });
    await expect(form).toHaveCount(1); await form.getByLabel("Screen name", { exact: true }).fill(name);
    await form.getByRole("button", { name: "Design Ticket", exact: true }).click(); await expect(page).toHaveURL(/\/design-studio\/[a-f0-9-]{36}$/);
    const id = new URL(page.url()).pathname.split("/").at(-1)!, first = await draft(id);
    await page.getByRole("complementary", { name: "Selected item properties" }).getByLabel("Display name", { exact: true }).fill(name);
    await page.getByRole("button", { name: "Add Edit ticket", exact: true }).click();
    await expect(page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: "Update work", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft(id)).revision).toBe(first.revision + 1);
    const payload = pagePayloadSchema.parse((await draft(id)).payload);
    assert.equal(payload.sections[0].label, name);
    assert(payload.sections.flatMap(section => section.components).some(component => component.type === "surface" && component.surface.id === "tickets.ticket.progress_form"));
    await publishPage(); const published = await definition(id); assert(published.activeVersionId);
    return { id, name, versionId: published.activeVersionId };
  }
  async function goLiveSetup(id: string) {
    await page.getByRole("button", { name: "Review saved draft", exact: true }).click();
    await expect(page.getByText("Saved draft reviewed", { exact: true })).toBeVisible();
    await page.getByText("Make this setup live", { exact: true }).click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Go live", exact: true }) });
    if (await form.getByRole("checkbox").count()) await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Go live", exact: true }).click();
    await expect.poll(async () => (await definition(id)).activeVersionId).not.toBeNull();
  }
  const snapshot = async () => ({ native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
    extensions: await db.studioExtensionRecord.findMany({ where: scope, orderBy: { id: "asc" } }), assignments: await db.studioRecordTypeAssignment.findMany({ where: scope, orderBy: { id: "asc" } }),
    slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }), values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }),
    audits: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }) });
  try {
    const nativeBeforeDesign = await db.serviceWorkItem.count({ where: scope });
    const standard = await createLayout(baseName), specialised = await createLayout(typeName);
    assert.equal(await db.serviceWorkItem.count({ where: scope }), nativeBeforeDesign, "The design canvas may not run native Ticket operations.");
    await page.goto(`${base}/design-studio/setup`);
    const baseForm = page.locator("form").filter({ has: page.locator('input[name="kind"][value="base"]') });
    await baseForm.getByLabel("Record screen", { exact: true }).selectOption(standard.id);
    await baseForm.getByRole("button", { name: "Create base draft", exact: true }).click(); await expect(page).toHaveURL(/\/design-studio\/setup\/[a-f0-9-]{36}$/);
    const baseId = new URL(page.url()).pathname.split("/").at(-1)!;
    assert.equal(entityProfilePayloadSchema.parse((await draft(baseId)).payload).profile.page?.versionId, standard.versionId); await goLiveSetup(baseId);
    await page.goto(`${base}/design-studio/setup`);
    const typeForm = page.locator("form").filter({ has: page.locator('input[name="kind"][value="type"]') });
    await typeForm.getByLabel("Display name", { exact: true }).fill(businessType); await typeForm.getByLabel("Helpful description", { exact: true }).fill("A clear screen for customer issues.");
    await typeForm.getByLabel("Record screen", { exact: true }).selectOption(specialised.id);
    await typeForm.getByRole("button", { name: "Create record type draft", exact: true }).click(); await expect(page).toHaveURL(/\/design-studio\/setup\/[a-f0-9-]{36}$/);
    const typeId = new URL(page.url()).pathname.split("/").at(-1)!, typePayload = recordTypePayloadSchema.parse((await draft(typeId)).payload);
    assert.equal(typePayload.overlay.page?.versionId, specialised.versionId); await goLiveSetup(typeId);
    const queueName = `Visual layout private team ${marker}`, queue = new FormData(); queue.set("name", queueName); queue.set("department", "Exact Test acceptance"); queue.set("restricted", "on");
    await fixture.call("src/core/service-work/actions:saveDeskQueue", [queue]);
    const receiving = await db.serviceQueue.findFirstOrThrow({ where: { ...scope, name: queueName, restricted: true } });
    assert(await db.serviceQueueMember.findFirst({ where: { ...scope, queueId: receiving.id, userId: fixture.userId } }));
    await page.goto(`${base}/tickets/create?queueId=${encodeURIComponent(receiving.id)}`);
    const create = page.locator("form").filter({ has: page.getByRole("button", { name: "Create ticket", exact: true }) });
    await create.getByRole("combobox", { name: "Business type", exact: true }).selectOption({ label: businessType });
    const subject = `Real selected business layout ${marker}`; await create.getByLabel("Subject", { exact: true }).fill(subject); await create.getByLabel("Details and requested action", { exact: true }).fill("Created through the original native form.");
    const packet = fieldFormPacketSchema.parse(JSON.parse(await create.locator('input[name="studioFields"]').inputValue()));
    await create.getByRole("button", { name: "Create ticket", exact: true }).click(); await expect(page).toHaveURL(createdTicketUrl(base));
    const recordId = new URL(page.url()).pathname.split("/").at(-1)!;
    const native = await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: recordId, kind: "TICKET", requesterUserId: fixture.userId } }); assert.equal(native.subject, subject);
    const audit = await db.auditEntry.findFirstOrThrow({ where: { ...scope, id: ticketFormReceiptKey(packet.operationId), actorUserId: fixture.userId } });
    const receipt = ticketFormReceiptSchema.parse(audit.after); assert(receipt.schemaVersion === 2); assert.equal(receipt.typeSelection.definitionId, typeId); assert.equal(receipt.packetChecksum, checksum(packet));
    const assigned = await db.studioRecordTypeAssignment.findFirstOrThrow({ where: { ...scope, id: receipt.typeAssignment.operationId, recordId } });
    const origin = recordTypeAssignmentProvenanceSchema.parse(assigned.provenance); assert.equal(assigned.checksum, checksum(origin)); assert.equal(origin.baseProfile?.versionId, typePayload.baseProfile.versionId);
    assert.equal(origin.recordType?.definitionId, typeId); assert.equal(assigned.createdBy, fixture.userId); assert.equal(assigned.extensionRevision, receipt.fields.length + 1);
    await page.getByRole("link", { name: new RegExp(`Open business layout.*${typeName}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/screens/${specialised.id}\\?mode=record_default&record=${recordId}$`));
    await expect(page.getByRole("heading", { name: typeName, exact: true }).first()).toBeVisible(); await expect(page.getByText(subject, { exact: true })).toBeVisible();
    const progress = page.locator("form").filter({ has: page.getByRole("button", { name: "Update work", exact: true }) });
    await expect(progress.getByRole("combobox", { name: "Status", exact: true })).toBeVisible();
    await expect(progress.locator(`input[name="workId"][value="${recordId}"]`)).toHaveCount(1);
    const actor = await fresh(), request = { mode: "record_default" as const, entityId: "tickets.ticket" as const, recordId, formFactor: "desktop" as const };
    const retained = await readRecordDefaultCustomerPage(actor, request); assert(retained); assert.equal(retained.versionId, specialised.versionId);
    // A newer active Page is independently published. Existing type still pins
    // its reviewed historical Page until the profile itself is normally changed.
    await page.goto(`${base}/design-studio/${specialised.id}`);
    await page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: typeName, exact: true }).click();
    const newerLabel = `New active layout ${marker}`; await page.getByRole("complementary", { name: "Selected item properties" }).getByLabel("Display name", { exact: true }).fill(newerLabel);
    await page.getByRole("button", { name: "Save draft", exact: true }).click(); await publishPage();
    assert.notEqual((await definition(specialised.id)).activeVersionId, specialised.versionId);
    assert.equal((await readRecordDefaultCustomerPage(await fresh(), request))?.versionId, specialised.versionId);
    await page.goto(`${base}/screens/${specialised.id}?mode=record_default&record=${recordId}`);
    await expect(page.getByRole("heading", { name: typeName, exact: true }).first()).toBeVisible(); await expect(page.getByRole("heading", { name: newerLabel, exact: true })).toHaveCount(0);
    const chooser = page.locator("form").filter({ has: page.getByRole("button", { name: "Apply business type", exact: true }) });
    await chooser.getByRole("combobox", { name: "Business type", exact: true }).selectOption("");
    await chooser.getByRole("button", { name: "Apply business type", exact: true }).click(); await expect(page).toHaveURL(`${base}/tickets/${recordId}`);
    await page.getByRole("link", { name: new RegExp(`Open business layout.*${baseName}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/screens/${standard.id}\\?mode=record_default&record=${recordId}$`));
    const selected = await readRecordDefaultCustomerPage(await fresh(), request); assert(selected); assert.equal(selected.versionId, standard.versionId); assert.equal(selected.recordTypeDefinitionId, null);
    const beforeDenied = await snapshot();
    for (const hint of [{ expectedProfileFingerprint: retained.profileFingerprint }, { expectedVersionId: randomUUID() }, { expectedNativeRevision: native.version + 1 }])
      await assert.rejects(() => readRecordDefaultCustomerPage(actor, { ...request, ...hint }), /CONFLICT/);
    const foreignActor = await fresh(fixture.foreignOrganisationId);
    await assert.rejects(() => readRecordDefaultCustomerPage(foreignActor, request), /unavailable|NOT_FOUND|FORBIDDEN/i);
    assert.deepEqual(await snapshot(), beforeDenied);
    for (const revoked of ["tickets.ticket.read", "tickets.ticket.manage"]) {
      await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: membership.grantedCapabilities.filter(capability => capability !== revoked) } });
      if (revoked === "tickets.ticket.read") await assert.rejects(() => readRecordDefaultCustomerPage(actor, request), /FORBIDDEN|unavailable|NOT_FOUND/i);
      else {
        const view = await readRecordDefaultCustomerPage(await fresh(), request); assert(view);
        assert(!view.model.sections.flatMap(section => section.components).some(component => component.type === "surface"), "Revoked native Manage must not expose the owning form.");
      }
      assert.deepEqual(await snapshot(), beforeDenied);
      await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: membership.grantedCapabilities } });
    }
    console.log("STUDIO VISUAL RECORD LAYOUTS PASS: actual Ticket preset/surface save/publish, friendly base/type setup, native selector INSERT and SQL receipt2, full owning form, reassignment/native return, retained Page versus newer active version, stale/current/foreign access denial. Create-only, field/reference rights, concurrency and atomic failure remain original independent gates.");
    return { recordId, baseId, typeId, basePageId: standard.id, typePageId: specialised.id };
  } finally {
    await db.membership.update({ where: { id: fixture.membershipId, ...scope, userId: fixture.userId }, data: { grantedCapabilities: membership.grantedCapabilities } });
    assert.deepEqual(await db.membership.findMany({ where: { userId: fixture.userId }, orderBy: { id: "asc" } }), originals);
  }
}
