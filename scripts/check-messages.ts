/** Opt-in central QA: existing Guardian identity, synthetic contact/chat only; no external delivery. */
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
async function main() {
  assert(
    process.platform === "linux" && process.env.ATLAS_MESSAGES_CHECK === "1",
  );
  const userId = process.env.ATLAS_GUARDIAN_USER_ID,
    organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID;
  assert(userId && organisationId && process.env.SESSION_SECRET);
  const session = await sessionForUser(organisationId, userId);
  assert(session);
  for (const capability of [
    "core.chat.read",
    "core.chat.write",
    "customers.read",
    "sales.order.read",
  ])
    assert(session.capabilities.has(capability));
  const membership = await db.membership.findUniqueOrThrow({
    where: { organisationId_userId: { organisationId, userId } },
    include: { user: true },
  });
  const token = jwt.sign(
    {
      userId,
      organisationId,
      authVersion: membership.user.authVersion,
      sessionVersion: membership.sessionVersion,
    },
    process.env.SESSION_SECRET,
    { algorithm: "HS256", expiresIn: "15m" },
  );
  const base = new URL(
    process.env.ATLAS_MESSAGES_URL || "https://atlassystem.online",
  );
  assert(
    base.protocol === "https:" ||
      ["127.0.0.1", "localhost"].includes(base.hostname),
  );
  const suffix = Date.now().toString(36),
    name = `Atlas Chat QA ${suffix}`;
  const fixture = await db.party.create({
    data: {
      organisationId,
      kind: "COMPANY",
      name,
      customerCode: `QA-CHAT-${suffix}`,
      tags: ["acceptance-fixture"],
      contacts: {
        create: {
          firstName: "Atlas Chat",
          surname: `QA ${suffix}`,
          preferredName: name,
          roles: [],
        },
      },
    },
    include: { contacts: true },
  });
  const order = await db.salesOrder.findFirstOrThrow({
    where: { organisationId },
    select: { id: true, reference: true },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      baseURL: base.origin,
      locale: "en-GB",
    });
    await context.addCookies([
      {
        name: "atlas_session",
        value: token,
        domain: base.hostname,
        path: "/",
        httpOnly: true,
        secure: base.protocol === "https:",
        sameSite: "Lax",
      },
    ]);
    const anonymous = await browser.newContext({ baseURL: base.origin });
    assert.equal(
      (
        await anonymous.request.post("/api/chat", { data: { op: "snapshot" } })
      ).status(),
      401,
    );
    assert.equal(
      (await anonymous.request.get("/chat", { maxRedirects: 0 })).status(),
      307,
    );
    await anonymous.close();
    const page = await context.newPage(),
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(30_000);
    await page.goto("/home");
    await page
      .getByRole("button", { name: "Open messages", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Messages", exact: true });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Start a new chat", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Search people", exact: true })
      .fill(name);
    await page
      .getByRole("checkbox", { name: `Add ${name}`, exact: true })
      .check();
    await page.getByRole("button", { name: "Start chat", exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    const room = await db.chatConversation.findFirstOrThrow({
      where: {
        organisationId,
        participants: { some: { contactId: fixture.contacts[0].id } },
      },
    });
    // The only recipient is the synthetic contact; contact chat has no email/external transport.
    const createdAt = new Date(Date.now() - 100_000);
    await db.chatMessage.createMany({
      data: Array.from({ length: 82 }, (_, index) => ({
        organisationId,
        conversationId: room.id,
        authorUserId: userId,
        kind: "TEXT",
        body: `QA history ${index === 0 ? "oldest needle" : index.toString().padStart(2, "0")}`,
        createdAt: new Date(createdAt.getTime() + index * 1000),
      })),
    });
    await page
      .getByRole("textbox", { name: "Message", exact: true })
      .fill("Review this order together.");
    await page
      .getByRole("button", { name: "Attach a record", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Search records to attach", exact: true })
      .fill(order.reference);
    await page
      .getByRole("dialog", { name: "Attach Atlas records" })
      .getByRole("button")
      .filter({ hasText: order.reference })
      .click();
    await page
      .getByRole("button", { name: "Done attaching records", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(
      dialog.getByText("Review this order together.", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.locator(`a[href="/sales/orders/${order.id}"]`),
    ).toBeVisible();
    const saved = await db.chatMessage.findFirstOrThrow({
      where: {
        organisationId,
        conversationId: room.id,
        body: "Review this order together.",
      },
      include: { links: true },
    });
    assert(
      saved.links.some(
        (link) =>
          link.entityType === "SALES_ORDER" && link.entityId === order.id,
      ),
    );
    await page
      .getByRole("button", { name: "Conversation details", exact: true })
      .click();
    await expect(
      page.getByRole("complementary", { name: "Conversation information" }),
    ).toContainText(name);
    await expect(
      page
        .getByRole("complementary", { name: "Conversation information" })
        .locator(`a[href="/sales/orders/${order.id}"]`),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Close conversation details", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Search message history", exact: true })
      .fill("oldest needle");
    await expect(
      dialog.getByText("QA history oldest needle", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Clear message search", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Earlier messages", exact: true })
      .click();
    await expect(
      dialog.getByText("QA history oldest needle", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Latest messages", exact: true })
      .click();
    await expect(
      dialog.getByText("Review this order together.", { exact: true }),
    ).toBeVisible();
    console.log(
      "PASS real chat creation, send, order attachment persistence, details, full-history search and pagination.",
    );
    // Participant and attachment challenges do not write.
    assert.equal(
      (
        await context.request.post("/api/chat", {
          data: {
            op: "snapshot",
            activeId: "qa-nonexistent-room",
            query: "secret",
          },
        })
      ).status(),
      400,
    );
    const forged = await context.request.post("/api/chat", {
      data: {
        op: "send",
        input: {
          conversationId: room.id,
          body: "Must not be saved",
          links: [{ type: "SALES_ORDER", id: "qa-unavailable-order" }],
        },
      },
    });
    assert.equal(forged.status(), 400);
    assert.equal(
      await db.chatMessage.count({
        where: {
          organisationId,
          conversationId: room.id,
          body: "Must not be saved",
        },
      }),
      0,
    );
    await page
      .getByRole("textbox", { name: "Message", exact: true })
      .fill("Preserve my draft");
    await page
      .getByRole("button", { name: "Close messages", exact: true })
      .click();
    await page
      .locator('nav[aria-label="Workspace utilities"]:visible')
      .getByRole("link", { name: "Messages", exact: true })
      .click();
    await expect(
      dialog.getByRole("textbox", { name: "Message", exact: true }),
    ).toHaveValue("Preserve my draft");
    for (const [device, width, height] of [
      ["desktop", 1448, 1086],
      ["tablet", 820, 1180],
      ["phone", 390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Send message", exact: true }),
      ).toBeVisible();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      const bounds = await dialog.boundingBox();
      assert(
        bounds &&
          bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= width + 1 &&
          bounds.y + bounds.height <= height + 1,
      );
      assert(
        await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
      );
      await dialog
        .getByText("Review this order together.", { exact: true })
        .scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/atlas-messages-${device}.png` });
      console.log(
        `PASS ${device}: modern pop-out, composer and record cards fit the viewport.`,
      );
    }
    await page.setViewportSize({ width: 1448, height: 1086 });
    await dialog
      .getByRole("link", { name: "Expand messages", exact: true })
      .click();
    await page.waitForURL("**/chat");
    await expect(
      page.getByRole("textbox", { name: "Message", exact: true }),
    ).toHaveValue("Preserve my draft");
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Messages", exact: true }),
    ).toHaveCount(1);
    await page.getByRole("button").filter({ hasText: name }).first().click();
    await expect(
      page.getByRole("textbox", { name: "Message", exact: true }),
    ).toBeVisible();
    assert.deepEqual(errors, []);
    console.log(
      "PASS full Messages workspace, utility entry, draft retention, blocked forged attachment and no browser errors.",
    );
    await context.close();
  } finally {
    await browser.close();
    await db.contact.updateMany({
      where: { partyId: fixture.id },
      data: { status: "INACTIVE" },
    });
    await db.party.update({
      where: { id: fixture.id },
      data: { archived: true, status: "CLOSED" },
    });
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
