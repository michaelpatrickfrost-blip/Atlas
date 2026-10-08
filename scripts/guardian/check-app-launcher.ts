/** Read-only acceptance using existing Guardian access; no account or business writes. */
import assert from "node:assert/strict";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { getNavigableModules } from "../../src/core/modules/runtime";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_RELEASE_TEST === "1");
  assert(process.env.SESSION_SECRET && process.env.ATLAS_GUARDIAN_USER_ID && process.env.ATLAS_GUARDIAN_ORGANISATION_ID);
  const base = "https://atlassystem.online";
  const membership = await db.membership.findFirstOrThrow({ where: { userId: process.env.ATLAS_GUARDIAN_USER_ID, organisationId: process.env.ATLAS_GUARDIAN_ORGANISATION_ID, active: true }, include: { user: true } });
  const session = await sessionForUser(membership.organisationId, membership.userId);
  assert(session);
  const apps = await getNavigableModules(session);
  const token = jwt.sign({ userId: membership.userId, organisationId: membership.organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { expiresIn: "10m", algorithm: "HS256" });
  const browser = await chromium.launch();
  let failures = 0;
  try {
    const context = await browser.newContext({ baseURL: base });
    await context.addCookies([{ name: "atlas_session", value: token, url: base, httpOnly: true, secure: true, sameSite: "Lax" }]);
    await context.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", () => failures++);
    page.on("response", response => { if (response.url().includes("/_next/") && response.status() >= 400) failures++; });
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page).toHaveURL(`${base}/home`);
      await expect(page.getByRole("heading", { name: "Your apps", exact: true })).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Apps", exact: true });
      for (const app of apps) await expect(nav.getByRole("link", { name: app.name, exact: true })).toHaveAttribute("href", app.rootPath);
      assert(await nav.locator("svg").count() >= apps.length);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
      const launcherTop = await nav.evaluate(el => el.getBoundingClientRect().top);
      const attentionTop = await page.getByRole("region", { name: "Needs attention" }).evaluate(el => el.getBoundingClientRect().top);
      assert(launcherTop < attentionTop);
      if (process.env.ATLAS_LAUNCHER_SCREENSHOTS) {
        fs.mkdirSync(process.env.ATLAS_LAUNCHER_SCREENSHOTS, { recursive: true, mode: 0o700 });
        await page.screenshot({ path: `${process.env.ATLAS_LAUNCHER_SCREENSHOTS}/launcher-${width}.png`, fullPage: true });
      }
      await nav.getByRole("link", { name: "My work", exact: true }).click();
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
