import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import type { Session } from "../../src/core/auth/session";
import { sessionAuthorityStamp } from "../../src/core/auth/session";
import { db } from "../../src/core/db/client";
import { readStudioRuntimeFeatureEvidence, STUDIO_PAGE_FEATURE } from "../../src/core/studio/runtime-features";
import { saveTemplateForSession } from "../../src/core/templates/authoring";
import { renderTemplate } from "../../src/core/templates/service";
import { parseBlocks } from "../../src/core/templates/domain";
import { withStudioAuthoringAuthority } from "../../src/core/studio/authoring/context";
import { STUDIO_CAPABILITIES as CAP } from "../../src/core/studio/permissions";
import { inspectTemplateDraftInTransaction } from "../../src/core/templates/inspection";

export interface VisualDocumentFixture {
  organisationId: string; foreignOrganisationId: string; orderId: string; orderReference: string;
  customerName: string; membershipId: string; grantedCapabilities: string[];
  freshSession(organisationId?: string): Promise<Session>;
}

/** Nested in the original already-paired visual driver. Reuses its exact Test
 * companies, genuine current author, native Sales order and browser; no new
 * affiliations, fixture records, snapshots on disk or second document engine.
 * Only the original native generator creates its retained business document.
 */
export async function checkVisualDocuments(base: string, page: Page, fixture: VisualDocumentFixture) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  const revision = process.env.ATLAS_RELEASE_REVISION; assert(revision && /^[a-f0-9]{40}$/.test(revision));
  const evidence = readStudioRuntimeFeatureEvidence(process.cwd(), revision);
  if (!evidence?.features.includes(STUDIO_PAGE_FEATURE)) {
    console.log("DEFERRED document visual journey: original compatible visual fixture is not enabled; no data or browser access."); return;
  }
  assert(fixture.organisationId !== fixture.foreignOrganisationId);
  const actor = await fixture.freshSession(); assert(sessionAuthorityStamp(actor)); assert.equal(actor.organisationId, fixture.organisationId);
  assert(![...actor.capabilities].some(capability => capability.startsWith("atlas.")));
  assert(actor.capabilities.has("core.contract.manage") && actor.capabilities.has("sales.order.read"));
  for (const id of [fixture.organisationId, fixture.foreignOrganisationId]) assert(await db.organisation.findFirst({ where: {
    id, kind: "CUSTOMER", isTest: true, status: "ACTIVE", archivedAt: null, slug: { startsWith: "studio-check-visual-" },
  }, select: { id: true } }));
  const scope = { organisationId: fixture.organisationId }, membership = { id: fixture.membershipId, ...scope };
  const originalMembership = await db.membership.findFirstOrThrow({ where: membership });
  assert.equal(originalMembership.userId, actor.userId); assert.equal(originalMembership.active, true);
  assert.deepEqual(originalMembership.grantedCapabilities, fixture.grantedCapabilities);
  const order = await db.salesOrder.findFirstOrThrow({ where: { id: fixture.orderId, ...scope }, select: { id: true, reference: true, party: { select: { name: true } } } });
  assert.equal(order.reference, fixture.orderReference); assert.equal(order.party.name, fixture.customerName);
  const name = `Visual document ${randomUUID().slice(0, 8)}`;
  let second: Page | undefined;
  try {
    await page.goto(`${base}/design-studio/documents/new`);
    await page.getByLabel("Template name", { exact: true }).fill(name);
    // Edit literal text while named business details retain their logical keys.
    await page.getByLabel("Document title", { exact: true }).fill("Prepared order for ");
    await page.getByLabel("Section 1 text", { exact: true }).fill("Prepared for ");
    await page.getByLabel("Choose a detail", { exact: true }).selectOption("customer.name");
    await page.getByRole("button", { name: "Insert in selected section", exact: true }).click();
    await expect(page.getByLabel("Business detail: Customer name", { exact: true }).first()).toBeVisible();
    await page.getByLabel("Custom detail name", { exact: true }).fill("Delivery note");
    await page.getByRole("button", { name: "Add document detail", exact: true }).click();
    await page.getByLabel("Example Delivery note", { exact: true }).fill("Example delivery only");
    await page.getByRole("button", { name: "+ Add section", exact: true }).click();
    await page.getByLabel("Section 4 type", { exact: true }).selectOption("table");
    await page.getByRole("button", { name: "Add table column", exact: true }).click();
    await page.getByRole("button", { name: "Add table row", exact: true }).click();
    for (const [cell, value] of [["1 column 1", "Item"], ["1 column 2", "Notes"], ["2 column 1", "Prepared line"], ["2 column 2", "No native delivery changes"]])
      await page.getByLabel(`Section 4 row ${cell}`, { exact: true }).fill(value);
    const preview = () => page.getByRole("article", { name: "Document preview", exact: true });
    await expect(preview()).toContainText("Example customer"); await expect(preview()).toContainText("Example delivery only");
    await expect(preview().getByRole("cell", { name: "No native delivery changes", exact: true })).toBeVisible();
    const viewport = page.viewportSize();
    for (const width of [390, 320]) { await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Document editor must fit ${width}px without page overflow.`); }
    if (viewport) await page.setViewportSize(viewport);
    assert(await page.evaluate(() => !Array.from(document.querySelectorAll("input:not([type=hidden]),textarea")).some(input => /\{\{(?:customer|record|custom)\./.test((input as HTMLInputElement).value))), "Business keys must be protected chips, not raw editable template text.");
    await page.getByRole("button", { name: "Save template", exact: true }).click();
    await expect(page).toHaveURL(/\/design-studio\/documents\/[a-zA-Z0-9_-]+$/);
    const templateId = new URL(page.url()).pathname.split("/").at(-1)!;
    const template = () => db.documentTemplate.findFirstOrThrow({ where: { ...scope, id: templateId } });
    const saved = await template(); assert.equal(saved.status, "DRAFT"); assert.equal(saved.version, 1);
    assert.equal(saved.titleTemplate, "Prepared order for {{customer.name}}");
    assert.equal(parseBlocks(saved.blocks)[0].text, "Prepared for {{customer.name}}{{custom.delivery_note}}");
    assert(parseBlocks(saved.blocks).some(block => block.type === "table" && block.text.includes("Prepared line")));
    const snapshot = async () => ({ template: await template(), audit: await db.auditEntry.findMany({ where: scope, orderBy: { id: "asc" } }),
      documents: await db.contractDocument.findMany({ where: scope, orderBy: { id: "asc" } }) });
    const beforePreview = await snapshot();
    await page.getByLabel("Template name", { exact: true }).fill("");
    await expect(page.getByRole("region", { name: "Template checks", exact: true })).toContainText("Enter a name and document title.");
    await page.getByLabel("Template name", { exact: true }).fill(name);
    await expect(page.getByRole("region", { name: "Template checks", exact: true })).toContainText("Your template is ready to save");
    assert.deepEqual(await snapshot(), beforePreview, "Continuous document checks cannot save, publish or create an Audit entry.");
    await page.getByRole("button", { name: "Go to source", exact: true }).click();
    const detail = page.getByRole("dialog", { name: "Customer name", exact: true });
    await expect(detail.getByRole("heading", { name: "Customer Master", exact: true })).toBeVisible();
    await expect(detail).not.toContainText(fixture.customerName);
    await detail.getByRole("button", { name: "Where used in this template", exact: true }).click();
    await expect(detail.getByRole("button", { name: "Document title", exact: true })).toBeVisible();
    await expect(detail.getByRole("button", { name: "Section 1 · Heading", exact: true })).toBeVisible();
    await detail.getByRole("button", { name: "Document title", exact: true }).click();
    await expect(page.getByLabel("Document title", { exact: true })).toBeFocused();
    assert.deepEqual(await snapshot(), beforePreview, "Detail source and exact template usage are read-only metadata navigation.");
    await page.getByLabel("Preview content", { exact: true }).selectOption({ label: "Business record" });
    await page.getByLabel("Preview record", { exact: true }).selectOption(`sales/order/${fixture.orderId}`);
    await page.getByRole("button", { name: "Refresh business preview", exact: true }).click();
    await expect(preview()).toContainText(fixture.customerName); await expect(preview()).not.toContainText("Example customer");
    assert.deepEqual(await snapshot(), beforePreview, "Actual source preview must be read-only.");
    await db.membership.update({ where: membership, data: { deniedCapabilities: [...originalMembership.deniedCapabilities, "sales.order.read"] } });
    try {
      await page.getByRole("button", { name: "Refresh business preview", exact: true }).click();
      await expect(page.getByRole("alert").filter({ hasText: /cannot use that source app|access|FORBIDDEN|unavailable/i })).toBeVisible();
      await expect(preview()).toHaveCount(0);
      assert.deepEqual(await snapshot(), beforePreview);
    } finally { await db.membership.update({ where: membership, data: { deniedCapabilities: originalMembership.deniedCapabilities } }); }
    await page.reload();
    second = await page.context().newPage(); await second.goto(page.url());
    await second.getByLabel("Section 1 text", { exact: true }).fill("Unsaved second editor ");
    await page.getByLabel("Status", { exact: true }).selectOption("PUBLISHED");
    await page.getByRole("button", { name: "Save template", exact: true }).click();
    await expect.poll(async () => (await template()).version).toBe(2);
    const published = await template(); assert.equal(published.status, "PUBLISHED"); const beforeStale = await snapshot();
    await second.getByRole("button", { name: "Save template", exact: true }).click();
    await expect(second.getByRole("alert")).toContainText(/CONFLICT|another person changed/i);
    await expect(second.getByLabel("Section 1 text", { exact: true })).toHaveValue("Unsaved second editor ");
    assert.deepEqual(await snapshot(), beforeStale);
    const compare = second.getByRole("button", { name: "Compare with saved template", exact: true });
    const comparison = second.getByRole("dialog", { name: "Compare with saved template", exact: true });
    await compare.click(); await expect(comparison).toBeVisible();
    await expect(comparison.getByRole("region", { name: "Your unsaved template", exact: true })).toContainText("Unsaved second editor");
    await expect(comparison.getByRole("region", { name: "Current saved template", exact: true })).toContainText("Prepared for Example customer");
    await expect(comparison).not.toContainText(fixture.customerName);
    const back = comparison.getByRole("button", { name: "Back to editing", exact: true });
    await expect(back).toBeFocused(); await second.keyboard.press("Shift+Tab");
    await expect(comparison.getByRole("button", { name: "Keep my changes", exact: true })).toBeFocused();
    await second.keyboard.press("Tab"); await expect(back).toBeFocused();
    await second.keyboard.press("Escape"); await expect(comparison).toHaveCount(0); await expect(compare).toBeFocused();
    await expect(second.getByLabel("Section 1 text", { exact: true })).toHaveValue("Unsaved second editor ");
    assert.deepEqual(await snapshot(), beforeStale, "Escape preserves local edits and their old save baseline without writes.");
    await compare.click(); await comparison.getByRole("button", { name: "Keep my changes", exact: true }).click();
    await expect(second.getByLabel("Section 1 text", { exact: true })).toHaveValue("Unsaved second editor ");
    await expect(second.locator('input[name="version"]')).toHaveValue("2");
    assert.deepEqual(await snapshot(), beforeStale, "Keep adopts only the reviewed local baseline, without saving or publishing.");
    await compare.click(); await comparison.getByRole("button", { name: "Use saved template", exact: true }).click();
    await expect(second.getByLabel("Section 1 text", { exact: true })).toHaveValue("Prepared for ");
    await expect(second.getByLabel("Status", { exact: true })).toHaveValue("PUBLISHED");
    assert.deepEqual(await snapshot(), beforeStale, "Use saved only replaces the local editor; existing version and Audit stay unchanged.");
    await second.close(); second = undefined;
    function form(version: number, description: string) {
      const input = new FormData(); for (const [key, value] of Object.entries({ id: templateId, version: String(version), name,
        titleTemplate: published.titleTemplate, status: "PUBLISHED", blocks: JSON.stringify(parseBlocks(published.blocks)), description })) input.set(key, value);
      input.append("targetModules", "sales"); return input;
    }
    const trigger = `studio_document_${randomUUID().replaceAll("-", "")}`;
    assert(/^[a-zA-Z0-9_-]+$/.test(fixture.organisationId)); const beforeFailure = await snapshot();
    try {
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${fixture.organisationId}' AND NEW.action='template.saved' THEN RAISE EXCEPTION 'Exact visual template Audit failure'; END IF; RETURN NEW; END $$;`);
      await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
      await assert.rejects(() => fixture.freshSession().then(session => saveTemplateForSession(session, form(2, "Audit must roll back"))), /Exact visual template Audit failure/);
      assert.deepEqual(await snapshot(), beforeFailure);
    } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    const rendered = await renderTemplate(await fixture.freshSession(), templateId, { sourceModule: "sales", sourceType: "order", sourceId: fixture.orderId,
      values: { "custom.delivery_note": "Exact generated delivery note" } });
    assert.equal(rendered.title, `Prepared order for ${fixture.customerName}`);
    assert.equal(rendered.blocks[0].text, `Prepared for ${fixture.customerName}Exact generated delivery note`);
    await page.goto(`${base}/templates/${templateId}?source=sales/order/${fixture.orderId}`);
    await page.getByLabel(/^delivery note$/i).fill("Exact generated delivery note");
    await page.getByRole("button", { name: "Create draft document", exact: true }).click(); await expect(page).toHaveURL(`${base}/crm/contracts`);
    const documents = await db.contractDocument.findMany({ where: { ...scope, templateId }, orderBy: { id: "asc" } }); assert.equal(documents.length, 1);
    const generated = documents[0]; assert.equal(generated.templateVersion, 2); assert.equal(generated.status, "DRAFT");
    assert.equal(generated.sourceId, fixture.orderId); assert.equal(generated.sourceType, "order"); assert.equal(generated.sourceModule, "sales");
    const pdf = Buffer.from(generated.fileContent!); assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.equal(generated.contentHash, createHash("sha256").update(pdf).digest("hex"));
    assert.deepEqual(generated.templateSnapshot, { name: published.name, version: 2, title: rendered.title, blocks: rendered.blocks });
    assert(generated.bodyHtml.includes(fixture.customerName)); assert(generated.bodyHtml.includes("Exact generated delivery note"));
    await saveTemplateForSession(await fixture.freshSession(), form(2, "Later version preserves original documents")); assert.equal((await template()).version, 3);
    assert.deepEqual(await db.contractDocument.findFirstOrThrow({ where: { ...scope, id: generated.id } }), generated, "Later template saves cannot rewrite the existing PDF or resolved version snapshot.");
    const beforeForeign = await snapshot();
    await assert.rejects(() => fixture.freshSession(fixture.foreignOrganisationId).then(session => withStudioAuthoringAuthority(session, CAP.edit, undefined,
      authority => inspectTemplateDraftInTransaction(authority, form(3, "Foreign inspection denied")))), /unavailable|outside your access|FORBIDDEN/i);
    await assert.rejects(() => fixture.freshSession(fixture.foreignOrganisationId).then(session => saveTemplateForSession(session, form(3, "Foreign denied"))), /CONFLICT/);
    await assert.rejects(() => fixture.freshSession(fixture.foreignOrganisationId).then(session => renderTemplate(session, templateId, { sourceModule: "sales", sourceType: "order", sourceId: fixture.orderId })), /published template/);
    const beforeRevocation = await fixture.freshSession();
    await db.membership.update({ where: membership, data: { deniedCapabilities: [...originalMembership.deniedCapabilities, "core.contract.manage"] } });
    try {
      await assert.rejects(() => withStudioAuthoringAuthority(beforeRevocation, CAP.edit, undefined,
        authority => inspectTemplateDraftInTransaction(authority, form(3, "Revoked inspection denied"))), /FORBIDDEN/i);
    } finally { await db.membership.update({ where: membership, data: { deniedCapabilities: originalMembership.deniedCapabilities } }); }
    assert.deepEqual(await snapshot(), beforeForeign);
    console.log("PASS original document designer: protected friendly details, continuous metadata checks, exact detail source/usage, visual saved/local comparison and keyboard Escape/Back/Keep/Use with unchanged persistence, per-document inputs/table cells/sample+authorised actual preview, current source denial clears prior values, stale editor retention, template Audit atomicity, native generated PDF+version snapshot preserved after later edits, cross-tenant denial. No sharing/signing/email or second template engine.");
    return { templateId };
  } finally {
    const cleanup = await Promise.allSettled([second?.close() ?? Promise.resolve(),
      db.membership.update({ where: membership, data: { grantedCapabilities: originalMembership.grantedCapabilities, deniedCapabilities: originalMembership.deniedCapabilities } })]);
    for (const result of cleanup) if (result.status === "rejected") throw result.reason;
  }
}
