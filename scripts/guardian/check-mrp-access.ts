/** Opt-in central Test fixtures only; hold both deployment locks and back up first. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect, type BrowserContext, type Page } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { getMaterialShortages } from "../../src/modules/manufacturing/services/mrp-queries";

let phase = "configuration";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_MRP_TEST === "1" && process.env.ATLAS_RUNTIME !== "desktop");
  const base = new URL(process.env.ATLAS_MRP_TEST_URL ?? "https://atlassystem.online");
  assert((base.protocol === "https:" && base.hostname === "atlassystem.online") || (base.protocol === "http:" && base.hostname === "127.0.0.1"));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const release = async () => {
    const response = await fetch(new URL("/api/health/release", base)); assert(response.ok);
    const { revision } = await response.json() as { revision: string };
    assert(/^[a-f0-9]{40}$/.test(revision)); return revision;
  };
  const revision = await release();
  assert.equal(revision, process.env.ATLAS_MRP_TEST_REVISION, "Explicitly pin the tested runtime");
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName?: string }> };
  const actions = Object.entries(manifest.node).filter(([, entry]) => entry.exportedName === "runMrpForm");
  assert.equal(actions.length, 1);
  const actionId = actions[0][0], reproduce = process.argv.includes("--reproduce");
  const prefix = `guardian-mrp-${randomBytes(12).toString("hex")}`;
  const fixtures: { organisationId: string; slug: string; userIds: string[] }[] = [];
  const browser = await chromium.launch({ headless: true });
  let allowedBrowserPosts = 0, blockedPosts = 0, errors = 0;
  try {
    phase = "central disposable fixtures";
    const seeded = await db.$transaction(async tx => {
      const profiles = [];
      for (const mode of ["enabled", "disabled", "unentitled"] as const) {
        const slug = `${prefix}-${mode}`;
        const org = await tx.organisation.create({ data: { name: "Disposable Guardian MRP verification", slug, isTest: true,
          moduleStates: { create: ["manufacturing", "products"].map(moduleId => ({ moduleId, enabled: moduleId !== "manufacturing" || mode !== "disabled", entitled: moduleId !== "manufacturing" || mode !== "unentitled" })) } } });
        const users = [];
        const fixture = { organisationId: org.id, slug, userIds: [] as string[] }; fixtures.push(fixture);
        for (const role of mode === "enabled" ? ["reader", "planner"] : ["planner"]) {
          const user = await tx.user.create({ data: { name: `Guardian MRP ${role}`, email: `${slug}-${role}@example.test`, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) } });
          const caps = ["core.profile.self", "core.products.read", "manufacturing.order.read", "manufacturing.plan.read", ...(role === "planner" ? ["manufacturing.plan.manage"] : [])];
          const member = await tx.membership.create({ data: { organisationId: org.id, userId: user.id, grantedCapabilities: caps } });
          fixture.userIds.push(user.id);
          users.push({ user, token: jwt.sign({ userId: user.id, organisationId: org.id, authVersion: user.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET!, { algorithm: "HS256", expiresIn: "15m" }) });
        }
        profiles.push({ org, users });
      }
      const organisationId = profiles[0].org.id, plannerId = profiles[0].users[1].user.id;
      const parent = await tx.product.create({ data: { organisationId, code: "GUARDIAN-MAKE", name: "Guardian assembly", basePriceAmount: 1000 } });
      const components = [];
      for (const position of [0, 1]) components.push(await tx.product.create({ data: { organisationId, code: `GUARDIAN-PART-${position}`, name: `Guardian component ${position}`, basePriceAmount: 100 } }));
      const centre = await tx.manufacturingWorkCentre.create({ data: { organisationId, code: "GUARDIAN-CENTRE", name: "Guardian assembly centre" } });
      const machine = await tx.manufacturingResource.create({ data: { organisationId, workCentreId: centre.id, name: "Guardian assembly machine" } });
      await tx.manufacturingShift.create({ data: { organisationId, workCentreId: centre.id, resourceId: machine.id, startMinute: 540, endMinute: 1020, crewCount: 2 } });
      await tx.productDefinition.create({ data: { organisationId, productId: parent.id, version: 1, status: "ACTIVE", supply: "MAKE", batchQuantity: 10, yieldPercent: 100, createdByUserId: plannerId,
        lines: { create: components.map((component, position) => ({ organisationId, componentProductId: component.id, quantityPerUnit: position + 1, position })) },
        operations: { create: { organisationId, name: "Guardian assembly operation", position: 0, setupMinutes: 30, runMinutesPerUnit: 6, crewSize: 2, workCentreId: centre.id, resourceId: machine.id } } } });
      const now = new Date(), due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 9));
      await tx.manufacturingDemandForecast.create({ data: { organisationId, productId: parent.id, periodStart: due, quantity: 10, createdByUserId: plannerId, notes: "Guardian synthetic forecast" } });
      const historical = await tx.manufacturingPlanningRun.create({ data: { organisationId, triggeredByUserId: plannerId, startedAt: new Date(+now - 60000), finishedAt: new Date(+now - 59000), productCount: 1, suggestionCount: 1 } });
      await tx.manufacturingSupplySuggestion.create({ data: { organisationId, runId: historical.id, productId: parent.id, kind: "MAKE", quantity: 10, neededBy: due, startBy: new Date(+due - 3600000), pegging: {
        demand: [{ sourceType: "FORECAST", sourceId: parent.id, label: "Guardian synthetic forecast", quantity: 10 }],
        operations: [{ sequence: 0, name: "Guardian assembly operation", start: new Date(+due - 3600000).toISOString(), end: due.toISOString(), durationMinutes: 90, setupMinutes: 30, runMinutes: 60, crewSize: 2, resourceName: machine.name, workCentreName: centre.name }],
        materials: components.map((component, position) => ({ productId: component.id, productName: component.name, productCode: component.code, quantity: (position + 1) * 10, onHand: 0, covered: 0, shortage: (position + 1) * 10, requiredBy: new Date(+due + (1 - position) * 86400000).toISOString() })),
        hours: { setup: 0.5, run: 1, crew: 3 }, batchCount: 1,
      } } });
      return { profiles, parent, components, centre, machine, historical };
    }, { timeout: 30000 });
    const orgId = seeded.profiles[0].org.id;
    const planSnapshot = async (organisationId: string) => JSON.stringify(await Promise.all([
      db.manufacturingPlanningRun.findMany({ where: { organisationId }, orderBy: { id: "asc" } }),
      db.manufacturingSupplySuggestion.findMany({ where: { organisationId }, orderBy: { id: "asc" } }),
    ]));
    const otherState = async () => JSON.stringify(await Promise.all(seeded.profiles.flatMap(({ org }) => {
      const where = { organisationId: org.id };
      return [db.product.findMany({ where, orderBy: { id: "asc" } }), db.productDefinition.findMany({ where }), db.productBomLine.findMany({ where, orderBy: { id: "asc" } }), db.productOperation.findMany({ where }),
        db.manufacturingDemandForecast.findMany({ where }), db.manufacturingWorkCentre.findMany({ where }), db.manufacturingResource.findMany({ where }), db.manufacturingShift.findMany({ where }),
        db.manufacturingOrder.findMany({ where }), db.manufacturingWorkOrder.findMany({ where }), db.inventoryBalance.findMany({ where }), db.inventoryMovement.findMany({ where }),
        db.auditEntry.findMany({ where }), db.domainOutbox.findMany({ where }), db.financeDocument.findMany({ where }), db.salesOrder.findMany({ where })];
    })));
    const unchanged = await otherState();
    const history = JSON.stringify(await db.manufacturingPlanningRun.findUnique({ where: { id: seeded.historical.id }, include: { suggestions: true } }));

    phase = "original saved-date failure";
    if (process.env.ATLAS_MRP_LEGACY_REVISION) {
      const legacy = process.env.ATLAS_MRP_LEGACY_REVISION; assert(/^[a-f0-9]{40}$/.test(legacy));
      const root = `/opt/atlas-releases/${legacy}`; assert.equal(readFileSync(`${root}/.atlas-ready`, "utf8").trim(), legacy);
      const oldQueries = await import(pathToFileURL(`${root}/src/modules/manufacturing/services/mrp-queries.ts`).href) as { getMaterialShortages: (id: string) => Promise<unknown> };
      await assert.rejects(() => oldQueries.getMaterialShortages(orgId), error => error instanceof TypeError && error.message.includes("requiredDate.getTime is not a function"));
      console.log("REPRODUCED original persisted JSON-date TypeError with the retained source; no legacy web server started.");
    }
    const shortages = await getMaterialShortages(orgId);
    assert.deepEqual(shortages.map(row => row.productId), [seeded.components[1].id, seeded.components[0].id]);
    assert(shortages.every(row => row.requiredDate instanceof Date));

    const context = async (profile: typeof seeded.profiles[0]["users"][0], allowRun: boolean): Promise<BrowserContext> => {
      const ctx = await browser.newContext({ baseURL: base.origin });
      await ctx.addCookies([{ name: "atlas_session", value: profile.token, url: base.origin, httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
      await ctx.route("**/*", route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== base.origin) return route.abort();
        if (url.pathname === "/api/guardian/telemetry") return route.fulfill({ status: 204 });
        if (["GET", "HEAD"].includes(request.method())) return route.continue();
        if (allowRun && request.method() === "POST" && url.pathname === "/manufacturing/planning" && request.headers()["next-action"] === actionId) { allowedBrowserPosts++; return route.continue(); }
        blockedPosts++; return route.abort();
      });
      ctx.on("page", page => page.on("pageerror", () => errors++)); return ctx;
    };
    const reader = await context(seeded.profiles[0].users[0], false), planner = await context(seeded.profiles[0].users[1], true);
    const page = await planner.newPage(), readPage = await reader.newPage();
    const view = async (page: Page, path: string, heading: string) => {
      phase = `render ${path}`;
      const response = await page.goto(path, { waitUntil: "networkidle" }); assert(response?.ok());
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      assert(!(await page.locator("body").innerText()).includes("Something went wrong."));
    };
    phase = "saved central planning pages and product links";
    await view(page, "/manufacturing/planning", "Production planning");
    await expect(page.getByRole("link", { name: seeded.parent.name, exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: "Open planned orders", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Planned orders", exact: true })).toBeVisible();
    await expect(page.getByText("Guardian assembly operation", { exact: true })).toBeVisible();
    await expect(page.getByText(seeded.machine.name, { exact: false })).toBeVisible();
    for (const product of [seeded.parent, ...seeded.components]) {
      await page.locator(`main a[href="/products/${product.id}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
      await expect(page.getByRole("heading", { name: product.name, exact: true })).toBeVisible();
      await view(page, "/manufacturing/planning/planned-orders", "Planned orders");
    }
    await view(page, "/manufacturing/planning/shortages", "Shortages");
    assert.deepEqual(await page.locator("tbody tr td:first-child a").allTextContents(), [seeded.components[1].name, seeded.components[0].name]);
    for (const row of shortages) await expect(page.locator("tbody tr").filter({ has: page.getByRole("link", { name: row.productName, exact: true }) })).toContainText(row.requiredDate.toLocaleDateString("en-GB"));
    console.log("PASS saved proposals, operation/machine, chronological shortage dates and three real product links.");

    phase = "direct denied Server Actions";
    await view(readPage, "/manufacturing/planning", "Production planning");
    assert.equal(await readPage.getByRole("button", { name: "Run MRP", exact: true }).count(), 0);
    const deniedContexts = [reader, await context(seeded.profiles[1].users[0], false), await context(seeded.profiles[2].users[0], false)];
    for (const [index, ctx] of deniedContexts.entries()) {
      const organisationId = seeded.profiles[index].org.id, before = await planSnapshot(organisationId);
      const count = await db.manufacturingPlanningRun.count({ where: { organisationId } });
      // APIRequestContext is not covered by browser route interception. This one explicit
      // POST is authorised only for the newly created Test company/profile above.
      const response = await ctx.request.post("/manufacturing/planning", { headers: { "Next-Action": actionId, Accept: "text/x-component", "Content-Type": "text/plain;charset=UTF-8", Origin: base.origin }, data: "[]" });
      const body = await response.text();
      if (reproduce) {
        assert(response.ok()); assert(!body.includes('"digest"'));
        assert.equal(await db.manufacturingPlanningRun.count({ where: { organisationId } }), count + 1);
        const created = await db.manufacturingPlanningRun.findFirstOrThrow({ where: { organisationId }, orderBy: { startedAt: "desc" } });
        assert.equal(created.triggeredByUserId, index === 0 ? seeded.profiles[0].users[0].user.id : seeded.profiles[index].users[0].user.id);
      } else {
        assert(body.includes('"digest"') || response.status() >= 400, "Direct action must reject");
        assert.equal(await planSnapshot(organisationId), before, "Rejected action preserves exact runs and suggestions");
      }
      console.log(`${reproduce ? "REPRODUCED forbidden central write" : "PASS direct rejection and exact unchanged planning state"}: ${["read-only", "disabled app", "unentitled app"][index]}`);
    }
    phase = "actual authorised Run MRP button";
    await view(page, "/manufacturing/planning", "Production planning");
    phase = "authorised button and central run";
    const count = await db.manufacturingPlanningRun.count({ where: { organisationId: orgId } });
    const form = page.getByRole("button", { name: "Run MRP", exact: true }).locator("xpath=ancestor::form");
    await form.getByRole("button", { name: "Run MRP", exact: true }).click();
    await expect(form.getByRole("status")).toHaveText("Saved.");
    assert.equal(allowedBrowserPosts, 1, "One intentional button POST; no replay");
    assert.equal(await db.manufacturingPlanningRun.count({ where: { organisationId: orgId } }), count + 1);
    const run = await db.manufacturingPlanningRun.findFirstOrThrow({ where: { organisationId: orgId }, orderBy: { startedAt: "desc" }, include: { suggestions: true } });
    assert.equal(run.triggeredByUserId, seeded.profiles[0].users[1].user.id); assert(run.finishedAt);
    assert.equal(run.suggestionCount, run.suggestions.length);
    const make = run.suggestions.find(row => row.productId === seeded.parent.id && row.kind === "MAKE"); assert(make); assert.equal(Number(make.quantity), 10);
    const detail = make.pegging as unknown as { materials: { productId: string; quantity: number; requiredBy: string }[]; operations: { start: null; end: null; resourceId: string; durationMinutes: number }[] };
    assert.equal(detail.materials.length, 2); assert.equal(detail.operations.length, 1);
    for (const [position, component] of seeded.components.entries()) {
      const material = detail.materials.find(row => row.productId === component.id); assert(material);
      assert.equal(material.quantity, (position + 1) * 10); assert.equal(typeof material.requiredBy, "string"); assert(Number.isFinite(Date.parse(material.requiredBy)));
      assert(run.suggestions.some(row => row.productId === component.id && row.kind === "BUY" && Number(row.quantity) === (position + 1) * 10));
    }
    assert.equal(detail.operations[0].resourceId, seeded.machine.id);
    // MRP proposals have routing duration but no committed schedule. Existing
    // historical proposals above separately exercise ISO operation-date decoding.
    assert.equal(detail.operations[0].durationMinutes, 90);
    assert.equal(detail.operations[0].start, null); assert.equal(detail.operations[0].end, null);
    await page.reload({ waitUntil: "networkidle" }); await expect(page.getByRole("heading", { name: "Production planning", exact: true })).toBeVisible();
    if (reproduce) {
      phase = "original newly saved proposal failure";
      const response = await page.goto("/manufacturing/planning/planned-orders", { waitUntil: "networkidle" });
      assert(response && response.status() >= 400);
      await expect(page.getByText("Something went wrong.", { exact: true })).toBeVisible();
      console.log("REPRODUCED newly generated demand-field mismatch: central run saved, Planned orders returns generic failure.");
    } else {
      await view(page, "/manufacturing/planning/planned-orders", "Planned orders");
      await expect(page.getByText("Guardian assembly operation", { exact: true })).toBeVisible();
      await expect(page.getByText("Guardian synthetic forecast · 10", { exact: true }).first()).toBeVisible();
    }
    await view(page, "/manufacturing/planning/shortages", "Shortages"); assert.equal(await page.locator("tbody tr").count(), 2);
    for (const [position, component] of seeded.components.entries()) {
      const row = page.locator("tbody tr").filter({ has: page.locator(`a[href="/products/${component.id}"]`) });
      await expect(row.locator("td").nth(1)).toHaveText(String((position + 1) * 10 * (reproduce ? 2 : 1)));
      await expect(row.locator("td").nth(3)).toHaveText(String((position + 1) * 10 * (reproduce ? 2 : 1)));
      if (!reproduce) await expect(row.getByRole("link", { name: component.name, exact: true })).toBeVisible();
    }
    console.log(reproduce ? "REPRODUCED doubled component need/shortage after BUY proposals were added to the same BOM requirement." : "PASS exact shortage quantities and canonical component names; BUY supply is not counted again as demand.");
    assert.equal(await otherState(), unchanged, "Inputs, versions, orders, stock, finance, audit and outbox unchanged in every fixture company");
    assert.equal(JSON.stringify(await db.manufacturingPlanningRun.findUnique({ where: { id: seeded.historical.id }, include: { suggestions: true } })), history, "Historical planning run and suggestions preserved");
    if (!reproduce) assert.equal(errors, 0, "No browser runtime errors on valid workflows"); assert.equal(await release(), revision);
    console.log(`PASS real Run MRP creates one correctly scoped central run, MAKE/BUY quantities, machine/routing and material dates; historical/input/order/stock/Finance/audit/outbox records preserved. Blocked ${blockedPosts} background writes.`);
    if (!reproduce) console.log("PASS connected proposal/shortage pages reload with correct forecast label/quantity; zero browser errors.");
    console.log(reproduce ? "MRP ORIGINAL AUTHORIZATION REPRODUCTION PASSED." : "MRP ACCESS AND SAVED-DATE WORKFLOW PASSED.");
  } finally {
    await browser.close();
    for (const fixture of fixtures) await db.$transaction(async tx => {
      const org = await tx.organisation.findFirst({ where: { id: fixture.organisationId, slug: fixture.slug, isTest: true } }); if (!org) return;
      await tx.organisation.update({ where: { id: org.id }, data: { status: "SUSPENDED", name: "Retired Guardian MRP verification" } });
      await tx.membership.updateMany({ where: { organisationId: org.id }, data: { active: false, grantedCapabilities: [], sessionVersion: { increment: 1 } } });
      await tx.user.updateMany({ where: { id: { in: fixture.userIds } }, data: { authVersion: { increment: 1 } } });
    });
    await db.$disconnect(); console.log("Exact disposable Test companies suspended and synthetic sessions revoked; central history retained.");
  }
}
main().catch(error => { const line = error instanceof Error ? /check-mrp[^\n]*?:(\d+):\d+/.exec(error.stack ?? "")?.[1] : undefined; console.error(`MRP verification failed at ${phase} (${error instanceof Error ? error.name : "UnknownError"}, check line ${line ?? "unknown"}); inspect securely. No private records or credentials logged.`); process.exitCode = 1; });
