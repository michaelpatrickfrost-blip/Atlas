/** Read-only release continuity probe using the already authorised Guardian QA profile. */
import assert from "node:assert/strict";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { ATLAS_CAPABILITIES } from "../../src/core/admin/access";
import { canOpenModule, getEnabledModuleIds, getNavigableModules } from "../../src/core/modules/runtime";
import { getImplementedModules } from "../../src/core/modules/registry";
import { responseOutcome } from "./response-check";

let phase = "configuration";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_RELEASE_TEST === "1");
  const base = new URL(process.env.ATLAS_RELEASE_TEST_URL ?? "https://atlassystem.online");
  assert((base.protocol === "https:" && base.hostname === "atlassystem.online") || (base.protocol === "http:" && base.hostname === "127.0.0.1"));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  assert(process.env.ATLAS_GUARDIAN_ORGANISATION_ID && process.env.ATLAS_GUARDIAN_USER_ID);
  const membership = await db.membership.findFirstOrThrow({ where: { organisationId: process.env.ATLAS_GUARDIAN_ORGANISATION_ID, userId: process.env.ATLAS_GUARDIAN_USER_ID, active: true }, include: { user: true } });
  const session = await sessionForUser(membership.organisationId, membership.userId);
  assert(session);
  assert(session.capabilities.has(ATLAS_CAPABILITIES.staff), "release acceptance requires an active Atlas staff identity");
  const apps = await getNavigableModules(session);
  const expectedApps = getImplementedModules().filter(module => module.launcherVisible !== false && canOpenModule(session, module));
  const enabledApps = await getEnabledModuleIds(session.organisationId);
  assert(expectedApps.some(module => !enabledApps.has(module.id)), "release acceptance requires at least one disabled or unentitled app");
  assert.deepEqual(apps.map(module => module.id), expectedApps.map(module => module.id), "Atlas staff should see every implemented app they can access");
  const disabledApp = apps.find(module => !enabledApps.has(module.id));
  assert(disabledApp);
  const token = jwt.sign({ userId: membership.userId, organisationId: membership.organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" });
  const browser = await chromium.launch({ headless: true });
  let errors = 0, assets = 0, pages = 0, toggles = 0;
  try {
    const context = await browser.newContext({ baseURL: base.origin });
    await context.addCookies([{ name: "atlas_session", value: token, url: base.origin, httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
    await context.route("**/*", route => {
      const request = route.request();
      if (!['GET', 'HEAD'].includes(request.method())) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", () => errors++);
    page.on("response", response => { if (new URL(response.url()).pathname.startsWith("/_next/") && response.status() >= 400) assets++; });
    page.on("requestfailed", request => { if (["script", "stylesheet"].includes(request.resourceType())) assets++; });
    const duration = Number(process.env.ATLAS_RELEASE_TEST_SECONDS ?? "180"); assert(duration >= 1 && duration <= 900);
    const until = Date.now() + duration * 1000;
    do {
      phase = "Atlas staff launcher";
      const launcherResponse = await page.goto("/home", { waitUntil: "networkidle", timeout: 30_000 }); assert(launcherResponse);
      assert.equal(responseOutcome(launcherResponse.status(), await launcherResponse.text()), "http-render-pass", "Atlas staff launcher must render.");
      const launcher = page.getByRole("navigation", { name: "Apps", exact: true });
      await expect(launcher).toBeVisible();
      for (const app of apps) await expect(launcher.getByRole("link", { name: app.name, exact: true })).toHaveAttribute("href", app.rootPath);
      phase = `disabled app navigation ${disabledApp.rootPath}`;
      const appResponse = await page.goto(disabledApp.rootPath, { waitUntil: "networkidle", timeout: 30_000 }); assert(appResponse);
      assert.equal(responseOutcome(appResponse.status(), await appResponse.text()), "http-render-pass", "Atlas staff must be able to open an app disabled for the company.");
      await expect(page.locator("main")).not.toContainText(/disabled in your workspace|not enabled for this company/i);
      for (const path of ["/finance", "/logistics", "/manufacturing", "/service/queries", "/service/reports"]) {
        phase = `navigation ${path}`;
        const response = await page.goto(path, { waitUntil: "networkidle", timeout: 30_000 }); assert(response);
        assert.equal(responseOutcome(response.status(), await response.text()), "http-render-pass", "Original release page must render its authorised workspace.");
        await expect(page.locator("main")).toBeVisible();
        phase = `Apps toggle ${path}`;
        const menu = page.locator('[data-guardian-safe="toggle"]').first();
        await expect(menu).toBeVisible(); await menu.click(); await expect(menu).toHaveAttribute("aria-expanded", "true");
        await menu.click(); await expect(menu).toHaveAttribute("aria-expanded", "false"); pages++; toggles++;
      }
      if (process.env.ATLAS_RELEASE_TEST_READY) fs.writeFileSync(process.env.ATLAS_RELEASE_TEST_READY, `${pages}\n`, { mode: 0o600 });
      if (process.env.ATLAS_RELEASE_TEST_STOP && fs.existsSync(process.env.ATLAS_RELEASE_TEST_STOP)) break;
    } while (Date.now() < until);
    phase = `final counts pages=${pages} toggles=${toggles} browserErrors=${errors} assetFailures=${assets}`;
    assert.equal(errors, 0); assert.equal(assets, 0); assert(pages >= 5 && toggles === pages);
    console.log(`PASS release continuity: ${pages} rendered page requests and ${toggles} Apps toggles; zero browser/chunk failures. All business writes blocked.`);
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(`Release continuity failed (${error instanceof Error ? error.name : "UnknownError"}); phase: ${phase}; inspect securely without logging private data.`); process.exitCode = 1; });
