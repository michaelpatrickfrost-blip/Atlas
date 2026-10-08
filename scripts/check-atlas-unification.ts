/** Run on the deployed VPS only. All writes belong to disposable, suspended test tenants. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { db } from "../src/core/db/client";
import type { readAvailability, readOrderChain } from "../src/modules/stock/services/availability";

async function main() {
  assert(process.env.ATLAS_UNIFICATION_LIVE_TEST === "1" && process.env.ATLAS_RUNTIME !== "desktop", "Explicit server-only acceptance required");
  const base = "https://atlassystem.online";
  const suffix = randomBytes(8).toString("hex"), password = randomBytes(24).toString("base64url");
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  const companies: string[] = [], users: string[] = [];
  let checks = 0;
  const check = (value: unknown, label: string) => { assert(value, label); checks++; console.log(`PASS ${label}`); };
  const post = async (name: string, args: unknown[], cookie = "", fields?: Record<string, string>) => {
    const entry = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, value]) => value.exportedName === name);
    assert(entry, `Deployed action ${name}`);
    const headers: Record<string, string> = { Origin: base, "Next-Action": entry[0], Accept: "text/x-component", ...(cookie ? { Cookie: cookie } : {}) };
    let body: string | FormData;
    if (fields) {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.set(`_1_${key}`, value);
      form.set("0", JSON.stringify([...args, "$K1"])); body = form;
    } else { headers["Content-Type"] = "text/plain;charset=UTF-8"; body = JSON.stringify(args); }
    const response = await fetch(base + (name === "loginAction" ? "/login" : "/sales/orders"), { method: "POST", headers, body, redirect: "manual" });
    return { response, body: await response.text() };
  };
  const call = async <T>(name: string, args: unknown[], cookie: string): Promise<T> => {
    const result = await post(name, args, cookie);
    assert(result.response.status < 400 && !/(?:^|\n)\w+:E\{/.test(result.body), `${name} failed (${result.response.status})`);
    const line = result.body.split("\n").find(row => row.startsWith("1:"));
    assert(line, `${name} returned a Flight result`);
    return JSON.parse(line.slice(2)) as T;
  };
  const login = async (email: string) => {
    const result = await post("loginAction", [], "", { email, password });
    const cookie = result.response.headers.get("set-cookie")?.match(/atlas_session=[^;]+/)?.[0];
    assert(cookie, "Normal password sign-in"); return cookie;
  };
  try {
    for (const name of ["inside", "outside"]) {
      const company = await db.organisation.create({ data: { name: `Synthetic Atlas unification ${name} ${suffix}`, slug: `unification-${name}-${suffix}`, isTest: true } });
      companies.push(company.id);
      await db.moduleState.createMany({ data: ["sales", "stock", "logistics", "finance", "products"].map(moduleId => ({ organisationId: company.id, moduleId, enabled: true, entitled: true })) });
    }
    const organisationId = companies[0];
    const makeUser = async (name: string, caps: string[], org = organisationId) => {
      const user = await db.user.create({ data: { name: `Synthetic unification ${name}`, email: `unification-${name}-${suffix}@example.test`, passwordHash: await bcrypt.hash(password, 10) } }); users.push(user.id);
      await db.membership.create({ data: { organisationId: org, userId: user.id, grantedCapabilities: caps } }); return user;
    };
    const caps = ["sales.order.read", "customers.read", "core.products.read", "stock.read", "logistics.fulfilment.read"];
    const viewer = await makeUser("viewer", caps), accountant = await makeUser("accountant", [...caps, "finance.receivables.read"]), outside = await makeUser("outside", caps, companies[1]);
    const viewerCookie = await login(viewer.email), financeCookie = await login(accountant.email), outsideCookie = await login(outside.email);
    const product = await db.product.create({ data: { organisationId, code: "UNIFY", name: "Synthetic availability item", basePriceAmount: 100, baseCurrency: "GBP", unitOfMeasure: "each" } });
    const party = await db.party.create({ data: { organisationId, kind: "COMPANY", name: "Synthetic availability customer", customerCode: "UNIFY" } });
    const warehouse = await db.warehouse.create({ data: { organisationId, code: "UNIFY", name: "Synthetic test warehouse" } });
    await db.inventoryBalance.create({ data: { organisationId, productId: product.id, warehouseId: warehouse.id, quantity: 20 } });
    const order = async (reference: string, quantity: number, commercialStatus: "CONFIRMED" | "CLOSED") => db.salesOrder.create({ data: { organisationId, reference, partyId: party.id, ownerUserId: viewer.id, commercialStatus, lines: { create: { lineNumber: 1, productId: product.id, descriptionSnapshot: product.name, orderedQuantity: quantity, unitPriceAmount: 100, netAmount: quantity * 100 } } }, include: { lines: true } });
    const live = await order("SO-UNIFY-LIVE", 100, "CONFIRMED"), historical = await order("SO-UNIFY-HISTORY", 1000, "CLOSED");
    for (const source of [live, historical]) {
      const quantity = source.id === live.id ? 40 : 1000;
      await db.fulfilmentRequirement.create({ data: { organisationId, reference: `FF-${source.reference}`, salesOrderId: source.id, partyId: party.id, shipTo: {}, sourceEventKey: `unification-${source.id}`, lines: { create: { organisationId, salesOrderLineId: source.lines[0].id, productId: product.id, description: product.name, orderedQuantity: source.lines[0].orderedQuantity, allocatedQuantity: quantity, shippedQuantity: quantity, deliveredQuantity: source.id === live.id ? 10 : 1000 } } } });
    }
    await db.expectedReceipt.create({ data: { organisationId, reference: "RC-UNIFY", sourceType: "PURCHASE", sourceReference: "PO-UNIFY", warehouseId: warehouse.id, expectedOn: new Date("2026-10-20"), lines: { create: { organisationId, productId: product.id, description: product.name, expectedQuantity: 50, receivedQuantity: 20 } } } });
    const entity = await db.financeEntity.create({ data: { organisationId, code: "UNIFY", name: "Synthetic books" } });
    await db.financeDocument.create({ data: { organisationId, entityId: entity.id, kind: "AR_INVOICE", reference: "INV-UNIFY-PRIVATE", title: "Synthetic invoice", creatorUserId: accountant.id, salesOrderId: live.id, currency: "GBP", documentDate: new Date(), lines: { create: { number: 1, salesOrderLineId: live.lines[0].id, productId: product.id, description: product.name, quantity: 10, unitPrice: 100n, net: 1000n, tax: 0n } } } });
    type Picture = Awaited<ReturnType<typeof readAvailability>>;
    type Chain = Awaited<ReturnType<typeof readOrderChain>>;
    const picture = await call<Picture>("readAvailability", [], viewerCookie), row = picture.products.find(item => item.productId === product.id);
    check(row?.openDemand === 60 && row.delivered === 10 && row.shipped === 40, "Historical deliveries do not erase live demand; dispatch removes demand once");
    check(row?.incoming === 30 && row.available === -10 && row.availableNow === 20, "Outstanding receipts affect projection, never on-hand or available-now stock");
    const chain = await call<Chain>("readOrderChain", [live.id], viewerCookie);
    check(chain?.financeVisible === false && chain.invoices.length === 0 && chain.lines[0].invoiced === null, "Order viewer receives no private Finance projection");
    const finance = await call<Chain>("readOrderChain", [live.id], financeCookie);
    check(finance?.financeVisible && finance.invoices[0]?.reference === "INV-UNIFY-PRIVATE" && finance.lines[0].invoiced === 10, "Authorised accountant retains the canonical invoice relationship");
    check(await call<Chain>("readOrderChain", [live.id], outsideCookie) === null, "Cross-tenant order chain is unavailable");
    const foreignPicture = await call<Picture>("readAvailability", [], outsideCookie);
    check(!foreignPicture.products.some(item => item.productId === product.id), "Cross-tenant stock projection excludes the fixture");
    await db.moduleState.update({ where: { organisationId_moduleId: { organisationId, moduleId: "finance" } }, data: { enabled: false } });
    check((await call<Chain>("readOrderChain", [live.id], financeCookie))?.financeVisible === false, "Disabled Finance app suppresses invoice metadata even with capability");
    await db.moduleState.update({ where: { organisationId_moduleId: { organisationId, moduleId: "finance" } }, data: { enabled: true } });
    const anonymous = await post("readOrderChain", [live.id]);
    check(!anonymous.body.includes("INV-UNIFY-PRIVATE") && !anonymous.body.includes("Synthetic availability"), "Anonymous action cannot expose test records");
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch({ headless: true, ...(process.env.ATLAS_CHROMIUM_PATH ? { executablePath: process.env.ATLAS_CHROMIUM_PATH } : {}), args: ["--no-sandbox"] });
    try {
      for (const [cookie, allowed] of [[viewerCookie, false], [financeCookie, true]] as const) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        await context.addCookies([{ name: "atlas_session", value: cookie.slice("atlas_session=".length), url: base, httpOnly: true, secure: true }]);
        const page = await context.newPage(); let errors = 0; page.on("pageerror", () => errors++);
        await page.goto(`${base}/sales/orders/${live.id}`, { waitUntil: "networkidle" });
        await page.getByText("SO-UNIFY-LIVE", { exact: true }).first().waitFor();
        const fulfilmentTab = page.getByRole("tab", { name: "Delivery", exact: true });
        if (await fulfilmentTab.count()) await fulfilmentTab.click();
        const text = await page.locator("body").innerText();
        check(text.includes("Projected stock") && text.includes("INV-UNIFY-PRIVATE") === allowed && errors === 0, `Chromium order chain renders accurate labels and Finance access (${allowed ? "accountant" : "sales"})`);
        await context.close();
      }
    } finally { await browser.close(); }
    console.log(`LIVE ATLAS UNIFICATION ACCEPTANCE PASSED: ${checks} assertions`);
  } finally {
    for (const id of companies) { assert((await db.organisation.findUnique({ where: { id } }))?.isTest); await db.organisation.update({ where: { id }, data: { status: "SUSPENDED" } }); }
    await db.membership.updateMany({ where: { userId: { in: users } }, data: { active: false, grantedCapabilities: [], sessionVersion: { increment: 1 } } });
    await db.user.updateMany({ where: { id: { in: users } }, data: { passwordHash: await bcrypt.hash(randomBytes(32).toString("base64url"), 10), authVersion: { increment: 1 } } });
    await db.$disconnect(); console.log("Synthetic tenants suspended, credentials revoked; central acceptance evidence retained.");
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Unification acceptance failed"); process.exitCode = 1; });
