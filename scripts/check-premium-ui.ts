/** Read-only whole-app visual acceptance. Reuses Guardian's existing membership;
 * no fixtures, business writes, account grants or additional database dumps. */
import assert from "node:assert/strict";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
import { getNavigableModules } from "../src/core/modules/runtime";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_PREMIUM_CHECK === "1");
  const base = new URL(process.env.ATLAS_PREMIUM_URL!);
  assert(base.href === "https://atlassystem.online/" || base.href === "http://127.0.0.1:3011/");
  const evidence = process.env.ATLAS_PREMIUM_OUTPUT!;
  assert(evidence.startsWith("/tmp/atlas-polish-"));
  await mkdir(evidence, { recursive: true }); await chmod(evidence, 0o700);
  const userId = process.env.ATLAS_GUARDIAN_USER_ID!, organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID!;
  const session = await sessionForUser(organisationId, userId); assert(session);
  const membership = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId, userId } }, include: { user: true } });
  assert(membership.active && process.env.SESSION_SECRET);
  const token = jwt.sign({ userId, organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" });
  const modules = await getNavigableModules(session);
  const routes = [...new Set(["/home", ...modules.map(app => app.rootPath), "/customers", "/reports", "/guides", "/profile", "/settings", "/atlas", "/design-studio"])];
  const browser = await chromium.launch({ headless: true });
  const results: { path: string; viewport: string; headings: number; controls: number }[] = [];
  try {
    const context = await browser.newContext({ baseURL: base.origin });
    await context.addCookies([{ name: "atlas_session", value: token, url: base.origin, httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
    await context.route("**/*", route => ["GET", "HEAD", "OPTIONS"].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    const browserErrors: string[] = [], assetFailures: string[] = [];
    page.on("pageerror", error => browserErrors.push(error.name));
    page.on("response", response => { if (new URL(response.url()).pathname.startsWith("/_next/") && response.status() >= 400) assetFailures.push(new URL(response.url()).pathname); });
    for (const [viewport, width, height] of [["desktop", 1440, 1000], ["tablet", 820, 1180], ["phone", 390, 844]] as const) {
      await page.setViewportSize({ width, height });
      for (const path of routes) {
        const response = await page.goto(path, { waitUntil: "networkidle" });
        assert.equal(response?.status(), 200, `${path} ${viewport}: HTTP render`);
        await expect(page.locator("main")).toBeVisible();
        assert(!/Something went wrong|Application error:|could not load this page/i.test(await page.locator("main").innerText()), `${path}: no error boundary`);
        const layout = await page.evaluate(async () => {
          await document.fonts.ready;
          const main = document.querySelector("main")!;
          return {
            rootFits: document.documentElement.scrollWidth <= innerWidth,
            mainFits: main.scrollWidth <= main.clientWidth + 1,
            headings: main.querySelectorAll("h1,h2").length,
            controls: main.querySelectorAll("input,button,select,textarea").length,
            theme: getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim(),
            cardFilters: [...document.querySelectorAll(".atlas-card,.atlas-launcher-card")].every(el => getComputedStyle(el).backdropFilter === "none"),
          };
        });
        assert(layout.rootFits && layout.mainFits, `${path} ${viewport}: page and main must fit`);
        assert(layout.headings > 0 && layout.theme === "#18263e", `${path}: rendered premium foundation`);
        assert(layout.cardFilters, `${path}: cards must not trap overlays`);
        await page.screenshot({ path: `${evidence}/${path.replaceAll("/", "-").slice(1) || "root"}-${viewport}.png` });
        results.push({ path, viewport, headings: layout.headings, controls: layout.controls });
        console.log(`PASS ${path} ${viewport}: themed, rendered, viewport fit.`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Apps", exact: true }).click();
    const menu = page.getByRole("region", { name: "Apps menu" });
    await expect(menu).toBeVisible();
    assert(await menu.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && getComputedStyle(el).backgroundColor === "rgb(255, 255, 255)"; }), "Phone Apps popup is opaque and entirely in bounds");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Apps", exact: true })).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/home", { waitUntil: "networkidle" });
    assert(await page.locator(".atlas-launcher-card").first().evaluate(el => parseFloat(getComputedStyle(el).transitionDuration) < .01), "Reduced motion disables card animation");
    assert.equal(browserErrors.length, 0, "No browser runtime errors");
    assert.equal(assetFailures.length, 0, "No failed Next assets");
    await writeFile(`${evidence}/coverage.json`, JSON.stringify({ routes, results, browserErrors, assetFailures, readOnly: true }, null, 2));
    console.log(`PASS ${routes.length} routes × 3 widths, phone Apps/focus, reduced motion; all writes blocked.`);
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
