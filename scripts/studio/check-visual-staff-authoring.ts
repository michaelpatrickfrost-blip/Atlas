import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { expect, type Page } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { sessionAuthorityStamp, sessionForUser, type Session } from "../../src/core/auth/session";
import { ATLAS_CAPABILITIES as ATLAS } from "../../src/core/admin/access";
import { STUDIO_CAPABILITIES as CAP } from "../../src/core/studio/permissions";
import { STUDIO_PAGE_FEATURE, STUDIO_ANALYTICS_VIEW_FEATURE, readStudioRuntimeFeatureEvidence } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { pagePayloadSchema } from "../../src/core/studio/pages/schema";
import { viewPayloadSchema } from "../../src/core/studio/views/schema";
import { businessViewCreateSchema } from "../../src/modules/analytics/services/business-view-contract";
import { parseBlocks } from "../../src/core/templates/domain";
import { encodeWire, decodeWire, type Wire } from "../../src/core/desktop/wire";

export type VisualStaffAuthoringFixture = {
  staffActor: Session;
  organisationId: string; foreignOrganisationId: string; slug: string;
  pageDefinitionId: string; templateId: string; dashboardDefinitionId: string;
  orderId: string; orderReference: string; customerName: string;
  freshCustomerSession: (organisationId?: string) => Promise<Session>;
};

/** Original both-lock driver only. Reuses its genuine QA browser, business
 * browser and existing fixtures. No new login/token/context/user/company/role.
 * Launch uses the original explicit audited staff affiliation action. Only those
 * exact newly created Test affiliations are revoked in finally; history remains.
 * Local tests establish early boundaries, not positive SQL/browser acceptance. */
export async function checkVisualStaffAuthoring(base: string, staffPage: Page, customerPage: Page,
  fixture: VisualStaffAuthoringFixture) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence?.features.includes(STUDIO_PAGE_FEATURE) || !evidence.features.includes(STUDIO_ANALYTICS_VIEW_FEATURE)) {
    console.log("DEFERRED staff visual authoring: exact Page/dashboard current and rollback support is incomplete; no fixture/browser/session access.");
    return null;
  }
  const releases = dirname(root); assert.equal(basename(root), revision); assert(basename(releases).endsWith("-releases"));
  const current = realpathSync(join(dirname(releases), `${basename(releases).slice(0, -9)}-current`));
  if (base.startsWith("http://127.0.0.1:")) assert.equal(basename(current), evidence.rollbackRevision); else assert.equal(current, root);
  assert.deepEqual(verifyStudioRuntimeFeaturePair(root, join(releases, evidence.rollbackRevision), revision), evidence);
  const health = await fetch(`${base}/api/health/release`); assert(health.ok);
  assert.equal(z.object({ revision: z.string() }).parse(await health.json()).revision, revision);
  assert.notEqual(fixture.organisationId, fixture.foreignOrganisationId);
  assert(fixture.slug.startsWith("studio-check-visual-"));
  for (const id of [fixture.pageDefinitionId, fixture.dashboardDefinitionId]) z.uuid().parse(id);
  assert(fixture.templateId && fixture.orderId && fixture.customerName && fixture.orderReference);
  // The first access is the actual central synthetic-company guard. No browser
  // or Session collaborator is touched by a missing compatible release family.
  await db.organisation.findFirstOrThrow({ where: { id: fixture.organisationId, slug: fixture.slug,
    kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } });
  await db.organisation.findFirstOrThrow({ where: { id: fixture.foreignOrganisationId, kind: "CUSTOMER",
    status: "ACTIVE", archivedAt: null, isTest: true, slug: { startsWith: "studio-check-visual-" } } });
  const suppliedStamp = sessionAuthorityStamp(fixture.staffActor); assert(suppliedStamp, "A genuine original QA Session is required.");
  const staff = await sessionForUser(fixture.staffActor.organisationId, fixture.staffActor.userId); assert(staff);
  assert.deepEqual(sessionAuthorityStamp(staff), suppliedStamp);
  for (const capability of [ATLAS.staff, ATLAS.companies, ATLAS.businessUsersCreate, CAP.read, CAP.edit, CAP.publish])
    assert(staff.capabilities.has(capability), `Existing QA identity must already hold ${capability}; this checker grants none.`);
  const staffId = staff.userId, tenantIds = [fixture.organisationId, fixture.foreignOrganisationId];
  assert.equal(await db.membership.count({ where: { userId: staffId, organisationId: { in: tenantIds } } }), 0,
    "Only fresh original visual Test fixtures may receive new QA affiliations.");
  const qaBefore = await db.user.findFirstOrThrow({ where: { id: staffId }, include: { platformAdmin: true } });
  const qaMembershipsBefore = await db.membership.findMany({ where: { userId: staffId }, include: { roles: true }, orderBy: { id: "asc" } });
  const customer = await fixture.freshCustomerSession(); assert(sessionAuthorityStamp(customer));
  assert.equal(customer.organisationId, fixture.organisationId); assert.notEqual(customer.userId, staffId);
  assert(![...customer.capabilities].some(capability => capability.startsWith("atlas.")));
  const customerMembership = await db.membership.findFirstOrThrow({ where: { id: customer.membershipId,
    organisationId: fixture.organisationId, userId: customer.userId, active: true }, include: { roles: true } });
  const scope = { organisationId: fixture.organisationId };
  assert.equal(await db.moduleState.count({ where: { ...scope, moduleId: { in: ["studio", "sales", "templates", "analytics"] },
    enabled: true, entitled: true } }), 4);
  const order = await db.salesOrder.findFirstOrThrow({ where: { id: fixture.orderId, ...scope }, select: { reference: true, party: { select: { name: true } } } });
  assert.equal(order.reference, fixture.orderReference); assert.equal(order.party.name, fixture.customerName);
  const definition = (id: string) => db.studioDefinition.findFirstOrThrow({ where: { ...scope, id, retiredAt: null } });
  const draft = (id: string) => db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: id } });
  const template = () => db.documentTemplate.findFirstOrThrow({ where: { ...scope, id: fixture.templateId } });
  assert.equal((await definition(fixture.pageDefinitionId)).kind, "page");
  assert.equal((await definition(fixture.dashboardDefinitionId)).kind, "view");
  assert((await definition(fixture.pageDefinitionId)).activeVersionId && (await definition(fixture.dashboardDefinitionId)).activeVersionId);
  assert.equal((await template()).status, "PUBLISHED");
  const cookiesBefore = await staffPage.context().cookies(base);
  assert.notEqual(staffPage, customerPage); assert.notEqual(staffPage.context(), customerPage.context(), "Reuse the original independent QA and customer contexts.");
  assert.equal(cookiesBefore.filter(cookie => cookie.name === "atlas_session").length, 1);
  const nativeSnapshot = async () => ({
    orders: await db.salesOrder.findMany({ where: { organisationId: { in: tenantIds } }, include: { lines: { orderBy: { id: "asc" } } }, orderBy: { id: "asc" } }),
    work: await db.serviceWorkItem.findMany({ where: { organisationId: { in: tenantIds } }, orderBy: { id: "asc" } }),
    documents: await db.contractDocument.findMany({ where: { organisationId: { in: tenantIds } }, orderBy: { id: "asc" } }),
    extensions: await db.studioExtensionRecord.findMany({ where: { organisationId: { in: tenantIds } }, orderBy: { id: "asc" } }),
    slots: await db.studioFieldSlot.findMany({ where: { organisationId: { in: tenantIds } }, orderBy: { id: "asc" } }),
    values: await db.studioFieldValue.findMany({ where: { organisationId: { in: tenantIds } }, orderBy: { id: "asc" } }),
    // Delivery workers may advance status; immutable business event identities
    // and payloads must remain unchanged by these metadata-only authoring edits.
    outbox: await db.domainOutbox.findMany({ where: { organisationId: { in: tenantIds } },
      select: { id: true, organisationId: true, eventKey: true, eventName: true, payload: true }, orderBy: { id: "asc" } }),
  });
  const metadataSnapshot = async (organisationId: string) => ({
    definitions: await db.studioDefinition.findMany({ where: { organisationId }, orderBy: { id: "asc" } }),
    drafts: await db.studioDraft.findMany({ where: { organisationId }, orderBy: { id: "asc" } }),
    versions: await db.studioDefinitionVersion.findMany({ where: { organisationId }, orderBy: { id: "asc" } }),
    templates: await db.documentTemplate.findMany({ where: { organisationId }, orderBy: { id: "asc" } }),
    audit: await db.auditEntry.findMany({ where: { organisationId, action: { not: "atlas.studio.opened" } }, orderBy: { id: "asc" } }),
  });
  const nativeBefore = await nativeSnapshot(), foreignBefore = await metadataSnapshot(fixture.foreignOrganisationId);
  const createdMemberships = new Map<string, string>(), attemptedLaunches = new Set<string>();
  const marker = randomUUID().slice(0, 8), sectionName = `Staff designed order ${marker}`, dashboardTitle = `Staff designed figures ${marker}`;
  const route = (path: string, organisationId = fixture.organisationId) => `${base}${path}?business=${encodeURIComponent(organisationId)}`;
  async function launch(organisationId: string) {
    await staffPage.goto(`${base}/atlas/studio/${organisationId}`);
    await expect(staffPage.locator('[data-atlas-console="admin"]')).toBeVisible();
    for (const name of ["Apps", "Open chat", "Notifications"]) await expect(staffPage.getByRole("button", { name, exact: true })).toHaveCount(0);
    attemptedLaunches.add(organisationId);
    await staffPage.getByRole("button", { name: "Open visual Studio", exact: true }).click();
    await expect(staffPage).toHaveURL(route("/design-studio", organisationId));
    await expect(staffPage.getByRole("heading", { name: "Make this business feel like itself.", exact: true })).toBeVisible();
    const affiliation = await db.membership.findFirstOrThrow({ where: { organisationId, userId: staffId, active: true }, include: { roles: true } });
    assert.deepEqual(affiliation.grantedCapabilities, []); assert.deepEqual(affiliation.deniedCapabilities, []); assert.deepEqual(affiliation.roles, []);
    createdMemberships.set(organisationId, affiliation.id);
    const selected = await sessionForUser(organisationId, staffId); assert(selected && sessionAuthorityStamp(selected));
    assert.equal(selected.membershipId, affiliation.id); assert(selected.capabilities.has(ATLAS.staff));
    assert.equal(await db.auditEntry.count({ where: { organisationId, actorUserId: staffId, entityId: organisationId, action: "atlas.studio.opened" } }), 1);
    assert.deepEqual(await staffPage.context().cookies(base), cookiesBefore, "Visual launch must not replace the original QA login cookie.");
  }
  const responseSchema = z.object({ value: z.unknown().optional(), error: z.string().optional() });
  async function denied(action: string, args: unknown[]) {
    const body = JSON.stringify({ action, args: await encodeWire(args) });
    const result = await staffPage.evaluate(async body => {
      const response = await fetch("/api/desktop/action", { method: "POST", headers: { "content-type": "application/json", "x-atlas-client": "desktop" }, body });
      return { status: response.status, body: await response.json() as unknown };
    }, body);
    const parsed = responseSchema.parse(result.body), value = parsed.value === undefined ? undefined : decodeWire(parsed.value as Wire);
    const feedback = z.object({ error: z.string() }).safeParse(value);
    const message = parsed.error ?? (feedback.success ? feedback.data.error : "");
    assert(!message.includes("unsupported action"), "A missing desktop allowlist entry does not prove owning permission enforcement.");
    assert.match(message, /FORBIDDEN|CONFLICT|unavailable|not found|NOT_FOUND|available business record/i, "An unrelated HTTP/server error is not authority-denial evidence.");
    assert(result.status < 500, "An unhandled server failure is not an accepted permission denial.");
  }
  try {
    await staffPage.setViewportSize({ width: 1440, height: 1000 });
    await launch(fixture.organisationId);
    // All three positive writes go through actual existing UI and services.
    await staffPage.goto(route(`/design-studio/${fixture.pageDefinitionId}`));
    const beforePage = await draft(fixture.pageDefinitionId), pagePayload = pagePayloadSchema.parse(beforePage.payload);
    await staffPage.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: pagePayload.sections[0].label, exact: true }).click();
    await staffPage.getByRole("complementary", { name: "Selected item properties" }).getByLabel("Display name", { exact: true }).fill(sectionName);
    await staffPage.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft(fixture.pageDefinitionId)).revision).toBe(beforePage.revision + 1);
    const previousPageVersion = (await definition(fixture.pageDefinitionId)).activeVersionId;
    await staffPage.getByRole("button", { name: "Review & publish", exact: true }).click();
    const confirmation = staffPage.getByRole("dialog", { name: "Make this design live?" }); await expect(confirmation).toBeVisible();
    if (await confirmation.getByRole("checkbox").count()) await confirmation.getByRole("checkbox").check();
    await confirmation.getByRole("button", { name: "Go live", exact: true }).click();
    await expect.poll(async () => (await definition(fixture.pageDefinitionId)).activeVersionId).not.toBe(previousPageVersion);
    assert.equal(pagePayloadSchema.parse((await draft(fixture.pageDefinitionId)).payload).sections[0].label, sectionName);
    await staffPage.getByRole("button", { name: "Choose preview record", exact: true }).click();
    await staffPage.getByLabel("Preview record", { exact: true }).selectOption(fixture.orderId);
    await staffPage.getByRole("button", { name: "Load actual preview", exact: true }).click();
    await expect(staffPage.getByRole("region", { name: "Design canvas" }).getByText(fixture.customerName, { exact: true })).toBeVisible();

    await staffPage.goto(route(`/design-studio/documents/${fixture.templateId}`));
    const templateBefore = await template();
    await staffPage.getByLabel("Document title", { exact: true }).fill(`Staff prepared order ${marker} for `);
    await staffPage.getByRole("button", { name: "Save template", exact: true }).click();
    await expect.poll(async () => (await template()).version).toBe(templateBefore.version + 1);
    await expect(staffPage).toHaveURL(route(`/design-studio/documents/${fixture.templateId}`));
    assert.equal((await template()).titleTemplate, `Staff prepared order ${marker} for {{customer.name}}`);
    assert.deepEqual((await template()).blocks, templateBefore.blocks, "Literal title edits retain the native document blocks and protected fields.");
    await staffPage.getByLabel("Preview content", { exact: true }).selectOption({ label: "Business record" });
    await staffPage.getByLabel("Preview record", { exact: true }).selectOption(`sales/order/${fixture.orderId}`);
    await staffPage.getByRole("button", { name: "Refresh business preview", exact: true }).click();
    await expect(staffPage.getByRole("article", { name: "Document preview", exact: true })).toContainText(fixture.customerName);

    await staffPage.goto(route(`/design-studio/dashboards/${fixture.dashboardDefinitionId}`));
    const dashboardBefore = await draft(fixture.dashboardDefinitionId), previousDashboardVersion = (await definition(fixture.dashboardDefinitionId)).activeVersionId;
    await staffPage.getByRole("button", { name: "Configure widget 1", exact: true }).click();
    await staffPage.getByRole("complementary", { name: "Widget inspector" }).getByLabel("Chart title", { exact: true }).fill(dashboardTitle);
    await staffPage.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft(fixture.dashboardDefinitionId)).revision).toBe(dashboardBefore.revision + 1);
    await staffPage.getByRole("button", { name: "Review saved design", exact: true }).click();
    await expect(staffPage.getByText("Saved design reviewed", { exact: true })).toBeVisible();
    const publish = staffPage.getByRole("region", { name: "Publish business dashboard" });
    if (await publish.getByRole("checkbox", { name: "I have reviewed these notes.", exact: true }).count())
      await publish.getByRole("checkbox", { name: "I have reviewed these notes.", exact: true }).check();
    await staffPage.getByRole("button", { name: "Go live for this business", exact: true }).click();
    await expect.poll(async () => (await definition(fixture.dashboardDefinitionId)).activeVersionId).not.toBe(previousDashboardVersion);
    const dashboardContent = businessViewCreateSchema.parse(viewPayloadSchema.parse((await draft(fixture.dashboardDefinitionId)).payload).content);
    assert.equal(dashboardContent.widgets[0].title, dashboardTitle);
    for (const id of [fixture.pageDefinitionId, fixture.dashboardDefinitionId]) for (const action of ["studio.draft.updated", "studio.definition.published", "studio.definition.activated"])
      assert.equal(await db.auditEntry.count({ where: { ...scope, actorUserId: staffId, entityId: id, action } }), 1);
    assert.equal(await db.auditEntry.count({ where: { ...scope, actorUserId: staffId, entityId: fixture.templateId, action: "template.saved" } }), 1);

    // Same actual customer cookie, with its existing authoring grants removed
    // temporarily, must receive published design under ordinary source Read.
    await db.membership.update({ where: { id: customerMembership.id, ...scope, userId: customer.userId }, data: {
      deniedCapabilities: [...new Set([...customerMembership.deniedCapabilities, CAP.read, CAP.edit, CAP.publish, "analytics.dashboard.manage"])] } });
    const reader = await fixture.freshCustomerSession(); assert(sessionAuthorityStamp(reader));
    assert(![...reader.capabilities].some(capability => capability.startsWith("atlas.") || capability.startsWith("studio.")));
    assert(reader.capabilities.has("sales.order.read") && reader.capabilities.has("analytics.dashboard.read"));
    await customerPage.goto(`${base}/screens/${fixture.pageDefinitionId}?record=${encodeURIComponent(fixture.orderId)}`);
    await expect(customerPage.getByRole("heading", { name: sectionName, exact: true })).toBeVisible();
    await expect(customerPage.getByText(fixture.customerName, { exact: true })).toBeVisible();
    await customerPage.goto(`${base}/business-dashboards/${fixture.dashboardDefinitionId}`);
    await expect(customerPage.getByRole("heading", { name: dashboardTitle, exact: true })).toBeVisible();
    await expect(customerPage.locator("section").filter({ has: customerPage.getByRole("heading", { name: dashboardTitle, exact: true }) }).getByText("1", { exact: true })).toBeVisible();

    await launch(fixture.foreignOrganisationId);
    const currentPageDraft = await draft(fixture.pageDefinitionId), currentViewDraft = await draft(fixture.dashboardDefinitionId);
    const currentPagePayload = pagePayloadSchema.parse(currentPageDraft.payload), currentViewContent = businessViewCreateSchema.parse(viewPayloadSchema.parse(currentViewDraft.payload).content);
    const beforeDenials = await metadataSnapshot(fixture.organisationId);
    const savedTemplate = await template();
    const form = new FormData(); for (const [key, value] of Object.entries({ id: fixture.templateId, version: String(savedTemplate.version),
      name: savedTemplate.name, titleTemplate: savedTemplate.titleTemplate, status: savedTemplate.status, blocks: JSON.stringify(parseBlocks(savedTemplate.blocks)), description: savedTemplate.description ?? "" })) form.set(key, value);
    for (const moduleId of savedTemplate.targetModules) form.append("targetModules", moduleId);
    // These three original writers are NOT generic desktop endpoints. Exercise
    // their genuine current server boundary directly rather than misclassifying
    // an unsupported-action response as permission evidence. The positive path
    // above used their actual Next UI actions, not these service probes.
    const { withStudioAuthoringAuthority } = await import("../../src/core/studio/authoring/context");
    const { savePageDraftInTransaction } = await import("../../src/core/studio/authoring/pages");
    const { saveBusinessViewDraftInTransaction } = await import("../../src/modules/analytics/services/studio-business-view");
    const { saveTemplateInTransaction } = await import("../../src/core/templates/authoring");
    const denyOriginalWriters = async (organisationId: string) => {
      await assert.rejects(() => withStudioAuthoringAuthority(staff, CAP.edit, organisationId, authority => savePageDraftInTransaction(authority,
        { definitionId: fixture.pageDefinitionId, revision: currentPageDraft.revision, payload: currentPagePayload })), /FORBIDDEN|CONFLICT|unavailable/i);
      await assert.rejects(() => withStudioAuthoringAuthority(staff, CAP.edit, organisationId, authority => saveBusinessViewDraftInTransaction(authority,
        { ...currentViewContent, definitionId: fixture.dashboardDefinitionId, revision: currentViewDraft.revision })), /FORBIDDEN|CONFLICT|unavailable/i);
      await assert.rejects(() => withStudioAuthoringAuthority(staff, CAP.edit, organisationId, authority => saveTemplateInTransaction(authority.session, authority.transaction, form)), /FORBIDDEN|CONFLICT|unavailable/i);
    };
    await denyOriginalWriters(fixture.foreignOrganisationId);
    const previewInput = { titleTemplate: savedTemplate.titleTemplate, blocks: parseBlocks(savedTemplate.blocks), targetModules: savedTemplate.targetModules,
      sourceModule: "sales", sourceType: "order", sourceId: fixture.orderId };
    await denied("src/app/(studio)/design-studio/documents/actions:previewStudioDocument", [fixture.foreignOrganisationId, previewInput]);
    assert.deepEqual(await metadataSnapshot(fixture.organisationId), beforeDenials);
    assert.deepEqual(await metadataSnapshot(fixture.foreignOrganisationId), foreignBefore);

    await db.membership.update({ where: { id: createdMemberships.get(fixture.organisationId)!, ...scope, userId: staffId }, data: { active: false } });
    await denyOriginalWriters(fixture.organisationId);
    await denied("src/app/(studio)/design-studio/documents/actions:previewStudioDocument", [fixture.organisationId, previewInput]);
    assert.deepEqual(await metadataSnapshot(fixture.organisationId), beforeDenials, "Fresh loss of the selected affiliation must deny all original writers without effects.");
    assert.deepEqual(await nativeSnapshot(), nativeBefore);
    assert.deepEqual(await staffPage.context().cookies(base), cookiesBefore);
    console.log("PASS original staff selected-business journey: genuine QA Admin launch, unchanged login, actual screen/template/dashboard UI save+publish/preview, ordinary customer live delivery, foreign selection/current affiliation denial, native/typed/document/Outbox preservation. Existing approved Sales source only; no new permission engine or whole Phase2 PASS inferred.");
    return { pageDefinitionId: fixture.pageDefinitionId, templateId: fixture.templateId, dashboardDefinitionId: fixture.dashboardDefinitionId };
  } finally {
    const cleanup = await Promise.allSettled([
      db.membership.update({ where: { id: customerMembership.id, ...scope, userId: customer.userId }, data: {
        grantedCapabilities: customerMembership.grantedCapabilities, deniedCapabilities: customerMembership.deniedCapabilities } }),
      ...[...attemptedLaunches].map(async organisationId => {
        // Launch can commit before the browser fails. Initial zero-affiliation
        // proof permits cleanup of that one exact newly created Test membership.
        const affiliation = await db.membership.findFirst({ where: { organisationId, userId: staffId } });
        if (affiliation) { createdMemberships.set(organisationId, affiliation.id);
          await db.membership.update({ where: { id: affiliation.id, organisationId, userId: staffId }, data: { active: false } }); }
      }),
    ]);
    for (const result of cleanup) if (result.status === "rejected") throw result.reason;
    assert.deepEqual(await db.user.findFirstOrThrow({ where: { id: staffId }, include: { platformAdmin: true } }), qaBefore);
    assert.deepEqual(await db.membership.findMany({ where: { userId: staffId, id: { notIn: [...createdMemberships.values()] } }, include: { roles: true }, orderBy: { id: "asc" } }), qaMembershipsBefore);
    assert.deepEqual(await db.membership.findFirstOrThrow({ where: { id: customerMembership.id, ...scope }, include: { roles: true } }), customerMembership);
    const finalCookies = await staffPage.context().cookies(base);
    if (!isDeepStrictEqual(finalCookies, cookiesBefore)) {
      // Preserve the original login even when a regressed launch changed it.
      // This restores the identical existing cookie, never issues a new token.
      await staffPage.context().clearCookies({ name: "atlas_session" });
      await staffPage.context().addCookies(cookiesBefore.filter(cookie => cookie.name === "atlas_session"));
      assert.deepEqual(finalCookies, cookiesBefore, "Unexpected QA cookie change was restored and is an acceptance failure.");
    }
  }
}
