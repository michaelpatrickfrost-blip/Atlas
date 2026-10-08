/** Server-only browser regression. Only disposable staff identities are changed. No code/token is logged. */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";

async function main() {
  assert(process.env.ATLAS_GUARDIAN_COPY_TEST === "1", "Explicit server fixture opt-in required.");
  const base = "https://atlassystem.online";
  const reproduce = process.argv.includes("--reproduce");
  const suffix = randomBytes(12).toString("hex");
  const emails = [`guardian-copy-owner-${suffix}@example.test`, `guardian-copy-staff-${suffix}@example.test`];
  const password = randomBytes(24).toString("base64url");
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32, "Server secret required.");
  const browser = await chromium.launch({ headless: true });
  try {
    const internal = await db.organisation.findUniqueOrThrow({ where: { slug: "atlas-internal-staff", kind: "INTERNAL", status: "ACTIVE" } });
    const owner = await db.user.create({ data: {
      email: emails[0], name: "Disposable Guardian copy acceptance",
      passwordHash: await bcrypt.hash(password, 12),
      platformAdmin: { create: { role: "EMPLOYEE" } },
      memberships: { create: { organisationId: internal.id } },
    }, include: { memberships: true } });
    const member = owner.memberships[0];
    const token = jwt.sign({ userId: owner.id, organisationId: internal.id, authVersion: owner.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "10m" });
    const context = await browser.newContext({ baseURL: base });
    await context.addCookies([{ name: "atlas_session", value: token, domain: "atlassystem.online", path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
    // Deliberate failure reproduction is recorded separately; do not generate duplicate runtime alerts.
    await context.route("**/api/guardian/telemetry", route => route.fulfill({ status: 204 }));
    const page = await context.newPage();
    let errors = 0;
    page.on("pageerror", () => errors++);
    const response = await page.goto("/atlas/team", { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, "Staff screen renders.");
    await page.getByRole("button", { name: "Add Atlas employee", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add Atlas staff", exact: true });
    await dialog.getByLabel("Full name", { exact: true }).fill("Disposable Guardian copy staff");
    await dialog.getByLabel("Email", { exact: true }).fill(emails[1]);
    await dialog.getByLabel("Your administrator password", { exact: true }).fill(password);
    await dialog.getByRole("button", { name: "Create staff access", exact: true }).click();
    await expect(dialog.getByRole("heading", { name: "One-time code ready", exact: true })).toBeVisible();
    const code = (await dialog.locator("code").textContent())!;
    assert.match(code, /^[a-f0-9]{64}$/, "One-time code returned without logging it.");
    const created = await db.user.findUniqueOrThrow({ where: { email: emails[1] }, include: { memberships: true, platformAdmin: true } });
    assert(created.platformAdmin?.active && created.platformAdmin.role === "EMPLOYEE");
    const credential = await db.passwordReset.findFirstOrThrow({ where: { membershipId: created.memberships[0].id, usedAt: null } });
    assert.equal(credential.tokenHash, createHash("sha256").update(code).digest("hex"), "Rendered code matches its central credential.");
    console.log("PASS actual staff creation renders the matching one-time credential.");

    const cdp = await context.newCDPSession(page);
    await cdp.send("Browser.setPermission", { permission: { name: "clipboard-write" }, setting: "denied", origin: base });
    await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
    if (reproduce) {
      await expect.poll(() => errors).toBeGreaterThan(0);
      await expect(dialog.getByRole("button", { name: "Copy code", exact: true })).toBeVisible();
      assert.equal(await dialog.getByRole("status").count(), 0, "Original failure has no recovery feedback.");
      console.log("REPRODUCED clipboard denied: unhandled browser rejection, no copy feedback.");
      return;
    }
    await expect(dialog.getByRole("status")).toContainText("Select the code above and copy it manually.");
    assert.equal(errors, 0, "Clipboard denial is handled.");
    assert.equal(await dialog.locator("code").textContent(), code, "Same code remains available.");
    console.log("PASS denied clipboard gives manual-copy feedback without browser errors.");

    // Browsers without the Clipboard API must retain the same recovery path.
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
    await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("Select the code above and copy it manually.");
    assert.equal(errors, 0);
    console.log("PASS missing Clipboard API keeps the code and recovery feedback.");
    await page.evaluate(() => { delete (navigator as unknown as { clipboard?: Clipboard }).clipboard; });
    await cdp.send("Browser.setPermission", { permission: { name: "clipboard-write" }, setting: "granted", origin: base });
    await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveText("Code copied.");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), code, "Actual clipboard contains the unchanged code.");
    assert.equal((await db.passwordReset.findUniqueOrThrow({ where: { id: credential.id } })).usedAt, null, "Copying never consumes the credential.");
    assert.equal(errors, 0);
    console.log("PASS retry copies the exact code; the central credential remains unused.");
    await context.close();
  } finally {
    await browser.close();
    // Exact random fixture emails only; user cascades remove memberships, grants and codes.
    await db.user.deleteMany({ where: { email: { in: emails } } });
    assert.equal(await db.user.count({ where: { email: { in: emails } } }), 0, "Disposable identities removed.");
    await db.$disconnect();
    console.log("Disposable copy-test identities, grants and credentials removed; audit retained.");
  }
}
main().catch(() => { console.error("Guardian copy acceptance failed; inspect securely. No credentials logged."); process.exitCode = 1; });
