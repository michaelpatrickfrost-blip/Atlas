/** Read-only whole-app coverage. No business submissions, grants or fixture edits. */
import assert from "node:assert/strict";
import { mkdtemp, chmod, writeFile } from "node:fs/promises";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
import { auditSources, routeMatches } from "./guardian/source-audit";
import { responseOutcome } from "./guardian/response-check";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_APP_UI_CHECK === "1");
  const base = new URL(process.env.ATLAS_APP_UI_URL ?? "https://atlassystem.online");
  assert(base.origin === "https://atlassystem.online" || (base.hostname === "127.0.0.1" && base.protocol === "http:"));
  const organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID!, userId = process.env.ATLAS_GUARDIAN_USER_ID!;
  assert(organisationId && userId && process.env.SESSION_SECRET);
  assert(await sessionForUser(organisationId, userId), "Existing authorised QA membership required");
  const member = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId, userId } }, include: { user: true } });
  const token = jwt.sign({ userId, organisationId, authVersion: member.user.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "2h" });
  const revision = (await (await fetch(new URL("/api/health/release", base), { signal: AbortSignal.timeout(15000) })).json()).revision;
  if (process.env.ATLAS_TEST_REVISION) assert.equal(revision, process.env.ATLAS_TEST_REVISION);
  const evidence = await mkdtemp("/tmp/atlas-app-ui-"); await chmod(evidence, 0o700);
  console.log(`Private UI evidence: ${evidence}; revision ${revision}`);
  const audit = auditSources(process.cwd());
  const routes = audit.routes.filter(r => r.file.startsWith("src/app/(app)/") && !r.api);
  const queue = [...new Set(routes.filter(r => !r.path.includes("[")).map(r => r.path))];
  const seen = new Set<string>();
  const results: Array<Record<string, unknown>> = [];
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ baseURL: base.origin });
    await context.addCookies([{ name: "atlas_session", value: token, url: base.origin, httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
    await context.route("**/*", route => ["GET", "HEAD", "OPTIONS"].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    let exceptions = 0; page.on("pageerror", () => exceptions++);
    while (queue.length) {
      const route = queue.shift()!; if (seen.has(route)) continue; seen.add(route);
      const row: Record<string, unknown> = { route }; const initialErrors = exceptions;
      try {
        await page.setViewportSize({ width: 1448, height: 980 });
        const response = await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });
        assert(response && !/\/login$/.test(new URL(page.url()).pathname), "QA authentication lost");
        const outcome = responseOutcome(response.status(), await response.text()); row.outcome = outcome;
        if (new URL(page.url()).pathname.startsWith("/atlas/")) { row.outcome = "staff-console-redirect"; results.push(row); console.log(`staff-console-redirect ${route}`); continue; }
        if (outcome !== "http-render-pass") { results.push(row); console.log(`${outcome} ${route}`); continue; }
        await expect(page.locator(".atlas-shell")).toBeVisible();
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-atlas-blue").trim()), "#155dfc", "Screen must inherit the current Atlas theme");
        await expect(page.locator("main").first()).toBeVisible();
        assert.equal(exceptions, initialErrors, "Browser exception");
        const links = await page.locator('a[href^="/"]').evaluateAll(elements => elements.map(e => e.getAttribute("href")!));
        for (const href of links) {
          if (href.startsWith("//") || /[?#]/.test(href) || /^\/(api|atlas|auth|login|logout|sign|share)(\/|$)/.test(href)) continue;
          if (routes.some(r => routeMatches(r.path, href)) && !seen.has(href) && !queue.includes(href)) queue.push(href);
        }
        row.buttons = await page.locator("button").count(); row.links = links.length;
        let toggles = 0;
        const safe = page.locator('button[type="button"][data-guardian-safe="toggle"]');
        for (let i = 0; i < await safe.count(); i++) {
          const button = safe.nth(i); if (!await button.isVisible() || !await button.isEnabled()) continue;
          const before = await button.getAttribute("aria-expanded");
          await button.click(); await expect(button).toHaveAttribute("aria-expanded", before === "true" ? "false" : "true");
          await button.click(); await expect(button).toHaveAttribute("aria-expanded", before ?? "false"); toggles++;
        }
        row.safeToggles = toggles;
        let menus = 0, dialogs = 0;
        const groups = page.locator('[data-guardian-safe="menu"]');
        for (let i = 0; i < await groups.count(); i++) {
          const button = groups.nth(i); if (!await button.isVisible()) continue;
          await button.focus(); await button.press("ArrowDown");
          await expect(button).toHaveAttribute("aria-expanded", "true");
          const menu = button.locator("..").getByRole("menu"); await expect(menu).toBeVisible();
          await expect(menu.getByRole("menuitem").first()).toBeFocused();
          await page.keyboard.press("Escape"); await expect(button).toHaveAttribute("aria-expanded", "false"); await expect(button).toBeFocused(); menus++;
        }
        const creators = page.locator('[data-guardian-safe="dialog"]');
        for (let i = 0; i < await creators.count(); i++) {
          const button = creators.nth(i); if (!await button.isVisible() || !await button.isEnabled()) continue;
          await button.click(); const dialog = page.locator("dialog[open]"); await expect(dialog).toBeVisible();
          await dialog.getByRole("button", { name: "Close dialog", exact: true }).click(); await expect(dialog).toHaveCount(0); dialogs++;
        }
        row.moduleMenus = menus; row.creationDialogs = dialogs;
        for (const width of [1448, 390]) {
          await page.setViewportSize({ width, height: 980 });
          const menusAtWidth = page.locator('[data-guardian-safe="menu"]');
          for (let i = 0; i < await menusAtWidth.count(); i++) {
            const trigger = menusAtWidth.nth(i); if (!await trigger.isVisible()) continue;
            await trigger.focus(); await trigger.press("ArrowDown");
            const menu = trigger.locator("..").getByRole("menu");
            const bounds = await menu.boundingBox(); assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1, "Module menu leaves viewport");
            await page.keyboard.press("Escape");
          }
          let reachableButtons = 0;
          const buttons = page.locator("main button");
          for (let i = 0; i < await buttons.count(); i++) {
            const button = buttons.nth(i); if (!await button.isVisible() || !await button.isEnabled()) continue;
            await button.click({ trial: true, timeout: 5000 }); reachableButtons++;
          }
          row[`reachableButtons${width}`] = reachableButtons;
          const overflow = await page.locator("main").evaluate(el => el.scrollWidth - el.clientWidth);
          row[`overflow${width}`] = overflow;
          if (overflow > 2) row.layoutIssue = true;
        }
        assert.equal(exceptions, initialErrors, "Browser exception after interactions");
        row.browser = "pass";
        // Only app roots are photographed; record content stays out of persistent diagnostics.
        if (route.split("/").filter(Boolean).length === 1) {
          await page.screenshot({ path: `${evidence}/${route.slice(1)}-phone.png` });
          await page.setViewportSize({ width: 1448, height: 980 });
          await page.screenshot({ path: `${evidence}/${route.slice(1)}-desktop.png` });
        }
      } catch (error) { row.browser = "failed"; row.reason = error instanceof Error ? error.message.slice(0, 180) : "Unknown failure"; }
      results.push(row); console.log(`${row.browser ?? row.outcome} ${route}${row.layoutIssue ? " LAYOUT_OVERFLOW" : ""}`);
      await writeFile(`${evidence}/coverage.json`, JSON.stringify({ revision, source: audit.coverage, results, remaining: queue.length }, null, 2), { mode: 0o600 });
    }
    assert.equal((await (await fetch(new URL("/api/health/release", base), { signal: AbortSignal.timeout(15000) })).json()).revision, revision, "Deployment changed; rerun against one revision");
    const failures = results.filter(r => r.outcome === "failed" || r.browser === "failed" || r.layoutIssue);
    console.log(`Coverage ${results.length} pages; ${results.filter(r => r.browser === "pass").length} browser passes; ${failures.length} failures. Restricted/unavailable routes excluded. Mutations require dedicated synthetic workflow acceptance.`);
    if (failures.length) process.exitCode = 1;
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "UI check failed"); process.exitCode = 1; });
