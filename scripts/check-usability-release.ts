/** Explicit central Test acceptance. Fixture writes never use an ordinary company. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { chromium, expect, type Page } from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
import {
  getAccessibleModules,
  getModuleNavigation,
} from "../src/core/modules/runtime";
import { getImplementedModules, getModule } from "../src/core/modules/registry";
import { visibleGuides, canFollowStep } from "../src/core/guides/catalogue";
import { wipeCompany } from "../src/core/admin/wipe-company";
import { openBooks } from "../src/modules/finance/services/books";
import { collectProductionBatch } from "../src/modules/stock/services/production-handoff";
let phase = "configuration";
async function main() {
  assert(
    process.platform === "linux" &&
      process.env.ATLAS_USABILITY_CHECK === "1" &&
      process.env.ATLAS_RUNTIME !== "desktop",
  );
  const base = new URL(
    process.env.ATLAS_USABILITY_URL ?? "https://atlassystem.online",
  );
  assert(
    base.origin === "https://atlassystem.online" ||
      (base.protocol === "http:" && base.hostname === "127.0.0.1"),
  );
  assert(process.env.SESSION_SECRET && process.env.ATLAS_TEST_REVISION);
  const qa = await sessionForUser(
    process.env.ATLAS_GUARDIAN_ORGANISATION_ID!,
    process.env.ATLAS_GUARDIAN_USER_ID!,
  );
  assert(qa, "Active existing QA membership required");
  assert(
    qa.capabilities.has("atlas.staff.manage") &&
      qa.capabilities.has("atlas.companies.manage"),
    "Use the existing authorised QA identity.",
  );
  const original = await db.membership.findUniqueOrThrow({
      where: { id: qa.membershipId },
    }),
    user = await db.user.findUniqueOrThrow({ where: { id: qa.userId } });
  const out =
    process.env.ATLAS_USABILITY_OUTPUT ?? "/tmp/atlas-usability-evidence";
  fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  const browser = await chromium.launch({ headless: true });
  let fixtureId: string | undefined, current: Page | undefined;
  try {
    const publicContext = await browser.newContext({ baseURL: base.origin });
    await publicContext.route("**/*", (route) =>
      new URL(route.request().url()).origin === base.origin &&
      ["GET", "HEAD"].includes(route.request().method())
        ? route.continue()
        : route.abort(),
    );
    const publicPage = await publicContext.newPage();
    current = publicPage;
    const errors: string[] = [];
    publicPage.on("pageerror", (error) => errors.push(error.name));
    const revision = async () =>
      assert.equal(
        (await (await fetch(new URL("/api/health/release", base))).json())
          .revision,
        process.env.ATLAS_TEST_REVISION,
      );
    await revision();
    phase = "website spacing and interactions";
    for (const width of [1440, 820, 390, 320]) {
      await publicPage.setViewportSize({ width, height: 960 });
      assert.equal(
        (await publicPage.goto("/", { waitUntil: "networkidle" }))?.status(),
        200,
      );
      await expect(
        publicPage.getByRole("heading", {
          name: "Your whole business. In motion.",
        }),
      ).toBeVisible();
      await publicPage
        .getByRole("button", { name: "Pause motion", exact: true })
        .click();
      const root = publicPage.locator(".atlas-website");
      await expect(root).toHaveAttribute("data-motion", "paused");
      for (const name of ["01 Plan", "02 Make", "03 Deliver"]) {
        await publicPage.getByRole("button", { name, exact: true }).click();
        const layout = await publicPage.evaluate(() => {
          const card = document
              .querySelector(".website-hero-product")!
              .getBoundingClientRect(),
            note = document
              .querySelector(".website-floating-note")!
              .getBoundingClientRect(),
            controls = document
              .querySelector(".website-hero-controls")!
              .getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            clear: card.bottom < note.top && note.bottom < controls.top,
            inBounds: card.left >= -1 && card.right <= innerWidth + 1,
          };
        });
        assert(
          !layout.overflow && layout.clear && layout.inBounds,
          `Website scene spacing at ${width}: ${JSON.stringify(layout)}`,
        );
      }
      if (width < 850) {
        await publicPage
          .getByRole("button", { name: "Open navigation" })
          .click();
        await expect(
          publicPage.getByRole("navigation", { name: "Website" }),
        ).toBeVisible();
        await publicPage
          .getByRole("link", { name: "The software", exact: true })
          .click();
        await expect(
          publicPage.getByRole("button", { name: "Open navigation" }),
        ).toBeVisible();
      }
      await publicPage
        .getByRole("tab", { name: "02 Make", exact: true })
        .click();
      await expect(
        publicPage.getByRole("tabpanel", { name: "02 Make" }),
      ).toContainText("Warehouse");
      await publicPage
        .getByRole("tab", { name: "02 Make", exact: true })
        .press("ArrowRight");
      await expect(
        publicPage.getByRole("tab", { name: "03 Deliver" }),
      ).toHaveAttribute("aria-selected", "true");
      await publicPage
        .locator(".website-area")
        .filter({ hasText: "Manufacturing & supply" })
        .locator("summary")
        .click();
      await expect(
        publicPage
          .locator(".website-area-expanded")
          .filter({ hasText: "Demand becomes material proposals" }),
      ).toBeVisible();
      assert(
        await publicPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await publicPage.goto("/", { waitUntil: "networkidle" });
      await publicPage.getByRole("button", { name: "Pause motion" }).click();
      await publicPage.screenshot({
        path: `${out}/website-${width}.png`,
        fullPage: false,
      });
    }
    await publicPage.emulateMedia({ reducedMotion: "reduce" });
    await publicPage.reload({ waitUntil: "networkidle" });
    await expect(publicPage.locator(".atlas-website")).toHaveAttribute(
      "data-motion",
      "paused",
    );
    assert(
      await publicPage.evaluate(() =>
        document
          .querySelector(".atlas-website")!
          .getAnimations({ subtree: true })
          .every((animation) => animation.playState !== "running"),
      ),
      "Reduced motion leaves no running website animation",
    );
    for (const path of [
      "/guides",
      "/stock/handoffs",
      "/maintenance",
      "/quality",
      "/sop",
    ]) {
      const response = await publicContext.request.get(path);
      assert(
        new URL(response.url()).pathname === "/login",
        `Anonymous ${path} remains private`,
      );
    }
    assert.equal(errors.length, 0, "No website client errors");
    await publicContext.close();
    console.log(
      "PASS Website scenes, separated card/message/controls, tabs, expanded content, mobile navigation, 1440/820/390/320 widths, reduced motion and private workspace boundary.",
    );
    phase = "isolated Test fixture";
    const slug = `usability-check-${randomBytes(10).toString("hex")}`;
    const org = await db.organisation.create({
      data: {
        name: "Atlas usability verification · Test",
        slug,
        isTest: true,
        moduleStates: {
          create: getImplementedModules()
            .filter(
              (m) =>
                !m.utility &&
                !["connections", "atlas", "analytics-preview"].includes(m.id),
            )
            .map((m) => ({ moduleId: m.id, enabled: true, entitled: true })),
        },
      },
    });
    fixtureId = org.id;
    const member = await db.membership.create({
        data: { organisationId: org.id, userId: qa.userId },
      }),
      session = await sessionForUser(org.id, qa.userId);
    assert(session);
    const token = jwt.sign(
      {
        userId: qa.userId,
        organisationId: org.id,
        authVersion: user.authVersion,
        sessionVersion: member.sessionVersion,
      },
      process.env.SESSION_SECRET,
      { algorithm: "HS256", expiresIn: "30m" },
    );
    const context = await browser.newContext({ baseURL: base.origin });
    await context.addCookies([
      {
        name: "atlas_session",
        value: token,
        url: base.origin,
        httpOnly: true,
        secure: base.protocol === "https:",
        sameSite: "Lax",
      },
    ]);
    const writePaths = new Set([
      "/manufacturing/shop-floor",
      "/stock/handoffs",
      "/maintenance",
      "/sop",
      "/finance/documents/new",
    ]);
    await context.route("**/*", (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.origin !== base.origin) return route.abort();
      if (url.pathname === "/api/guardian/telemetry")
        return route.fulfill({ status: 204 });
      if (
        ["GET", "HEAD", "OPTIONS"].includes(request.method()) ||
        (request.method() === "POST" && writePaths.has(url.pathname))
      )
        return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    current = page;
    page.on("pageerror", (error) => errors.push(error.name));
    await page.setViewportSize({ width: 1440, height: 960 });
    const warehouse = await db.warehouse.create({
        data: {
          organisationId: org.id,
          code: "PROD",
          name: "Production warehouse",
        },
      }),
      yard = await db.warehouse.create({
        data: {
          organisationId: org.id,
          code: "YARD",
          name: "North yard",
          kind: "YARD",
        },
      });
    const yardLocation = await db.stockLocation.create({
      data: {
        organisationId: org.id,
        warehouseId: yard.id,
        code: "NORTH",
        name: "North bay",
        capabilities: ["STORAGE"],
      },
    });
    const product = await db.product.create({
      data: {
        organisationId: org.id,
        code: "FIN-01",
        name: "Finished batch verification",
        itemClass: "FINISHED",
        sellable: true,
        basePriceAmount: 1500,
      },
    });
    const stock = getModule("stock")?.stockProvider;
    assert(stock);
    await stock.receiveStock(session, {
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: 3,
      requestKey: `${slug}-opening`,
      reference: slug,
      reason: "Isolated Test opening stock",
    });
    const order = await db.manufacturingOrder.create({
      data: {
        organisationId: org.id,
        orderNumber: "MO-HANDOFF",
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 10,
        status: "RUNNING",
        createdByUserId: qa.userId,
      },
    });
    await db.manufacturingWorkOrder.create({
      data: {
        organisationId: org.id,
        productionOrderId: order.id,
        sequence: 1,
        operationName: "Finish and hand over",
        status: "RUNNING",
        actualStart: new Date(),
      },
    });
    phase = "production completion";
    await page.goto("/manufacturing/shop-floor", { waitUntil: "networkidle" });
    await page.getByPlaceholder("Good qty").fill("10");
    await page.getByRole("button", { name: "Complete", exact: true }).click();
    await expect
      .poll(() =>
        db.stockProductionBatch.count({ where: { organisationId: org.id } }),
      )
      .toBe(1);
    const batch = await db.stockProductionBatch.findFirstOrThrow({
      where: { organisationId: org.id },
    });
    assert.equal(batch.quantity, 10);
    assert.equal(
      (await stock.getAvailability(session, { productId: product.id }))
        .available,
      3,
    );
    assert.equal(
      (
        await db.manufacturingOrder.findUniqueOrThrow({
          where: { id: order.id },
        })
      ).status,
      "COMPLETE",
    );
    phase = "partial collection and stale form";
    await page.goto("/stock/handoffs", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Collect & book into yard", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Collect batch MO-HANDOFF",
    });
    await dialog.getByLabel("Quantity collected").fill("4");
    await dialog
      .getByLabel("Destination yard or storage location")
      .selectOption(yardLocation.id);
    await dialog
      .getByLabel("Collection / booking reference")
      .fill("First collection to north bay");
    const stale = await context.newPage();
    await stale.goto("/stock/handoffs", { waitUntil: "networkidle" });
    await stale
      .getByRole("button", { name: "Collect & book into yard" })
      .click();
    const staleDialog = stale.getByRole("dialog", {
      name: "Collect batch MO-HANDOFF",
    });
    await staleDialog.getByLabel("Quantity collected").fill("4");
    await staleDialog
      .getByLabel("Destination yard or storage location")
      .selectOption(yardLocation.id);
    await staleDialog
      .getByLabel("Collection / booking reference")
      .fill("Stale second collection");
    await dialog
      .getByRole("button", { name: "Confirm collection & stock booking" })
      .click();
    await expect
      .poll(
        async () =>
          (
            await db.stockProductionBatch.findUniqueOrThrow({
              where: { id: batch.id },
            })
          ).collectedQuantity,
      )
      .toBe(4);
    await staleDialog
      .getByRole("button", { name: "Confirm collection & stock booking" })
      .click();
    await expect(staleDialog.getByRole("alert")).toContainText(
      "Someone else changed this batch",
    );
    assert.equal(
      await db.stockProductionCollection.count({
        where: { organisationId: org.id },
      }),
      1,
    );
    await stale.close();
    assert.equal(
      (await stock.getAvailability(session, { productId: product.id }))
        .available,
      7,
    );
    const collection = await db.stockProductionCollection.findFirstOrThrow({
      where: { organisationId: org.id },
    });
    await collectProductionBatch(session, {
      batchId: batch.id,
      version: 1,
      quantity: 4,
      locationId: yardLocation.id,
      requestKey: collection.requestKey,
      note: collection.note,
    });
    assert.equal(
      await db.stockProductionCollection.count({
        where: { organisationId: org.id },
      }),
      1,
    );
    const hold = await db.qualityHold.create({
      data: {
        organisationId: org.id,
        number: "QH-TEST",
        productId: product.id,
        warehouseId: warehouse.id,
        lotCode: batch.lotCode,
        quantity: 6,
        reason: "Isolated quality restriction",
        placedByUserId: qa.userId,
      },
    });
    await assert.rejects(
      () =>
        collectProductionBatch(session, {
          batchId: batch.id,
          version: 2,
          quantity: 6,
          locationId: yardLocation.id,
          requestKey: "held-collection",
          note: "Should be blocked by Quality",
        }),
      /active hold/,
    );
    await db.qualityHold.update({
      where: { id: hold.id },
      data: {
        status: "RELEASED",
        releasedByUserId: qa.userId,
        releasedAt: new Date(),
        releaseNote: "Synthetic acceptance hold resolved",
      },
    });
    await page.goto("/stock/handoffs", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Collect & book into yard" })
      .click();
    const final = page.getByRole("dialog", {
      name: "Collect batch MO-HANDOFF",
    });
    await expect(final.getByLabel("Quantity collected")).toHaveValue("6");
    await final
      .getByLabel("Destination yard or storage location")
      .selectOption(yardLocation.id);
    await final
      .getByLabel("Collection / booking reference")
      .fill("Final collection to north bay");
    await final
      .getByRole("button", { name: "Confirm collection & stock booking" })
      .click();
    await expect
      .poll(
        async () =>
          (
            await db.stockProductionBatch.findUniqueOrThrow({
              where: { id: batch.id },
            })
          ).fullyCollected,
      )
      .toBe(true);
    assert.equal(
      (await stock.getAvailability(session, { productId: product.id }))
        .available,
      13,
    );
    assert.equal(
      (
        await db.inventoryBalance.findUniqueOrThrow({
          where: {
            warehouseId_productId: {
              warehouseId: yard.id,
              productId: product.id,
            },
          },
        })
      ).quantity,
      10,
    );
    await page.goto("/stock/handoffs?state=all", { waitUntil: "networkidle" });
    await page.getByText("Collection history (2)", { exact: true }).click();
    await expect(
      page.getByText("Final collection to north bay", { exact: false }),
    ).toBeVisible();
    await page.screenshot({
      path: `${out}/production-handoff.png`,
      fullPage: false,
    });
    console.log(
      "PASS Actual final-operation completion, held output unavailable, partial collection to yard, stale rejection, replay, active Quality hold, final collection, conserved balance/lot and immutable history.",
    );
    phase = "operational forms";
    await db.maintenanceEquipment.create({
      data: { organisationId: org.id, code: "ASSET-1", name: "Line one mixer" },
    });
    await page.goto("/maintenance", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Create work order", exact: true })
      .first()
      .click();
    const workDialog = page.getByRole("dialog");
    await workDialog.getByLabel("Work order title").fill("Inspect the mixer");
    await workDialog
      .getByLabel("Equipment or vehicle")
      .selectOption({ label: "Line one mixer" });
    await workDialog
      .getByLabel("Reported issue or planned work")
      .fill("Isolated acceptance inspection");
    await workDialog
      .getByRole("button", { name: "Create work order", exact: true })
      .click();
    await expect
      .poll(() =>
        db.maintenanceWorkOrder.count({
          where: {
            organisationId: org.id,
            equipmentId: { not: null },
            vehicleId: null,
          },
        }),
      )
      .toBe(1);
    await db.sopCycle.create({
      data: {
        organisationId: org.id,
        name: "Planning acceptance cycle",
        startsOn: new Date("2026-10-01"),
        endsOn: new Date("2027-09-30"),
        ownerUserId: qa.userId,
      },
    });
    await page.goto("/sop", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "New cycle", exact: true }).click();
    await expect(page.getByLabel("Cycle name")).toBeVisible();
    await expect(page.getByLabel("Cycle name")).toBeFocused();
    assert(
      await page
        .locator("#new-cycle")
        .evaluate((node) => node instanceof HTMLDetailsElement && node.open),
    );
    await db.$transaction((tx) =>
      openBooks(tx, {
        organisationId: org.id,
        name: "Fixture books",
        code: "MAIN",
        currency: "GBP",
        startAt: new Date("2026-01-01"),
        endAt: new Date("2027-12-31"),
        actorUserId: qa.userId,
        reason: "Isolated usability acceptance",
      }),
    );
    await page.goto("/finance/documents/new?kind=PO", {
      waitUntil: "networkidle",
    });
    await expect(
      page.getByRole("combobox", { name: "Document", exact: true }),
    ).toHaveValue("PO");
    await page.getByLabel("VAT rate (%)").fill("20");
    await expect(page.getByLabel("VAT rate (%)")).toHaveValue("20");
    await page.getByLabel("VAT rate (%)").fill("5");
    await expect(page.getByLabel("VAT rate (%)")).toHaveValue("5");
    console.log(
      "PASS Single-asset Maintenance work creation, New cycle opens and focuses its form, native PO selection and human percentage tax input.",
    );
    phase = "registered pages and guide links";
    const accessible = await getAccessibleModules(session),
      ids = new Set(accessible.map((m) => m.id));
    const paths = new Set([
      "/guides",
      "/quality",
      "/finance/purchases",
      "/maintenance",
      "/stock/handoffs",
      "/sop?view=help",
    ]);
    for (const entry of accessible.filter(
      (m) =>
        !["connections", "atlas", "analytics-preview"].includes(m.id) &&
        m.id !== "connections",
    ))
      for (const nav of getModuleNavigation(entry, session))
        if (nav.href.startsWith("/") && !nav.href.startsWith("/atlas"))
          paths.add(nav.href);
    for (const guide of visibleGuides(session.capabilities, ids)) {
      paths.add(`/guides/${guide.id}`);
      for (const step of guide.steps)
        if (canFollowStep(step, session.capabilities, ids))
          paths.add(step.href!);
    }
    const failures: string[] = [];
    for (const path of paths) {
      const response = await context.request.get(path);
      if (response.status() !== 200)
        failures.push(`${path}: ${response.status()}`);
    }
    assert.deepEqual(
      failures,
      [],
      "Every registered authorised destination and guide link resolves",
    );
    for (const width of [1440, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      for (const path of [
        "/guides",
        "/guides/procurement",
        "/guides/maintenance",
        "/guides/quality",
        "/guides/sop",
        "/maintenance",
        "/quality",
        "/finance/purchases",
        "/stock/handoffs?state=all",
        "/sop?view=help",
        "/manufacturing/shop-floor",
      ]) {
        await page.goto(path, { waitUntil: "networkidle" });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `No root overflow: ${path} at ${width}`,
        );
      }
      await page.goto("/guides", { waitUntil: "networkidle" });
      await page.screenshot({
        path: `${out}/guides-${width}.png`,
        fullPage: false,
      });
    }
    assert.equal(errors.length, 0, "No operational client errors");
    await revision();
    console.log(
      `PASS ${paths.size} registered destinations/guide links and critical workspaces at 1440/820/390/320; exact release verified.`,
    );
  } catch (error) {
    if (current && !current.isClosed())
      await current
        .screenshot({ path: `${out}/failure.png`, fullPage: true })
        .catch(() => {});
    console.error("FAIL phase:", phase);
    throw error;
  } finally {
    await browser.close();
    if (fixtureId) {
      await wipeCompany(fixtureId);
      assert.equal(
        await db.organisation.count({ where: { id: fixtureId } }),
        0,
      );
      console.log(
        "PASS Synthetic company, its records, memberships and fixture files removed.",
      );
    }
    assert.deepEqual(
      await db.membership.findUniqueOrThrow({ where: { id: qa.membershipId } }),
      original,
    );
    for (const file of fs.readdirSync(out)) {
      if (/^(production-handoff|guides-\d+)\.png$/.test(file))
        fs.rmSync(`${out}/${file}`);
    }
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
