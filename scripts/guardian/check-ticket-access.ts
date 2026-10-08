/** Explicit disposable central fixtures, never an existing company/profile. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { deploymentGuard } from "./deployment-guard";

let phase = "configuration";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_ACCESS_TEST === "1" && process.env.ATLAS_RUNTIME !== "desktop");
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const stable = deploymentGuard(process.cwd(), revision);
  const reproduce = process.argv.includes("--reproduce"), suffix = randomBytes(12).toString("hex");
  const base = "https://atlassystem.online", secret = `SYNTHETIC-PRIVATE-${suffix}`;
  const fixtures: { organisationId: string; slug: string; userId: string; token: string; ticketId: string; queueId: string; name: string }[] = [];
  const grants = ["tickets.ticket.read", "tickets.ticket.create", "tickets.ticket.manage", "tickets.ticket.reply", "tickets.queue.read", "tickets.queue.manage"];
  const browser = await chromium.launch({ headless: true });
  try {
    stable();
    for (const name of ["denied", "disabled", "unentitled"]) {
      phase = `fixture ${name}`;
      const slug = `guardian-access-${name}-${suffix}`;
      const fixture = await db.$transaction(async tx => {
        const org = await tx.organisation.create({ data: { name: "Disposable Guardian access verification", slug, isTest: true, moduleStates: { create: { moduleId: "tickets", enabled: name !== "disabled", entitled: name !== "unentitled" } } } });
        const user = await tx.user.create({ data: { name: "Guardian access fixture", email: `guardian-access-${name}-${suffix}@example.test`, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) } });
        const member = await tx.membership.create({ data: { organisationId: org.id, userId: user.id, grantedCapabilities: name === "denied" ? [] : grants } });
        const queue = await tx.serviceQueue.create({ data: { organisationId: org.id, name: secret, department: "QA", prefix: "QA" } });
        const ticket = await tx.serviceWorkItem.create({ data: { organisationId: org.id, queueId: queue.id, requesterUserId: user.id, number: "TKT-ACCESS", kind: "TICKET", subject: secret, description: secret } });
        return { organisationId: org.id, userId: user.id, queueId: queue.id, ticketId: ticket.id, slug, name, token: jwt.sign({ userId: user.id, organisationId: org.id, authVersion: user.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET!, { algorithm: "HS256", expiresIn: "15m" }) };
      });
      fixtures.push(fixture);
    }
    const renderCounts = async () => (await db.guardianIssue.aggregate({ where: { route: { startsWith: "/tickets" }, title: { startsWith: "Server render failed:" } }, _sum: { occurrences: true } }))._sum.occurrences ?? 0;
    const originalRenders = await renderCounts();
    const manifest = JSON.parse(fs.readFileSync(".next/server/server-reference-manifest.json", "utf8"));
    const createAction = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, value]) => value.exportedName === "createWork");
    assert(createAction);
    for (const fixture of fixtures) {
      phase = `${fixture.name} page`;
      const context = await browser.newContext({ baseURL: base, viewport: { width: 390, height: 844 } });
      await context.addCookies([{ name: "atlas_session", value: fixture.token, domain: "atlassystem.online", path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
      await context.route("**/api/guardian/telemetry", route => route.fulfill({ status: 204 }));
      const page = await context.newPage();
      let errors = 0; page.on("pageerror", () => errors++);
      for (const path of reproduce ? ["/tickets"] : ["/tickets", "/tickets/create", "/tickets/queues", `/tickets/${fixture.ticketId}`, "/tickets/catalogue", "/tickets/knowledge", "/tickets/reports", "/tickets/queues/manage"]) {
        phase = `${fixture.name} request`;
        const response = await page.goto(path, { waitUntil: "networkidle" });
        assert(response);
        const body = await response.text();
        assert(!body.includes(secret), "No synthetic private record or queue appears in the response payload.");
        if (reproduce && fixture.name === "denied") {
          phase = "denied generic failure";
          await expect(page.getByText("Something went wrong.", { exact: true })).toBeVisible();
          console.log("REPRODUCED denied Tickets access is shown as a generic failure.");
        } else if (reproduce) {
          phase = `${fixture.name} existing disabled view`;
          await expect(page.getByText("Tickets is disabled", { exact: true })).toBeVisible();
          console.log(`REPRODUCED ${fixture.name} layout hides child rendering; original server error remains separately correlated. Explicit Home link count: ${await page.getByRole("link", {name:"Go to Home",exact:true}).count()}.`);
        } else {
          assert.equal(response.status(), 200);
          await expect(page.getByRole("heading", { name: fixture.name === "denied" ? "You don't have permission to view this." : "This app is not enabled for your company.", exact: true })).toBeVisible();
          await expect(page.getByText("Something went wrong.", { exact: true })).toHaveCount(0);
          assert(await page.locator("main").evaluate(element => element.scrollWidth <= element.clientWidth));
        }
        if (reproduce && fixture.name !== "denied") continue;
        phase = `${fixture.name} Home navigation`;
        await page.getByRole("link", { name: "Go to Home", exact: true }).click();
        await expect(page).toHaveURL(`${base}/home`);
      }
      if (!reproduce) assert.equal(errors, 0);
      // Prove the new display cannot bypass the existing server action's permission/module guard.
      const form = new FormData();
      for (const [key, value] of Object.entries({ kind: "TICKET", queueId: fixture.queueId, subject: "Forbidden fixture write", description: "Must not persist" })) form.set(`_1_${key}`, value);
      form.set("0", '["$K1"]');
      const denied = await fetch(`${base}/tickets/create`, { method: "POST", headers: { Origin: base, "Next-Action": createAction[0], Accept: "text/x-component", Cookie: `atlas_session=${fixture.token}` }, body: form, redirect: "manual" });
      const deniedBody = await denied.text();
      assert(denied.status >= 400 || /(?:^|\n)\w+:E\{/.test(deniedBody));
      assert.equal(await db.serviceWorkItem.count({ where: { organisationId: fixture.organisationId } }), 1);
      const record = await db.serviceWorkItem.findUniqueOrThrow({ where: { id: fixture.ticketId } });
      assert.equal(record.version, 1); assert.equal(record.subject, secret);
      assert.equal(await db.serviceWorkEntry.count({ where: { organisationId: fixture.organisationId } }), 0);
      assert.equal(await db.auditEntry.count({ where: { organisationId: fixture.organisationId, action: "service.work.created" } }), 0);
      assert.equal((await db.serviceQueue.findUniqueOrThrow({ where: { id: fixture.queueId } })).name, secret);
      console.log(`PASS ${fixture.name}: ${reproduce ? "pre-fix evidence" : "Home navigation"}, no private payload, direct action denied and central records unchanged.`);
      await context.close();
    }
    stable();
    if (!reproduce) assert.equal(await renderCounts(), originalRenders, "Restrictions must not throw new Tickets server-render errors.");
    if (!reproduce) console.log("PASS all 24 Tickets access requests, phone fit, Home links and protected central state.");
  } finally {
    await browser.close();
    for (const fixture of fixtures) await db.$transaction(async tx => {
      await tx.organisation.findFirstOrThrow({ where: { id: fixture.organisationId, slug: fixture.slug, isTest: true } });
      await tx.organisation.update({ where: { id: fixture.organisationId }, data: { status: "SUSPENDED", name: "Retired Guardian access verification" } });
      await tx.membership.updateMany({ where: { organisationId: fixture.organisationId }, data: { active: false, sessionVersion: { increment: 1 } } });
      await tx.user.update({ where: { id: fixture.userId }, data: { authVersion: { increment: 1 } } });
    });
    await db.$disconnect();
    console.log("Exact disposable access companies suspended and sessions revoked; central history retained.");
  }
}
main().catch(error => { console.error(`Guardian access verification failed at ${phase} (${error instanceof Error ? error.name : "UnknownError"}); inspect securely.`); process.exitCode = 1; });
