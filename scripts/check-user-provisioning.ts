/** Explicit central-server staff setup and acceptance. Credentials arrive on stdin only. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createInterface } from "node:readline/promises";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_USER_SETUP === "1", "Explicit central-server setup only");
  const reader = createInterface({ input: process.stdin });
  const line = await reader.question("");
  reader.close(); process.stdin.pause();
  const input = JSON.parse(line) as { name: string; email: string; password: string };
  const email = input.email.toLowerCase(), base = "https://atlassystem.online";
  assert(input.name && email && input.password, "Supply requested staff credentials on stdin");
  const owner = await db.user.findUniqueOrThrow({ where: { email: "kickablur@icloud.com" }, include: { platformAdmin: true } });
  assert(owner.platformAdmin?.active, "Michael is active Atlas staff");
  const internal = await db.organisation.findUniqueOrThrow({ where: { slug: "atlas-internal-staff" } });
  const ownerMember = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId: internal.id, userId: owner.id } } });
  assert(ownerMember.active && internal.status === "ACTIVE", "Michael has active staff workspace access");
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  // Local, short-lived maintenance session for the human-authorised account setup.
  const ownerToken = jwt.sign({ userId: owner.id, organisationId: internal.id, authVersion: owner.authVersion, sessionVersion: ownerMember.sessionVersion }, process.env.SESSION_SECRET, { expiresIn: "10m" });
  let assertions = 0;
  const check = (value: unknown, label: string) => { assert(value, label); console.log("PASS " + label); assertions++; };
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  const post = async (name: string, fields: Record<string, string>, cookie: string, route: string) => {
    const entry = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, value]) => value.exportedName === name);
    assert(entry, "Action " + name);
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set("_1_" + key, value);
    data.set("0", '["$K1"]');
    const response = await fetch(base + route, { method: "POST", headers: { Origin: base, Accept: "text/x-component", "Next-Action": entry[0], Cookie: cookie }, body: data, redirect: "manual" });
    return { response, body: await response.text() };
  };
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([{ name: "atlas_session", value: ownerToken, url: base, httpOnly: true, secure: true }]);
    const page = await context.newPage();
    await page.goto(base + "/atlas/team", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Add Atlas employee", exact: true })).toBeVisible();
    check(true, "Michael sees the employee creation control");
    const existing = await db.user.findUnique({ where: { email }, include: { platformAdmin: true } });
    if (!existing) {
      await page.getByRole("button", { name: "Add Atlas employee", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      check(await dialog.locator('input[name="currentPassword"]').count() === 0, "New employee form does not ask for Michael's password");
      await dialog.getByLabel("Full name", { exact: true }).fill(input.name);
      await dialog.getByLabel("Email", { exact: true }).fill(input.email);
      await dialog.getByLabel("Atlas role", { exact: true }).selectOption("EMPLOYEE");
      await dialog.getByLabel("Employee sign-in password", { exact: true }).fill(input.password);
      await dialog.getByRole("button", { name: "Create staff access", exact: true }).click();
      await expect(dialog.getByRole("status")).toContainText("sign in now");
      check(true, "Live employee form creates staff with immediate sign-in");
    } else {
      assert(existing.platformAdmin?.active && existing.platformAdmin.role === "EMPLOYEE", "Existing requested account must already be the intended active employee");
      assert(await bcrypt.compare(input.password, existing.passwordHash), "Existing requested password matches; no unrequested reset");
      check(true, "Requested employee already exists with matching access and password");
    }
    const employee = await db.user.findUniqueOrThrow({ where: { email }, include: { platformAdmin: true, memberships: true } });
    check(employee.name === input.name && employee.platformAdmin?.role === "EMPLOYEE" && employee.platformAdmin.active, "Requested identity has active Atlas Employee access");
    check(await bcrypt.compare(input.password, employee.passwordHash) && employee.passwordHash !== input.password, "Requested password is stored only as a bcrypt hash");
    check(employee.memberships.some(member => member.organisationId === internal.id && member.active), "Employee has active internal workspace membership");
    check(await db.passwordReset.count({ where: { membership: { userId: employee.id }, usedAt: null } }) === 0, "Direct setup has no pending recovery code");
    const audit = await db.auditEntry.findFirstOrThrow({ where: { actorUserId: owner.id, entityId: employee.id, action: "atlas.staff.created" }, orderBy: { createdAt: "desc" } });
    check(!JSON.stringify(audit).includes(input.password), "Creation audit records Michael without storing the password");
    const duplicate = await post("createAtlasStaff", { name: input.name, email, staffRole: "EMPLOYEE", newPassword: input.password }, "atlas_session=" + ownerToken, "/atlas/team");
    check(duplicate.body.includes("already listed in Atlas team"), "Duplicate staff creation returns useful feedback");
    await context.close();
    const staffContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const staffPage = await staffContext.newPage();
    await staffPage.goto(base + "/login", { waitUntil: "domcontentloaded" });
    await staffPage.getByLabel("Email", { exact: true }).fill(input.email);
    await staffPage.getByLabel("Password", { exact: true }).fill(input.password);
    await staffPage.getByRole("button", { name: /sign in/i }).click();
    await staffPage.waitForURL(base + "/atlas");
    await expect(staffPage.getByRole("heading", { name: "Company accounts", exact: true })).toBeVisible();
    check(true, "Requested username and password sign in through the live login form");
    check(await staffPage.getByRole("button", { name: "New company", exact: true }).count() === 0, "Employee cannot create a company and its first user");
    await staffPage.goto(base + "/atlas/team", { waitUntil: "domcontentloaded" });
    await expect(staffPage.getByRole("heading", { name: "Atlas team", exact: true })).toBeVisible();
    check(await staffPage.getByRole("button", { name: "Add Atlas employee", exact: true }).count() === 0, "Employee can open Atlas team but cannot add staff");
    const staffCookie = "atlas_session=" + (await staffContext.cookies()).find(cookie => cookie.name === "atlas_session")!.value;
    const deniedEmail = "denied-provisioning-" + randomBytes(8).toString("hex") + "@example.test";
    for (const [action, route] of [["createAtlasStaff", "/atlas/team"], ["createCompanyAccount", "/atlas"], ["createCompanyUser", "/atlas"], ["createUser", "/settings"], ["createManagedUser", "/settings"]]) {
      await post(action, { name: "Must never exist", email: deniedEmail, userEmail: owner.email, staffRole: "EMPLOYEE", newPassword: input.password, ownerName: "Must never exist" }, staffCookie, route);
      check(!await db.user.findUnique({ where: { email: deniedEmail } }), "Employee cannot bypass creation policy through " + action);
    }
    const company = await db.organisation.findFirstOrThrow({ where: { kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, memberships: { some: { userId: owner.id, active: true } } }, select: { id: true } });
    const opened = await post("openCompanyWorkspace", { organisationId: company.id }, staffCookie, "/atlas");
    const companyCookie = opened.response.headers.get("set-cookie")?.match(/atlas_session=([^;]+)/)?.[1];
    assert(companyCookie, "Employee can open a selected company");
    await staffContext.addCookies([{ name: "atlas_session", value: companyCookie, url: base, httpOnly: true, secure: true }]);
    await staffPage.goto(base + `/atlas/${company.id}/users`, { waitUntil: "domcontentloaded" });
    await expect(staffPage.getByRole("heading", { name: "Users & access", exact: true })).toBeVisible();
    check(await staffPage.getByRole("button", { name: "Add user", exact: true }).count() === 0, "Selected-company admin retains user reading without creation");
    await staffPage.goto(base + "/settings?tab=users", { waitUntil: "domcontentloaded" });
    await expect(staffPage.getByRole("heading", { name: "People & access", exact: true })).toBeVisible();
    check(await staffPage.getByRole("button", { name: "Add user", exact: true }).count() === 0, "Company administration hides employee user creation");
    check((await db.user.findUniqueOrThrow({ where: { id: owner.id } })).passwordHash === owner.passwordHash, "Michael's sign-in password remains unchanged");
    await staffContext.close();
    console.log(`LIVE USER SETUP PASSED: ${assertions} assertions`);
  } finally { await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "User setup verification failed"); process.exitCode = 1; });
