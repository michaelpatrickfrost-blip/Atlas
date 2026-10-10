/** Central disposable Test fixtures only; real forms, scoped tokens, no external messages. */
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  chromium,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { db } from "../src/core/db/client";
import {
  CUSTOMER_CAPABILITIES,
  SALES_CAPABILITIES,
  MARKETING_CAPABILITIES,
} from "../src/core/permissions/capabilities";
import { appointmentDay } from "../src/modules/crm/domain/appointments";

async function main() {
  assert(
    process.platform === "linux" && process.env.ATLAS_COMMERCIAL_CHECK === "1",
    "Explicit server Test acceptance opt-in required.",
  );
  const base = new URL(
    process.env.ATLAS_COMMERCIAL_URL ?? "https://atlassystem.online",
  );
  assert(
    base.origin === "https://atlassystem.online" ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(base.origin),
  );
  assert(process.env.SESSION_SECRET && process.env.ATLAS_TEST_REVISION);
  const health = await fetch(new URL("/api/health/release", base));
  assert.equal((await health.json()).revision, process.env.ATLAS_TEST_REVISION);
  const manifest = JSON.parse(
    readFileSync(".next/server/server-reference-manifest.json", "utf8"),
  ) as {
    node: Record<
      string,
      { exportedName?: string; workers?: Record<string, unknown> }
    >;
  };
  const allowedNames = new Set([
    "createNoteFormAction",
    "saveAppointmentForm",
    "finishAppointmentForm",
    "createJourneyMap",
    "addJourneyTouch",
    "addJourneyStage",
    "editJourneyStageForm",
    "moveJourneyStageForm",
    "editJourneyTouchForm",
    "saveJourneyPathForm",
    "createJourney",
    "reviseJourney",
    "publishJourney",
  ]);
  const actionIds = new Set(
    Object.entries(manifest.node)
      .filter(([, value]) => allowedNames.has(value.exportedName ?? ""))
      .map(([id]) => id),
  );
  const suffix = randomBytes(6).toString("hex"),
    fixtureIds: string[] = [],
    users: string[] = [];
  const output = mkdtempSync("/tmp/atlas-commercial-acceptance-");
  const browser = await chromium.launch({ headless: true });
  let debugPage: Page | undefined;
  let phase = "fixtures",
    posts = 0,
    blocked = 0;
  try {
    const seed = await db.$transaction(async (tx) => {
      const org = await tx.organisation.create({
        data: {
          name: `Commercial workspace Test ${suffix}`,
          slug: `commercial-check-${suffix}`,
          isTest: true,
          moduleStates: {
            create: ["crm", "sales", "marketing"].map((moduleId) => ({
              moduleId,
              enabled: true,
              entitled: true,
            })),
          },
        },
      });
      fixtureIds.push(org.id);
      const other = await tx.organisation.create({
        data: {
          name: `Commercial isolation Test ${suffix}`,
          slug: `commercial-other-${suffix}`,
          isTest: true,
        },
      });
      fixtureIds.push(other.id);
      const all = [
        ...Object.values(CUSTOMER_CAPABILITIES),
        ...Object.values(SALES_CAPABILITIES),
        ...Object.values(MARKETING_CAPABILITIES),
        "core.profile.self",
      ];
      const profiles = [];
      for (const kind of ["manager", "reader", "rep"] as const) {
        const user = await tx.user.create({
          data: {
            name: `Commercial ${kind}`,
            email: `${kind}-${suffix}@example.test`,
            passwordHash: await bcrypt.hash(
              randomBytes(32).toString("hex"),
              10,
            ),
          },
        });
        users.push(user.id);
        const caps =
          kind === "manager"
            ? all
            : [
                "core.profile.self",
                "customers.read",
                "sales.opportunity.read",
                "sales.prospect.read",
                "sales.order.read",
                "marketing.campaign.read",
                "marketing.journey.read",
                ...(kind === "rep" ? ["sales.activity.manage"] : []),
              ];
        const member = await tx.membership.create({
          data: {
            organisationId: org.id,
            userId: user.id,
            grantedCapabilities: caps,
          },
        });
        profiles.push({
          kind,
          user,
          token: jwt.sign(
            {
              userId: user.id,
              organisationId: org.id,
              authVersion: user.authVersion,
              sessionVersion: member.sessionVersion,
            },
            process.env.SESSION_SECRET!,
            { algorithm: "HS256", expiresIn: "45m" },
          ),
        });
      }
      const manager = profiles[0].user;
      const group = await tx.party.create({
        data: {
          organisationId: org.id,
          kind: "COMPANY",
          name: "Commercial group",
          customerCode: "CG",
          hierarchyRole: "GROUP",
          tags: [],
        },
      });
      const account = await tx.party.create({
        data: {
          organisationId: org.id,
          kind: "COMPANY",
          name: "Commercial customer",
          customerCode: "CC",
          status: "ACTIVE",
          parentPartyId: group.id,
          accountManagerUserId: manager.id,
          tags: [],
          contacts: {
            create: {
              firstName: "Alex",
              surname: "Buyer",
              jobTitle: "Purchasing manager",
              email: "alex@example.test",
              isPrimary: true,
              roles: [],
            },
          },
        },
      });
      const branch = await tx.party.create({
        data: {
          organisationId: org.id,
          kind: "COMPANY",
          name: "Commercial branch",
          customerCode: "CB",
          hierarchyRole: "BRANCH",
          parentPartyId: account.id,
          tags: [],
        },
      });
      const unrelated = await tx.party.create({
        data: {
          organisationId: org.id,
          kind: "COMPANY",
          name: "Unrelated account stays off the chart",
          customerCode: "UN",
          tags: [],
          contacts: {
            create: { firstName: "Unrelated", surname: "Person", roles: [] },
          },
        },
      });
      const foreign = await tx.party.create({
        data: {
          organisationId: other.id,
          kind: "COMPANY",
          name: "Foreign customer",
          customerCode: "FC",
          tags: [],
        },
      });
      const pipeline = await tx.pipeline.create({
        data: {
          organisationId: org.id,
          key: "commercial-check",
          name: "Commercial pipeline",
          isDefault: true,
          stages: {
            create: [
              { key: "qualified", name: "Qualified", order: 0 },
              { key: "proposal", name: "Proposal", order: 1 },
            ],
          },
        },
        include: { stages: true },
      });
      const deal = await tx.opportunity.create({
        data: {
          organisationId: org.id,
          partyId: account.id,
          pipelineId: pipeline.id,
          stageId: pipeline.stages[0].id,
          name: "Commercial Test deal",
          valueAmount: 100000,
          ownerUserId: manager.id,
        },
      });
      const product = await tx.product.create({
        data: {
          organisationId: org.id,
          code: "COMMERCIAL-CHECK",
          name: "Commercial Test product",
          basePriceAmount: 10000,
        },
      });
      const order = await tx.salesOrder.create({
        data: {
          organisationId: org.id,
          partyId: account.id,
          reference: "CHECK-SO-1",
          ownerUserId: manager.id,
          netAmount: 10000,
          taxAmount: 2000,
          grossAmount: 12000,
          lines: {
            create: {
              lineNumber: 1,
              productId: product.id,
              descriptionSnapshot: product.name,
              unitPriceAmount: 10000,
              netAmount: 10000,
              taxAmount: 2000,
            },
          },
        },
      });
      return {
        org,
        other,
        profiles,
        group,
        account,
        branch,
        unrelated,
        foreign,
        deal,
        order,
      };
    });
    const errors: string[] = [];
    async function context(
      profile: (typeof seed.profiles)[number],
      write: boolean,
    ): Promise<BrowserContext> {
      const ctx = await browser.newContext({
        baseURL: base.origin,
        locale: "en-GB",
        timezoneId: "Europe/London",
      });
      await ctx.addCookies([
        {
          name: "atlas_session",
          value: profile.token,
          url: base.origin,
          httpOnly: true,
          secure: base.protocol === "https:",
          sameSite: "Lax",
        },
      ]);
      await ctx.route("**/*", (route) => {
        const request = route.request(),
          url = new URL(request.url());
        if (url.origin !== base.origin) return route.abort();
        if (url.pathname === "/api/guardian/telemetry")
          return route.fulfill({ status: 204 });
        if (["GET", "HEAD", "OPTIONS"].includes(request.method()))
          return route.continue();
        if (
          write &&
          request.method() === "POST" &&
          actionIds.has(request.headers()["next-action"] ?? "")
        ) {
          posts++;
          return route.continue();
        }
        blocked++;
        return route.abort();
      });
      ctx.on("page", (page) =>
        page.on("pageerror", (error) => errors.push(error.message)),
      );
      return ctx;
    }
    const manager = await context(seed.profiles[0], true),
      reader = await context(seed.profiles[1], false),
      rep = await context(seed.profiles[2], true);
    const page = await manager.newPage(),
      read = await reader.newPage();
    debugPage = page;
    const visit = async (page: Page, path: string) => {
      const response = await page.goto(path, {
        waitUntil: "load",
        timeout: 45000,
      });
      assert(response?.ok(), `render ${path}`);
      assert(
        !(await page.locator("body").innerText()).includes(
          "Something went wrong.",
        ),
        path,
      );
    };
    phase = "customer menu layering";
    for (const [name, width, height] of [["desktop", 1448, 1086], ["tablet", 820, 1180], ["phone", 390, 844]] as const) {
      await page.setViewportSize({ width, height });
      await visit(page, `/customers/${seed.account.id}`);
      for (const label of ["Actions", "Manage Record"]) {
        const trigger = page.getByRole("button", { name: label, exact: true });
        await trigger.click();
        const menu = page.getByRole("menu");
        await expect(menu).toBeVisible();
        for (const item of await menu.getByRole("menuitem").all()) {
          await item.scrollIntoViewIfNeeded();
          assert(await item.evaluate((node) => {
            const rect = node.getBoundingClientRect();
            return node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
          }), `${name}: ${label} item is above page content`);
        }
        await page.screenshot({ path: `${output}/customer-${label.replaceAll(" ", "-")}-${name}.png` });
        await trigger.click();
        await expect(menu).toHaveCount(0);
      }
    }
    await page.setViewportSize({ width: 1448, height: 1086 });
    console.log("PASS customer Actions and Manage Record menus above content at desktop/tablet/phone.");
    phase = "customer-scoped hierarchy";
    await visit(page, `/customers/${seed.account.id}?tab=relationships`);
    await expect(page.locator("[data-journey-stage]")).toHaveCount(0);
    const chart = page
      .locator("ul")
      .filter({
        has: page.getByRole("button", { name: /Commercial customer/ }),
      })
      .first();
    await expect(
      page.getByRole("button", { name: /Commercial customer/ }).first(),
    ).toBeVisible();
    assert(!(await chart.innerText()).includes(seed.unrelated.name));
    assert(!(await chart.innerText()).includes("Unrelated Person"));
    await visit(page, "/customers/map");
    await expect(
      page.getByRole("heading", { name: "Choose a customer", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Find a customer for the hierarchy"),
    ).toBeVisible();
    assert.equal(await page.getByLabel("Search the map").count(), 0);
    console.log(
      "PASS selected customer family only; global map starts with customer selection.",
    );
    phase = "linked customer notes";
    await visit(page, `/crm/accounts/${seed.account.id}`);
    await page
      .getByLabel("Add an account note")
      .fill("Shared preparation from CRM");
    await page.getByRole("button", { name: "Save note", exact: true }).click();
    await expect(
      page.getByText("Shared preparation from CRM", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Add an account note")
      .fill("Restricted commercial context");
    await page.getByLabel("Restricted", { exact: true }).check();
    await page.getByRole("button", { name: "Save note", exact: true }).click();
    await expect(
      page.getByText("Restricted commercial context", { exact: true }),
    ).toBeVisible();
    await visit(page, `/customers/${seed.account.id}?tab=activity`);
    await expect(
      page.getByText("Shared preparation from CRM", { exact: true }),
    ).toBeVisible();
    await visit(read, `/crm/accounts/${seed.account.id}`);
    await expect(
      read.getByText("Shared preparation from CRM", { exact: true }),
    ).toBeVisible();
    await expect(
      read.getByText("Restricted commercial context", { exact: true }),
    ).toHaveCount(0);
    await expect(read.getByRole("button", { name: "Save note" })).toHaveCount(
      0,
    );
    console.log(
      "PASS account notes save across CRM/Customers, restricted read and write controls.",
    );
    phase = "appointment create and overlap";
    await visit(page, `/crm/appointments?party=${seed.account.id}`);
    await page
      .getByRole("button", { name: "New appointment", exact: true })
      .click();
    let dialog = page.getByRole("dialog", {
      name: "Schedule a sales appointment",
    });
    const day = appointmentDay(new Date().toISOString());
    await dialog
      .getByLabel("Appointment title")
      .fill("Commercial acceptance meeting");
    await dialog
      .getByLabel("Appointment account")
      .selectOption(`party:${seed.account.id}`);
    await dialog.getByLabel("Deal (optional)").selectOption(seed.deal.id);
    await dialog.getByLabel("Starts · London time").fill(`${day}T10:00`);
    await dialog.getByLabel("Ends · London time").fill(`${day}T10:30`);
    await dialog
      .getByLabel("Preparation & notes")
      .fill("Review customer priorities");
    await dialog.getByLabel("Location or meeting link").fill("Customer site");
    await dialog
      .getByRole("button", { name: "Schedule appointment", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText("scheduled");
    const activity = await db.salesActivity.findFirstOrThrow({
      where: {
        organisationId: seed.org.id,
        subject: "Commercial acceptance meeting",
      },
    });
    assert.equal(activity.partyId, seed.account.id);
    assert.equal(activity.opportunityId, seed.deal.id);
    assert.equal(+activity.endsAt! - +activity.dueAt!, 1800000);
    await dialog.getByLabel("Appointment title").fill("Overlapping meeting");
    await dialog
      .getByLabel("Appointment account")
      .selectOption(`party:${seed.account.id}`);
    await dialog.getByLabel("Starts · London time").fill(`${day}T10:15`);
    await dialog.getByLabel("Ends · London time").fill(`${day}T10:45`);
    await dialog
      .getByRole("button", { name: "Schedule appointment", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("overlaps");
    assert.equal(
      await db.salesActivity.count({ where: { organisationId: seed.org.id } }),
      1,
    );
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await page
      .getByRole("button", { name: /Commercial acceptance meeting/ })
      .click();
    await expect(
      page.getByText("Review customer priorities", { exact: true }).first(),
    ).toBeVisible();
    await page.getByText("Reschedule or edit", { exact: true }).click();
    const edit = page
      .locator("details")
      .filter({ hasText: "Reschedule or edit" });
    await edit.getByLabel("Starts · London time").fill(`${day}T11:00`);
    await edit.getByLabel("Ends · London time").fill(`${day}T11:30`);
    await edit
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await db.salesActivity.findUniqueOrThrow({
              where: { id: activity.id },
            })
          ).version,
      )
      .toBe(2);
    await page
      .getByLabel("Outcome / next step")
      .fill("Discussed priorities; follow up with a quotation");
    await page
      .getByRole("button", { name: "Mark completed", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Commercial acceptance meeting/ }),
    ).toHaveCount(0);
    await visit(
      page,
      `/crm/appointments?state=completed&party=${seed.account.id}`,
    );
    await page
      .getByRole("button", { name: /Commercial acceptance meeting/ })
      .click();
    await expect(
      page.getByText("Discussed priorities; follow up with a quotation", {
        exact: true,
      }),
    ).toBeVisible();
    console.log(
      "PASS appointment create, account/deal links, overlap rejection, reschedule and retained completion outcome.",
    );
    phase = "retained appointment cancellation";
    await visit(page, `/crm/appointments?party=${seed.account.id}`);
    await page
      .getByRole("button", { name: "New appointment", exact: true })
      .click();
    dialog = page.getByRole("dialog", { name: "Schedule a sales appointment" });
    await dialog
      .getByLabel("Appointment title")
      .fill("Commercial cancellation check");
    await dialog
      .getByLabel("Appointment account")
      .selectOption(`party:${seed.account.id}`);
    await dialog.getByLabel("Starts · London time").fill(`${day}T12:00`);
    await dialog.getByLabel("Ends · London time").fill(`${day}T12:30`);
    await dialog
      .getByRole("button", { name: "Schedule appointment", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText("scheduled");
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await page
      .getByRole("button", { name: /Commercial cancellation check/ })
      .click();
    await page
      .getByRole("button", { name: "Cancel appointment", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Commercial cancellation check/ }),
    ).toHaveCount(0);
    await visit(
      page,
      `/crm/appointments?state=cancelled&party=${seed.account.id}`,
    );
    await expect(
      page.getByRole("button", { name: /Commercial cancellation check/ }),
    ).toBeVisible();
    const cancelled = await db.salesActivity.findFirstOrThrow({
      where: {
        organisationId: seed.org.id,
        subject: "Commercial cancellation check",
      },
    });
    assert(cancelled.cancelledAt);
    assert.equal(cancelled.completedAt, null);
    console.log(
      "PASS cancelled appointment retains its record and does not become a completion.",
    );
    phase = "appointment privacy and direct denied actions";
    await visit(read, "/crm/appointments");
    await expect(
      read.getByRole("button", { name: "New appointment" }),
    ).toHaveCount(0);
    const repPage = await rep.newPage();
    await visit(repPage, "/crm/appointments?state=completed");
    await expect(
      repPage.getByRole("button", { name: /Commercial acceptance meeting/ }),
    ).toHaveCount(0);
    const post = async (
      name: string,
      fields: Record<string, string>,
      token: string,
      args: unknown[] = [],
      path = "/crm/appointments",
    ) => {
      const actions = Object.entries(manifest.node).filter(
        ([, value]) => value.exportedName === name,
      );
      assert(actions.length);
      const body = new FormData();
      for (const [key, value] of Object.entries(fields))
        body.set("_1_" + key, value);
      body.set("0", JSON.stringify([...args, "$K1"]));
      return fetch(new URL(path, base), {
        method: "POST",
        headers: {
          Origin: base.origin,
          Accept: "text/x-component",
          "Next-Action": actions[0][0],
          Cookie: `atlas_session=${token}`,
        },
        body,
      });
    };
    phase = "legacy activity completion boundary";
    const postLegacy = (token: string, id: string, outcome: string) =>
      post(
        "completeActivity",
        {},
        token,
        [id, outcome],
        `/crm/opportunities/${seed.deal.id}`,
      );
    const legacy = await db.salesActivity.create({
      data: {
        organisationId: seed.org.id,
        ownerUserId: seed.profiles[0].user.id,
        partyId: seed.account.id,
        type: "TASK",
        subject: "Legacy completion guard",
      },
    });
    const booked = await db.salesActivity.create({
      data: {
        organisationId: seed.org.id,
        ownerUserId: seed.profiles[0].user.id,
        partyId: seed.account.id,
        type: "MEETING",
        subject: "Booked completion guard",
        dueAt: new Date(`${day}T15:00:00Z`),
        endsAt: new Date(`${day}T15:30:00Z`),
      },
    });
    for (const [token, id] of [
      [seed.profiles[0].token, booked.id],
      [seed.profiles[0].token, cancelled.id],
      [seed.profiles[1].token, legacy.id],
      [seed.profiles[2].token, legacy.id],
    ]) {
      const response = await postLegacy(token, id, "Must not complete");
      const result = await response.text();
      assert(
        !result.includes("Unrecognized server action"),
        "Known legacy completion action invoked",
      );
      assert(
        response.status >= 400 || /\n[0-9a-f]+:E\{/.test(result),
        "Legacy completion rejected",
      );
      const unchanged = await db.salesActivity.findUniqueOrThrow({
        where: { id },
      });
      assert.equal(unchanged.completedAt, null);
      assert.equal(
        unchanged.version,
        id === cancelled.id ? cancelled.version : 1,
      );
    }
    const completedLegacy = await postLegacy(
      seed.profiles[0].token,
      legacy.id,
      "Legacy work completed",
    );
    const completionResult = await completedLegacy.text();
    assert(
      completedLegacy.status < 400 && !/\n[0-9a-f]+:E\{/.test(completionResult),
      "Legacy completion succeeds",
    );
    const retainedLegacy = await db.salesActivity.findUniqueOrThrow({
      where: { id: legacy.id },
    });
    assert(retainedLegacy.completedAt);
    assert.equal(retainedLegacy.version, 2);
    assert.equal(retainedLegacy.outcome, "Legacy work completed");
    const replay = await postLegacy(
      seed.profiles[0].token,
      legacy.id,
      "Must not overwrite",
    );
    await replay.text();
    const replayedLegacy = await db.salesActivity.findUniqueOrThrow({
      where: { id: legacy.id },
    });
    assert.equal(replayedLegacy.version, 2);
    assert.equal(replayedLegacy.outcome, retainedLegacy.outcome);
    console.log(
      "PASS legacy completion rejects booked/cancelled appointments and unauthorised owners; ordinary legacy work completes once with a version increment.",
    );
    const before = await db.salesActivity.count({
      where: { organisationId: seed.org.id },
    });
    for (const [token, fields] of [
      [seed.profiles[1].token, { partyId: seed.account.id }],
      [seed.profiles[2].token, { partyId: seed.foreign.id }],
    ] as const) {
      const response = await post(
        "saveAppointmentForm",
        {
          requestKey: randomUUID(),
          subject: "Must not save",
          type: "MEETING",
          startsAt: `${day}T14:00:00Z`,
          endsAt: `${day}T14:30:00Z`,
          ...fields,
        },
        token,
      );
      const result = await response.text();
      assert(
        !result.includes("Unrecognized server action"),
        "Known server action invoked",
      );
      assert(
        response.status >= 400 || /\n[0-9a-f]+:E\{/.test(result),
        "Rejected server action",
      );
    }
    assert.equal(
      await db.salesActivity.count({ where: { organisationId: seed.org.id } }),
      before,
    );
    console.log(
      "PASS reader controls, rep owner scope, missing capability and foreign-customer rejection.",
    );
    phase = "journey mapping forms";
    await visit(page, "/marketing/journey");
    await page
      .getByRole("button", { name: "New journey", exact: true })
      .click();
    dialog = page.getByRole("dialog", { name: "Create a customer journey" });
    await dialog.getByLabel("Journey name").fill("Commercial customer journey");
    await dialog
      .getByLabel("Who is this for?")
      .fill("Commercial customers considering a first order");
    await dialog
      .getByRole("button", { name: "Create journey", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText("Saved");
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.locator("[data-journey-stage]")).toHaveCount(5);
    const map = await db.marketingProgram.findFirstOrThrow({
      where: { organisationId: seed.org.id, kind: "JOURNEY_MAP" },
    });
    const inspector = page.getByLabel("Journey stage details");
    await inspector
      .getByLabel("Friction / pain point")
      .fill("Hard to compare delivery commitments");
    await inspector
      .getByLabel("How can we improve this?")
      .fill("Give a clear delivery promise");
    await inspector
      .getByLabel("What would success look like?")
      .fill("Customer understands the delivery date");
    await inspector.getByLabel("How do they feel?").selectOption("FRUSTRATED");
    await inspector
      .getByRole("button", { name: "Save stage", exact: true })
      .click();
    await expect(
      page
        .getByText("Hard to compare delivery commitments", { exact: true })
        .first(),
    ).toBeVisible();
    await inspector
      .getByRole("button", { name: "Add touchpoint", exact: true })
      .click();
    dialog = page.getByRole("dialog", {
      name: "Add a touchpoint",
      exact: true,
    });
    await dialog
      .getByLabel("Touchpoint name")
      .fill("Delivery promise conversation");
    await dialog
      .getByLabel("What happens at this moment?")
      .fill("Sales confirms the customer requirements");
    await dialog.getByLabel("Owner", { exact: true }).fill("Sales team");
    await dialog
      .getByRole("button", { name: "Add touchpoint", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText("Saved");
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await expect(
      page.getByText("Delivery promise conversation", { exact: true }).first(),
    ).toBeVisible();
    await inspector
      .getByRole("button", { name: "Add a branch or return path" })
      .click();
    dialog = page.getByRole("dialog", { name: "Connect journey stages" });
    await dialog.getByLabel("To stage").selectOption({ label: "Decision" });
    await dialog.getByLabel("Path label / condition").fill("Ready to choose");
    await dialog.getByRole("button", { name: "Connect stages" }).click();
    await expect(dialog.getByRole("status")).toContainText("Saved");
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await expect(
      page.locator("svg text").filter({ hasText: "Ready to choose" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Experience map", exact: true })
      .click();
    await expect(
      page.getByText("Give a clear delivery promise", { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Flow", exact: true }).click();
    await page.getByRole("button", { name: "Zoom out journey" }).click();
    await expect(page.getByText("75%", { exact: true })).toBeVisible();
    await inspector
      .getByRole("button", { name: "Move later", exact: true })
      .click();
    await expect(page.locator("[data-journey-stage]").nth(1)).toContainText(
      "Awareness",
    );
    console.log(
      "PASS visual customer journey, experience details, touchpoint, branch connector, zoom and stage reordering.",
    );
    phase = "automation branch editor";
    await visit(page, "/marketing/journeys");
    await page
      .getByRole("button", { name: "New automation", exact: true })
      .click();
    dialog = page.getByRole("dialog", { name: "Build an automation journey" });
    await dialog
      .getByLabel("Journey name")
      .fill("Commercial nurture automation");
    await dialog
      .getByRole("button", { name: "Add branch", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Save draft", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText("Saved");
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.getByLabel("Automation flow")).toContainText(
      "Matched → Step",
    );
    await page.getByRole("button", { name: "Publish V1", exact: true }).click();
    await expect(page.getByText(/Published V1/)).toBeVisible();
    const journey = await db.marketingJourney.findFirstOrThrow({
      where: { organisationId: seed.org.id },
    });
    assert.equal(journey.publishedVersion, 1);
    assert.equal(
      await db.marketingDelivery.count({
        where: { organisationId: seed.org.id },
      }),
      0,
    );
    console.log(
      "PASS visual automation branching, version publication and zero message deliveries.",
    );
    phase = "responsive commercial workspaces";
    const routes = [
      "/customers",
      "/crm/today",
      "/crm/accounts",
      `/crm/accounts/${seed.account.id}`,
      "/crm/appointments",
      "/sales/orders",
      `/sales/orders/${seed.order.id}`,
      "/marketing",
      `/marketing/journey?focus=${map.id}`,
      "/marketing/journeys",
    ];
    for (const [name, width, height] of [
      ["desktop", 1448, 1086],
      ["tablet", 820, 1180],
      ["phone", 390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      for (const route of routes) {
        await visit(page, route);
        assert(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <= innerWidth &&
              [...document.querySelectorAll("main")].every(
                (node) => node.scrollWidth <= node.clientWidth,
              ),
          ),
          `${name}: no horizontal overflow ${route}`,
        );
      }
      await visit(page, `/marketing/journey?focus=${map.id}`);
      await page.screenshot({
        path: `${output}/journey-${name}.png`,
        fullPage: false,
      });
      await visit(page, "/crm/appointments?state=completed");
      await page.screenshot({
        path: `${output}/appointments-${name}.png`,
        fullPage: false,
      });
      console.log(
        `PASS ${name}: all ten commercial screens, no page overflow.`,
      );
    }
    const anon = await browser.newContext({ baseURL: base.origin });
    for (const route of [
      "/crm/accounts",
      "/crm/appointments",
      "/marketing/journey",
    ])
      assert.equal(
        (await anon.request.get(route, { maxRedirects: 0 })).status(),
        307,
      );
    await anon.close();
    assert.deepEqual(errors, []);
    assert.equal(
      await db.salesActivity.count({
        where: { organisationId: seed.other.id },
      }),
      0,
    );
    assert.equal(
      await db.note.count({
        where: { party: { organisationId: seed.other.id } },
      }),
      0,
    );
    console.log(
      `PASS anonymous access, cross-tenant isolation, no browser errors. Allowed form POSTs: ${posts}; blocked background writes: ${blocked}.`,
    );
    console.log(`Private screenshots/evidence: ${output}`);
  } catch (error) {
    if (debugPage) {
      await debugPage
        .screenshot({ path: `${output}/stopped.png`, fullPage: true })
        .catch(() => {});
    }
    console.error(`Acceptance stopped at ${phase}; private evidence ${output}`);
    throw error;
  } finally {
    await browser.close();
    if (fixtureIds.length)
      await db.organisation.updateMany({
        where: { id: { in: fixtureIds }, isTest: true },
        data: { status: "SUSPENDED" },
      });
    if (users.length) {
      await db.membership.updateMany({
        where: { userId: { in: users }, organisationId: { in: fixtureIds } },
        data: {
          active: false,
          grantedCapabilities: [],
          sessionVersion: { increment: 1 },
        },
      });
      await db.user.updateMany({
        where: { id: { in: users } },
        data: { authVersion: { increment: 1 } },
      });
    }
    await db.$disconnect();
    console.log(
      "Exact synthetic Test companies suspended; access revoked; records and audit retained.",
    );
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
