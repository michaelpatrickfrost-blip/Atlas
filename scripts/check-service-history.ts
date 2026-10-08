/** Server-only synthetic acceptance. Retains audit/history and revokes fixture access. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { db } from "../src/core/db/client";
import { chromium } from "@playwright/test";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_SERVICE_HISTORY_TEST === "1" && process.env.ATLAS_RUNTIME !== "desktop", "Explicit live server acceptance required");
  const before = process.argv[2] === "before", base = "https://atlassystem.online", suffix = randomBytes(8).toString("hex"), password = randomBytes(24).toString("base64url");
  const companies: string[] = [], users: string[] = []; let checks = 0;
  const check = (value: unknown, label: string) => { assert(value, label); checks++; console.log(`PASS ${label}`); };
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  const post = async (name: string, values: Record<string, string>, cookie = "") => {
    const action = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, value]) => value.exportedName === name); assert(action, `Action ${name}`);
    const form = new FormData(); for (const [key, value] of Object.entries(values)) form.set(`_1_${key}`, value); form.set("0", '["$K1"]');
    const response = await fetch(base + (name === "loginAction" ? "/login" : "/service/tickets"), { method: "POST", headers: { Origin: base, "Next-Action": action[0], Accept: "text/x-component", ...(cookie ? { Cookie: cookie } : {}) }, body: form, redirect: "manual" });
    return { response, body: await response.text() };
  };
  const login = async (email: string) => { const result = await post("loginAction", { email, password }); const cookie = result.response.headers.get("set-cookie")?.match(/atlas_session=[^;]+/)?.[0]; assert(cookie, "Normal sign-in"); return cookie; };
  try {
    for (const name of ["inside", "outside"]) {
      const org = await db.organisation.create({ data: { name: `Synthetic service history ${name}`, slug: `service-history-${name}-${suffix}`, isTest: true } }); companies.push(org.id);
      await db.moduleState.create({ data: { organisationId: org.id, moduleId: "service", enabled: true, entitled: true } });
    }
    const organisationId = companies[0];
    const makeUser = async (name: string, caps: string[], org = organisationId) => { const user = await db.user.create({ data: { name: `Synthetic ${name}`, email: `history-${name}-${suffix}@example.test`, passwordHash: await bcrypt.hash(password, 10) } }); users.push(user.id); await db.membership.create({ data: { organisationId: org, userId: user.id, grantedCapabilities: caps } }); return user; };
    const caps = ["service.ticket.read", "service.ticket.update"];
    const worker = await makeUser("worker", caps), observer = await makeUser("observer", ["service.ticket.read"]), foreign = await makeUser("outside", caps, companies[1]);
    const owner = await makeUser("case-owner", ["service.ticket.read", "service.case.read", "service.case.update", "service.case.resolve"]);
    const party = await db.party.create({ data: { organisationId, customerCode: "HISTORY", kind: "COMPANY", name: "Synthetic historical customer" } });
    const serviceCase = await db.serviceCase.create({ data: { organisationId, partyId: party.id, number: "CS-HISTORY", subject: "Synthetic originating case", description: "CASE-CONVERSATION-MUST-STAY-PRIVATE", ownerUserId: owner.id, createdByUserId: owner.id, status: "WAITING_INTERNAL" } });
    await db.serviceEntry.create({ data: { organisationId, caseId: serviceCase.id, kind: "INTERNAL_NOTE", body: "PRIVATE-PARENT-NOTE", authorUserId: owner.id } });
    const queue = await db.serviceQueue.create({ data: { organisationId, name: "Historical Operations", department: "Operations", prefix: "HIS" } });
    await db.serviceQueueMember.createMany({ data: [worker, observer].map(user => ({ organisationId, queueId: queue.id, userId: user.id })) });
    const ticket = await db.serviceTicket.create({ data: { organisationId, caseId: serviceCase.id, queueId: queue.id, number: "HIS-OPEN", subject: "Investigate historical delivery", description: "Check the delivered quantity and report the findings.", dueAt: new Date(Date.now() - 3_600_000) } });
    await db.serviceTicket.create({ data: { organisationId, caseId: serviceCase.id, queueId: queue.id, number: "HIS-DONE", subject: "Earlier finished investigation", description: "Historical outcome", status: "COMPLETE", ownerUserId: worker.id, dueAt: new Date(), completedAt: new Date(), outcome: "Earlier issue corrected" } });
    const restrictedQueue = await db.serviceQueue.create({ data: { organisationId, name: "Restricted Historical Team", department: "Private", prefix: "PRV", restricted: true } });
    const privateTicket = await db.serviceTicket.create({ data: { organisationId, caseId: serviceCase.id, queueId: restrictedQueue.id, number: "HIS-PRIVATE", subject: "RESTRICTED-QUEUE-SECRET", description: "Restricted", dueAt: new Date() } });
    const restrictedCase = await db.serviceCase.create({ data: { organisationId, partyId: party.id, number: "CS-RESTRICTED", subject: "Restricted case", security: "RESTRICTED", ownerUserId: owner.id, createdByUserId: owner.id } });
    await db.serviceTicket.create({ data: { organisationId, caseId: restrictedCase.id, queueId: queue.id, number: "HIS-RESTRICTED-CASE", subject: "RESTRICTED-CASE-SECRET", description: "Restricted", dueAt: new Date() } });
    const workerCookie = await login(worker.email), observerCookie = await login(observer.email), foreignCookie = await login(foreign.email), ownerCookie = await login(owner.email);
    const browser = await chromium.launch({ args: ["--no-sandbox"], ...(process.env.ATLAS_CHROMIUM_PATH ? { executablePath: process.env.ATLAS_CHROMIUM_PATH } : {}) });
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await context.addCookies([{ name: "atlas_session", value: workerCookie.slice(14), url: base, httpOnly: true, secure: true }]);
      const page = await context.newPage(); let errors = 0; page.on("pageerror", () => errors++);
      await page.goto(base + "/service/tickets", { waitUntil: "domcontentloaded" });
      if (before) {
        await page.waitForURL("**/tickets"); check(page.url().endsWith("/tickets") && !(await page.locator("body").innerText()).includes(ticket.number), "REPRODUCED: historical department work redirects away from its records");
      } else {
        await page.getByRole("heading", { name: "Historical department work", exact: true }).waitFor();
        check(page.url().endsWith("/service/tickets") && await page.getByText(ticket.number, { exact: true }).count() === 1 && await page.getByText("HIS-DONE", { exact: true }).count() === 1, "Historical list shows open and completed original records without new Tickets permission");
        check(!(await page.content()).includes("RESTRICTED-QUEUE-SECRET") && !(await page.content()).includes("RESTRICTED-CASE-SECRET"), "List hides restricted queue and restricted case work");
        await page.getByRole("link", { name: new RegExp(ticket.number) }).click();
        await page.getByRole("heading", { name: ticket.subject, exact: true }).waitFor();
        check(!(await page.content()).includes("PRIVATE-PARENT-NOTE") && !(await page.content()).includes("CASE-CONVERSATION-MUST-STAY-PRIVATE") && await page.locator(`a[href="/service/cases/${serviceCase.id}"]`).count() === 0, "Department responder receives ticket context without private parent conversation or inaccessible case link");
        await page.getByRole("combobox", { name: /^Status/ }).selectOption("IN_PROGRESS"); await page.getByLabel("Assign this ticket to me").check();
        await page.getByRole("button", { name: "Save progress", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Saved." }).waitFor();
        check((await db.serviceTicket.findUniqueOrThrow({ where: { id: ticket.id } })).ownerUserId === worker.id, "Historical responder takes ownership and saves progress through real browser form");
        await page.reload({ waitUntil: "domcontentloaded" }); await page.getByRole("combobox", { name: /^Status/ }).selectOption("COMPLETE");
        await page.getByLabel("Outcome / reason", { exact: true }).fill("Delivered quantity reconciled with the warehouse.");
        await page.getByLabel("Customer-safe summary", { exact: true }).fill("We checked and corrected the delivery record.");
        await page.getByRole("button", { name: "Save progress", exact: true }).click();
        await page.getByText("This ticket is complete.", { exact: true }).waitFor();
        const done = await db.serviceTicket.findUniqueOrThrow({ where: { id: ticket.id } });
        check(done.status === "COMPLETE" && !!done.completedAt && done.customerSafeSummary?.includes("corrected"), "Historical completion records outcome, safe summary and completion time");
        const parent = await db.serviceCase.findUniqueOrThrow({ where: { id: serviceCase.id } });
        check(parent.ownerUserId === owner.id && parent.status === "WAITING_INTERNAL" && await db.serviceEntry.count({ where: { organisationId, ticketId: ticket.id, kind: "DEPARTMENT_RESPONSE_READY" } }) === 1, "Completion notifies the original case without transferring ownership or resolving it");
        await page.setViewportSize({ width: 390, height: 844 }); check(await page.locator("main").evaluate(element => element.scrollWidth <= element.clientWidth), "Historical ticket detail fits a phone viewport");
        check(errors === 0, "Historical journey has no browser runtime errors");
        for (const [cookie, path, visible] of [[observerCookie, `/service/tickets/${ticket.id}`, true], [foreignCookie, `/service/tickets/${ticket.id}`, false], [workerCookie, `/service/tickets/${privateTicket.id}`, false]] as const) {
          const other = await browser.newContext(); await other.addCookies([{ name: "atlas_session", value: cookie.slice(14), url: base, httpOnly: true, secure: true }]); const view = await other.newPage();
          await view.goto(base + path, { waitUntil: "domcontentloaded" });
          check((await view.locator("body").innerText()).includes(ticket.subject) === visible && await view.getByRole("button", { name: "Save progress", exact: true }).count() === 0, "Read-only/foreign/restricted detail access preserves scope and mutation permissions"); await other.close();
        }
        const denied = await post("updateDepartmentTicket", { ticketId: ticket.id, version: String(done.version), status: "IN_PROGRESS" }, observerCookie);
        check(/(?:^|\n)\w+:E\{/.test(denied.body) || denied.response.status >= 400, "Read-only user cannot bypass update permission through the action endpoint");
        const ownerView = await browser.newContext(); await ownerView.addCookies([{ name: "atlas_session", value: ownerCookie.slice(14), url: base, httpOnly: true, secure: true }]); const ownerPage = await ownerView.newPage();
        await ownerPage.goto(`${base}/service/cases/${serviceCase.id}`, { waitUntil: "domcontentloaded" }); await ownerPage.getByRole("tab", { name: /^Linked work/ }).click();
        check(await ownerPage.locator(`a[href="/service/tickets/${ticket.id}"]`).count() === 1, "Case Linked work opens its exact historical departmental ticket"); await ownerView.close();
      }
      await context.close();
    } finally { await browser.close(); }
    console.log(`${before ? "REPRODUCTION" : "LIVE HISTORICAL WORK ACCEPTANCE"} PASSED: ${checks} assertions`);
  } finally {
    for (const id of companies) await db.organisation.update({ where: { id }, data: { status: "SUSPENDED" } });
    await db.membership.updateMany({ where: { userId: { in: users } }, data: { active: false, sessionVersion: { increment: 1 }, grantedCapabilities: [] } });
    await db.user.updateMany({ where: { id: { in: users } }, data: { authVersion: { increment: 1 }, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) } });
    await db.$disconnect(); console.log("Synthetic tenants suspended and credentials revoked; central history retained.");
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Acceptance failed"); process.exitCode = 1; });
