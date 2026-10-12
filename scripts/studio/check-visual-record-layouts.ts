import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { expect, type Page, type Locator } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { sessionAuthorityStamp, type Session } from "../../src/core/auth/session";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { STUDIO_PAGE_FEATURE, STUDIO_PROFILE_FEATURE, STUDIO_RECORD_TYPE_FORM_FEATURE, STUDIO_TICKET_PANEL_FEATURE, readStudioRuntimeFeatureEvidence } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { pagePayloadSchema } from "../../src/core/studio/pages/schema";
import { entityProfilePayloadSchema, recordTypePayloadSchema } from "../../src/core/studio/record-types/schema";
import { ticketFormReceiptSchema, ticketFormReceiptKey } from "../../src/core/service-work/form-receipt-contract";
import { fieldFormPacketSchema } from "../../src/core/studio/fields/form-packet";
import { recordTypeAssignmentProvenanceSchema } from "../../src/core/studio/record-types/assignment-contract";
import { readRecordDefaultCustomerPage } from "../../src/core/studio/pages/record-default";
import { checksum } from "../../src/core/studio/registry/contracts";
import { createdTicketUrl } from "./ticket-urls";
import { readActiveCustomerPage } from "../../src/core/studio/pages/customer-gateway";
import { withStudioAuthoringAuthority } from "../../src/core/studio/authoring/context";
import { createPageDraftInTransaction, savePageDraftInTransaction } from "../../src/core/studio/authoring/pages";
import { designReferenceSchema, type DesignReference } from "../../src/core/studio/authoring/reference-links";
import { readDesignReferenceMetadataInTransaction } from "../../src/core/studio/authoring/reference-navigation";
import { ticketPanelKinds, ticketPanelLabels, ticketPanelSurface, parseTicketPanel } from "../../src/core/service-work/page-panel-contract";
import { studioRegistry } from "../../src/core/studio/registry/runtime";

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
    await page.getByRole("button", { name: "Add Status at a glance", exact: true }).click();
    await expect(page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: "Update work", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft(id)).revision).toBe(first.revision + 1);
    const payload = pagePayloadSchema.parse((await draft(id)).payload);
    assert.equal(payload.sections[0].label, name);
    assert(payload.sections.flatMap(section => section.components).some(component => component.type === "surface" && component.surface.id === "tickets.ticket.progress_form"));
    assert(payload.sections.flatMap(section => section.components).some(component => component.type === "facts" && component.factIds.includes("status")));
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
  // Reuse the original page; link targets open new tabs for users, but this
  // acceptance read navigates the same fixture page without creating a context.
  async function inspectReferenceNavigation(navigation: Locator, expected: DesignReference, name: string, incoming?: string, logicalIncoming?: string) {
    const pin = designReferenceSchema.parse(expected), origin = page.url();
    const source = navigation.getByRole("link", { name: /Go to source · current draft/ });
    const usage = navigation.getByRole("link", { name: /Where used · saved version/ });
    await expect(source).toHaveAttribute("target", "_blank"); await expect(usage).toHaveAttribute("target", "_blank");
    await expect(source).toHaveAttribute("rel", /noopener/); await expect(usage).toHaveAttribute("rel", /noopener/);
    const sourceHref = await source.getAttribute("href"), usageHref = await usage.getAttribute("href"); assert(sourceHref && usageHref);
    const target = new URL(usageHref, base), currentDraft = new URL(sourceHref, base);
    assert.equal(target.origin, base); assert.equal(currentDraft.origin, base);
    assert.equal(target.pathname, `/design-studio/references/${pin.definitionId}`);
    assert.deepEqual(Object.fromEntries(target.searchParams), { kind: pin.kind, version: pin.versionId, schema: String(pin.schemaVersion), checksum: pin.checksum });
    assert.equal(currentDraft.pathname, `/design-studio/${pin.kind === "page" ? "" : "setup/"}${pin.definitionId}`);
    const currentResponse = await page.goto(currentDraft.href); assert.equal(currentResponse?.status(), 200);
    await expect(page.getByRole("heading", { name, exact: true }).first()).toBeVisible();
    const usageResponse = await page.goto(target.href); assert.equal(usageResponse?.status(), 200);
    await expect(page.getByRole("heading", { name, exact: true }).first()).toBeVisible();
    await expect(page.getByText("This review covers saved configuration references. Draft changes and individual business records are not included.", { exact: true })).toBeVisible();
    if (incoming) await expect(page.getByRole("region", { name: "Saved references" }).getByText(incoming, { exact: true })).toBeVisible();
    if (logicalIncoming) {
      const logical = page.getByRole("region", { name: "Screens using this business type", exact: true });
      await expect(logical.getByText(logicalIncoming, { exact: true })).toBeVisible();
      await expect(logical.getByText("These visibility rules choose the business type itself, independently of its published version. They are separate from the saved-version references above.", { exact: true })).toBeVisible();
    }
    await page.goto(origin);
  }
  async function exactReference(kind: "page" | "entityProfile" | "recordType", definitionId: string, versionId: string) {
    const row = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, definitionId, id: versionId } });
    assert.equal(checksum(row.compiledPlan), row.checksum);
    return designReferenceSchema.parse({ kind, definitionId, versionId, schemaVersion: row.schemaVersion, checksum: row.checksum });
  }
  const snapshot = async () => ({ native: await db.serviceWorkItem.findMany({ where: scope, orderBy: { id: "asc" } }),
    extensions: await db.studioExtensionRecord.findMany({ where: scope, orderBy: { id: "asc" } }), assignments: await db.studioRecordTypeAssignment.findMany({ where: scope, orderBy: { id: "asc" } }),
    slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }), values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }),
    audits: await db.auditEntry.findMany({ where: { organisationId: { in: [fixture.organisationId, fixture.foreignOrganisationId] } }, orderBy: { id: "asc" } }),
    entries: await db.serviceWorkEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
    outbox: await db.domainOutbox.findMany({ where: scope, select: { id: true, eventKey: true, eventName: true, payload: true, createdAt: true }, orderBy: { id: "asc" } }),
    definitions: await db.studioDefinition.findMany({ where: { organisationId: { in: [fixture.organisationId, fixture.foreignOrganisationId] } }, orderBy: { id: "asc" } }),
    drafts: await db.studioDraft.findMany({ where: { organisationId: { in: [fixture.organisationId, fixture.foreignOrganisationId] } }, orderBy: { id: "asc" } }),
    versions: await db.studioDefinitionVersion.findMany({ where: { organisationId: { in: [fixture.organisationId, fixture.foreignOrganisationId] } }, orderBy: { id: "asc" } }),
    edges: await db.studioConfigurationDependency.findMany({ where: { organisationId: { in: [fixture.organisationId, fixture.foreignOrganisationId] } }, orderBy: [{ versionId: "asc" }, { targetVersionId: "asc" }] }) });
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
    // Same existing Page/type fixture, original browser and actual palette. The
    // stable type UUID stays internal; the editor offers only the approved label.
    const originalBaseVersion = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, definitionId: standard.id, id: standard.versionId } });
    const conditionalLabel = `Customer issue focus ${marker}`, conditionalNote = `Customer issue guidance ${marker}`;
    await page.goto(`${base}/design-studio/${standard.id}`);
    const properties = page.getByRole("complementary", { name: "Selected item properties" });
    await page.getByRole("button", { name: "Add Helpful note", exact: true }).click();
    await properties.getByLabel("Display name", { exact: true }).fill(conditionalNote);
    await properties.getByLabel("Message", { exact: true }).fill("Use the customer issue procedure for this business type.");
    await properties.getByLabel("Show this item", { exact: true }).selectOption("when");
    await properties.getByLabel("Business detail 1", { exact: true }).selectOption({ label: "Business record type" });
    await properties.getByLabel("Is equal to 1", { exact: true }).selectOption({ label: businessType });
    await page.getByRole("button", { name: "Add conditional layout", exact: true }).click();
    const when = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: /^When to use / }) });
    await when.locator("summary").click();
    await when.getByLabel("Business detail 1", { exact: true }).selectOption({ label: "Business record type" });
    await when.getByLabel("Is equal to 1", { exact: true }).selectOption({ label: businessType });
    await when.getByLabel("Layout name", { exact: true }).fill("Customer issue view");
    await page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: `${baseName} · Alternative layout`, exact: true }).click();
    await properties.getByLabel("Display name", { exact: true }).fill(conditionalLabel);
    await expect(page.getByText(typeId, { exact: true })).toHaveCount(0);
    const beforeConditionalSave = await draft(standard.id);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft(standard.id)).revision).toBe(beforeConditionalSave.revision + 1);
    const conditionalPayload = pagePayloadSchema.parse((await draft(standard.id)).payload);
    assert.equal(conditionalPayload.variants.length, 1); const conditionalVariant = conditionalPayload.variants[0];
    assert.deepEqual(conditionalVariant.when, { kind: "recordType", definitionId: typeId });
    const typedNote = conditionalPayload.sections.flatMap(section => section.components).find(component => component.label === conditionalNote);
    assert(typedNote?.type === "callout"); assert.deepEqual(typedNote.visibleWhen, { kind: "recordType", definitionId: typeId });
    await publishPage(); const conditionalVersionId = (await definition(standard.id)).activeVersionId; assert(conditionalVersionId);
    assert.notEqual(conditionalVersionId, standard.versionId);
    const retainedBaseVersion = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, definitionId: standard.id, id: standard.versionId } });
    assert.equal(retainedBaseVersion.checksum, originalBaseVersion.checksum); assert.deepEqual(retainedBaseVersion.compiledPlan, originalBaseVersion.compiledPlan);
    assert.equal(checksum(retainedBaseVersion.compiledPlan), originalBaseVersion.checksum);
    assert.equal(entityProfilePayloadSchema.parse((await draft(baseId)).payload).profile.page?.versionId, standard.versionId);
    const configurationBeforeInvalid = await snapshot();
    const baseDefinition = await definition(baseId), typeDefinition = await definition(typeId);
    assert(baseDefinition.activeVersionId && typeDefinition.activeVersionId);
    const standardPin = await exactReference("page", standard.id, standard.versionId);
    const specialisedPin = await exactReference("page", specialised.id, specialised.versionId);
    const basePin = await exactReference("entityProfile", baseId, typePayload.baseProfile.versionId);
    const typePin = await exactReference("recordType", typeId, typeDefinition.activeVersionId);
    await page.goto(`${base}/design-studio/setup/${baseId}`);
    await inspectReferenceNavigation(page.getByRole("navigation", { name: "Record screen references" }), standardPin, standard.name, baseDefinition.name);
    await page.goto(`${base}/design-studio/setup/${typeId}`);
    await inspectReferenceNavigation(page.getByRole("navigation", { name: "Base record setup references" }), basePin, baseDefinition.name, typeDefinition.name);
    await inspectReferenceNavigation(page.getByRole("navigation", { name: "Record screen references" }), specialisedPin, specialised.name, typeDefinition.name);
    await page.goto(`${base}/design-studio/${standard.id}`);
    await page.getByLabel("Screen layout", { exact: true }).selectOption(conditionalVariant.id);
    const typeCondition = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: /^When to use / }) });
    await typeCondition.locator("summary").click();
    // Stable type predicates do not fabricate a versioned dependency edge. The
    // exact source pin and separate logical screen usage must both be truthful.
    await inspectReferenceNavigation(typeCondition.getByRole("navigation", { name: "Business record type references" }), typePin, typeDefinition.name, undefined, standard.name);
    assert.deepEqual(await snapshot(), configurationBeforeInvalid, "Source/usage navigation must be metadata read-only.");
    const savedConditional = await draft(standard.id), unknown = structuredClone(conditionalPayload);
    unknown.variants[0].when = { kind: "recordType", definitionId: randomUUID() };
    const invalidAuthor = await fresh();
    await assert.rejects(() => withStudioAuthoringAuthority(invalidAuthor, STUDIO_CAPABILITIES.edit, undefined, authority =>
      savePageDraftInTransaction(authority, { definitionId: standard.id, revision: savedConditional.revision, payload: unknown })), /RECORD_PROFILE_INVALID|unavailable|incompatible/i);
    const foreignAuthor = await fresh(fixture.foreignOrganisationId);
    await assert.rejects(() => withStudioAuthoringAuthority(foreignAuthor, STUDIO_CAPABILITIES.edit, undefined, authority =>
      createPageDraftInTransaction(authority, { name: "Denied cross-business type", payload: conditionalPayload })), /RECORD_PROFILE_INVALID|unavailable|incompatible/i);
    const listMetadata = studioRegistry().describe("tickets.ticket.page.list", 1);
    const listPayload = pagePayloadSchema.parse({ ...conditionalPayload, variants: [], sections: [{ ...conditionalPayload.sections[0], visibleWhen: undefined,
      components: [typedNote, { id: "always_guidance", type: "instructions", text: "Always available guidance.", formFactors: conditionalPayload.formFactors },
        { id: "records", type: "queryList", query: { id: listMetadata.id, version: listMetadata.version, schemaHash: listMetadata.schemaHash, contractHash: listMetadata.contractHash },
          columns: ["subject"], pageSize: 1, formFactors: conditionalPayload.formFactors }] }] });
    const currentAuthor = await fresh();
    await assert.rejects(() => withStudioAuthoringAuthority(currentAuthor, STUDIO_CAPABILITIES.edit, undefined, authority =>
      createPageDraftInTransaction(authority, { name: "Denied type-filtered list", payload: listPayload })), /record screen/i);
    assert.deepEqual(await snapshot(), configurationBeforeInvalid);
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
    const activeRequest = { definitionId: standard.id, request: { kind: "record" as const, recordId }, formFactor: "desktop" as const };
    const beforeActiveRead = await snapshot(), activeTyped = await readActiveCustomerPage(await fresh(), activeRequest);
    assert.equal(activeTyped.versionId, conditionalVersionId); assert.equal(activeTyped.model.variantId, conditionalVariant.id);
    assert(activeTyped.model.sections.some(section => section.label === conditionalLabel));
    assert(activeTyped.model.sections.flatMap(section => section.components).some(component => component.id === typedNote.id));
    assert.deepEqual(await snapshot(), beforeActiveRead);
    await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: ["tickets.ticket.read"] } });
    const typedReader = await fresh(), typedReadOnly = await readActiveCustomerPage(typedReader, activeRequest);
    assert.equal(typedReadOnly.model.variantId, conditionalVariant.id);
    assert(typedReadOnly.model.sections.flatMap(section => section.components).some(component => component.id === typedNote.id));
    assert(!typedReadOnly.model.sections.flatMap(section => section.components).some(component => component.type === "surface"));
    assert(![...typedReader.capabilities].some(capability => capability.startsWith("studio.")));
    await page.goto(`${base}/screens/${standard.id}?record=${recordId}`);
    await expect(page.getByRole("heading", { name: conditionalLabel, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Update work", exact: true })).toHaveCount(0);
    assert.deepEqual(await snapshot(), beforeActiveRead);
    await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: membership.grantedCapabilities } });
    await page.goto(`${base}/screens/${standard.id}?record=${recordId}`);
    await expect(page.getByRole("heading", { name: conditionalLabel, exact: true })).toBeVisible(); await expect(page.getByText(conditionalNote, { exact: true })).toBeVisible();
    await page.goto(`${base}/screens/${specialised.id}?mode=record_default&record=${recordId}`);
    const actor = await fresh(), request = { mode: "record_default" as const, entityId: "tickets.ticket" as const, recordId, formFactor: "desktop" as const };
    const retained = await readRecordDefaultCustomerPage(actor, request); assert(retained); assert.equal(retained.versionId, specialised.versionId);
    assert(retained.model.sections.flatMap(section => section.components).some(component => component.type === "facts" && component.cells.some(cell => cell.text === native.status)), "Published summary must show actual authorised native status.");
    // A newer active Page is independently published. Existing type still pins
    // its reviewed historical Page until the profile itself is normally changed.
    await page.goto(`${base}/design-studio/${specialised.id}`);
    await page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: typeName, exact: true }).click();
    const newerLabel = `New active layout ${marker}`; await page.getByRole("complementary", { name: "Selected item properties" }).getByLabel("Display name", { exact: true }).fill(newerLabel);
    await page.getByRole("button", { name: "Save draft", exact: true }).click(); await publishPage();
    assert.notEqual((await definition(specialised.id)).activeVersionId, specialised.versionId);
    const beforeRetainedNavigation = await snapshot();
    await page.goto(`${base}/design-studio/setup/${typeId}`);
    await inspectReferenceNavigation(page.getByRole("navigation", { name: "Record screen references" }), specialisedPin, specialised.name, typeDefinition.name);
    assert.deepEqual(await snapshot(), beforeRetainedNavigation, "A newer active source must not replace the saved type's reference or produce writes.");
    assert.equal((await readRecordDefaultCustomerPage(await fresh(), request))?.versionId, specialised.versionId);
    await page.goto(`${base}/screens/${specialised.id}?mode=record_default&record=${recordId}`);
    await expect(page.getByRole("heading", { name: typeName, exact: true }).first()).toBeVisible(); await expect(page.getByRole("heading", { name: newerLabel, exact: true })).toHaveCount(0);
    const chooser = page.locator("form").filter({ has: page.getByRole("button", { name: "Apply business type", exact: true }) });
    await chooser.getByRole("combobox", { name: "Business type", exact: true }).selectOption("");
    await chooser.getByRole("button", { name: "Apply business type", exact: true }).click(); await expect(page).toHaveURL(`${base}/tickets/${recordId}`);
    await page.getByRole("link", { name: new RegExp(`Open business layout.*${baseName}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/screens/${standard.id}\\?mode=record_default&record=${recordId}$`));
    const selected = await readRecordDefaultCustomerPage(await fresh(), request); assert(selected); assert.equal(selected.versionId, standard.versionId); assert.equal(selected.recordTypeDefinitionId, null);
    const activeDefault = await readActiveCustomerPage(await fresh(), activeRequest);
    assert.equal(activeDefault.versionId, conditionalVersionId); assert.equal(activeDefault.model.variantId, null);
    assert(activeDefault.model.sections.some(section => section.label === baseName));
    assert(!activeDefault.model.sections.flatMap(section => section.components).some(component => component.id === typedNote.id));
    await page.goto(`${base}/screens/${standard.id}?record=${recordId}`);
    await expect(page.getByRole("heading", { name: baseName, exact: true })).toBeVisible(); await expect(page.getByText(conditionalNote, { exact: true })).toHaveCount(0);
    const beforeDenied = await snapshot();
    for (const hint of [{ expectedProfileFingerprint: retained.profileFingerprint }, { expectedVersionId: randomUUID() }, { expectedNativeRevision: native.version + 1 }])
      await assert.rejects(() => readRecordDefaultCustomerPage(actor, { ...request, ...hint }), /CONFLICT/);
    const foreignActor = await fresh(fixture.foreignOrganisationId);
    await assert.rejects(() => readRecordDefaultCustomerPage(foreignActor, request), /unavailable|NOT_FOUND|FORBIDDEN/i);
    await assert.rejects(() => readActiveCustomerPage(foreignActor, activeRequest), /unavailable|NOT_FOUND|FORBIDDEN/i);
    await assert.rejects(() => withStudioAuthoringAuthority(foreignActor, STUDIO_CAPABILITIES.read, undefined, authority =>
      readDesignReferenceMetadataInTransaction(authority, typePin)), /unavailable|NOT_FOUND|FORBIDDEN|DEPENDENCY_BROKEN/i);
    assert.deepEqual(await snapshot(), beforeDenied);
    for (const revoked of ["tickets.ticket.read", "tickets.ticket.manage"]) {
      await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: membership.grantedCapabilities.filter(capability => capability !== revoked) } });
      if (revoked === "tickets.ticket.read") {
        await assert.rejects(() => readRecordDefaultCustomerPage(actor, request), /FORBIDDEN|unavailable|NOT_FOUND/i);
        await assert.rejects(() => readActiveCustomerPage(actor, activeRequest), /FORBIDDEN|unavailable|NOT_FOUND/i);
        await assert.rejects(() => withStudioAuthoringAuthority(actor, STUDIO_CAPABILITIES.read, undefined, authority =>
          readDesignReferenceMetadataInTransaction(authority, typePin)), /FORBIDDEN|unavailable|NOT_FOUND/i);
      }
      else {
        const view = await readRecordDefaultCustomerPage(await fresh(), request); assert(view);
        assert(!view.model.sections.flatMap(section => section.components).some(component => component.type === "surface"), "Revoked native Manage must not expose the owning form.");
      }
      assert.deepEqual(await snapshot(), beforeDenied);
      await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: membership.grantedCapabilities } });
    }
    // Extend this same retained native Ticket and its existing specialised Page
    // only after the original form/profile/permission assertions. An unsupported
    // bridge still runs those assertions; it must not claim panel acceptance.
    if (!evidence.features.includes(STUDIO_TICKET_PANEL_FEATURE)) {
      console.log("DEFERRED visual Ticket native panels: the actual paired reader is not enabled; existing record-layout checks retained.");
    } else {
      await page.goto(`${base}/design-studio/${specialised.id}`);
      const previousPanelDraft = await draft(specialised.id), previousPanelPayload = pagePayloadSchema.parse(previousPanelDraft.payload);
      for (const kind of ticketPanelKinds)
        await page.getByRole("button", { name: `Add ${ticketPanelLabels[kind]}`, exact: true }).click();
      await expect(page.getByRole("region", { name: "Design canvas" }).getByText("Reopened 0 times", { exact: false })).toHaveCount(0);
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await expect.poll(async () => (await draft(specialised.id)).revision).toBe(previousPanelDraft.revision + 1);
      const panelPayload = pagePayloadSchema.parse((await draft(specialised.id)).payload);
      for (const node of previousPanelPayload.sections.flatMap(section => section.components))
        assert(panelPayload.sections.some(section => section.components.some(actual => checksum(actual) === checksum(node))), "Adding panels must preserve every prior component.");
      for (const kind of ticketPanelKinds)
        assert(panelPayload.sections.flatMap(section => section.components).some(node => node.type === "surface" && node.surface.id === ticketPanelSurface(kind).id && node.surface.version === 1));
      await publishPage();
      await expect(page.getByRole("button", { name: "Recheck saved draft", exact: true })).toBeEnabled();
      const panelDefinition = await definition(specialised.id), panelVersion = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, id: panelDefinition.activeVersionId!, definitionId: specialised.id } });
      const panelFrame = z.object({ approvals: z.object({ sourcePage: z.object({ id: z.literal("tickets.ticket.page"), version: z.union([z.literal(2), z.literal(3)]), ownerModuleId: z.literal("tickets") }) }) }).parse(panelVersion.compiledPlan);
      assert(panelFrame.approvals.sourcePage.version >= 2); assert.equal(checksum(panelVersion.compiledPlan), panelVersion.checksum);
      const panelRequest = { definitionId: specialised.id, request: { kind: "record" as const, recordId }, formFactor: "desktop" as const };
      const panelActor = await fresh(), panelNative = await db.serviceWorkItem.findFirstOrThrow({ where: { ...scope, id: recordId, kind: "TICKET" } });
      const panelBefore = await snapshot(), panelRead = await readActiveCustomerPage(panelActor, panelRequest);
      assert.equal(panelRead.versionId, panelVersion.id);
      const surfaces = panelRead.model.sections.flatMap(section => section.components).filter(node => node.type === "surface");
      const output = (kind: typeof ticketPanelKinds[number]) => {
        const selected = surfaces.filter(node => node.surface?.id === ticketPanelSurface(kind).id && node.surface.version === 1);
        assert.equal(selected.length, 1); assert.equal(selected[0].outputs.length, 1);
        return selected[0].outputs[0];
      };
      const statusRows = parseTicketPanel("status", output("status"));
      assert.equal(statusRows.length, 1); assert.equal(statusRows[0].id, recordId);
      assert.equal(statusRows[0].values.status, panelNative.status); assert.equal(statusRows[0].values.reopen_count, panelNative.reopenCount); assert.equal(panelNative.reopenCount, 0);
      assert.equal(statusRows[0].values.first_response_due, panelNative.firstResponseDueAt?.toISOString() ?? null);
      assert.equal(statusRows[0].values.resolution_due, panelNative.resolutionDueAt?.toISOString() ?? null);
      const activityRows = parseTicketPanel("activity", output("activity")); assert(activityRows.length > 0);
      const actualEntries = await db.serviceWorkEntry.findMany({ where: { ...scope, workId: recordId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 });
      assert.deepEqual(activityRows.map(row => ({ id: row.id, body: row.values.body, kind: row.values.kind, visibility: row.values.visibility })),
        actualEntries.map(entry => ({ id: entry.id, body: entry.body, kind: entry.kind, visibility: entry.visibility })));
      assert.equal(await db.serviceFile.count({ where: { ...scope, workId: recordId } }), 0);
      assert.deepEqual(parseTicketPanel("documents", output("documents")), []);
      assert.deepEqual(parseTicketPanel("relationships", output("relationships")), []);
      assert.deepEqual(parseTicketPanel("outstanding_work", output("outstanding_work")), []);
      assert.equal(panelNative.approvalId, null); assert.deepEqual(parseTicketPanel("approval", output("approval")), []);
      assert.deepEqual(await snapshot(), panelBefore, "All six native panel reads must preserve native/configuration/Audit history.");
      await page.goto(`${base}/screens/${specialised.id}?record=${recordId}`);
      for (const kind of ticketPanelKinds) await expect(page.getByRole("heading", { name: ticketPanelLabels[kind], exact: true })).toBeVisible();
      await expect(page.getByText("Reopened 0 times", { exact: false })).toBeVisible();
      for (const text of ["No evidence attached.", "No linked work.", "No outstanding linked work.", "No approval requested."])
        await expect(page.getByText(text, { exact: true })).toBeVisible();
      await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: ["tickets.ticket.read"] } });
      const ordinary = await fresh(), ordinaryPanels = await readActiveCustomerPage(ordinary, panelRequest);
      assert(![...ordinary.capabilities].some(capability => capability.startsWith("studio.")));
      const ordinarySurfaces = ordinaryPanels.model.sections.flatMap(section => section.components).filter(node => node.type === "surface");
      for (const kind of ticketPanelKinds.filter(kind => kind !== "approval"))
        assert(ordinarySurfaces.some(node => node.surface?.id === ticketPanelSurface(kind).id), "Ordinary native Read must retain its authorised read-only panels.");
      assert(!ordinarySurfaces.some(node => node.surface?.id === "tickets.ticket.progress_form" || node.surface?.id === ticketPanelSurface("approval").id));
      await page.goto(`${base}/screens/${specialised.id}?record=${recordId}`);
      await expect(page.getByRole("heading", { name: ticketPanelLabels.status, exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: ticketPanelLabels.approval, exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Update work", exact: true })).toHaveCount(0);
      assert.deepEqual(await snapshot(), panelBefore);
      await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: [] } });
      await assert.rejects(() => readActiveCustomerPage(ordinary, panelRequest), /FORBIDDEN|unavailable|NOT_FOUND/i);
      const foreignPanelActor = await fresh(fixture.foreignOrganisationId);
      await assert.rejects(() => readActiveCustomerPage(foreignPanelActor, panelRequest), /FORBIDDEN|unavailable|NOT_FOUND/i);
      assert.deepEqual(await snapshot(), panelBefore);
      await db.membership.update({ where: { id: fixture.membershipId, ...scope }, data: { grantedCapabilities: membership.grantedCapabilities } });
      console.log("PASS visual Ticket native panels: same private-queue native record, all six actual owner projections, status zero/history plus legitimate empty evidence/links/approval, live UI and ordinary Read panels with Manage-only form/approval hidden, current native Read and tenant denial, unchanged native/configuration/Audit snapshots. INTERNAL file/name filtering and nonempty linked/approval records remain separate owner regression evidence.");
    }
    console.log("STUDIO VISUAL RECORD LAYOUTS PASS: actual Ticket preset/surface save/publish, friendly base/type setup and condition selector, actual Page/base/type source-and-retained-usage links with no native effects, actual alternate/hidden-component selection from canonical assignment, new-publication foreign/unknown/list denial with unchanged sealed history, native selector INSERT and SQL receipt2, full owning form, reassignment/native return, retained Page versus newer active version, stale/current/foreign access denial. Create-only, field/reference rights, concurrency and atomic failure remain original independent gates.");
    return { recordId, baseId, typeId, basePageId: standard.id, typePageId: specialised.id };
  } finally {
    await db.membership.update({ where: { id: fixture.membershipId, ...scope, userId: fixture.userId }, data: { grantedCapabilities: membership.grantedCapabilities } });
    assert.deepEqual(await db.membership.findMany({ where: { userId: fixture.userId }, orderBy: { id: "asc" } }), originals);
  }
}
