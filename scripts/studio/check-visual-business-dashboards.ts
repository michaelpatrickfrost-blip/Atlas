import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import { sessionAuthorityStamp } from "../../src/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "../../src/core/studio/permissions";
import { STUDIO_ANALYTICS_VIEW_FEATURE, readStudioRuntimeFeatureEvidence } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { withFieldRuntimeAuthority } from "../../src/core/studio/fields/runtime-authority";
import { withStudioAuthoringAuthority } from "../../src/core/studio/authoring/context";
import { readPublishedAnalyticsViewInTransaction, listPublishedBusinessViewsInTransaction,
  saveBusinessViewDraftInTransaction } from "../../src/modules/analytics/services/studio-business-view";
import { businessViewCreateSchema } from "../../src/modules/analytics/services/business-view-contract";
import { viewPayloadSchema } from "../../src/core/studio/views/schema";

export type VisualBusinessDashboardFixture = {
  organisationId: string; slug: string; userId: string; membershipId: string;
  foreignOrganisationId: string; grantedCapabilities: readonly string[];
  freshSession: (organisationId?: string) => Promise<Session>;
};
const requiredGrants = ["analytics.dashboard.read", "analytics.dashboard.manage", "sales.order.read", "sales.quote.read", CAP.read, CAP.edit, CAP.publish];

/** Nested in the original both-lock central visual fixture. These are actual UI
 * journeys only when executed there; local tests prove early deny/defer ordering.
 * No new company, user, context, backup, result cache or business write engine.
 * Exact owned Test membership changes are restored; original driver later revokes
 * and suspends its retained fixture. Atlas staff support selection is a separate
 * authority gate, not inferred from this genuine non-admin business author. */
export async function checkVisualBusinessDashboards(base: string, page: Page, fixture: VisualBusinessDashboardFixture) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence?.features.includes(STUDIO_ANALYTICS_VIEW_FEATURE)) {
    console.log("DEFERRED visual business dashboards: actual current/rollback viewer support is incomplete; no fixture or browser access.");
    return null;
  }
  const releases = dirname(root); assert.equal(basename(root), revision); assert(basename(releases).endsWith("-releases"));
  const current = realpathSync(join(dirname(releases), `${basename(releases).slice(0, -9)}-current`));
  if (base.startsWith("http://127.0.0.1:")) assert.equal(basename(current), evidence.rollbackRevision); else assert.equal(current, root);
  assert.deepEqual(verifyStudioRuntimeFeaturePair(root, join(releases, evidence.rollbackRevision), revision), evidence);
  const health = await fetch(`${base}/api/health/release`); assert(health.ok);
  assert.equal(z.object({ revision: z.string() }).parse(await health.json()).revision, revision,
    "Dashboard checks must target the exact sealed compatible release.");
  assert.notEqual(fixture.organisationId, fixture.foreignOrganisationId);
  assert(fixture.slug.startsWith("studio-check-visual-"));
  for (const grant of requiredGrants) assert(fixture.grantedCapabilities.includes(grant), `Original visual fixture needs ${grant}.`);
  await db.organisation.findFirstOrThrow({ where: { id: fixture.organisationId, slug: fixture.slug,
    kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } });
  await db.organisation.findFirstOrThrow({ where: { id: fixture.foreignOrganisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null,
    isTest: true, slug: { startsWith: "studio-check-visual-" } } });
  await db.user.findFirstOrThrow({ where: { id: fixture.userId, platformAdmin: null, email: { startsWith: "studio-check-", endsWith: "@example.test" } } });
  const scope = { organisationId: fixture.organisationId };
  const membership = await db.membership.findFirstOrThrow({ where: { id: fixture.membershipId, ...scope, userId: fixture.userId, active: true } });
  assert.deepEqual(membership.grantedCapabilities, [...fixture.grantedCapabilities]);
  assert.equal(await db.moduleState.count({ where: { ...scope, moduleId: { in: ["studio", "analytics", "sales"] }, enabled: true, entitled: true } }), 3);
  assert.equal(await db.salesOrder.count({ where: scope }), 1, "Reuse the original real native Sales Order fixture.");
  const affiliations = await db.membership.findMany({ where: { userId: fixture.userId }, orderBy: { id: "asc" } });
  async function fresh(organisationId = fixture.organisationId) {
    const actor = await fixture.freshSession(organisationId), stamp = sessionAuthorityStamp(actor);
    assert(stamp && actor.userId === fixture.userId && actor.organisationId === organisationId
      && stamp.userId === actor.userId && stamp.organisationId === actor.organisationId);
    if (organisationId === fixture.organisationId) assert.equal(actor.membershipId, fixture.membershipId);
    assert(![...actor.capabilities].some(capability => capability.startsWith("atlas."))); return actor;
  }
  await fresh();
  const nativeBefore = await db.salesOrder.findMany({ where: scope, orderBy: { id: "asc" } });
  const marker = randomUUID().slice(0, 8), firstName = `Business overview ${marker}`, savedName = `Order overview ${marker}`;
  const zeroTitle = `Current quotations ${marker}`;
  const firstTitle = `Current orders ${marker}`, secondTitle = `Orders by status ${marker}`;
  let definitionId = "";
  const draft = () => db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId } });
  const definition = () => db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definitionId } });
  const content = async () => businessViewCreateSchema.parse(viewPayloadSchema.parse((await draft()).payload).content);
  const snapshot = async () => ({ definition: await definition(), draft: await draft(),
    versions: await db.studioDefinitionVersion.findMany({ where: { ...scope, definitionId }, orderBy: { version: "asc" } }),
    audits: await db.auditEntry.findMany({ where: { ...scope, entityId: definitionId }, orderBy: { id: "asc" } }),
    native: await db.salesOrder.findMany({ where: scope, orderBy: { id: "asc" } }) });
  async function live() {
    await page.getByRole("button", { name: "Review saved design", exact: true }).click();
    await expect(page.getByText("Saved design reviewed", { exact: true })).toBeVisible();
    const publish = page.getByRole("region", { name: "Publish business dashboard" });
    if (await publish.getByRole("checkbox", { name: "I have reviewed these notes.", exact: true }).count())
      await publish.getByRole("checkbox", { name: "I have reviewed these notes.", exact: true }).check();
    const previous = (await definition()).activeVersionId;
    await page.getByRole("button", { name: "Go live for this business", exact: true }).click();
    await expect.poll(async () => (await definition()).activeVersionId).not.toBe(previous);
    await expect(page.getByRole("link", { name: "Open live dashboard", exact: true })).toBeVisible();
    return (await definition()).activeVersionId!;
  }
  async function view(actor = fresh()) {
    return withFieldRuntimeAuthority(await actor, authority => readPublishedAnalyticsViewInTransaction(authority, { definitionId }));
  }
  const pages: Page[] = [], browserErrors: string[] = [], failedAssets: string[] = [];
  try {
    await page.goto(`${base}/design-studio/dashboards`);
    await page.getByLabel("Dashboard name", { exact: true }).fill(firstName);
    await page.getByLabel("Start with", { exact: true }).selectOption("sales.orders");
    await page.getByRole("button", { name: "Start designing", exact: true }).click();
    await expect(page).toHaveURL(/\/design-studio\/dashboards\/[a-f0-9-]{36}$/);
    definitionId = new URL(page.url()).pathname.split("/").at(-1)!;
    const initial = await draft(); assert.equal(initial.revision, 0); assert.equal((await definition()).activeVersionId, null);
    assert.equal((await content()).widgets[0].metricId, "sales.orders");
    await page.getByLabel("Dashboard name", { exact: true }).fill(savedName);
    await page.getByRole("button", { name: "Configure widget 1", exact: true }).click();
    const inspector = page.getByRole("complementary", { name: "Widget inspector" });
    await inspector.getByLabel("Chart title", { exact: true }).fill(firstTitle);
    await inspector.getByRole("button", { name: "Design", exact: true }).click();
    await inspector.getByRole("button", { name: "Number visual", exact: true }).click();
    await page.getByRole("button", { name: "Add widget", exact: true }).click();
    await page.getByRole("region", { name: "Widget library" }).getByRole("button").filter({ has: page.getByText("Quotations", { exact: true }) }).click();
    await page.getByRole("button", { name: "Configure widget 2", exact: true }).click();
    await inspector.getByLabel("Chart title", { exact: true }).fill(zeroTitle);
    await inspector.getByRole("button", { name: "Design", exact: true }).click();
    await inspector.getByRole("button", { name: "Number visual", exact: true }).click();
    await expect(page.getByRole("button", { name: "Review saved design", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Go live for this business", exact: true })).toBeDisabled();
    const dialog = page.waitForEvent("dialog"), leaving = page.getByRole("button", { name: "← Business dashboards", exact: true }).click();
    const confirmation = await dialog; assert.equal(confirmation.message(), "Leave this dashboard and discard unsaved changes?"); await confirmation.dismiss(); await leaving;
    assert.equal(new URL(page.url()).pathname, `/design-studio/dashboards/${definitionId}`);
    await expect(page.getByLabel("Dashboard name", { exact: true })).toHaveValue(savedName);
    assert.equal((await draft()).revision, initial.revision, "Dirty edits must not silently persist or publish.");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft()).revision).toBe(1);
    await expect(page.getByRole("button", { name: "Review saved design", exact: true })).toBeEnabled();
    const saved = await content(); assert.equal(saved.name, savedName); assert.equal(saved.widgets[0].title, firstTitle); assert.equal(saved.widgets[0].visual, "kpi");
    await page.reload(); await expect(page.getByLabel("Dashboard name", { exact: true })).toHaveValue(savedName);
    // Same existing fixture, no extra records: genuine current inspection and
    // all three deliberate conflict-review choices must remain read-only.
    const beforeComparison = await snapshot(), comparisonTitle = `Unsaved comparison ${marker}`;
    await page.getByRole("button", { name: "Configure widget 1", exact: true }).click();
    await inspector.getByLabel("Chart title", { exact: true }).fill(comparisonTitle);
    await expect(page.getByRole("region", { name: "Dashboard design checks" })).toContainText("Design checked against your current business access.");
    const compare = page.getByRole("button", { name: "Compare saved draft", exact: true });
    const comparison = page.getByRole("dialog", { name: "Compare dashboard designs", exact: true });
    await compare.click(); await expect(comparison).toBeVisible();
    await expect(comparison.getByRole("region", { name: "Current saved draft", exact: true })).toContainText(firstTitle);
    await expect(comparison.getByRole("region", { name: "Your local changes", exact: true })).toContainText(comparisonTitle);
    await comparison.getByRole("button", { name: "Back to my design", exact: true }).click();
    await expect(inspector.getByLabel("Chart title", { exact: true })).toHaveValue(comparisonTitle);
    assert.deepEqual(await snapshot(), beforeComparison, "Continuous check and Back must not save, publish, Audit or mutate native records.");
    await compare.click(); await expect(comparison).toBeVisible();
    await comparison.getByRole("button", { name: "Keep my changes against this saved draft", exact: true }).click();
    await expect(inspector.getByLabel("Chart title", { exact: true })).toHaveValue(comparisonTitle);
    await expect(page.getByRole("button", { name: "Save draft", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Review saved design", exact: true })).toBeDisabled();
    assert.deepEqual(await snapshot(), beforeComparison, "Keep adopts only a local baseline; no automatic merge, save or publication.");
    await compare.click(); await expect(comparison).toBeVisible();
    await comparison.getByRole("button", { name: "Use saved draft", exact: true }).click();
    await page.getByRole("button", { name: "Configure widget 1", exact: true }).click();
    await expect(inspector.getByLabel("Chart title", { exact: true })).toHaveValue(firstTitle);
    await expect(page.getByRole("button", { name: "Review saved design", exact: true })).toBeEnabled();
    assert.deepEqual(await snapshot(), beforeComparison, "Use saved loads the existing design locally; no new persisted effects.");
    const version1 = await live(), first = await view(); assert.equal(first.view.versionId, version1);
    assert.equal(first.content.widgets[0].title, firstTitle);
    assert.equal(first.dataByWidget[first.content.widgets[0].id].points.reduce((sum, point) => sum + point.value, 0), 1);
    const zeroWidget = first.content.widgets.find(widget => widget.metricId === "sales.quotes"); assert(zeroWidget);
    assert.equal(zeroWidget.title, zeroTitle);
    assert.equal(first.dataByWidget[zeroWidget.id].points.reduce((sum, point) => sum + point.value, 0), 0);
    for (const action of ["studio.definition.published", "studio.definition.activated"])
      assert.equal(await db.auditEntry.count({ where: { ...scope, actorUserId: fixture.userId, entityId: definitionId, action } }), 1);
    // Review the actual View-family source and immutable reverse use in the same
    // browser/company. This is metadata navigation, never a measure execution.
    const beforeReference = await snapshot();
    await page.getByRole("button", { name: "Configure widget 1", exact: true }).click();
    const sourceLink = inspector.getByRole("link", { name: "Go to source", exact: true });
    const sourceHref = await sourceLink.getAttribute("href");
    assert(sourceHref?.startsWith("/design-studio/capabilities/") && new URL(sourceHref, base).searchParams.get("family") === "view");
    const sourceOpened = page.waitForEvent("popup"); await sourceLink.click();
    const reference = await sourceOpened; pages.push(reference);
    await expect(reference.getByText("Sales · Approved measure", { exact: true })).toBeVisible();
    await expect(reference.getByText(/This is an approved part of the app/)).toBeVisible();
    await reference.getByRole("navigation", { name: "App reference review" }).getByRole("link", { name: "Where used", exact: true }).click();
    await expect(reference.getByRole("heading", { name: "Saved designs using this app reference", exact: true })).toBeVisible();
    await expect(reference.getByText(savedName, { exact: true })).toBeVisible();
    assert.deepEqual(await snapshot(), beforeReference, "Measure source/usage navigation cannot change metadata, Audit or native records.");
    await reference.close();
    const customer = await page.context().newPage(); pages.push(customer);
    customer.on("pageerror", error => browserErrors.push(error.message));
    customer.on("response", response => { if (response.url().startsWith(base) && /\/_next\/static\//.test(response.url()) && response.status() >= 400) failedAssets.push(`${response.status()}:${response.url()}`); });
    await customer.goto(`${base}/home`); await expect(customer.getByRole("link", { name: savedName, exact: true })).toHaveAttribute("href", `/business-dashboards/${definitionId}`);
    await customer.getByRole("link", { name: savedName, exact: true }).click();
    await expect(customer.getByRole("heading", { name: firstTitle, exact: true })).toBeVisible();
    const chart = customer.locator("section").filter({ has: customer.getByRole("heading", { name: firstTitle, exact: true }) });
    await expect(chart.getByText("1", { exact: true })).toBeVisible();
    const beforeSecondSave = await draft();
    await page.getByRole("button", { name: "Configure widget 1", exact: true }).click();
    await page.getByRole("complementary", { name: "Widget inspector" }).getByLabel("Chart title", { exact: true }).fill(secondTitle);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft()).revision).toBe(beforeSecondSave.revision + 1);
    await expect(page.getByRole("button", { name: "Review saved design", exact: true })).toBeEnabled();
    const version2 = await live(); assert.notEqual(version2, version1);
    const beforeStale = await snapshot();
    await customer.getByRole("button", { name: "Refresh figures", exact: true }).click();
    await expect(customer.getByRole("alert")).toContainText("could not refresh");
    await expect(customer.getByRole("heading", { name: firstTitle, exact: true })).toHaveCount(0);
    assert.deepEqual(await snapshot(), beforeStale, "A stale live head refresh must be read-only and clear its old figures.");
    await customer.reload(); await expect(customer.getByRole("heading", { name: secondTitle, exact: true })).toBeVisible();
    await page.getByText("Previous published designs", { exact: true }).click();
    await page.getByLabel("Choose a design", { exact: true }).selectOption(version1);
    await page.getByRole("checkbox", { name: "Make this previous design live for the business.", exact: true }).check();
    await page.getByRole("button", { name: "Restore selected design", exact: true }).click();
    await expect.poll(async () => (await definition()).activeVersionId).toBe(version1);
    assert.equal(await db.studioDefinitionVersion.count({ where: { ...scope, definitionId } }), 2, "Restore reuses an immutable published version.");
    await customer.reload(); await expect(customer.getByRole("heading", { name: firstTitle, exact: true })).toBeVisible();
    for (const width of [390, 320]) {
      await customer.setViewportSize({ width, height: 850 });
      assert(await customer.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Published dashboard must fit the customer device.");
      const refresh = customer.getByRole("button", { name: "Refresh figures", exact: true });
      await expect(refresh).toBeVisible(); await refresh.scrollIntoViewIfNeeded();
      assert(await refresh.evaluate(element => { const bounds = element.getBoundingClientRect(), hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); return hit === element || !!hit && element.contains(hit); }), "Refresh must be reachable on the customer device.");
    }
    const viewerCaps = ["core.profile.self", "analytics.dashboard.read", "sales.order.read", "sales.quote.read"];
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: viewerCaps } });
    const reader = await fresh(); assert(!reader.capabilities.has("analytics.dashboard.manage") && ![...reader.capabilities].some(cap => cap.startsWith("studio.")));
    await customer.goto(`${base}/home`); await expect(customer.getByRole("link", { name: savedName, exact: true })).toBeVisible();
    await customer.getByRole("link", { name: savedName, exact: true }).click(); await expect(customer.getByRole("heading", { name: firstTitle, exact: true })).toBeVisible();
    const beforeDenied = await snapshot();
    await assert.rejects(() => withStudioAuthoringAuthority(reader, CAP.edit, undefined, authority => saveBusinessViewDraftInTransaction(authority,
      { ...saved, definitionId, revision: 0 })), /FORBIDDEN/);
    await assert.rejects(() => view(fresh(fixture.foreignOrganisationId)), /unavailable|NOT_FOUND|FORBIDDEN/i);
    assert.deepEqual(await snapshot(), beforeDenied);
    await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: viewerCaps.filter(cap => cap !== "sales.order.read") } });
    await assert.rejects(() => view(Promise.resolve(reader)), /FORBIDDEN/); // genuine earlier stamp must refresh revoked source rights
    const omitted = await withFieldRuntimeAuthority(await fresh(), authority => listPublishedBusinessViewsInTransaction(authority));
    assert(!omitted.some(candidate => candidate.definitionId === definitionId));
    await customer.getByRole("button", { name: "Refresh figures", exact: true }).click();
    await expect(customer.getByRole("alert")).toContainText("could not refresh");
    await expect(customer.getByRole("heading", { name: firstTitle, exact: true })).toHaveCount(0);
    await customer.goto(`${base}/home`); await expect(customer.getByRole("link", { name: savedName, exact: true })).toHaveCount(0);
    assert.deepEqual(await snapshot(), beforeDenied, "Source/tenant/authoring denials may not alter versions, Audit or native records.");
    assert.deepEqual(await db.salesOrder.findMany({ where: scope, orderBy: { id: "asc" } }), nativeBefore);
    assert.deepEqual(browserErrors, []); assert.deepEqual(failedAssets, []);
    console.log("PASS visual business dashboards: genuine business-author native chart edit/save/dirty guard/continuous metadata checks/visual comparison Back Keep Use with unchanged snapshots/review/live, Home/current figures, immutable version restore, stale-head clearing, ordinary Read-only customer, independent revoked Sales source and tenant/authoring denial, phone geometry. Limited registered count family; staff support selection, cross-provider snapshots and whole Phase2 completion are not inferred.");
    return { definitionId, version1, version2 };
  } finally {
    try {
      await db.membership.update({ where: { id: membership.id, ...scope, userId: fixture.userId }, data: { grantedCapabilities: membership.grantedCapabilities } });
      assert.deepEqual(await db.membership.findMany({ where: { userId: fixture.userId }, orderBy: { id: "asc" } }), affiliations);
    } finally { await Promise.all(pages.map(owned => owned.close())); }
  }
}
