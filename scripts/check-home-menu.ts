/** Read-only acceptance using the existing Guardian QA membership; no records or grants created. */
import assert from "node:assert/strict";
import { mkdtemp, chmod } from "node:fs/promises";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
import { getNavigableModules } from "../src/core/modules/runtime";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_HOME_MENU_CHECK === "1");
  const userId = process.env.ATLAS_GUARDIAN_USER_ID;
  const organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID;
  assert(userId && organisationId && process.env.SESSION_SECRET);
  const session = await sessionForUser(organisationId, userId);
  assert(session, "Existing QA membership must be active.");
  const membership = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId, userId } }, include: { user: true } });
  const token = jwt.sign({ userId, organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "15m" });
  const base = new URL(process.env.ATLAS_HOME_MENU_URL ?? "https://atlassystem.online");
  assert(base.protocol === "https:" || ["localhost", "127.0.0.1"].includes(base.hostname));
  const evidence = await mkdtemp("/tmp/atlas-home-menu-check-");
  await chmod(evidence, 0o700);
  console.log(`Private browser evidence: ${evidence}`);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ baseURL: base.origin });
    await context.addCookies([{ name: "atlas_session", value: token, domain: base.hostname, path: "/", httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
    await context.route("**/*", (route) => ["GET", "HEAD", "OPTIONS"].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    async function assertBusinessBoundary() {
      await expect(page.locator('a[href="/atlas"], a[href^="/atlas/"]')).toHaveCount(0);
      await expect(page.locator('[data-atlas-console="admin"]')).toHaveCount(0);
      assert(!/Atlas Admin|Atlas console/i.test(await page.locator("body").innerText()), "Platform administration stays outside the business interface, including staff support workspaces.");
    }
    const modules = await getNavigableModules(session);
    for (const [name, width, height] of [["desktop", 1448, 1086], ["tablet", 820, 1180], ["phone", 390, 844]] as const) {
      await page.setViewportSize({ width, height });
      const response = await page.goto("/home", { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200);
      await expect(page.getByRole("heading", { name: "Your apps", exact: true })).toBeVisible();
      await assertBusinessBoundary();
      const utilities = page.locator('nav[aria-label="Workspace utilities"]:visible');
      await expect(utilities).toHaveCount(1);
      const utilityHrefs = await utilities.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      assert(utilityHrefs.every((href) => ["/home", "/reports", "/profile#assigned", "/chat", "/settings"].includes(href ?? "")), "Rail only contains utilities.");
      const apps = page.locator('main nav[aria-label="Apps"]');
      for (const app of modules) await expect(apps.locator(`a[href="${app.rootPath}"]`)).toHaveCount(1);
      const overflow = await page.evaluate(() => ({ root: document.documentElement.scrollWidth > innerWidth, main: Array.from(document.querySelectorAll("main")).some((node) => node.scrollWidth > node.clientWidth) }));
      assert(!overflow.root && !overflow.main, `${name} must not overflow horizontally.`);
      assert(await page.locator('img[src="/brand/atlas-mark.png"]').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)));
      await page.screenshot({ path: `${evidence}/home-${name}.png`, fullPage: false });
      console.log(`PASS ${name}: utilities, authorised cards, loaded branding, no overflow.`);
    }
    await page.getByRole("button", { name: /Search apps, people, reports/ }).click();
    await expect(page.getByRole("dialog", { name: "Search Atlas" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Search Atlas" })).toHaveCount(0);
    if (modules.length) {
      await page.locator(`main nav[aria-label="Apps"] a[href="${modules[0].rootPath}"]`).click();
      await page.waitForURL(`**${modules[0].rootPath}`);
      for (const [name, width, height] of [["desktop", 1448, 1086], ["tablet", 820, 1180], ["phone", 390, 844], ["small-phone", 320, 740]] as const) {
        await page.setViewportSize({ width, height });
        const trigger = page.getByRole("button", { name: "Apps", exact: true });
        await trigger.click();
        const panel = page.getByRole("region", { name: "Apps menu", exact: true });
        await expect(panel).toBeVisible();
        await assertBusinessBoundary();
        for (const app of modules) await expect(panel.locator(`a[href="${app.rootPath}"]`)).toHaveCount(1);
        await expect(panel.getByRole("link", { name: "Reports", exact: true })).toHaveCount(1);
        const fit = await panel.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight && node.scrollWidth <= node.clientWidth && document.documentElement.scrollWidth <= innerWidth;
        });
        assert(fit, `${name} Apps panel fits viewport with internal vertical scrolling.`);
        const links = panel.getByRole("link");
        assert(await links.evaluateAll((nodes) => nodes.every((node) => node.getBoundingClientRect().height >= 44)), "Links retain 44px touch targets.");
        await panel.getByRole("heading").first().click();
        await expect(panel).toBeVisible();
        if (name === "desktop") {
          const customers = await panel.getByRole("region", { name: "Customers", exact: true }).boundingBox();
          const more = await panel.getByRole("region", { name: "More", exact: true }).boundingBox();
          const company = await panel.getByRole("region", { name: "Company", exact: true }).boundingBox();
          if (customers && more && company) assert(more.y > customers.y && Math.abs(more.y - company.y) < 2 && company.x > more.x, "More and Company form the second desktop row.");
        }
        await page.screenshot({ path: `${evidence}/apps-menu-${name}.png`, fullPage: false });
        await links.last().focus();
        await page.keyboard.press("Escape");
        await expect(panel).toHaveCount(0);
        await expect(trigger).toBeFocused();
        console.log(`PASS ${name}: grouped Apps, authorised links, viewport fit, touch targets and Escape focus.`);
      }
      await page.getByRole("button", { name: "Apps", exact: true }).click();
      await page.getByRole("button", { name: /Search apps, people, reports/ }).click();
      await expect(page.getByRole("region", { name: "Apps menu", exact: true })).toHaveCount(0);
      await expect(page.getByRole("dialog", { name: "Search Atlas" })).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Apps", exact: true }).click();
      await page.getByRole("region", { name: "Apps menu", exact: true }).getByRole("link", { name: "My work", exact: true }).click();
      await page.waitForURL("**/profile");
      await expect(page.getByRole("region", { name: "Apps menu", exact: true })).toHaveCount(0);
    }
    for (const path of ["/settings?tab=workspace", "/settings?tab=users", "/settings/imports"]) {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200);
      await assertBusinessBoundary();
    }
    const search = await context.request.get("/api/search?q=Atlas%20Admin");
    assert.equal(search.status(), 200);
    const results = (await search.json()).results as Array<{ href: string }>;
    assert(results.every((result) => result.href !== "/atlas" && !result.href.startsWith("/atlas/")), "Business search does not advertise platform tools.");
    const adminResponse = await page.goto("/atlas", { waitUntil: "networkidle" });
    assert.equal(adminResponse?.status(), 200);
    await expect(page.locator('[data-atlas-console="admin"]')).toHaveCount(1);
    assert(await page.locator('a[href="/atlas/connections"]').count() > 0, "Staff Connections remains in the separate console.");
    await expect(page.getByRole("button", { name: "Apps", exact: true })).toHaveCount(0);
    console.log("PASS business Home, Apps, header, settings and search exclude platform tools; staff console retains Connections.");
    console.log("PASS search and existing workspace Apps menu remain usable; all writes blocked.");
    await context.close();
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
