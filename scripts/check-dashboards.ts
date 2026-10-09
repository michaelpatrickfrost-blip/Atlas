/** Opt-in acceptance on central Guardian QA membership. Only synthetic personal boards are written. */
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
import { reportDatasets } from "../src/core/reports/catalogue";
import {
  readWidgets,
  readBoardSettings,
  DASHBOARD_PREFIX,
} from "../src/modules/analytics/definition";
async function main() {
  assert(
    process.platform === "linux" && process.env.ATLAS_DASHBOARD_CHECK === "1",
  );
  const userId = process.env.ATLAS_GUARDIAN_USER_ID,
    organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID;
  assert(userId && organisationId && process.env.SESSION_SECRET);
  const session = await sessionForUser(organisationId, userId);
  assert(session);
  for (const c of ["analytics.dashboard.read", "analytics.dashboard.manage"])
    assert(session.capabilities.has(c));
  const member = await db.membership.findUniqueOrThrow({
    where: { organisationId_userId: { organisationId, userId } },
    include: { user: true },
  });
  const token = jwt.sign(
    {
      userId,
      organisationId,
      authVersion: member.user.authVersion,
      sessionVersion: member.sessionVersion,
    },
    process.env.SESSION_SECRET,
    { algorithm: "HS256", expiresIn: "20m" },
  );
  const base = new URL(
    process.env.ATLAS_DASHBOARD_URL || "https://atlassystem.online",
  );
  assert(base.protocol === "https:" || base.hostname === "127.0.0.1");
  const sources = await reportDatasets(session),
    customers = sources.find((d) => d.id === "customers.records"),
    finance = sources.find(
      (d) =>
        d.source === "Finance" &&
        !d.summary &&
        d.columns.some((c) => c.type === "money"),
    );
  assert(customers && finance);
  const amount = finance.columns.find((c) => c.type === "money")!,
    prefix = `Dashboard QA ${Date.now().toString(36)}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      baseURL: base.origin,
      locale: "en-GB",
      viewport: { width: 1440, height: 1000 },
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
      (await anonymous.request.get("/analytics", { maxRedirects: 0 })).status(),
      307,
    );
    await anonymous.close();
    const page = await context.newPage(),
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(30000);
    await page.goto("/home");
    const nav = page.getByRole("navigation", { name: "Workspace utilities" });
    await expect(nav.getByRole("link", { name: "Dashboards" })).toBeVisible();
    assert.equal(
      await page
        .getByRole("navigation", { name: "Apps", exact: true })
        .getByRole("link", { name: /^Dashboards/ })
        .count(),
      0,
    );
    await nav.getByRole("link", { name: "Dashboards" }).click();
    await expect(
      page.getByRole("heading", { name: /Your business/ }),
    ).toBeVisible();
    await page.screenshot({ path: "/tmp/atlas-dashboards-gallery.png" });
    await page
      .getByRole("button", { name: "New dashboard", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Widget library" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Dashboard name", exact: true })
      .fill(prefix);
    await page
      .getByRole("combobox", { name: "Dashboard refresh", exact: true })
      .selectOption("0");
    await page
      .getByRole("button", { name: "Build from records", exact: true })
      .click();
    await page
      .getByRole("region", { name: "Widget library" })
      .getByRole("button")
      .filter({ hasText: customers.name })
      .click();
    await page
      .getByRole("combobox", { name: "Group by", exact: true })
      .selectOption("status");
    await page
      .getByRole("textbox", { name: "Chart title", exact: true })
      .fill("Customer lifecycle");
    await page
      .getByRole("button", { name: "Number visual", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Widget height", exact: true })
      .selectOption("compact");
    await page
      .getByRole("combobox", { name: "Widget width", exact: true })
      .selectOption("6");
    await page
      .getByRole("button", { name: "teal colour", exact: true })
      .click();
    const first = page.locator("[data-widget-id]").first();
    await expect(
      first.getByText("Loading matching data…", { exact: true }),
    ).toHaveCount(0);
    await expect(
      first
        .locator("p")
        .filter({ hasText: /records/ })
        .last(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Duplicate", exact: true }).click();
    assert.equal(await page.locator("[data-widget-id]").count(), 2);
    await page.getByRole("button", { name: "Undo dashboard change" }).click();
    assert.equal(await page.locator("[data-widget-id]").count(), 1);
    await page.getByRole("button", { name: "Redo dashboard change" }).click();
    assert.equal(await page.locator("[data-widget-id]").count(), 2);
    await page
      .getByRole("button", { name: "Remove widget", exact: true })
      .click();
    await page.getByRole("button", { name: "Add widget", exact: true }).click();
    await page
      .getByRole("region", { name: "Widget library" })
      .getByRole("button")
      .filter({ hasText: finance.name })
      .click();
    await page
      .getByRole("combobox", { name: "Calculation", exact: true })
      .selectOption("sum");
    await page
      .getByRole("combobox", { name: "Value field", exact: true })
      .selectOption(amount.key);
    await expect(
      page
        .locator("[data-widget-id]")
        .last()
        .getByText("Choose one currency for this monetary calculation.", {
          exact: true,
        }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Widget currency", exact: true })
      .fill("GBP");
    await page
      .getByRole("textbox", { name: "Chart title", exact: true })
      .fill("Finance · GBP");
    await page
      .getByRole("button", { name: "Number visual", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Widget height", exact: true })
      .selectOption("compact");
    await page
      .getByRole("combobox", { name: "Measure period", exact: true })
      .selectOption("30");
    await page
      .getByRole("button", { name: "Close widget settings", exact: true })
      .click();
    await expect(
      page
        .locator("[data-widget-id]")
        .last()
        .getByText("Loading matching data…", { exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForURL(/dashboard=/);
    const id = new URL(page.url()).searchParams.get("dashboard")!;
    const stored = await db.dashboard.findFirstOrThrow({
      where: { id, userId, organisationId },
    });
    assert.equal(readWidgets(stored.widgets).length, 2);
    assert.equal(readBoardSettings(stored.widgets).period, "30");
    assert.equal(readWidgets(stored.widgets)[0].color, "teal");
    assert.equal(readWidgets(stored.widgets)[1].data?.currency, "GBP");
    await page
      .getByRole("button", { name: "Edit dashboard", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Dashboard name", exact: true })
      .fill(`${prefix} renamed`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: `${prefix} renamed`, exact: true }),
    ).toBeVisible();
    assert.equal(
      (
        await db.dashboard.findFirstOrThrow({
          where: { id, userId, organisationId },
        })
      ).name,
      DASHBOARD_PREFIX + `${prefix} renamed`,
    );
    assert.equal(
      await db.dashboard.count({
        where: {
          userId,
          organisationId,
          name: { startsWith: DASHBOARD_PREFIX + prefix },
        },
      }),
      1,
    );
    await page
      .getByRole("button", { name: "View dashboard", exact: true })
      .click();
    for (const [width, height, label] of [
      [1440, 1000, "desktop"],
      [820, 1180, "tablet"],
      [390, 844, "phone"],
    ] as const) {
      await page.setViewportSize({ width, height });
      await expect(
        page.getByRole("heading", { name: `${prefix} renamed`, exact: true }),
      ).toBeVisible();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({ path: `/tmp/atlas-dashboards-${label}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload();
    await expect(
      page.getByRole("combobox", { name: "Measure period", exact: true }),
    ).toHaveValue("30");
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: "Monitor", exact: true }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState("networkidle");
    await expect(
      popup.getByRole("heading", { name: `${prefix} renamed`, exact: true }),
    ).toBeVisible();
    assert.equal(
      await popup
        .getByText("This measure is no longer available.", { exact: true })
        .count(),
      0,
    );
    await popup.close();
    await page.goto("/reports?dataset=" + finance.id);
    await expect(
      page.getByRole("combobox", { name: "Dataset", exact: true }),
    ).toHaveValue(finance.id);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Dashboard sidebar, record builder, currency guard, duplicate/undo/redo, personal save/rename/reload, saved period, monitor, desktop/tablet/phone and Reports source.",
    );
  } finally {
    await browser.close();
    await db.dashboard.deleteMany({
      where: {
        organisationId,
        userId,
        name: { startsWith: DASHBOARD_PREFIX + prefix },
      },
    });
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
