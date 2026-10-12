import { checkVisualDocuments } from "./check-visual-documents";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { realpathSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join } from "node:path";
import jwt from "jsonwebtoken";
import { expect, type Browser } from "@playwright/test";
import { z } from "zod";
import { db } from "../../src/core/db/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import { encodeWire, decodeWire } from "../../src/core/desktop/wire";
import { STUDIO_CAPABILITIES as CAP } from "../../src/core/studio/permissions";
import { readStudioRuntimeFeatureEvidence, STUDIO_PAGE_FEATURE } from "../../src/core/studio/runtime-features";
import { verifyStudioRuntimeFeaturePair } from "./runtime-feature-probe";
import { withStudioAuthoringAuthority } from "../../src/core/studio/authoring/context";
import { savePageDraftInTransaction, publishPageDraftInTransaction, createPageDraftInTransaction } from "../../src/core/studio/authoring/pages";
import { reconstructPageApprovalsInTransaction } from "../../src/core/studio/pages/server-approvals";
import { createSalesOrderPagePresets } from "../../src/modules/sales/services/studio-page-presets";
import { pagePayloadSchema } from "../../src/core/studio/pages/schema";
import { readActiveCustomerPage } from "../../src/core/studio/pages/customer-gateway";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { designReferenceLinks } from "../../src/core/studio/authoring/reference-links";
import { TICKETING_CAPABILITIES } from "../../src/core/permissions/capabilities";
import { checkVisualRecordLayouts } from "./check-visual-record-layouts";
import { checkVisualBusinessDashboards } from "./check-visual-business-dashboards";
import { checkVisualPageDashboards } from "./check-visual-page-dashboards";

const responseSchema = z.object({ error: z.string().optional(), redirect: z.string().optional(), value: z.unknown().optional() });
const userSelect = { id: true, name: true, email: true, authVersion: true, createdAt: true, updatedAt: true } as const;
const nativeGrants = ["core.profile.self", "customers.read", "customers.create", "sales.order.read", "sales.order.create", "sales.order.price_override"];
const authorGrants = [...nativeGrants, "core.contract.manage", "analytics.dashboard.read", "analytics.dashboard.manage", "sales.quote.read", TICKETING_CAPABILITIES.ticketRead, TICKETING_CAPABILITIES.ticketManage,
  TICKETING_CAPABILITIES.ticketCreate, TICKETING_CAPABILITIES.queueManage, ...Object.values(CAP)];

/** Original BOTH-lock central driver only. Compatibility and target revision
 * precede ANY fixture query. Readiness support is not visual acceptance. Native
 * Party/order use existing authenticated owning actions; all history is retained.
 * Local gate tests mock only disabled/failed pre-fixture boundaries, never a pass.
 */
export async function checkVisualPages(base: string, browser: Browser, managerSyntheticUserId: string, cleanupCompanyIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  const root = realpathSync(process.cwd()), revision = process.env.ATLAS_RELEASE_REVISION;
  assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(root, revision);
  if (!evidence?.features.includes(STUDIO_PAGE_FEATURE)) {
    console.log("DEFERRED visual Page acceptance: structured Pages lack a sealed compatible current/rollback pair; no fixture queries or writes performed.");
    return;
  }
  const releases = dirname(root); assert.equal(basename(root), revision); assert(basename(releases).endsWith("-releases"));
  const current = realpathSync(join(dirname(releases), `${basename(releases).slice(0, -9)}-current`));
  if (base.startsWith("http://127.0.0.1:")) assert.equal(basename(current), evidence.rollbackRevision); else assert.equal(current, root);
  assert.deepEqual(verifyStudioRuntimeFeaturePair(root, join(releases, evidence.rollbackRevision), revision), evidence);
  const health = z.object({ revision: z.string() }).parse(await (await fetch(`${base}/api/health/release`)).json());
  assert.equal(health.revision, revision, "Visual checks must target the exact sealed compatible release.");
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const output = process.env.ATLAS_STUDIO_EVIDENCE;
  assert(output && isAbsolute(output), "The original driver must supply its private release evidence directory for three visual screenshots.");
  const evidenceDirectory = realpathSync(output); assert(statSync(evidenceDirectory).isDirectory());
  assert(evidenceDirectory.includes(revision), "Visual evidence must belong to this release, not a new development copy.");
  const user = await db.user.findFirstOrThrow({ where: { id: managerSyntheticUserId, platformAdmin: null,
    email: { startsWith: "studio-check-", endsWith: "@example.test" } }, select: userSelect });
  const originalMemberships = await db.membership.findMany({ where: { userId: user.id }, orderBy: { id: "asc" } });
  const companies: { id: string; slug: string }[] = [], members: { id: string; organisationId: string; userId: string; sessionVersion: number }[] = [];
  const contexts: Awaited<ReturnType<Browser["newContext"]>>[] = [], browserErrors: string[] = [], failedAssets: string[] = [];
  const marker = randomUUID().slice(0, 8), screenName = `Sales screen acceptance ${marker}`, customerName = `Visual customer ${marker}`;
  try {
    for (const label of ["a", "b"]) {
      const company = await db.organisation.create({ data: { name: `Studio visual business ${label}`, slug: `studio-check-visual-${label}-${randomUUID()}`,
        kind: "CUSTOMER", status: "ACTIVE", isTest: true }, select: { id: true, slug: true } });
      cleanupCompanyIds.push(company.id); companies.push(company);
      assert(await db.organisation.findFirst({ where: { ...company, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } }));
      await db.moduleState.createMany({ data: ["studio", "sales", "tickets", "templates", "analytics"].map(moduleId => ({ organisationId: company.id, moduleId, enabled: true, entitled: true })) });
      members.push(await db.membership.create({ data: { organisationId: company.id, userId: user.id, grantedCapabilities: authorGrants },
        select: { id: true, organisationId: true, userId: true, sessionVersion: true } }));
    }
    const [a, b] = companies, membership = members[0], scope = { organisationId: a.id };
    const fresh = async (organisationId = a.id) => { const session = await sessionForUser(organisationId, user.id); assert(session);
      assert.equal(session.membershipId, members.find(member => member.organisationId === organisationId)!.id);
      assert(![...session.capabilities].some(capability => capability.startsWith("atlas."))); return session; };
    const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 }, acceptDownloads: false }); contexts.push(context);
    const token = jwt.sign({ userId: user.id, organisationId: a.id, authVersion: user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET,
      { algorithm: "HS256", expiresIn: "30m" });
    await context.addCookies([{ name: "atlas_session", value: token, url: base, secure: base.startsWith("https"), httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage(); page.on("pageerror", error => browserErrors.push(error.message));
    page.on("response", response => { if (response.url().startsWith(base) && /\/_next\/static\//.test(response.url()) && response.status() >= 400) failedAssets.push(`${response.status()}:${response.url()}`); });
    await page.goto(`${base}/home`); await expect(page.getByRole("main")).toBeVisible();
    async function call(action: string, args: unknown[]) {
      const body = JSON.stringify({ action, args: await encodeWire(args) });
      const response = await page.evaluate(async value => { const result = await fetch("/api/desktop/action", { method: "POST",
        headers: { "content-type": "application/json", "x-atlas-client": "desktop" }, body: value });
        return { status: result.status, body: await result.json() as unknown }; }, body);
      const parsed = responseSchema.parse(response.body), value = parsed.value === undefined ? undefined : decodeWire(parsed.value as Awaited<ReturnType<typeof encodeWire>>);
      const feedback = z.object({ error: z.string() }).safeParse(value);
      assert(response.status < 400 && !parsed.error && !(feedback.success && feedback.data.error), parsed.error ?? (feedback.success ? feedback.data.error : "Owning action failed."));
      return { value, redirect: parsed.redirect };
    }
    const customer = z.object({ id: z.string() }).parse((await call("src/core/customers/commands:createCustomer", [{ name: customerName, kind: "COMPANY",
      country: "GB", contactFirstName: "", contactSurname: "" }])).value);
    const orderForm = new FormData(); for (const [key, value] of Object.entries({ mode: "order", orderType: "STANDARD", partyId: customer.id,
      customerPoReference: `Visual PO ${marker}`, lines: JSON.stringify([{ type: "TEXT", description: "Real approved visual line", quantity: 2,
        discount: 0, unitAmount: 1234, overrideReason: "Exact visual Test acceptance custom price" }]) })) orderForm.set(key, value);
    const createdOrder = await call("src/modules/sales/services/documents:saveDocument", [{ error: "" }, orderForm]);
    assert(createdOrder.redirect && /^\/sales\/orders\/[a-zA-Z0-9_-]+$/.test(createdOrder.redirect));
    const orderId = createdOrder.redirect.split("/").at(-1)!;
    const order = await db.salesOrder.findFirstOrThrow({ where: { id: orderId, ...scope }, include: { lines: true, party: { select: { name: true } } } });
    assert.equal(order.party.name, customerName); assert.equal(order.lines.length, 1); assert.equal(order.netAmount, 2468);
    assert.equal(await db.salesOrder.count({ where: scope }), 1);
    await page.goto(`${base}/design-studio`);
    await expect(page.getByRole("heading", { name: "Make this business feel like itself.", exact: true })).toBeVisible();
    const create = page.locator("form").filter({ has: page.locator('input[name="layout"][value="sales_order_overview"]') });
    await expect(create).toHaveCount(1); await create.getByLabel("Screen name", { exact: true }).fill(screenName);
    await create.getByRole("button", { name: "Design Sales order", exact: true }).click();
    await expect(page).toHaveURL(/\/design-studio\/[a-f0-9-]{36}$/);
    const definitionId = new URL(page.url()).pathname.split("/").at(-1)!;
    const draft = () => db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId } });
    const definition = () => db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: definitionId } });
    const initial = await draft(); assert.equal(initial.revision, 0); assert.equal((await definition()).activeVersionId, null);
    const properties = page.getByRole("complementary", { name: "Selected item properties" });
    await properties.getByLabel("Display name", { exact: true }).fill("Your order essentials");
    await properties.getByLabel("Helpful description", { exact: true }).fill("Created visually for this business only.");
    await properties.getByLabel("Desktop columns", { exact: true }).selectOption("1");
    await page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: "Select Order items", exact: true }).click();
    await properties.getByRole("button", { name: "Remove Tax amount column", exact: true }).click();
    await properties.getByLabel("Add a column", { exact: true }).selectOption("discount_percent");
    await properties.getByRole("button", { name: "Move Description column down", exact: true }).click();
    await properties.getByLabel("Rows per page", { exact: true }).selectOption("5");
    await expect(page.getByRole("button", { name: "Review & publish", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await draft()).revision).toBe(initial.revision + 1);
    const saved = await draft(), savedPayload = pagePayloadSchema.parse(saved.payload);
    assert.equal(savedPayload.sections[0].label, "Your order essentials"); assert.equal(savedPayload.sections[0].help, "Created visually for this business only.");
    assert.equal(savedPayload.sections[0].columns.desktop, 1); assert.equal((await definition()).activeVersionId, null);
    const itemTable = savedPayload.sections.flatMap(section => section.components).find(component => component.type === "queryList" && component.id === "order_item_list");
    assert(itemTable?.type === "queryList"); assert.equal(itemTable.pageSize, 5);
    assert.deepEqual(itemTable.columns, ["ordered_quantity", "description", "unit_of_measure", "unit_price_amount", "net_amount", "discount_percent"]);
    await page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: "Your order essentials", exact: true }).click();
    await page.getByRole("button", { name: "Choose preview record", exact: true }).click();
    await expect(page.getByLabel("Preview record", { exact: true }).locator(`option[value="${orderId}"]`)).toHaveCount(1);
    await page.getByLabel("Preview record", { exact: true }).selectOption(orderId);
    await page.getByRole("button", { name: "Load actual preview", exact: true }).click();
    const canvas = page.getByRole("region", { name: "Design canvas" });
    await expect(canvas.getByText(customerName, { exact: true })).toBeVisible();
    await expect(canvas.getByText("Real approved visual line", { exact: true })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Preview acknowledgement", exact: true })).toBeDisabled();
    assert.equal(await db.salesOrder.count({ where: scope }), 1, "Design preview may not execute business commands.");
    async function publish() { await expect(page.getByRole("button", { name: "Review & publish", exact: true })).toBeEnabled();
      await page.getByRole("button", { name: "Review & publish", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Make this design live?" }); await expect(dialog).toBeVisible();
      if (await dialog.getByRole("checkbox").count()) await dialog.getByRole("checkbox").check();
      await dialog.getByRole("button", { name: "Go live", exact: true }).click();
      await expect(page.getByText("Your reviewed design is now live for this business.", { exact: true })).toBeVisible(); }
    await publish(); const first = await definition(); assert(first.activeVersionId);
    const firstVersionId = first.activeVersionId;
    // The actual permission-filtered native table choice exposes metadata
    // navigation only. Use the original saved Page and existing browser/tenant,
    // not another fixture or a provider shortcut. No native/metadata writes.
    const referenceBefore = { draft: await draft(), definition: await definition(),
      audit: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      native: await db.salesOrder.findFirstOrThrow({ where: { id: orderId, ...scope }, include: { lines: { orderBy: { id: "asc" } } } }) };
    await page.getByRole("region", { name: "Design canvas" }).getByRole("button", { name: "Select Order items", exact: true }).click();
    const nativeSourceHref = await properties.getByRole("link", { name: "Go to source", exact: true }).getAttribute("href");
    assert(nativeSourceHref?.startsWith("/design-studio/capabilities/"));
    await properties.getByRole("link", { name: "Go to source", exact: true }).click();
    await expect(page.getByText("Sales · Approved record query", { exact: true })).toBeVisible();
    await expect(page.getByText(/This is an approved part of the app/)).toBeVisible();
    await expect(page.getByRole("main").locator("form, textarea")).toHaveCount(0);
    await page.getByRole("navigation", { name: "App reference review" }).getByRole("link", { name: "Where used", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Saved designs using this app reference", exact: true })).toBeVisible();
    await expect(page.getByText(screenName, { exact: true })).toBeVisible();
    assert.deepEqual({ draft: await draft(), definition: await definition(),
      audit: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      native: await db.salesOrder.findFirstOrThrow({ where: { id: orderId, ...scope }, include: { lines: { orderBy: { id: "asc" } } } }) }, referenceBefore);
    const runtimeRequest = { definitionId, request: { kind: "record" as const, recordId: orderId }, formFactor: "desktop" as const };
    assert.equal((await readActiveCustomerPage(await fresh(), runtimeRequest)).versionId, firstVersionId);
    await page.goto(`${base}/screens/${definitionId}?record=${encodeURIComponent(orderId)}`);
    await expect(page.getByRole("heading", { name: "Your order essentials", exact: true })).toBeVisible();
    await expect(page.getByText(customerName, { exact: true })).toBeVisible(); await expect(page.getByText("Real approved visual line", { exact: true })).toBeVisible();
    // The live button passes the actual visible component through the genuine
    // server gateway. Only the existing owning read-only PDF operation executes.
    const nativeBeforeButton = await db.salesOrder.findFirstOrThrow({ where: { id: orderId, ...scope }, include: { lines: { orderBy: { id: "asc" } } } });
    const acknowledgement = page.getByRole("button", { name: "Preview acknowledgement", exact: true });
    await expect(acknowledgement).toBeEnabled();
    const pdfResponse = page.waitForResponse(response => response.url() === `${base}/api/orders/${orderId}/pdf?preview=1`);
    await acknowledgement.click(); const pdf = await pdfResponse;
    assert.equal(pdf.status(), 200); assert.match(pdf.headers()["content-type"] ?? "", /^application\/pdf/);
    // Headless Chromium does not expose its PDF viewer consistently. Confirm the
    // actual browser navigation first, then read the same authenticated native
    // endpoint in memory; no PDF download or duplicated output is saved.
    const pdfDocument = await context.request.get(`/api/orders/${orderId}/pdf?preview=1`);
    assert.equal(pdfDocument.status(), 200); assert.equal((await pdfDocument.body()).subarray(0, 5).toString(), "%PDF-");
    await pdfDocument.dispose();
    assert.deepEqual(await db.salesOrder.findFirstOrThrow({ where: { id: orderId, ...scope }, include: { lines: { orderBy: { id: "asc" } } } }), nativeBeforeButton);
    await page.goto(`${base}/design-studio/${definitionId}`);
    await properties.getByLabel("Display name", { exact: true }).fill("Updated order essentials");
    await page.getByLabel("Previous published design", { exact: true }).selectOption(firstVersionId);
    await page.getByRole("button", { name: "Compare designs", exact: true }).click();
    const comparison = page.getByRole("dialog", { name: "Compare your designs", exact: true });
    await expect(comparison.getByRole("region", { name: "Previous design preview" }).getByRole("heading", { name: "Your order essentials", exact: true })).toBeVisible();
    await expect(comparison.getByRole("region", { name: "Current draft preview" }).getByRole("heading", { name: "Updated order essentials", exact: true })).toBeVisible();
    for (const command of await comparison.getByRole("button", { name: "Preview acknowledgement", exact: true }).all()) await expect(command).toBeDisabled();
    await comparison.getByRole("button", { name: "Back to editing", exact: true }).click();
    await expect(properties.getByLabel("Display name", { exact: true })).toHaveValue("Updated order essentials");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => pagePayloadSchema.parse((await draft()).payload).sections[0].label).toBe("Updated order essentials");
    await publish(); const second = await definition(); assert(second.activeVersionId && second.activeVersionId !== firstVersionId);
    const draftBeforeRestore = await draft();
    await page.getByLabel("Previous published design", { exact: true }).selectOption(firstVersionId);
    await page.getByRole("button", { name: "Restore live design", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Restore this live design", exact: true }).click();
    await expect.poll(async () => (await definition()).activeVersionId).toBe(firstVersionId);
    assert.deepEqual((await draft()).payload, draftBeforeRestore.payload); assert.equal((await draft()).revision, draftBeforeRestore.revision);
    await page.goto(`${base}/screens/${definitionId}?record=${encodeURIComponent(orderId)}`);
    await expect(page.getByRole("heading", { name: "Your order essentials", exact: true })).toBeVisible();
    // Genuine normal list publication and an independent second business layout.
    async function createList(session: Session, name: string, sectionLabel: string) {
      const created = await withStudioAuthoringAuthority(session, CAP.edit, undefined, async authority => {
        const metadata = authority.registry.describePageSourceForEntity(savedPayload.entity).metadata;
        const approvals = await reconstructPageApprovalsInTransaction(authority, { sourcePage: { id: metadata.id, version: metadata.version,
          schemaHash: metadata.schemaHash, contractHash: metadata.contractHash } });
        const layout = createSalesOrderPagePresets(approvals).find(value => value.scope === "list"); assert(layout);
        return createPageDraftInTransaction(authority, { name, payload: { ...layout.page, sections: layout.page.sections.map(section => ({ ...section, label: sectionLabel })) } });
      });
      await withStudioAuthoringAuthority(session, CAP.publish, undefined, authority => publishPageDraftInTransaction(authority,
        { definitionId: created.id, revision: 0, acknowledgeWarnings: true }));
      return created.id;
    }
    const listId = await createList(await fresh(), "Business A order list", "Our current sales orders");
    const foreignId = await createList(await fresh(b.id), "Business B order list", "Business B only");
    await page.goto(`${base}/screens/${listId}`);
    await expect(page.getByRole("heading", { name: "Our current sales orders", exact: true })).toBeVisible();
    await expect(page.getByText(order.reference, { exact: true })).toBeVisible();
    const other = await fresh(b.id);
    await assert.rejects(() => readActiveCustomerPage(other, runtimeRequest), /unavailable/);
    const currentActor = await fresh();
    await assert.rejects(() => readActiveCustomerPage(currentActor, { ...runtimeRequest, definitionId: foreignId }), /unavailable/);
    const independent = await readActiveCustomerPage(other, { definitionId: foreignId, request: { kind: "list" }, formFactor: "phone" });
    assert.equal(independent.model.sections[0].label, "Business B only");
    // Browser stale save retains the user's local design and cannot overwrite a
    // concurrent genuine server save. No client authoring/tenant waiver is used.
    await page.goto(`${base}/design-studio/${definitionId}`);
    const stale = await draft();
    await properties.getByLabel("Display name", { exact: true }).fill("Local unsaved design stays here");
    const concurrent = pagePayloadSchema.parse(stale.payload); concurrent.sections[0].help = "A second saved editor revision";
    await withStudioAuthoringAuthority(await fresh(), CAP.edit, undefined, authority => savePageDraftInTransaction(authority,
      { definitionId, revision: stale.revision, payload: concurrent }));
    const afterConcurrent = await draft();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByText(/Your changes are kept\. The saved draft may have changed/)).toBeVisible();
    await expect(properties.getByLabel("Display name", { exact: true })).toHaveValue("Local unsaved design stays here");
    assert.deepEqual(await draft(), afterConcurrent);
    const snapshot = async () => ({
      definitions: await db.studioDefinition.findMany({ where: scope, orderBy: { id: "asc" } }),
      drafts: await db.studioDraft.findMany({ where: scope, orderBy: { id: "asc" } }),
      versions: await db.studioDefinitionVersion.findMany({ where: scope, orderBy: { id: "asc" } }),
      dependencies: await db.studioDependency.findMany({ where: scope, orderBy: { id: "asc" } }),
      configurations: await db.studioConfigurationDependency.findMany({ where: scope, orderBy: { id: "asc" } }),
      audits: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      orders: await db.salesOrder.findMany({ where: scope, include: { lines: { orderBy: { id: "asc" } } }, orderBy: { id: "asc" } }),
    });
    // Exact new Test tenant's activation Audit failure proves publication, edge,
    // draft, pointer and paired Audits rollback in the original transaction.
    const failure = `studio_visual_audit_${randomUUID().replaceAll("-", "")}`;
    assert(/^[a-zA-Z0-9_-]+$/.test(a.id));
    const beforeFailure = await snapshot(), failureActor = await fresh();
    try {
      await db.$executeRawUnsafe(`CREATE FUNCTION ${failure}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${a.id}' AND NEW.action='studio.definition.activated' THEN RAISE EXCEPTION 'Exact visual Test activation Audit failure'; END IF; RETURN NEW; END $$;`);
      await db.$executeRawUnsafe(`CREATE TRIGGER ${failure} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${failure}();`);
      await assert.rejects(() => withStudioAuthoringAuthority(failureActor, CAP.publish, undefined, authority => publishPageDraftInTransaction(authority,
        { definitionId, revision: afterConcurrent.revision, acknowledgeWarnings: true })), /Exact visual Test activation Audit failure/);
      assert.deepEqual(await snapshot(), beforeFailure);
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${failure} ON audit_entries;`);
      await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${failure}();`);
    }
    const recovered = await withStudioAuthoringAuthority(await fresh(), CAP.publish, undefined, authority => publishPageDraftInTransaction(authority,
      { definitionId, revision: afterConcurrent.revision, acknowledgeWarnings: true }));
    assert.equal((await definition()).activeVersionId, recovered.versionId);
    // Friendly field setup uses the real saved draft and original review/live
    // path. No default feature is assumed and no existing customer field changes.
    await page.goto(`${base}/design-studio/setup`);
    const fieldForm = page.locator("form").filter({ has: page.locator('input[name="kind"][value="field"]') });
    await fieldForm.getByLabel("Display name", { exact: true }).fill(`Visit notes ${marker}`);
    await fieldForm.getByLabel("What kind of detail?", { exact: true }).selectOption("string");
    await fieldForm.getByLabel("Maximum characters", { exact: true }).fill("300");
    await fieldForm.getByRole("checkbox", { name: "Make this detail available in search", exact: true }).check();
    await fieldForm.getByRole("button", { name: "Create field draft", exact: true }).click();
    await expect(page).toHaveURL(/\/design-studio\/setup\/[a-f0-9-]{36}$/);
    const fieldId = new URL(page.url()).pathname.split("/").at(-1)!;
    const fieldDraft = () => db.studioDraft.findFirstOrThrow({ where: { ...scope, definitionId: fieldId } });
    const originalFieldPayload = customFieldPayloadSchema.parse((await fieldDraft()).payload), originalField = originalFieldPayload.field;
    assert.equal(originalField.indexed, true);
    await expect(page.getByRole("checkbox", { name: "Make this detail available in search", exact: true })).toBeChecked();
    await expect(page.getByLabel("Maximum characters", { exact: true })).toHaveValue("300");
    await page.getByLabel("Maximum characters", { exact: true }).fill("500");
    await expect(page.getByRole("button", { name: "Review saved draft", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(async () => (await fieldDraft()).revision).toBe(1);
    const editedFieldPayload = customFieldPayloadSchema.parse((await fieldDraft()).payload), editedField = editedFieldPayload.field;
    assert.equal(editedField.key, originalField.key); assert.equal(editedFieldPayload.storageGeneration, originalFieldPayload.storageGeneration);
    assert.equal(editedField.storage.type, "string");
    if (editedField.storage.type !== "string") throw new Error("The field type changed unexpectedly.");
    assert.equal(editedField.storage.maxLength, 500);
    assert.equal(editedField.indexed, true);
    await page.getByRole("button", { name: "Review saved draft", exact: true }).click();
    await expect(page.getByText("Saved draft reviewed", { exact: true })).toBeVisible();
    await page.getByText("Make this setup live", { exact: true }).click();
    const fieldLive = page.locator("form").filter({ has: page.getByRole("button", { name: "Go live", exact: true }) });
    if (await fieldLive.getByRole("checkbox").count()) await fieldLive.getByRole("checkbox").check();
    await fieldLive.getByRole("button", { name: "Go live", exact: true }).click();
    await expect.poll(async () => (await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: fieldId } })).activeVersionId).not.toBeNull();
    await expect(page.getByLabel("Maximum characters", { exact: true })).toHaveCount(0);
    const liveFieldBefore = await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: fieldId } });
    // Review the actual retained field link without modifying the editor or values.
    const liveFieldVersion = await db.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, id: liveFieldBefore.activeVersionId! } });
    const fieldLinks = designReferenceLinks({ kind: "customField", definitionId: fieldId, versionId: liveFieldVersion.id,
      schemaVersion: liveFieldVersion.schemaVersion, checksum: liveFieldVersion.checksum });
    await page.goto(`${base}${fieldLinks.whereUsedHref}`);
    await expect(page.getByRole("heading", { name: originalField.label, exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Saved references", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to source", exact: true })).toHaveAttribute("href", fieldLinks.sourceHref);
    await page.getByRole("link", { name: "Go to source", exact: true }).click();
    assert.deepEqual(await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: fieldId } }), liveFieldBefore,
      "Source navigation and Where used must not change the field definition.");
    await page.getByRole("link", { name: /Change settings and preview existing values/ }).click();
    await expect(page).toHaveURL(new RegExp(`/design-studio/setup/${fieldId}/change$`));
    await page.getByLabel("Maximum characters", { exact: true }).fill("250");
    await expect(page.getByRole("button", { name: "Preview saved change", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Save new settings", exact: true }).click();
    await expect(page.getByText("New settings saved as a draft. The live field is unchanged.", { exact: true })).toBeVisible();
    const evolutionDraft = await fieldDraft(), evolutionTarget = customFieldPayloadSchema.parse(evolutionDraft.payload);
    assert.equal(evolutionDraft.revision, 2); assert.notEqual(evolutionTarget.storageGeneration, editedFieldPayload.storageGeneration);
    assert.equal(evolutionTarget.field.key, editedField.key); assert.equal(evolutionTarget.field.storage.type, "string");
    if (evolutionTarget.field.storage.type !== "string") throw new Error("Unexpected field conversion target.");
    assert.equal(evolutionTarget.field.storage.maxLength, 250);
    assert.equal(evolutionTarget.field.indexed, true, "Published field evolution must preserve its approved index.");
    assert.equal((await db.studioDefinition.findFirstOrThrow({ where: { ...scope, id: fieldId } })).activeVersionId, liveFieldBefore.activeVersionId);
    await page.getByRole("button", { name: "Preview saved change", exact: true }).click();
    const fieldPreview = page.getByRole("region", { name: "Field change preview" });
    await expect(fieldPreview.getByText("0 records are in scope. This page contains 0 examples.", { exact: true })).toBeVisible();
    await expect(fieldPreview.getByText(/They are not the complete review/)).toBeVisible();
    assert.equal(await db.studioFieldMigrationPreparation.count({ where: { ...scope, definitionId: fieldId } }), 0, "A friendly preview must not persist a review.");
    assert.equal((await fieldDraft()).revision, evolutionDraft.revision);
    await checkVisualDocuments(base, page, { organisationId: a.id, foreignOrganisationId: b.id,
      orderId, orderReference: order.reference, customerName, membershipId: membership.id,
      grantedCapabilities: authorGrants, freshSession: fresh });
    // Current grants are enforced server-side. A configuration cannot turn native
    // Read or authoring back on; customer runtime needs no Studio grants.
    await db.membership.updateMany({ where: membership, data: { grantedCapabilities: nativeGrants } });
    const businessReader = await fresh(); assert(![...businessReader.capabilities].some(value => value.startsWith("studio.")));
    const runtime = await readActiveCustomerPage(businessReader, runtimeRequest); assert.equal(runtime.versionId, recovered.versionId);
    await page.goto(`${base}/home`);
    await expect(page.getByRole("link", { name: screenName, exact: true })).toHaveAttribute("href", `/screens/${definitionId}`);
    await page.getByRole("link", { name: screenName, exact: true }).click();
    const recordChoice = page.getByRole("link", { name: `${order.reference} · ${customerName}`, exact: true });
    await expect(recordChoice).toHaveAttribute("href", `/screens/${definitionId}?record=${orderId}`);
    await recordChoice.click();
    await expect(page.getByText(customerName, { exact: true })).toBeVisible();
    await assert.rejects(() => withStudioAuthoringAuthority(businessReader, CAP.edit, undefined, authority => savePageDraftInTransaction(authority,
      { definitionId, revision: recovered.revision, payload: concurrent })), /FORBIDDEN/);
    await db.membership.updateMany({ where: membership, data: { grantedCapabilities: nativeGrants.filter(value => value !== "sales.order.read") } });
    await assert.rejects(() => readActiveCustomerPage(businessReader, runtimeRequest), /FORBIDDEN/);
    await db.membership.updateMany({ where: membership, data: { grantedCapabilities: authorGrants } });
    await db.moduleState.update({ where: { organisationId_moduleId: { organisationId: a.id, moduleId: "sales" } }, data: { enabled: false } });
    await assert.rejects(() => readActiveCustomerPage(currentActor, runtimeRequest), /unavailable|disabled|DEPENDENCY/);
    await db.moduleState.update({ where: { organisationId_moduleId: { organisationId: a.id, moduleId: "sales" } }, data: { enabled: true } });
    await db.moduleState.update({ where: { organisationId_moduleId: { organisationId: a.id, moduleId: "studio" } }, data: { enabled: false } });
    await assert.rejects(() => withStudioAuthoringAuthority(currentActor, CAP.edit, undefined, authority => savePageDraftInTransaction(authority,
      { definitionId, revision: recovered.revision, payload: concurrent })), /disabled/);
    await db.moduleState.update({ where: { organisationId_moduleId: { organisationId: a.id, moduleId: "studio" } }, data: { enabled: true } });
    await checkVisualRecordLayouts(base, page, { organisationId: a.id, slug: a.slug, userId: user.id,
      membershipId: membership.id, grantedCapabilities: authorGrants, foreignOrganisationId: b.id, freshSession: fresh, call });
    const dashboard = await checkVisualBusinessDashboards(base, page, { organisationId: a.id, slug: a.slug, userId: user.id,
      membershipId: membership.id, grantedCapabilities: authorGrants, foreignOrganisationId: b.id, freshSession: fresh });
    if (dashboard) await checkVisualPageDashboards(base, page, { organisationId: a.id, slug: a.slug, userId: user.id,
      membershipId: membership.id, grantedCapabilities: authorGrants, foreignOrganisationId: b.id, freshSession: fresh,
      pageDefinitionId: definitionId, orderId, dashboard });
    // Screenshots are exactly three, only in the original private release evidence
    // directory. Device canvas width and page geometry are checked, not inferred.
    await page.goto(`${base}/design-studio/${definitionId}`);
    for (const [width, device, formFactor] of [[1440, "Desktop", "desktop"], [820, "Tablet", "tablet"], [390, "Phone", "phone"]] as const) {
      await page.setViewportSize({ width, height: 1000 });
      await page.getByRole("button", { name: `${device} preview`, exact: true }).click();
      await expect(page.locator(`[data-form-factor="${formFactor}"] [data-page-form-factor="${formFactor}"]`)).toBeVisible();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${device} Studio must not overflow the page.`);
      await page.screenshot({ path: join(evidenceDirectory, `visual-studio-${formFactor}.png`), fullPage: false });
      await page.goto(`${base}/screens/${definitionId}?record=${encodeURIComponent(orderId)}`);
      await expect(page.getByText(customerName, { exact: true })).toBeVisible();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${device} customer Page must not overflow.`);
      await page.goto(`${base}/design-studio/${definitionId}`);
    }
    assert.deepEqual(browserErrors, []); assert.deepEqual(failedAssets, []);
    assert.deepEqual(await db.user.findFirstOrThrow({ where: { id: user.id }, select: userSelect }), user);
    assert.deepEqual(await db.membership.findMany({ where: { userId: user.id, organisationId: { notIn: companies.map(company => company.id) } }, orderBy: { id: "asc" } }), originalMemberships);
    assert.equal(await db.salesOrder.count({ where: scope }), 1); assert.equal(await db.salesOrder.count({ where: { organisationId: b.id } }), 0);
    console.log("PASS actual visual Sales Page slice: real preset/canvas/save/review/preview/publish/customer home+record+list, disabled preview commands, genuine live acknowledgement/PDF without native mutation, independent tenant layout, rollback draft retention, stale save retention, current native/authoring/module denial, activation Audit atomic recovery and desktop/tablet/phone geometry+three private evidence screenshots.");
    console.log("LIMIT visual Page slice: Sales uses tenant-level Read, no private Sales filter exists; Ticket private/current-written/reference gates remain separate. Native edit integration requires its owning handler acceptance; this check does not claim complete Phase 2, business dashboard publication or later engines.");
  } finally {
    const cleanup = [
      ...await Promise.allSettled(contexts.map(context => context.close())),
      ...await Promise.allSettled(members.map(member => db.membership.updateMany({ where: member,
        data: { active: false, grantedCapabilities: [], deniedCapabilities: [], sessionVersion: { increment: 1 } } }))),
      ...await Promise.allSettled(companies.map(company => db.organisation.updateMany({ where: { ...company, kind: "CUSTOMER", isTest: true }, data: { status: "SUSPENDED" } }))),
    ];
    const failures = cleanup.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failures.length) throw new AggregateError(failures.map(result => result.reason), "Visual acceptance exact Test cleanup requires original registered-company recovery.");
  }
}
