import { chromium, expect } from "@playwright/test";
import type { Finding } from "../../src/core/guardian/report";

/** Real browser render/hydration and explicitly non-mutating menu checks. No forms are submitted. */
export async function browserSweep(base: URL, token: string, routes: string[], report: (finding: Finding) => Promise<unknown>) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: base.origin });
  await context.addCookies([{ name: "atlas_session", value: token, domain: base.hostname, path: "/", httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
  let pages = 0, controls = 0, failures = 0;
  try {
    for (const route of [...new Set(routes)].slice(0, 100)) {
      const page = await context.newPage();
      let errorCount = 0;
      page.on("pageerror", () => errorCount++);
      // Diagnostic browser checks cannot create business writes, including background UI mutations.
      await page.route("**/*", request => ["GET", "HEAD", "OPTIONS"].includes(request.request().method()) ? request.continue() : request.abort());
      try {
        const response = await page.goto(route, { waitUntil: "networkidle", timeout: 30_000 });
        await expect(page.locator("main")).toBeVisible();
        if (!response?.ok() || new URL(page.url()).pathname === "/login") throw new Error("Render failed");
        await expect(page.getByText("Something went wrong.", { exact: true })).toHaveCount(0);
        if (errorCount) throw new Error("Browser exception");
        pages++;
        // Only controls explicitly annotated by the product as safe. Never infer safety from a label.
        const menus = page.locator('button[type="button"][data-guardian-safe="toggle"]');
        for (let i = 0; i < await menus.count(); i++) {
          const button = menus.nth(i);
          if (!await button.isVisible() || !await button.isEnabled()) continue;
          const before = await button.getAttribute("aria-expanded");
          await button.click();
          await expect(button).toHaveAttribute("aria-expanded", before === "true" ? "false" : "true");
          await button.click(); controls++;
        }
      } catch {
        failures++;
        await report({ key: `browser-probe:${route}`, title: `Browser check failed: ${route}`, kind: "BROWSER_PROBE", severity: "HIGH", route, expected: "The workspace hydrates without errors; tested controls respond visibly.", actual: "Chromium render, hydration or safe-toggle assertion failed.", steps: ["Run node --env-file=.env.local --env-file=/etc/atlas/guardian.env --import tsx scripts/guardian/worker.ts --now", `Open ${route} in the browser and inspect page errors/control state.`], evidence: [`Browser exceptions observed: ${errorCount}`, "Business writes were blocked during the probe. No screenshots or business content retained."] });
      } finally { await page.close(); }
    }
  } finally { await context.close(); await browser.close(); }
  return { failures, summary: `Chromium checked ${pages} rendered pages and ${controls} explicit safe toggles; ${failures} browser failures. ${Math.max(0, routes.length - 100)} routes beyond browser cap.` };
}
