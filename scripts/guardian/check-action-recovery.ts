/** Opt-in central Test fixture only. No real company writes or automatic action replay. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";

let phase = "configuration";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_ACTION_TEST === "1" && process.env.ATLAS_RUNTIME !== "desktop");
  const base = new URL(process.env.ATLAS_ACTION_TEST_URL ?? "https://atlassystem.online");
  assert((base.protocol === "https:" && base.hostname === "atlassystem.online") || (base.protocol === "http:" && base.hostname === "127.0.0.1"));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const qa = await sessionForUser(process.env.ATLAS_GUARDIAN_ORGANISATION_ID!, process.env.ATLAS_GUARDIAN_USER_ID!);
  assert(qa, "Existing active Guardian QA membership required.");
  assert(qa.capabilities.has("atlas.companies.manage"), "Existing authorised Guardian staff membership required; never grant it.");
  const membership = await db.membership.findUniqueOrThrow({ where: { id: qa.membershipId }, include: { user: true } });
  const sign = (userId: string, organisationId: string, authVersion: number, sessionVersion: number) => jwt.sign({ userId, organisationId, authVersion, sessionVersion }, process.env.SESSION_SECRET!, { algorithm: "HS256", expiresIn: "15m" });
  const staffToken = sign(qa.userId, qa.organisationId, membership.user.authVersion, membership.sessionVersion);
  const reproduce = process.argv.includes("--reproduce"), suffix = randomBytes(12).toString("hex"), slug = `guardian-action-${suffix}`;
  let fixture: { organisationId: string; userId: string } | undefined;
  const browser = await chromium.launch({ headless: true });
  try {
    phase = "disposable central fixture";
    const seeded = await db.$transaction(async tx => {
      const org = await tx.organisation.create({ data: { name: "Disposable Guardian action verification", slug, isTest: true, moduleStates: { create: { moduleId: "service", enabled: true, entitled: true } } } });
      const user = await tx.user.create({ data: { name: "Guardian action agent", email: `guardian-action-${suffix}@example.test`, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) } });
      const member = await tx.membership.create({ data: { organisationId: org.id, userId: user.id, grantedCapabilities: ["core.profile.self", "service.ticket.read", "service.ticket.update"] } });
      const queue = await tx.serviceQueue.create({ data: { organisationId: org.id, name: "Guardian action team", department: "QA", prefix: "QAT" } });
      await tx.serviceQueueMember.create({ data: { organisationId: org.id, queueId: queue.id, userId: user.id } });
      const query = await tx.serviceWorkItem.create({ data: { organisationId: org.id, number: "QAT-RECOVERY", kind: "QUERY", subject: "Guardian older-tab recovery", queueId: queue.id, requesterUserId: user.id } });
      fixture = { organisationId: org.id, userId: user.id };
      return { org, user, query, token: sign(user.id, org.id, user.authVersion, member.sessionVersion) };
    });
    const accountPath = `/atlas/${seeded.org.id}`, queryPath = `/service/queries/${seeded.query.id}`;
    let posts = 0, errors = 0;
    const contextFor = async (token: string, allowedPath: string) => {
      const context = await browser.newContext({ baseURL: base.origin });
      await context.addCookies([{ name: "atlas_session", value: token, url: base.origin, httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
      await context.route("**/*", route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== base.origin) return route.abort();
        if (url.pathname === "/api/guardian/telemetry") return route.fulfill({ status: 204 });
        if (["GET", "HEAD"].includes(request.method())) return route.continue();
        if (request.method() === "POST" && url.pathname === allowedPath) { posts++; return route.continue(); }
        return route.abort();
      });
      context.on("page", page => page.on("pageerror", () => errors++));
      return context;
    };
    const staff = await (await contextFor(staffToken, accountPath)).newPage();
    const agent = await (await contextFor(seeded.token, queryPath)).newPage();
    phase = "rejected portal draft";
    await staff.goto(accountPath, { waitUntil: "networkidle" });
    const account = staff.getByRole("button", { name: "Save account", exact: true }).locator("xpath=ancestor::form");
    const name = account.getByLabel("Company name", { exact: true }), plan = account.getByLabel("Plan name", { exact: true });
    await name.fill("  "); await plan.fill("Unsaved Guardian plan");
    await account.getByRole("button", { name: "Save account", exact: true }).click();
    await expect(account.getByRole("alert")).toBeVisible();
    await expect(plan).toHaveValue(reproduce ? seeded.org.planName : "Unsaved Guardian plan");
    assert.equal((await db.organisation.findUniqueOrThrow({ where: { id: seeded.org.id } })).planName, seeded.org.planName);
    assert.equal(await db.auditEntry.count({ where: { organisationId: seeded.org.id, action: "atlas.company.updated" } }), 0);
    console.log(reproduce ? "REPRODUCED rejected Atlas account save erases the unsaved plan; central company and audit unchanged." : "PASS rejected Atlas account save preserves the draft; central company and audit unchanged.");
    await name.fill("Guardian saved account"); await plan.fill("Guardian saved plan");
    await account.getByRole("button", { name: "Save account", exact: true }).click();
    await expect(account.getByRole("status")).toHaveText(/^Saved\.?$/);
    assert.equal((await db.organisation.findUniqueOrThrow({ where: { id: seeded.org.id } })).planName, "Guardian saved plan");
    assert.equal(await db.auditEntry.count({ where: { organisationId: seeded.org.id, action: "atlas.company.updated" } }), 1);
    console.log("PASS explicit corrected Atlas save updates the exact disposable company and one audit entry.");
    await staff.reload({ waitUntil: "networkidle" });
    await plan.fill("Unsaved older-tab plan");
    await agent.goto(queryPath, { waitUntil: "networkidle" });
    const progress = agent.getByRole("button", { name: "Update work", exact: true }).locator("xpath=ancestor::form");
    const draft = async () => {
      await progress.getByRole("combobox", { name: /^Status/ }).selectOption("IN_PROGRESS");
      await progress.getByRole("combobox", { name: /^Owner/ }).selectOption(seeded.user.id);
      await progress.getByLabel("Resolution / reason", { exact: true }).fill("Guardian older-tab draft");
    };
    await draft();
    const waitSignal = async (key: string) => {
      const path = process.env[key]; assert(path);
      const until = Date.now() + 120_000;
      while (!fs.existsSync(path)) { assert(Date.now() < until, "Staging signal timed out"); await new Promise(resolve => setTimeout(resolve, 250)); }
    };
    if (process.env.ATLAS_ACTION_TEST_READY) {
      assert(base.hostname === "127.0.0.1", "Cross-release staging must stay on loopback");
      fs.writeFileSync(process.env.ATLAS_ACTION_TEST_READY, "ready\n", { mode: 0o600 });
      phase = "await actual isolated runtime switch"; await waitSignal("ATLAS_ACTION_TEST_SWITCHED");
      phase = "submit older portal tab";
      let before = posts;
      await account.getByRole("button", { name: "Save account", exact: true }).click();
      await expect(account.getByRole("alert")).toContainText(reproduce ? "Server Action" : "Copy your unsaved changes");
      await expect(plan).toHaveValue(reproduce ? "Guardian saved plan" : "Unsaved older-tab plan");
      assert.equal(posts, before + 1, "Never automatically replay a mutation");
      assert.equal((await db.organisation.findUniqueOrThrow({ where: { id: seeded.org.id } })).planName, "Guardian saved plan");
      assert.equal(await db.auditEntry.count({ where: { organisationId: seeded.org.id, action: "atlas.company.updated" } }), 1);
      phase = "submit older query tab"; before = posts;
      await progress.getByRole("button", { name: "Update work", exact: true }).click();
      await expect(progress.getByRole("alert")).toContainText(reproduce ? "Server Action" : "Copy your unsaved changes");
      await expect(progress.getByLabel("Resolution / reason", { exact: true })).toHaveValue("Guardian older-tab draft");
      const unchanged = await db.serviceWorkItem.findUniqueOrThrow({ where: { id: seeded.query.id } });
      assert.equal(unchanged.version, 1); assert.equal(unchanged.ownerUserId, null); assert.equal(unchanged.status, "NEW");
      assert.equal(await db.serviceWorkEntry.count({ where: { workId: seeded.query.id } }), 0);
      assert.equal(posts, before + 1, "Never automatically replay a mutation");
      console.log(reproduce ? "REPRODUCED both older tabs reject unknown actions: portal draft erased, shared query draft retained, raw framework errors, no central changes or POST replay." : "PASS both older tabs retain drafts with explicit copy/reload guidance; no central changes or POST replay.");
      fs.writeFileSync(process.env.ATLAS_ACTION_TEST_FAILED!, "checked\n", { mode: 0o600 });
      phase = "await runtime restoration"; await waitSignal("ATLAS_ACTION_TEST_RESTORED");
    }
    phase = "explicit reload and intentional save";
    await agent.reload({ waitUntil: "networkidle" }); await draft();
    await progress.getByRole("button", { name: "Update work", exact: true }).click();
    await expect(progress.getByRole("status")).toHaveText("Saved.");
    const saved = await db.serviceWorkItem.findUniqueOrThrow({ where: { id: seeded.query.id } });
    assert.equal(saved.status, "IN_PROGRESS"); assert.equal(saved.ownerUserId, seeded.user.id); assert.equal(saved.version, 2);
    assert.equal(await db.serviceWorkEntry.count({ where: { workId: saved.id, body: { contains: "Guardian older-tab draft" } } }), 1);
    await agent.reload({ waitUntil: "networkidle" });
    await expect(progress.getByRole("combobox", { name: /^Owner/ })).toHaveValue(seeded.user.id);
    assert.equal(errors, 0);
    console.log("PASS intentional reload/re-entry/save persists exact query status, owner, version and one history entry; zero browser errors.");
  } finally {
    await browser.close();
    if (fixture) await db.$transaction(async tx => {
      await tx.organisation.findFirstOrThrow({ where: { id: fixture!.organisationId, slug, isTest: true } });
      await tx.organisation.update({ where: { id: fixture!.organisationId }, data: { status: "SUSPENDED", name: "Retired Guardian action verification" } });
      await tx.membership.updateMany({ where: { organisationId: fixture!.organisationId }, data: { active: false, sessionVersion: { increment: 1 } } });
      await tx.user.update({ where: { id: fixture!.userId }, data: { authVersion: { increment: 1 } } });
    });
    await db.$disconnect();
    console.log("Exact Test company suspended and synthetic sessions revoked; central history retained. Existing QA staff account unchanged.");
  }
}
main().catch(error => { console.error(`Action recovery check failed at ${phase} (${error instanceof Error ? error.name : "UnknownError"}); inspect securely. No private content or credentials logged.`); process.exitCode = 1; });
