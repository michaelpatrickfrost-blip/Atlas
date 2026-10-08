/** Explicit central fixture test. Never edits an existing company, user or permission. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { deploymentGuard } from "./deployment-guard";
import { execFileSync } from "node:child_process";

let phase = "configuration";
async function main() {
  assert(process.env.ATLAS_GUARDIAN_TICKET_TEST === "1" && process.platform === "linux" && process.env.ATLAS_RUNTIME !== "desktop", "Explicit Linux server fixture opt-in required.");
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const stable = deploymentGuard(process.cwd(), revision);
  const reproduce = process.argv.includes("--reproduce");
  const suffix = randomBytes(12).toString("hex");
  const slug = `guardian-ticket-check-${suffix}`;
  const base = "https://atlassystem.online";
  let fixture: { organisationId: string; userId: string } | undefined;
  const browser = await chromium.launch({ headless: true });
  try {
    stable(); phase = "disposable fixture";
    const { organisation, user, member } = await db.$transaction(async tx => {
      const organisation = await tx.organisation.create({ data: { name: "Disposable Guardian Tickets verification", slug, isTest: true, moduleStates: { create: { moduleId: "tickets", enabled: true, entitled: true } } } });
      const user = await tx.user.create({ data: { name: "Guardian Tickets fixture agent", email: `guardian-ticket-${suffix}@example.test`, passwordHash: await bcrypt.hash(randomBytes(32).toString("base64url"), 10) } });
      const member = await tx.membership.create({ data: { organisationId: organisation.id, userId: user.id, grantedCapabilities: ["core.profile.self", "tickets.ticket.read", "tickets.ticket.create", "tickets.ticket.manage", "tickets.ticket.reply", "tickets.ticket.watch", "tickets.queue.read", "tickets.queue.manage"] } });
      return { organisation, user, member };
    });
    fixture = { organisationId: organisation.id, userId: user.id };
    const token = jwt.sign({ userId: user.id, organisationId: organisation.id, authVersion: user.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "15m" });
    const context = await browser.newContext({ baseURL: base });
    await context.addCookies([{ name: "atlas_session", value: token, domain: "atlassystem.online", path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
    await context.route("**/api/guardian/telemetry", route => route.fulfill({ status: 204 }));
    let errors = 0;
    context.on("page", page => page.on("pageerror", () => errors++));
    const page = await context.newPage();
    phase = "queue page request";
    const response = await page.goto("/tickets/queues", { waitUntil: "networkidle" });
    console.log(`Queue response status: ${response?.status()}; login redirect: ${new URL(page.url()).pathname === "/login"}.`);
    assert.equal(response?.status(), 200);
    phase = "queue workspace heading";
    await expect(page.getByRole("heading", { name: "Teams & queues", exact: true })).toBeVisible();
    phase = "new queue fields";
    const create = page.getByRole("button", { name: "Create queue", exact: true }).locator("xpath=ancestor::form");
    await create.getByLabel("Queue name", { exact: true }).fill("Guardian queue");
    await create.getByLabel("Department", { exact: true }).fill("QA");
    phase = "new queue submit";
    await create.getByRole("button", { name: "Create queue", exact: true }).click();
    phase = "created queue render";
    await expect(page.getByRole("heading", { name: "Guardian queue", exact: true })).toBeVisible();
    const queue = await db.serviceQueue.findFirstOrThrow({ where: { organisationId: organisation.id, name: "Guardian queue" } });
    assert.equal(await db.serviceQueueMember.count({ where: { organisationId: organisation.id, queueId: queue.id, userId: user.id } }), 1);
    console.log("PASS formerly blank queue page renders; Create queue saves its own company and membership.");
    const card = page.getByRole("heading", { name: "Guardian queue", exact: true }).locator("..");
    await card.getByText("Configure queue", { exact: true }).click();
    await card.getByLabel("Queue name", { exact: true }).fill("Retained draft queue");

    phase = "concurrent queue edit";
    const other = await context.newPage();
    await other.goto("/tickets/queues", { waitUntil: "networkidle" });
    const otherCard = other.getByRole("heading", { name: "Guardian queue", exact: true }).locator("..");
    const otherForm = other.locator(`form:has(input[name="queueId"][value="${queue.id}"])`);
    await otherCard.getByText("Configure queue", { exact: true }).click();
    await otherCard.getByLabel("Queue name", { exact: true }).fill("Concurrent saved queue");
    await otherCard.getByRole("button", { name: "Save queue", exact: true }).click();
    await expect(otherForm.getByRole("status")).toHaveText("Saved.");
    assert.equal((await db.serviceQueue.findUniqueOrThrow({ where: { id: queue.id } })).name, "Concurrent saved queue");
    phase = "stale edit rejection";
    await card.getByRole("button", { name: "Save queue", exact: true }).click();
    await expect(card.getByRole("alert")).toBeVisible();
    const retained = await card.getByLabel("Queue name", { exact: true }).inputValue();
    assert.equal((await db.serviceQueue.findUniqueOrThrow({ where: { id: queue.id } })).name, "Concurrent saved queue", "Rejected stale write preserves the newer record.");
    if (reproduce) {
      assert.notEqual(retained, "Retained draft queue", "Pre-fix form loses its rejected draft.");
      console.log("REPRODUCED rejected Save queue discards the entered draft; newer central state remains protected.");
      return;
    }
    assert.equal(retained, "Retained draft queue", "Rejected form keeps the entered draft.");
    console.log("PASS rejected stale queue edit preserves the draft and the newer central record.");

    phase = "queue retry";
    await page.reload({ waitUntil: "networkidle" });
    const refreshed = page.getByRole("heading", { name: "Concurrent saved queue", exact: true }).locator("..");
    await refreshed.getByText("Configure queue", { exact: true }).click();
    await refreshed.getByLabel("Queue name", { exact: true }).fill("Retained draft queue");
    await refreshed.getByRole("button", { name: "Save queue", exact: true }).click();
    await expect(page.locator(`form:has(input[name="queueId"][value="${queue.id}"])`).getByRole("status")).toHaveText("Saved.");
    assert.equal((await db.serviceQueue.findUniqueOrThrow({ where: { id: queue.id } })).name, "Retained draft queue");
    console.log("PASS refreshed queue edit saves successfully with visible feedback.");

    phase = "ticket creation and detail";
    await page.goto("/tickets/create", { waitUntil: "networkidle" });
    await page.getByLabel("Subject", { exact: true }).fill("Guardian ticket detail proof");
    await page.getByLabel("Details and requested action", { exact: true }).fill("Disposable fixture request; no customer or external message.");
    await page.getByRole("button", { name: "Create ticket", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Guardian ticket detail proof", exact: true })).toBeVisible();
    const ticket = await db.serviceWorkItem.findFirstOrThrow({ where: { organisationId: organisation.id, subject: "Guardian ticket detail proof" } });
    assert.equal(new URL(page.url()).pathname, `/tickets/${ticket.id}`);
    assert.equal(ticket.queueId, queue.id);
    assert.equal(ticket.requesterUserId, user.id);
    assert(ticket.firstResponseDueAt && ticket.resolutionDueAt);
    console.log("PASS Create ticket navigates to the formerly blank detail route with correct queue, requester and deadlines.");
    phase = "ticket controls";
    await page.getByRole("button", { name: "Follow updates", exact: true }).click();
    await expect(page.getByRole("button", { name: "Stop following", exact: true })).toBeVisible();
    assert((await db.serviceWorkItem.findUniqueOrThrow({ where: { id: ticket.id } })).watcherIds.includes(user.id));
    await page.getByLabel("Reply or investigation note", { exact: true }).fill("Disposable Guardian reply evidence");
    await page.getByRole("button", { name: "Add reply", exact: true }).click();
    await expect(page.getByText("Disposable Guardian reply evidence", { exact: true })).toBeVisible();
    assert.equal(await db.serviceWorkEntry.count({ where: { organisationId: organisation.id, workId: ticket.id, actorUserId: user.id, body: "Disposable Guardian reply evidence" } }), 1);
    await page.getByRole("link", { name: "← Tickets", exact: true }).click();
    await expect(page).toHaveURL(`${base}/tickets`);
    await page.getByRole("link", { name: /Guardian ticket detail proof/ }).click();
    await expect(page.getByRole("heading", { name: "Guardian ticket detail proof", exact: true })).toBeVisible();
    assert.equal(errors, 0);
    stable();
    console.log("PASS follow/reply controls persist exact state; list/detail links work with zero browser errors.");
  } finally {
    await browser.close();
    if (fixture) {
      await db.$transaction(async tx => {
        await tx.organisation.findFirstOrThrow({ where: { id: fixture!.organisationId, slug, isTest: true } });
        await tx.organisation.update({ where: { id: fixture!.organisationId }, data: { status: "SUSPENDED", name: "Retired Guardian Tickets verification" } });
        await tx.membership.updateMany({ where: { organisationId: fixture!.organisationId }, data: { active: false, sessionVersion: { increment: 1 } } });
        await tx.user.update({ where: { id: fixture!.userId }, data: { authVersion: { increment: 1 } } });
      });
      console.log("Exact disposable company suspended and all fixture sessions revoked; central acceptance evidence retained.");
    }
    await db.$disconnect();
  }
}
main().catch(error => { console.error(`Guardian Tickets check failed at ${phase} (${error instanceof Error ? error.name : "UnknownError"}); inspect securely. No customer content or credentials logged.`); process.exitCode = 1; });
