/** Read-only candidate/public typography acceptance with the existing Guardian QA membership. */
import assert from "node:assert/strict";
import { chmod, mkdtemp } from "node:fs/promises";
import jwt from "jsonwebtoken";
import { chromium } from "@playwright/test";
import { db } from "../src/core/db/client";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_TYPOGRAPHY_CHECK === "1");
  const base = new URL(process.env.ATLAS_TYPOGRAPHY_URL ?? "https://atlassystem.online");
  assert((base.protocol === "https:" && base.hostname === "atlassystem.online") || (base.protocol === "http:" && base.hostname === "127.0.0.1"));
  const userId = process.env.ATLAS_GUARDIAN_USER_ID;
  const organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID;
  assert(userId && organisationId && process.env.SESSION_SECRET);
  const membership = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId, userId } }, include: { user: true } });
  assert(membership.active);
  const token = jwt.sign({ userId, organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "15m" });
  const evidence = await mkdtemp("/tmp/atlas-typography-check-");
  await chmod(evidence, 0o700);
  console.log(`Private typography evidence: ${evidence}`);
  const browser = await chromium.launch({ headless: true });
  try {
    let browserErrors = 0;
    let assetFailures = 0;
    let externalFonts = 0;
    for (const authenticated of [false, true]) {
      const context = await browser.newContext({ baseURL: base.origin });
      if (authenticated) await context.addCookies([{ name: "atlas_session", value: token, url: base.origin, httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
      await context.route("**/*", (route) => ["GET", "HEAD", "OPTIONS"].includes(route.request().method()) ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on("pageerror", () => browserErrors++);
      page.on("response", (response) => { if (new URL(response.url()).pathname.startsWith("/_next/") && response.status() >= 400) assetFailures++; });
      page.on("request", (request) => { if (request.resourceType() === "font" && new URL(request.url()).origin !== base.origin) externalFonts++; });
      const cdp = await context.newCDPSession(page);
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");
      const routes = authenticated ? ["/home", "/reports", "/sales", "/stock", "/products", "/manufacturing", "/atlas"] : ["/login", "/19811171adminlogin", "/19811171adminlogin/recovery"];
      for (const [viewport, width, height] of [["desktop", 1448, 1086], ["tablet", 820, 1180], ["phone", 390, 844]] as const) {
        await page.setViewportSize({ width, height });
        for (const path of routes) {
          const response = await page.goto(path, { waitUntil: "networkidle" });
          assert.equal(response?.status(), 200, `${path} ${viewport} renders.`);
          const check = await page.evaluate(async () => {
            await document.fonts.ready;
            const family = getComputedStyle(document.body).fontFamily;
            const sans = getComputedStyle(document.documentElement).getPropertyValue("--font-atlas-sans").trim();
            const controls = Array.from(document.querySelectorAll("h1,h2,button,input,select,textarea,th,td")).filter((node) => node.getClientRects().length && !node.closest(".font-mono,code,pre"));
            const inherited = controls.every((node) => getComputedStyle(node).fontFamily === family);
            const probe = document.createElement("span");
            probe.style.cssText = "position:fixed;visibility:hidden;white-space:pre;font-size:16px";
            document.body.append(probe);
            const widths = Array.from({ length: 10 }, (_, digit) => { probe.textContent = String(digit); return probe.getBoundingClientRect().width; });
            probe.remove();
            return { family, sans, inherited, controls: controls.length, fit: document.documentElement.scrollWidth <= innerWidth, digitSpread: Math.max(...widths) - Math.min(...widths) };
          });
          const normalize = (family: string) => family.replaceAll('"', "").replaceAll("'", "");
          assert(check.sans && normalize(check.family) === normalize(check.sans), `${path} uses the shared sans font.`);
          assert(check.inherited && check.controls > 0, `${path} headings, controls and table text inherit rounded typography.`);
          assert(check.fit, `${path} ${viewport} has no horizontal page overflow.`);
          assert(check.digitSpread < 0.1, `${path} numeric columns retain equal digit widths.`);
          const { root } = await cdp.send("DOM.getDocument");
          const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: "h1, h2" });
          assert(nodeId, `${path} has a rendered heading.`);
          const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
          assert(fonts.some((font) => font.isCustomFont && /Nunito/i.test(font.familyName) && font.glyphCount > 0), `${path} actually renders the bundled Nunito font.`);
          const label = path.replaceAll("/", "-").replace(/^-/, "");
          await page.screenshot({ path: `${evidence}/${label}-${viewport}.png`, fullPage: false });
          console.log(`PASS ${path} ${viewport}: real Nunito glyphs, ${check.controls} inherited elements, aligned digits and viewport fit.`);
        }
      }
      await context.close();
    }
    assert.equal(browserErrors, 0, "No browser runtime errors.");
    assert.equal(assetFailures, 0, "No failed Next assets.");
    assert.equal(externalFonts, 0, "All fonts served by Atlas.");
    console.log("PASS typography on 10 routes at 3 viewport sizes; no browser/asset errors or external font requests. All writes blocked.");
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
