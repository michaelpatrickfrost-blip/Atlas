/** Opt-in central Test acceptance. Never changes existing passwords or staff grants. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { ADMIN_LOGIN_PATH, ADMIN_RECOVERY_PATH } from "../src/core/auth/admin-address";
import { allowAuthenticationAttempt, authenticationAttemptKeys } from "../src/core/auth/attempt-limit";
import { createRecoveryCredential } from "../src/core/auth/recovery";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_PRIVATE_ADMIN_TEST === "1", "Explicit server Test acceptance required");
  const base = process.env.ATLAS_PRIVATE_ADMIN_TEST_URL ?? "https://atlassystem.online";
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert(process.env.SESSION_SECRET && process.env.ATLAS_GUARDIAN_USER_ID);
  const qa = await db.membership.findFirstOrThrow({ where: { userId: process.env.ATLAS_GUARDIAN_USER_ID, active: true, organisation: { kind: "INTERNAL", status: "ACTIVE" } }, include: { user: { include: { platformAdmin: true } } } });
  assert(qa.user.platformAdmin?.active, "QA staff must already exist and be independently authorised");
  const suffix = randomUUID().slice(0, 8), identifier = `admin-entry-check-${suffix}@example.test`;
  const company = await db.organisation.create({ data: { name: `Private Admin acceptance ${suffix}`, slug: `admin-entry-${suffix}`, isTest: true } });
  const password = `Acceptance-${randomUUID()}`;
  const user = await db.user.create({ data: { name: "Private entry Test user", email: identifier, passwordHash: await bcrypt.hash(password, 12) } });
  const membership = await db.membership.create({ data: { userId: user.id, organisationId: company.id, active: true } });
  const browser = await chromium.launch({ headless: true });
  const evidence = process.env.ATLAS_PRIVATE_ADMIN_EVIDENCE;
  if (evidence) mkdirSync(evidence, { recursive: true, mode: 0o700 });
  let browserErrors = 0;
  try {
    const anonymous = await browser.newContext({ baseURL: base });
    for (const path of ["/atlas/login", "/atlas/reset-password", "/atlas", "/atlas/team", "/atlas/studio", "/reset-password?portal=atlas"]) {
      const response = await anonymous.request.get(path, { maxRedirects: 0 });
      assert.equal(response.status(), 404, `Retired/anonymous address ${path}`);
      assert.equal(response.headers().location, undefined);
      assert(!(await response.text()).includes(ADMIN_LOGIN_PATH), `No private entry disclosure on ${path}`);
    }
    for (const path of [ADMIN_LOGIN_PATH, ADMIN_RECOVERY_PATH]) {
      const response = await anonymous.request.get(path);
      assert.equal(response.status(), 200); assert.match(response.headers()["x-robots-tag"], /noindex/);
      assert.equal(response.headers()["referrer-policy"], "no-referrer"); assert.match(response.headers()["cache-control"], /no-store/);
      assert.match(await response.text(), /name="robots" content="noindex/);
    }
    const publicLogin = await anonymous.request.get("/login");
    assert.equal(publicLogin.status(), 200); assert(!(await publicLogin.text()).includes(ADMIN_LOGIN_PATH));
    for (const path of ["/robots.txt", "/sitemap.xml"]) assert(!(await (await anonymous.request.get(path)).text()).includes(ADMIN_LOGIN_PATH));
    const page = await anonymous.newPage();
    page.on("pageerror", () => browserErrors++);
    page.on("response", response => { if (response.url().includes("/_next/") && response.status() >= 400) browserErrors++; });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ADMIN_LOGIN_PATH, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: "Admin sign in", exact: true })).toBeVisible();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
      await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
      await page.getByRole("button", { name: "Show password", exact: true }).click();
      await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: "Hide password", exact: true }).click();
      if (evidence) await page.screenshot({ path: `${evidence}/admin-login-${width}.png`, fullPage: true });
    }
    await page.getByRole("link", { name: "Use a setup or recovery code", exact: true }).click();
    await expect(page).toHaveURL(`${base}${ADMIN_RECOVERY_PATH}`);
    await page.getByRole("link", { name: "Back to sign in", exact: true }).click();
    await expect(page).toHaveURL(`${base}${ADMIN_LOGIN_PATH}`);
    await page.getByLabel("Email address", { exact: true }).fill(identifier);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("This account does not have Atlas administration access.");
    assert(!(await anonymous.cookies()).some(cookie => cookie.name === "atlas_session"));
    assert.equal((await db.membership.findUniqueOrThrow({ where: { id: membership.id } })).lastLoginAt, null);
    const badEmail = `missing-admin-check-${suffix}@example.test`;
    await page.getByLabel("Email address", { exact: true }).fill(badEmail);
    for (let attempt = 1; attempt <= 11; attempt++) {
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page.locator("form").getByRole("alert")).toHaveText(attempt <= 10 ? "Incorrect email or password." : "Too many attempts. Wait 15 minutes before trying again.");
    }
    assert(!(await anonymous.cookies()).some(cookie => cookie.name === "atlas_session"));
    console.log("PASS private URL/noindex/no-referrer, retired/anonymous 404 without disclosure, customer login has no Admin link, desktop/phone/password reveal/recovery navigation, customer Admin denial and real repeated-login blocking");

    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email", { exact: true }).fill(identifier); await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click(); await expect(page).toHaveURL(`${base}/home`);
    const cookie = (await anonymous.cookies()).find(cookie => cookie.name === "atlas_session"); assert(cookie);
    const signed = jwt.verify(cookie.value, process.env.SESSION_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    assert.equal(signed.userId, user.id); assert.equal(signed.organisationId, company.id);
    if (base.startsWith("https")) { assert(cookie.secure); assert(cookie.httpOnly); }
    await page.goto("/atlas", { waitUntil: "networkidle" }); await expect(page).toHaveURL(`${base}/home`);
    await anonymous.clearCookies();
    const recovery = createRecoveryCredential();
    const reset = await db.passwordReset.create({ data: { membershipId: membership.id, tokenHash: recovery.tokenHash, expiresAt: recovery.expiresAt, purpose: "COMPANY" } });
    await page.goto(ADMIN_RECOVERY_PATH, { waitUntil: "networkidle" });
    await page.getByLabel("Code", { exact: true }).fill(recovery.code);
    await page.getByLabel("New password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Save password", exact: true }).click(); await expect(page.locator("form").getByRole("alert")).toContainText("Could not set your password");
    assert.equal((await db.passwordReset.findUniqueOrThrow({ where: { id: reset.id } })).usedAt, null);
    await page.goto(`/business/${company.slug}/reset-password`, { waitUntil: "networkidle" });
    await page.getByLabel("Code", { exact: true }).fill(recovery.code);
    await page.getByLabel("New password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Save password", exact: true }).click();
    await expect(page).toHaveURL(`${base}/home`);
    assert((await db.passwordReset.findUniqueOrThrow({ where: { id: reset.id } })).usedAt);
    console.log("PASS real customer sign-in/signed cookie and tenant selection; customer console denial; wrong-portal recovery leaves code unused and correct-company recovery succeeds");

    const staff = await browser.newContext({ baseURL: base });
    const token = jwt.sign({ userId: qa.userId, organisationId: qa.organisationId, authVersion: qa.user.authVersion, sessionVersion: qa.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "10m" });
    await staff.addCookies([{ name: "atlas_session", value: token, url: base, secure: base.startsWith("https"), httpOnly: true, sameSite: "Lax" }]);
    const admin = await staff.newPage();
    for (const path of ["/atlas", "/atlas/team", "/atlas/studio", "/atlas/connections"]) {
      const response = await admin.goto(path, { waitUntil: "networkidle" }); assert(response && response.status() === 200);
      assert.match(response.headers()["x-robots-tag"], /noindex/); await expect(admin.locator('[data-atlas-console="admin"]')).toBeVisible();
    }
    await admin.getByRole("button", { name: "Sign out of Atlas Admin", exact: true }).click(); await expect(admin).toHaveURL(`${base}${ADMIN_LOGIN_PATH}`);
    assert(!(await staff.cookies()).some(value => value.name === "atlas_session"));
    console.log("PASS existing authorised staff console/Team/Studio/Connections, noindex and sign-out to private entry; no existing credentials or grants changed");

    const limitHeaders = new Headers({ "x-forwarded-for": `198.18.${parseInt(suffix.slice(0,2),16)}.${parseInt(suffix.slice(2,4),16)}` });
    const keys = authenticationAttemptKeys(limitHeaders, identifier, "login");
    const attempts = await Promise.all(Array.from({ length: 12 }, () => allowAuthenticationAttempt(limitHeaders, identifier, "login")));
    assert.equal(attempts.filter(Boolean).length, 10, "Atomic concurrent admission cap");
    await db.$executeRaw`UPDATE "authentication_rate_limits" SET "expiresAt" = NOW() - INTERVAL '1 second' WHERE "key" IN (${keys.ipKey}, ${keys.identityKey})`;
    assert(await allowAuthenticationAttempt(limitHeaders, identifier, "login"), "Expired windows reset");
    await db.$executeRaw`DELETE FROM "authentication_rate_limits" WHERE "key" IN (${keys.ipKey}, ${keys.identityKey})`;
    assert.equal(browserErrors, 0); console.log("PASS central concurrent attempt cap/expiry; zero login browser/asset errors");
  } finally {
    await browser.close();
    await db.membership.update({ where: { id: membership.id }, data: { active: false, sessionVersion: { increment: 1 } } });
    await db.passwordReset.updateMany({ where: { membershipId: membership.id, usedAt: null }, data: { usedAt: new Date() } });
    await db.organisation.update({ where: { id: company.id }, data: { status: "SUSPENDED" } });
    await db.$disconnect();
    console.log("Retained isolated central Test fixture suspended; sessions/codes revoked.");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
