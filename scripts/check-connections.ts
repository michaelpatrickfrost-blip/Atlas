/** Explicit server acceptance: synthetic Test companies, existing authorised QA staff only. */
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { CONNECTION_TEMPLATES } from "../src/modules/connections/domain/catalogue";
import { csvText } from "../src/core/shared/csv";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_CONNECTIONS_LIVE_TEST === "1", "Explicit server Test acceptance opt-in required.");
  const base = process.env.ATLAS_CONNECTIONS_TEST_URL ?? "https://atlassystem.online";
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  assert(process.env.ATLAS_GUARDIAN_USER_ID && process.env.ATLAS_GUARDIAN_ORGANISATION_ID);
  const membership = await db.membership.findFirstOrThrow({ where: { userId: process.env.ATLAS_GUARDIAN_USER_ID, organisationId: process.env.ATLAS_GUARDIAN_ORGANISATION_ID, active: true }, include: { user: { include: { platformAdmin: true } } } });
  assert(membership.user.platformAdmin?.active, "Existing QA profile must already have independent Atlas staff access.");
  const token = jwt.sign({ userId: membership.userId, organisationId: membership.organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" });
  const suffix = crypto.randomUUID().slice(0, 8);
  const companyIds: string[] = [];
  const browser = await chromium.launch({ headless: true });
  let errors = 0, failedAssets = 0, imports = 0;
  try {
    const a = await db.organisation.create({ data: { name: `Connections acceptance A ${suffix}`, slug: `connections-check-a-${suffix}`, isTest: true } }); companyIds.push(a.id);
    const b = await db.organisation.create({ data: { name: `Connections acceptance B ${suffix}`, slug: `connections-check-b-${suffix}`, isTest: true } }); companyIds.push(b.id);
    await db.moduleState.createMany({ data: ["products", "pricing", "stock", "people", "manufacturing", "sales"].map(moduleId => ({ organisationId: a.id, moduleId, enabled: true, entitled: true })) });
    const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: "atlas_session", value: token, url: base, secure: base.startsWith("https"), httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();
    page.on("pageerror", () => errors++);
    page.on("response", response => { if (new URL(response.url()).pathname.startsWith("/_next/") && response.status() >= 400) failedAssets++; });
    const anon = await browser.newContext({ baseURL: base });
    const blocked = await anon.request.get("/atlas/connections", { maxRedirects: 0 }); assert.equal(blocked.status(), 307);
    const blockedTemplate = await anon.request.get("/api/atlas/connections/template?entity=machines", { maxRedirects: 0 }); assert.equal(blockedTemplate.status(), 307);
    await anon.close(); console.log("PASS anonymous workspace/template protection");
    for (const template of CONNECTION_TEMPLATES) {
      const response = await context.request.get(`/api/atlas/connections/template?entity=${template.id}`);
      assert.equal(response.status(), 200); assert((await response.text()).includes(template.columns.join(",")));
    }
    console.log("PASS all 13 authenticated templates download");
    const submit = async (entity: string, rows?: string[][], apply = true) => {
      const template = CONNECTION_TEMPLATES.find(item => item.id === entity)!;
      await page.goto(`/atlas/connections?company=${a.id}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: template.title, exact: true }).click();
      await page.locator('input[type="file"]').setInputFiles({ name: `${entity}.csv`, mimeType: "text/csv", buffer: Buffer.from(csvText([template.columns, ...(rows ?? [template.example])])) });
      await page.getByRole("button", { name: "Validate & preview", exact: true }).click();
      if (!apply) return;
      await expect(page.getByRole("status")).toContainText("rows validated", { timeout: 30000 });
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: `Attach to ${a.name}`, exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Attached", { timeout: 30000 });
      imports++; console.log(`PASS live upload, review, attach: ${entity}`);
    };
    const customer = CONNECTION_TEMPLATES.find(item => item.id === "customers")!;
    const branch = [...customer.example]; branch[0] = "C-101"; branch[1] = "Acceptance Branch"; branch[3] = "C-100"; branch[4] = "BRANCH";
    await submit("customers", [customer.example, branch]);
    const savedCustomers = await db.party.findMany({ where: { organisationId: a.id }, orderBy: { customerCode: "asc" } }); assert.equal(savedCustomers[1].parentPartyId, savedCustomers[0].id);
    await submit("contacts");
    const product = CONNECTION_TEMPLATES.find(item => item.id === "products")!;
    await submit("products", [product.example, ["SKU-Z", "Zero-rated product", "PRODUCT", "each", "10.00", "GBP", "ZERO_RATED"]]);
    await submit("price-lists"); await submit("prices"); await submit("customer-commercial");
    await submit("warehouses"); await submit("locations"); await submit("employees"); await submit("work-centres"); await submit("machines");
    await submit("sales-orders", [["SO-1001", "C-100", "SKU-100", "10", "", "2026-11-01", "Acceptance"], ["SO-1001", "C-100", "SKU-Z", "2", "", "2026-11-01", "Acceptance"]]);
    await submit("sales-quotes");
    const order = await db.salesOrder.findFirstOrThrow({ where: { organisationId: a.id }, include: { lines: true } });
    assert.equal(order.commercialStatus, "DRAFT"); assert.equal(order.lines.length, 2); assert.equal(order.netAmount, 22250); assert.equal(order.taxAmount, 4050); assert.equal(order.grossAmount, 26300); assert.equal(order.lines.find(line => line.taxCategory === "ZERO_RATED")?.taxAmount, 0);
    const quote = await db.quote.findFirstOrThrow({ where: { organisationId: a.id }, include: { lines: true } }); assert.equal(quote.status, "DRAFT"); assert(quote.lines[0].productId);
    const resource = await db.manufacturingResource.findFirstOrThrow({ where: { organisationId: a.id }, include: { workCentre: true } }); assert.equal(resource.workCentre.code, "PACK"); assert.equal(Number(resource.nominalUnitsPerHour), 120); assert.equal(Number(resource.planningEfficiencyPercent), 85);
    assert.equal(await db.auditEntry.count({ where: { organisationId: a.id, entityType: "Import" } }), 13);
    assert.equal(await db.party.count({ where: { organisationId: b.id } }), 0); assert.equal(await db.product.count({ where: { organisationId: b.id } }), 0);
    console.log("PASS canonical hierarchy, machine links, draft products/pricing/discounts/VAT and company isolation");
    await submit("products", undefined, false);
    await expect(page.getByRole("status")).toContainText("rows validated", { timeout: 30000 }); await page.getByRole("checkbox").check(); await page.getByRole("button", { name: `Attach to ${a.name}`, exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("already attached", { timeout: 30000 }); assert.equal(await db.auditEntry.count({ where: { organisationId: a.id, entityType: "Import" } }), 13);
    console.log("PASS exact-file retry rejected without duplicate audit/records");
    const invalid = [...product.example]; invalid[0] = "ROLLBACK-1"; const bad = [...product.example]; bad[0] = "ROLLBACK-2"; bad[3] = "each"; bad[4] = "not-money";
    await submit("products", [invalid, bad], false); await expect(page.getByRole("alert")).toContainText("Row 3", { timeout: 30000 }); assert.equal(await db.product.count({ where: { organisationId: a.id, code: { startsWith: "ROLLBACK-" } } }), 0);
    console.log("PASS invalid later row creates no partial records");
    await submit("machines", [["MISSING", "Missing machine", "MACHINE", "100", "90"]], false); await expect(page.getByRole("alert")).toContainText("missing", { timeout: 30000 });
    await submit("products", [["REVIEW-SWITCH", "Switch test", "PRODUCT", "each", "1.00", "GBP", "STANDARD"]], false); await expect(page.getByRole("status")).toContainText("rows validated", { timeout: 30000 });
    await page.getByRole("combobox", { name: "Attach records to company" }).selectOption(b.id); await expect(page.getByRole("button", { name: /^Attach to/ })).toHaveCount(0); await expect(page.locator('input[type="file"]')).toHaveValue("");
    console.log("PASS company switch clears review and upload");
    // App gate: company B deliberately has no entitled/enabled apps.
    await page.getByRole("button", { name: "Products & services", exact: true }).click(); await page.locator('input[type="file"]').setInputFiles({ name: "products.csv", mimeType: "text/csv", buffer: Buffer.from(csvText([product.columns, product.example])) }); await page.getByRole("button", { name: "Validate & preview", exact: true }).click(); await expect(page.getByRole("alert")).toContainText("Enable products", { timeout: 30000 });
    console.log("PASS destination entitlement/enablement enforced");
    await page.goto(`/atlas/connections?company=${a.id}`, { waitUntil: "networkidle" }); await expect(page.getByRole("heading", { name: "Company import history" })).toBeVisible(); assert.equal(await page.locator("section").last().locator("tbody tr").count(), 13);
    await page.setViewportSize({ width: 390, height: 844 }); await expect(page.getByRole("heading", { name: "Connections", exact: true })).toBeVisible(); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Mobile document must not overflow horizontally.");
    assert.equal(errors, 0); assert.equal(failedAssets, 0); console.log(`LIVE CONNECTIONS ACCEPTANCE PASSED: ${imports} section imports; zero browser/asset failures; history and mobile layout verified.`);
  } finally {
    await browser.close();
    // Retain audited synthetic business history; suspend only the exact fixture companies.
    await db.organisation.updateMany({ where: { id: { in: companyIds }, isTest: true, slug: { startsWith: "connections-check-" } }, data: { status: "SUSPENDED" } });
    await db.$disconnect(); console.log("Synthetic Test companies suspended; records/audit retained; existing QA identity unchanged.");
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Acceptance failed"); process.exitCode = 1; });
