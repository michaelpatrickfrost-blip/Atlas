/** Central QA, own synthetic task fixtures only; source business records are read-only. */
import assert from "node:assert/strict";
import { mkdtemp, chmod } from "node:fs/promises";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_TASKS_CHECK === "1");
  const userId = process.env.ATLAS_GUARDIAN_USER_ID!, organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID!;
  assert(userId && organisationId && process.env.SESSION_SECRET);
  const session = await sessionForUser(organisationId, userId); assert(session && session.capabilities.has("projects.manage") && session.capabilities.has("projects.read"));
  const membership = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId, userId } }, include: { user: true } });
  const token = jwt.sign({ userId, organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "20m" });
  const base = new URL(process.env.ATLAS_TASKS_URL || "https://atlassystem.online"); assert(base.protocol === "https:" || base.hostname === "127.0.0.1");
  const evidence = await mkdtemp("/tmp/atlas-tasks-browser-"); await chmod(evidence, 0o700); console.log(`Private screenshots: ${evidence}`);
  const suffix = Date.now().toString(36), title = `Task popout QA ${suffix}`;
  const task = await db.projectTask.create({ data: { organisationId, assigneeUserId: userId, creatorUserId: userId, visibility: "PRIVATE", title, description: "Check the installation notes before completion.", tags: ["acceptance-fixture"], checklist: { create: { organisationId, title: "Required QA checkpoint" } }, comments: { create: { organisationId, authorUserId: userId, body: "QA discussion note appears inside the task." } } } });
  const other = await db.projectTask.create({ data: { organisationId, assigneeUserId: "qa-unassigned-sentinel", creatorUserId: userId, visibility: "PRIVATE", title: `Not assigned QA ${suffix}`, tags: ["acceptance-fixture"] } });
  const order = await db.salesOrder.findFirst({ where: { organisationId }, select: { id: true, reference: true } });
  if (order) await db.projectWorkLink.create({ data: { organisationId, taskId: task.id, targetEntity: "SalesOrder", targetId: order.id } });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ baseURL: base.origin });
    await context.addCookies([{ name: "atlas_session", value: token, domain: base.hostname, path: "/", httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
    const page = await context.newPage();
    for (const width of [320, 390, 820, 1448]) {
      await page.setViewportSize({ width, height: 980 }); await page.goto("/home", { waitUntil: "networkidle" });
      await expect(page.getByRole("button", { name: "Open my tasks", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Open messages", exact: true })).toBeVisible();
      await page.locator('nav[aria-label="Workspace utilities"]').getByRole("link", { name: /My tasks/ }).click();
      assert(new URL(page.url()).pathname === "/home");
      const panel = page.getByRole("dialog", { name: "My tasks", exact: true }); await expect(panel).toBeVisible();
      await expect.poll(() => panel.evaluate((node) => { const r = node.getBoundingClientRect(); return r.width <= 561 && Math.abs(innerWidth - r.right - (innerWidth < 640 ? 8 : 16)) < 2; }), { message: `Tasks is a right-hand drawer at ${width}` }).toBe(true);
      await panel.getByRole("textbox", { name: "Find my tasks" }).fill(suffix);
      await expect(panel.getByRole("button", { name: new RegExp(title) })).toBeVisible();
      await expect(panel.getByRole("button", { name: new RegExp(other.title) })).toHaveCount(0);
      await panel.getByRole("button", { name: new RegExp(title) }).click();
      await expect(panel.getByText(task.description, { exact: true })).toBeVisible();
      await expect(panel.getByText("QA discussion note appears inside the task.")).toBeVisible();
      if (order) await expect(panel.getByRole("link", { name: new RegExp(order.reference) })).toBeVisible();
      assert(await panel.evaluate((node) => { const r = node.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && node.scrollWidth <= node.clientWidth; }), `Panel fits ${width}`);
      await page.screenshot({ path: `${evidence}/tasks-${width}.png` });
      await panel.getByRole("button", { name: "Back to tasks" }).click();
      await expect(panel.getByRole("textbox", { name: "Find my tasks" })).toHaveValue(suffix);
      await panel.getByRole("button", { name: new RegExp(title) }).click();
      await expect(panel.getByText(task.description, { exact: true })).toBeVisible();
      if (width === 1448) {
        await panel.getByRole("combobox", { name: "Task status" }).selectOption("DONE"); await expect(panel.getByRole("alert")).toBeVisible();
        assert.equal((await db.projectTask.findUniqueOrThrow({ where: { id: task.id } })).status, "TODO");
        await db.projectChecklistItem.updateMany({ where: { organisationId, taskId: task.id }, data: { done: true } });
        await panel.getByRole("combobox", { name: "Task status" }).selectOption("IN_PROGRESS"); await expect(panel.getByText("Status saved.", { exact: true })).toBeVisible();
        assert.equal((await db.projectTask.findUniqueOrThrow({ where: { id: task.id } })).status, "IN_PROGRESS");
        await panel.getByRole("combobox", { name: "Task status" }).selectOption("DONE"); await expect(panel.getByText("Status saved.", { exact: true })).toBeVisible();
        await expect.poll(async () => (await db.projectTask.findUniqueOrThrow({ where: { id: task.id } })).status).toBe("DONE");
      }
      if (width === 1448) await expect(panel.getByRole("combobox", { name: "Task status" })).toBeEnabled();
      await page.keyboard.press("Escape"); await expect(panel).not.toBeVisible();
      await page.getByRole("button", { name: "Open messages", exact: true }).click();
      const messages = page.getByRole("dialog", { name: "Messages", exact: true }); await expect(messages).toBeVisible();
      await expect.poll(() => messages.evaluate((node) => { const r = node.getBoundingClientRect(); return r.width <= 561 && Math.abs(innerWidth - r.right - (innerWidth < 640 ? 8 : 16)) < 2 && node.scrollWidth <= node.clientWidth; })).toBe(true);
      await page.screenshot({ path: `${evidence}/messages-${width}.png` });
      await messages.getByRole("button", { name: "Close messages", exact: true }).click(); await expect(messages).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Open messages", exact: true })).toBeFocused();
      await page.getByRole("button", { name: "Open messages", exact: true }).click();
      await expect(messages).toBeVisible();
      await expect.poll(() => messages.evaluate((node) => Math.abs(innerWidth - node.getBoundingClientRect().right - (innerWidth < 640 ? 8 : 16)) < 2)).toBe(true);
      await page.mouse.click(1, 200); await expect(messages).not.toBeVisible();
    }
    await page.setViewportSize({ width: 320, height: 980 });
    await page.goto("/customers", { waitUntil: "networkidle" });
    for (const label of ["Open my tasks", "Open messages"]) {
      const control = page.getByRole("button", { name: label, exact: true }); await expect(control).toBeVisible();
      assert(await control.evaluate((node) => { const r = node.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= 112; }), `${label} fits narrow workspace header`);
    }
    await page.getByRole("button", { name: "Open my tasks", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "My tasks" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open my tasks", exact: true })).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Open my tasks", exact: true }).click();
    const reduced = page.getByRole("dialog", { name: "My tasks", exact: true }); await expect(reduced).toBeVisible();
    assert(await reduced.evaluate((node) => node.getAnimations().every((animation) => animation.effect?.getTiming().duration === 0)), "Reduced motion removes drawer movement");
    await reduced.getByRole("button", { name: "Close my tasks" }).click(); await expect(reduced).not.toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const release = await context.request.get("/api/health/release"); assert.equal((await release.json()).revision, process.env.ATLAS_TEST_REVISION);
    console.log("PASS Right-hand Tasks/Messages drawers, reduced motion, close/focus/back navigation, Tasks buttons, assigned-only search, notes, discussion, attached records, guarded completion, persisted status, Escape and 320/390/820/1448 layouts.");
  } finally {
    await browser.close(); await db.projectTask.updateMany({ where: { id: { in: [task.id, other.id] }, organisationId }, data: { status: "CANCELLED", completedAt: new Date() } }); await db.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
