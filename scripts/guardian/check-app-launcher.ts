/** Read-only acceptance using existing Guardian access; no account or business writes. */
import assert from "node:assert/strict";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { ATLAS_CAPABILITIES } from "../../src/core/admin/access";
import { canOpenModule, getEnabledModuleIds, getNavigableModules } from "../../src/core/modules/runtime";
import { getImplementedModules } from "../../src/core/modules/registry";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_RELEASE_TEST === "1");
  assert(process.env.SESSION_SECRET && process.env.ATLAS_GUARDIAN_USER_ID);
  const base = process.env.ATLAS_RELEASE_TEST_URL ?? "https://atlassystem.online";
  const baseUrl = new URL(base);
  assert((baseUrl.protocol === "https:" && baseUrl.hostname === "atlassystem.online") || (baseUrl.protocol === "http:" && baseUrl.hostname === "127.0.0.1"));
  const membership = await db.membership.findFirstOrThrow({ where: { userId: process.env.ATLAS_GUARDIAN_USER_ID, active: true, organisation: { kind: "INTERNAL", status: "ACTIVE" } }, include: { user: true } });
  const session = await sessionForUser(membership.organisationId, membership.userId);
  assert(session);
  assert(session.capabilities.has(ATLAS_CAPABILITIES.staff), "launcher acceptance requires an active Atlas staff identity");
  const apps = await getNavigableModules(session);
  const accessible = getImplementedModules().filter(module => module.launcherVisible !== false && canOpenModule(session, module));
  const expectedApps = accessible.filter(module => !module.launcherConsolidatedInto || !accessible.some(target => target.id === module.launcherConsolidatedInto));
  const enabledApps = await getEnabledModuleIds(session.organisationId);
  assert(expectedApps.some(module => !enabledApps.has(module.id)), "launcher acceptance requires at least one disabled or unentitled app");
  assert.deepEqual(apps.map(module => module.id), expectedApps.map(module => module.id), "Atlas staff see each authorised launcher, consolidating source owners only when their workspace is accessible");
  const disabledApp = apps.find(module => !enabledApps.has(module.id));
  assert(disabledApp);
  const token = jwt.sign({ userId: membership.userId, organisationId: membership.organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { expiresIn: "10m", algorithm: "HS256" });
  const browser = await chromium.launch();
  let failures = 0;
  try {
    const context = await browser.newContext({ baseURL: base });
    await context.addCookies([{ name: "atlas_session", value: token, url: base, httpOnly: true, secure: baseUrl.protocol === "https:", sameSite: "Lax" }]);
    await context.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", () => failures++);
    page.on("response", response => { if (response.url().includes("/_next/") && response.status() >= 400) failures++; });
    const disabledResponse = await page.goto(disabledApp.rootPath, { waitUntil: "networkidle" });
    assert(disabledResponse && disabledResponse.status() < 500, "Atlas staff must be able to open an app disabled in the internal workspace.");
    await expect(page.locator("main")).not.toContainText(/disabled in your workspace|not enabled for this company/i);
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/`, { waitUntil: "networkidle" });
      await expect(page).toHaveURL(`${base}/home`);
      await expect(page.getByRole("heading", { name: "Your apps", exact: true })).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Apps", exact: true });
      for (const app of apps.filter(app => app.id !== "analytics")) {
        const link = nav.locator(`a[href="${app.rootPath}"]`);
        await expect(link).toHaveCount(1);
        await expect(link.locator(".atlas-launcher-title")).toHaveText(app.name);
      }
      if (apps.some(app => app.id === "analytics")) await expect(page.getByRole("navigation", { name: "Workspace utilities" }).locator('a[href="/analytics"]')).toBeVisible();
      const firstApp = nav.getByRole("link").first();
      const iconSize = await firstApp.locator(".atlas-app-icon svg").evaluate(el => {
        const { width, height } = el.getBoundingClientRect();
        return { width, height };
      });
      assert(iconSize.width >= 24 && iconSize.width <= 28 && iconSize.height === iconSize.width, "Premium launcher icons retain the shared 27px size.");
      const iconTileSize = await firstApp.locator(".atlas-app-icon").evaluate(el => {
        const { width, height } = el.getBoundingClientRect();
        return { width, height };
      });
      assert(iconTileSize.width >= 48 && iconTileSize.width <= 54 && iconTileSize.height === iconTileSize.width, "Launcher tiles use the shared 48px phone / 54px desktop dimensions.");
      assert(await nav.locator("svg").count() >= apps.length);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
      const launcherTop = await nav.evaluate(el => el.getBoundingClientRect().top);
      const attentionTop = await page.getByRole("region", { name: "Needs attention" }).evaluate(el => el.getBoundingClientRect().top);
      assert(launcherTop < attentionTop);
      if (process.env.ATLAS_LAUNCHER_SCREENSHOTS) {
        fs.mkdirSync(process.env.ATLAS_LAUNCHER_SCREENSHOTS, { recursive: true, mode: 0o700 });
        await page.screenshot({ path: `${process.env.ATLAS_LAUNCHER_SCREENSHOTS}/launcher-${width}.png`, fullPage: true });
      }
      await nav.locator('a[href="/profile"]').click();
      await expect(page).toHaveURL(`${base}/profile`);
      const toggle = page.locator('[data-guardian-safe="toggle"]').first();
      await toggle.click(); await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await page.getByRole("navigation", { name: "Apps", exact: true }).getByRole("link", { name: "My work", exact: true }).click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
    assert.equal(failures, 0);
    console.log(`PASS launcher: ${apps.length} authorised module links/icons; desktop/tablet/phone, root landing, no overflow, My work navigation and Apps switching; zero browser/chunk errors. All writes blocked.`);
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
