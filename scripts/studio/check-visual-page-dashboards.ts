import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { z } from "zod";
import { formatMoney } from "@/core/shared/money";
import { db } from "@/core/db/client";
import { sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { readStudioRuntimeFeatureEvidence, STUDIO_ANALYTICS_VIEW_FEATURE, STUDIO_PAGE_EMBEDDED_VIEW_FEATURE } from "@/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { readSealedViewInTransaction } from "@/core/studio/views/runtime";
import { savePageDraftInTransaction } from "@/core/studio/authoring/pages";
import { readActiveCustomerPage } from "@/core/studio/pages/customer-gateway";
import { pagePayloadSchema } from "@/core/studio/pages/schema";
import { compilePage } from "@/core/studio/pages/compiler";
import { pageApprovalsSchema } from "@/core/studio/pages/approvals";
import { checksum } from "@/core/studio/registry/contracts";

export type VisualPageDashboardFixture = {
  organisationId: string; slug: string; userId: string; membershipId: string;
  foreignOrganisationId: string; grantedCapabilities: readonly string[];
  freshSession: (organisationId?: string) => Promise<Session>;
  pageDefinitionId: string; orderId: string;
  dashboard: { definitionId: string; version1: string; version2: string };
};
const requiredGrants = ["analytics.dashboard.read", "analytics.dashboard.manage", "sales.order.read", "sales.quote.read", CAP.read, CAP.edit, CAP.publish];

/** Original both-lock driver only. Reuses its exact retained Test fixtures and
 * existing browser Page. Local tests establish the pre-fixture boundary only;
 * PASS below requires actual original SQL and browser execution. No screenshots,
 * new companies/users/contexts, business mutation or result caches are created. */
export async function checkVisualPageDashboards(base: string, page: Page, fixture: VisualPageDashboardFixture) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence || ![STUDIO_ANALYTICS_VIEW_FEATURE, STUDIO_PAGE_EMBEDDED_VIEW_FEATURE].every(feature => evidence.features.includes(feature))) {
    console.log("DEFERRED visual embedded dashboards: actual current/rollback Page and View support is incomplete; no fixture or browser access.");
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
  for (const grant of requiredGrants) assert(fixture.grantedCapabilities.includes(grant));
  z.uuid().parse(fixture.pageDefinitionId); z.uuid().parse(fixture.dashboard.definitionId);
  z.uuid().parse(fixture.dashboard.version1); z.uuid().parse(fixture.dashboard.version2);
  assert.notEqual(fixture.dashboard.version1, fixture.dashboard.version2);
  assert.notEqual(fixture.pageDefinitionId, fixture.dashboard.definitionId);
  assert(fixture.orderId.length > 0 && fixture.orderId.length <= 200);
  const scope = { organisationId: fixture.organisationId };
  await db.organisation.findFirstOrThrow({ where: { id: fixture.organisationId, slug: fixture.slug, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } });
  await db.organisation.findFirstOrThrow({ where: { id: fixture.foreignOrganisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null,
    isTest: true, slug: { startsWith: "studio-check-visual-" } } });
  await db.user.findFirstOrThrow({ where: { id: fixture.userId, platformAdmin: null, email: { startsWith: "studio-check-", endsWith: "@example.test" } } });
  const membership = await db.membership.findFirstOrThrow({ where: { id: fixture.membershipId, ...scope, userId: fixture.userId, active: true } });
  assert.deepEqual(membership.grantedCapabilities, [...fixture.grantedCapabilities]);
  assert.equal(await db.moduleState.count({ where: { ...scope, moduleId: { in: ["studio", "analytics", "sales"] }, enabled: true, entitled: true } }), 3);
  const affiliations = await db.membership.findMany({ where: { userId: fixture.userId }, orderBy: { id: "asc" } });
  async function fresh(organisationId = fixture.organisationId) {
    const actor = await fixture.freshSession(organisationId), stamp = sessionAuthorityStamp(actor);
    assert(stamp && stamp.userId === fixture.userId && stamp.organisationId === organisationId
      && actor.userId === stamp.userId && actor.organisationId === stamp.organisationId);
    if (organisationId === fixture.organisationId) assert.equal(actor.membershipId, fixture.membershipId);
    assert(![...actor.capabilities].some(capability => capability.startsWith("atlas."))); return actor;
  }
  await fresh();
  const native = () => Promise.all([
    db.salesOrder.findMany({ where: scope, orderBy: { id: "asc" } }),
    db.salesOrderLine.findMany({ where: { order: scope }, orderBy: { id: "asc" } }),
  ]);
  const nativeBefore = await native(); assert.equal(nativeBefore[0].length, 1); assert.equal(nativeBefore[0][0].id, fixture.orderId);
  const ids = [fixture.pageDefinitionId, fixture.dashboard.definitionId];
  const draft = () => db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: fixture.pageDefinitionId, definition: { kind: "page", retiredAt: null } } });
  const definition = () => db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: fixture.pageDefinitionId, kind: "page", retiredAt: null } });
  const dashboard = () => db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: fixture.dashboard.definitionId, kind: "view", retiredAt: null } });
  const snapshot = async () => ({ native: await native(), definitions: await db.studioDefinition.findMany({ where: { ...scope, id: { in: ids } }, orderBy: { id: "asc" } }),
    drafts: await db.studioDraft.findMany({ where: { ...scope, definitionId: { in: ids } }, orderBy: { id: "asc" } }),
    versions: await db.studioDefinitionVersion.findMany({ where: { ...scope, definitionId: { in: ids } }, orderBy: { id: "asc" } }),
    pins: await db.studioConfigurationDependency.findMany({ where: { ...scope, definitionId: { in: ids } }, orderBy: { id: "asc" } }),
    audit: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
    outbox: await db.domainOutbox.findMany({ where: scope, select: { id: true, eventKey: true, eventName: true, payload: true, createdAt: true }, orderBy: { id: "asc" } }) });
  const request = { definitionId: fixture.pageDefinitionId, request: { kind: "record" as const, recordId: fixture.orderId }, formFactor: "desktop" as const };
  const read = (actor: Session) => readActiveCustomerPage(actor, request);
  const frameSchema = z.object({ approvals: pageApprovalsSchema, payload: pagePayloadSchema });
  const initialVersion = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, id: (await definition()).activeVersionId! } });
  const initialFrame = frameSchema.parse(initialVersion.compiledPlan);
  assert.equal(initialFrame.approvals.sourcePage.id, "sales.order.page"); assert.equal(initialFrame.approvals.sourcePage.version, 3);
  assert.equal(initialFrame.approvals.sourcePage.ownerModuleId, "sales");
  assert.equal(checksum(compilePage(initialFrame.payload, initialFrame.approvals)), initialVersion.checksum);
  assert.equal((await dashboard()).activeVersionId, fixture.dashboard.version1, "Original Dashboard restore must leave its first actual version active.");
  const viewVersion = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, definitionId: fixture.dashboard.definitionId, id: fixture.dashboard.version1 } });
  const viewContent = z.object({ content: z.object({ widgets: z.array(z.object({ id: z.string(), title: z.string(), metricId: z.string() })).min(1) }) }).parse(viewVersion.payload).content;
  const title = viewContent.widgets.find(widget => widget.metricId === "sales.orders")?.title; assert(title);
  const dashboardName = (await dashboard()).name;
  const originalComponents = initialFrame.payload.sections.flatMap(section => section.components);
  const beforeAudits = await db.auditEntry.count({ where: { ...scope, entityId: fixture.pageDefinitionId, action: "studio.definition.published" } });
  async function publish() {
    await page.getByRole("button", { name: "Review & publish", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Make this design live?", exact: true });
    if (await dialog.getByRole("checkbox").count()) await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Go live", exact: true }).click();
    await expect(page.getByText("Your reviewed design is now live for this business.", { exact: true })).toBeVisible();
    return (await definition()).activeVersionId!;
  }
  const viewport = page.viewportSize();
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/design-studio/${fixture.pageDefinitionId}`);
    await page.getByRole("button", { name: `Add ${dashboardName}`, exact: true }).click();
    const properties = page.getByRole("complementary", { name: "Selected item properties" });
    await expect(properties.getByLabel("Saved dashboard", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Review & publish", exact: true })).toBeDisabled();
    if (!originalComponents.some(component => component.type === "metric")) await page.getByRole("button", { name: "Add Order total", exact: true }).click();
    await page.getByRole("button", { name: "Choose preview record", exact: true }).click();
    await page.getByLabel("Preview record", { exact: true }).selectOption(fixture.orderId);
    await page.getByRole("button", { name: "Load actual preview", exact: true }).click();
    const canvas = page.getByRole("region", { name: "Design canvas" });
    await expect(canvas.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const zeroTitle = viewContent.widgets.find(widget => widget.metricId === "sales.quotes")?.title; assert(zeroTitle);
    const zeroChart = canvas.locator("section").filter({ has: canvas.getByRole("heading", { name: zeroTitle, exact: true }) });
    await expect(zeroChart.getByText("0", { exact: true })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Preview acknowledgement", exact: true })).toBeDisabled();
    const beforeSave = await draft();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft()).revision).toBe(beforeSave.revision + 1);
    const saved = pagePayloadSchema.parse((await draft()).payload), component = saved.sections.flatMap(section => section.components).find(node => node.type === "analyticsView");
    assert(component?.type === "analyticsView"); assert.equal(component.view.versionId, fixture.dashboard.version1);
    for (const node of originalComponents) assert(saved.sections.some(section => section.components.some(actual => actual.id === node.id)), "Embedding must preserve native Page nodes.");
    const versionId = await publish();
    assert.equal(await db.auditEntry.count({ where: { ...scope, entityId: fixture.pageDefinitionId, action: "studio.definition.published" } }), beforeAudits + 1);
    const stored = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, id: versionId, definitionId: fixture.pageDefinitionId } });
    const frame = frameSchema.parse(stored.compiledPlan), compiled = compilePage(frame.payload, frame.approvals);
    assert.equal(checksum(compiled), stored.checksum); assert(compiled.base.queryCost <= frame.approvals.maxQueryCost);
    assert.equal(frame.approvals.sourcePage.version, 3);
    const pins = await db.studioConfigurationDependency.findMany({ where: { ...scope, versionId } });
    assert(pins.some(pin => pin.targetDefinitionId === fixture.dashboard.definitionId && pin.targetVersionId === fixture.dashboard.version1 && pin.targetChecksum === viewVersion.checksum));
    const actual = await read(await fresh()), nodes = actual.model.sections.flatMap(section => section.components), embedded = nodes.find(node => node.id === component.id);
    assert(embedded?.type === "analyticsView" && embedded.output); assert.equal(embedded.output.view.versionId, fixture.dashboard.version1);
    const ordersWidget = viewContent.widgets.find(widget => widget.metricId === "sales.orders")!;
    assert.equal(z.array(z.object({ value: z.number() })).parse(embedded.output.dataByWidget[ordersWidget.id]).reduce((sum, point) => sum + point.value, 0), 1);
    const zeroWidget = viewContent.widgets.find(widget => widget.metricId === "sales.quotes"); assert(zeroWidget);
    assert.equal(z.array(z.object({ value: z.number() })).parse(embedded.output.dataByWidget[zeroWidget.id]).reduce((sum, point) => sum + point.value, 0), 0);
    assert(nodes.some(node => node.type === "metric" && node.cells.some(cell => !cell.unavailable && cell.text !== "—")), "Native Order total must remain live alongside the embedded dashboard.");
    const metricComponent = saved.sections.flatMap(section => section.components).find(node => node.type === "metric" && node.metric.id === "sales.order.page.total_metric" && node.metric.version === 1); assert(metricComponent);
    const total = nodes.find(node => node.id === metricComponent.id); assert(total?.type === "metric");
    const owningOrder = nativeBefore[0][0], expectedTotal = formatMoney(owningOrder.grossAmount, owningOrder.currency);
    assert.deepEqual(total.cells, [{ label: "Order total", text: expectedTotal, unavailable: false }, { label: "Currency", text: owningOrder.currency, unavailable: false }],
      "Sales KPI must use the exact canonical order minor amount and explicit currency alongside the embedded View.");
    await page.goto(`${base}/screens/${fixture.pageDefinitionId}?record=${encodeURIComponent(fixture.orderId)}`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const totalCard = page.locator("div").filter({ has: page.getByRole("heading", { name: total.label, exact: true }) }).filter({ has: page.locator("dl") }).last();
    await expect(totalCard.locator("dd")).toHaveText([expectedTotal, owningOrder.currency]);
    const unchanged = await snapshot();
    // Original publisher restore changes only the View active head; the Page
    // continues to use its exact retained version and SQL dependency edge.
    await page.goto(`${base}/design-studio/dashboards/${fixture.dashboard.definitionId}`);
    await page.getByText("Previous published designs", { exact: true }).click();
    await page.getByLabel("Choose a design", { exact: true }).selectOption(fixture.dashboard.version2);
    await page.getByRole("checkbox", { name: "Make this previous design live for the business.", exact: true }).check();
    await page.getByRole("button", { name: "Restore selected design", exact: true }).click();
    await expect.poll(async () => (await dashboard()).activeVersionId).toBe(fixture.dashboard.version2);
    assert.equal((await read(await fresh())).versionId, versionId);
    assert.deepEqual((await snapshot()).pins, unchanged.pins); assert.deepEqual((await snapshot()).native, unchanged.native);
    const retained = (await read(await fresh())).model.sections.flatMap(section => section.components).find(node => node.id === component.id);
    assert(retained?.type === "analyticsView" && retained.output); assert.equal(retained.output.view.versionId, fixture.dashboard.version1);
    const beforeDenied = await snapshot(), currentDraft = await draft(), freshActor = await fresh();
    // Visible component loses its independent View grant: fail before returning
    // protected figures. Restore original exact grants before authoring the
    // separately hidden case below; do not change a stored capability policy.
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId },
      data: { grantedCapabilities: membership.grantedCapabilities.filter(cap => cap !== "analytics.dashboard.read") } });
    await assert.rejects(() => read(freshActor), /FORBIDDEN/);
    assert.deepEqual(await snapshot(), beforeDenied);
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: membership.grantedCapabilities } });
    await assert.rejects(() => withStudioAuthoringAuthority(freshActor, CAP.edit, undefined, authority => savePageDraftInTransaction(authority,
      { definitionId: fixture.pageDefinitionId, revision: beforeSave.revision, payload: saved })), /CONFLICT/);
    const oversized = { ...saved, sections: saved.sections.map((section, index) => index ? section : { ...section,
      components: [...section.components, ...Array.from({ length: 10 }, (_, i) => ({ ...component, id: `budget_view_${i}` }))] }) };
    await assert.rejects(() => withStudioAuthoringAuthority(freshActor, CAP.edit, undefined, authority => savePageDraftInTransaction(authority,
      { definitionId: fixture.pageDefinitionId, revision: currentDraft.revision, payload: oversized })), /budget/);
    assert.deepEqual(await snapshot(), beforeDenied, "Stale draft and actual combined query budget must reject before draft/version/Audit effects.");
    // A saved closed visibility predicate is metadata, not a permission waiver.
    // Missing Analytics Read hides the View before its native provider preflight;
    // ordinary Sales fields remain available. No hook/instrumentation is installed.
    const hidden = { ...saved, sections: saved.sections.map(section => ({ ...section, components: section.components.map(node => node.id === component.id
      ? { ...node, visibleWhen: { kind: "capabilities" as const, mode: "all" as const, capabilities: ["analytics.dashboard.read"] } } : node) })) };
    await withStudioAuthoringAuthority(await fresh(), CAP.edit, undefined, authority => savePageDraftInTransaction(authority,
      { definitionId: fixture.pageDefinitionId, revision: currentDraft.revision, payload: hidden }));
    await page.goto(`${base}/design-studio/${fixture.pageDefinitionId}`); await publish();
    const viewerCaps = ["core.profile.self", "sales.order.read", "sales.quote.read", "analytics.dashboard.read"];
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: viewerCaps } });
    const reader = await fresh(); assert(![...reader.capabilities].some(cap => cap.startsWith("studio.")));
    assert((await read(reader)).model.sections.flatMap(section => section.components).some(node => node.id === component.id));
    const readOnly = await snapshot();
    await assert.rejects(() => withStudioAuthoringAuthority(reader, CAP.edit, undefined, async authority => savePageDraftInTransaction(authority,
      { definitionId: fixture.pageDefinitionId, revision: (await draft()).revision, payload: hidden })), /FORBIDDEN/);
    await assert.rejects(async () => readActiveCustomerPage(await fresh(fixture.foreignOrganisationId), request), /NOT_FOUND|unavailable|FORBIDDEN/i);
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: viewerCaps.filter(cap => cap !== "analytics.dashboard.read") } });
    await assert.rejects(() => withFieldRuntimeAuthority(reader, authority => readSealedViewInTransaction(authority, component.view)), /FORBIDDEN/);
    const hiddenRead = await read(reader); assert(!hiddenRead.model.sections.some(section => section.components.some(node => node.id === component.id)));
    assert(hiddenRead.model.sections.some(section => section.components.some(node => node.type === "metric")));
    await page.goto(`${base}/screens/${fixture.pageDefinitionId}?record=${encodeURIComponent(fixture.orderId)}`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
    await expect(page.getByText(dashboardName, { exact: true })).toHaveCount(0);
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: viewerCaps.filter(cap => cap !== "sales.order.read") } });
    await assert.rejects(() => read(reader), /FORBIDDEN/);
    assert.deepEqual(await snapshot(), readOnly, "Current Read-only, hidden/revoked and foreign reads may not write native/configuration/Audit history.");
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: viewerCaps } });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/screens/${fixture.pageDefinitionId}?record=${encodeURIComponent(fixture.orderId)}&size=phone`);
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Embedded customer screen must fit the phone.");
    }
    assert.deepEqual(await native(), nativeBefore);
    console.log("PASS bounded visual Page embedding: actual saved Dashboard palette/record preview (Orders=1/Quotations=0)/save/review/live, original native nodes+Order total, immutable View pin after later active restore, combined query budget/CAS, current Read-only customer, hidden Analytics View without protected figures/names, independent revoked Sales/foreign denial, read-only snapshots and phone geometry. No query instrumentation or whole Phase2/private Ticket acceptance inferred.");
    return { pageDefinitionId: fixture.pageDefinitionId, versionId, viewVersionId: fixture.dashboard.version1 };
  } finally {
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: membership.grantedCapabilities } });
    assert.deepEqual(await db.membership.findMany({ where: { userId: fixture.userId }, orderBy: { id: "asc" } }), affiliations);
    if (viewport) await page.setViewportSize(viewport);
  }
}
