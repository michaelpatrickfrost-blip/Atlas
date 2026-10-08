/** Explicit central synthetic workflow. No existing company or customer messages. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { deploymentGuard } from "./deployment-guard";

let phase = "configuration";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_QUERY_TEST === "1" && process.env.ATLAS_RUNTIME !== "desktop");
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const stable = deploymentGuard(process.cwd(), revision), reproduce = process.argv.includes("--reproduce");
  const base = "https://atlassystem.online", suffix = randomBytes(12).toString("hex"), slug = `guardian-query-${suffix}`;
  const privateText = `PRIVATE-SYNTHETIC-CASE-${suffix}`, internalText = `PRIVATE-SYNTHETIC-TEAM-${suffix}`;
  let fixture: { organisationId: string; userIds: string[] } | undefined;
  const browser = await chromium.launch({ headless: true });
  try {
    stable(); phase = "disposable central fixture";
    const seeded = await db.$transaction(async tx => {
      const org = await tx.organisation.create({ data: { name: "Disposable Guardian query verification", slug, isTest: true, moduleStates: { create: { moduleId: "service", enabled: true, entitled: true } } } });
      const userIds: string[] = [];
      const makeUser = async (role: string, caps: string[]) => {
        const user = await tx.user.create({ data: { name: `Guardian query ${role}`, email: `guardian-query-${role}-${suffix}@example.test`, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) } });
        userIds.push(user.id);
        const member = await tx.membership.create({ data: { organisationId: org.id, userId: user.id, grantedCapabilities: ["core.profile.self", ...caps] } });
        return { id: user.id, token: jwt.sign({ userId: user.id, organisationId: org.id, authVersion: user.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET!, { algorithm: "HS256", expiresIn: "15m" }) };
      };
      const requester = await makeUser("requester", ["service.case.read", "service.ticket.read", "service.ticket.create"]);
      const agent = await makeUser("agent", ["service.ticket.read", "service.ticket.update"]);
      const queue = await tx.serviceQueue.create({ data: { organisationId: org.id, name: "Guardian receiving team", department: "QA", prefix: "QAT" } });
      await tx.serviceQueueMember.create({ data: { organisationId: org.id, queueId: queue.id, userId: agent.id } });
      const party = await tx.party.create({ data: { organisationId: org.id, customerCode: "GUARDIAN", name: "Synthetic query customer", kind: "COMPANY" } });
      const origin = await tx.serviceCase.create({ data: { organisationId: org.id, partyId: party.id, number: "CS-GUARDIAN", subject: "Guardian originating case", description: privateText, ownerUserId: requester.id, createdByUserId: requester.id } });
      await tx.serviceEntry.create({ data: { organisationId: org.id, caseId: origin.id, kind: "INTERNAL_NOTE", body: privateText, authorUserId: requester.id } });
      fixture = { organisationId: org.id, userIds };
      return { organisationId: org.id, queue, origin, requester, agent };
    });
    const makeContext = async (token: string) => {
      const context = await browser.newContext({ baseURL: base });
      await context.addCookies([{ name: "atlas_session", value: token, domain: "atlassystem.online", path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
      await context.route("**/api/guardian/telemetry", route => route.fulfill({ status: 204 }));
      return context;
    };
    const requesterContext = await makeContext(seeded.requester.token), agentContext = await makeContext(seeded.agent.token);
    let errors = 0;
    for (const context of [requesterContext, agentContext]) context.on("page", page => page.on("pageerror", () => errors++));
    const requester = await requesterContext.newPage(), agent = await agentContext.newPage();
    phase = "origin case query creation";
    await requester.goto(`/service/cases/${seeded.origin.id}`, { waitUntil: "networkidle" });
    await expect(requester.getByRole("heading", { name: seeded.origin.subject, exact: true })).toBeVisible();
    await requester.getByRole("tab", { name: /^Linked work/ }).click();
    await requester.getByLabel("What do you need from this team?", { exact: true }).fill("Guardian linked query proof");
    await requester.getByLabel("Details and requested action", { exact: true }).fill("Check the synthetic receiving record and return findings.");
    await requester.getByRole("button", { name: "Create linked query", exact: true }).click();
    await expect(requester.getByRole("heading", { name: "Guardian linked query proof", exact: true })).toBeVisible();
    const query = await db.serviceWorkItem.findFirstOrThrow({ where: { organisationId: seeded.organisationId, kind: "QUERY" } });
    assert.equal(new URL(requester.url()).pathname, `/service/queries/${query.id}`);
    assert.equal(query.parentCaseId, seeded.origin.id); assert.equal(query.queueId, seeded.queue.id); assert.equal(query.requesterUserId, seeded.requester.id);
    const parentAfterCreate = await db.serviceCase.findUniqueOrThrow({ where: { id: seeded.origin.id } });
    assert.equal(parentAfterCreate.status, "WAITING_INTERNAL"); assert.equal(parentAfterCreate.ownerUserId, seeded.requester.id);
    console.log("PASS real case form creates its exact linked query, queue, requester and waiting parent without transferring case ownership.");

    phase = "receiving team list and privacy";
    await agent.goto("/service/queries", { waitUntil: "networkidle" });
    await agent.getByRole("link", { name: /Guardian linked query proof/ }).click();
    await expect(agent.getByRole("heading", { name: query.subject, exact: true })).toBeVisible();
    assert(!(await agent.content()).includes(privateText));
    await expect(agent.locator(`a[href="/service/cases/${seeded.origin.id}"]`)).toHaveCount(0);
    console.log("PASS query list/detail link opens and receiving team cannot read the parent conversation or navigate to its private case.");
    const progress = agent.getByRole("button", { name: "Update work", exact: true }).locator("xpath=ancestor::form");
    phase = "assign query";
    await progress.getByRole("combobox", { name: /^Status/ }).selectOption("IN_PROGRESS");
    await progress.getByRole("combobox", { name: /^Owner/ }).selectOption(seeded.agent.id);
    await progress.getByRole("button", { name: "Update work", exact: true }).click();
    await expect(progress.getByRole("status")).toHaveText("Saved.");
    assert.equal((await db.serviceWorkItem.findUniqueOrThrow({ where: { id: query.id } })).ownerUserId, seeded.agent.id);
    console.log("PASS receiving agent assignment persists through the real Update work button.");
    phase = "unassign query";
    await progress.getByRole("combobox", { name: /^Owner/ }).selectOption("");
    await progress.getByRole("button", { name: "Update work", exact: true }).click();
    await expect(progress.getByRole("status")).toHaveText("Saved.");
    const unassigned = await db.serviceWorkItem.findUniqueOrThrow({ where: { id: query.id } });
    if (reproduce) {
      assert.equal(unassigned.ownerUserId, seeded.agent.id);
      console.log("REPRODUCED Unassigned + Update work reports Saved but retains the previous central owner.");
      stable(); return;
    }
    assert.equal(unassigned.ownerUserId, null);
    assert.equal(await db.serviceWorkEntry.count({ where: { organisationId: seeded.organisationId, workId: query.id, body: { contains: `Owner: ${seeded.agent.id} → unassigned.` } } }), 1);
    await agent.reload({ waitUntil: "networkidle" });
    await expect(progress.getByRole("combobox", { name: /^Owner/ })).toHaveValue("");
    await expect(agent.getByText(/^Owner: Unassigned/)).toBeVisible();
    console.log("PASS Unassigned persists after reload and exact ownership-change history is central.");

    phase = "reply and internal note";
    const reply = agent.getByRole("button", { name: "Add reply", exact: true }).locator("xpath=ancestor::form");
    await reply.getByLabel("Reply or investigation note", { exact: true }).fill("Guardian receiving findings ready");
    await reply.getByRole("button", { name: "Add reply", exact: true }).click();
    await expect(agent.getByText("Guardian receiving findings ready", { exact: true })).toBeVisible();
    assert.equal(await db.serviceWorkEntry.count({ where: { organisationId: seeded.organisationId, workId: query.id, body: "Guardian receiving findings ready", visibility: "REQUESTER" } }), 1);
    assert((await db.serviceWorkItem.findUniqueOrThrow({ where: { id: query.id } })).firstResponseAt);
    await reply.getByRole("combobox", { name: /^Visibility/ }).selectOption("INTERNAL");
    await reply.getByLabel("Reply or investigation note", { exact: true }).fill(internalText);
    await reply.getByRole("button", { name: "Add reply", exact: true }).click();
    await expect(agent.getByText(internalText, { exact: true })).toBeVisible();
    await requester.reload({ waitUntil: "networkidle" });
    await expect(requester.getByText("Guardian receiving findings ready", { exact: true })).toBeVisible();
    assert(!(await requester.content()).includes(internalText));
    console.log("PASS reply records the first response; receiving-team note stays private from the requester payload.");

    phase = "resolve query and connected parent";
    await progress.getByRole("combobox", { name: /^Status/ }).selectOption("RESOLVED");
    await progress.getByLabel("Resolution / reason", { exact: true }).fill("Synthetic investigation complete");
    await progress.getByRole("button", { name: "Update work", exact: true }).click();
    await expect(progress.getByRole("status")).toHaveText("Saved.");
    const resolved = await db.serviceWorkItem.findUniqueOrThrow({ where: { id: query.id } });
    assert.equal(resolved.status, "RESOLVED"); assert(resolved.resolvedAt && resolved.resolutionDueAt);
    assert.equal(resolved.ownerUserId, null);
    const parent = await db.serviceCase.findUniqueOrThrow({ where: { id: seeded.origin.id } });
    assert.equal(parent.status, "WAITING_INTERNAL"); assert.equal(parent.ownerUserId, seeded.requester.id); assert.equal(parent.resolvedAt, null);
    assert.equal(await db.serviceEntry.count({ where: { organisationId: seeded.organisationId, caseId: parent.id, kind: "LINKED_QUERY_RESOLVED" } }), 1);
    await requester.reload({ waitUntil: "networkidle" });
    await requester.getByRole("link", { name: "Originating customer case →", exact: true }).click();
    await expect(requester.getByText("Update customer — team response ready", { exact: true })).toBeVisible();
    await requester.getByRole("tab", { name: /^Linked work/ }).click();
    await requester.locator(`a[href="/service/queries/${query.id}"]`).click();
    await expect(requester.getByRole("heading", { name: query.subject, exact: true })).toBeVisible();
    console.log("PASS resolution returns a safe parent event and response-ready prompt; both case/query links work without resolving the parent.");

    phase = "reports and navigation";
    await requester.goto("/service/reports", { waitUntil: "networkidle" });
    await expect(requester.getByRole("heading", { name: "Service performance", exact: true })).toBeVisible();
    await expect(requester.getByText("1/1 completed within resolution target", { exact: true })).toBeVisible();
    await expect(requester.getByText(seeded.queue.name, { exact: true })).toBeVisible();
    await requester.getByRole("link", { name: "Open underlying records →", exact: true }).click();
    await expect(requester).toHaveURL(`${base}/service/cases`);
    await agent.getByRole("link", { name: "← Queries", exact: true }).click();
    await expect(agent).toHaveURL(`${base}/service/queries`);
    assert.equal(errors, 0); stable();
    console.log("PASS Service reports reflect the completed linked record; reports/cases and query back links work with zero browser errors.");
  } finally {
    await browser.close();
    if (fixture) await db.$transaction(async tx => {
      await tx.organisation.findFirstOrThrow({ where: { id: fixture!.organisationId, slug, isTest: true } });
      await tx.organisation.update({ where: { id: fixture!.organisationId }, data: { status: "SUSPENDED", name: "Retired Guardian query verification" } });
      await tx.membership.updateMany({ where: { organisationId: fixture!.organisationId }, data: { active: false, sessionVersion: { increment: 1 } } });
      await tx.user.updateMany({ where: { id: { in: fixture!.userIds } }, data: { authVersion: { increment: 1 } } });
    });
    await db.$disconnect();
    console.log("Exact synthetic company suspended and sessions revoked; central records/audit retained.");
  }
}
main().catch(error => { console.error(`Guardian query check failed at ${phase} (${error instanceof Error ? error.name : "UnknownError"}); inspect securely. No private content or credentials logged.`); process.exitCode = 1; });
