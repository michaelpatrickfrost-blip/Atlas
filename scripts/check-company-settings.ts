/** Central synthetic Test-company acceptance. No existing company/user settings are changed. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import jwt from "jsonwebtoken";
import {
  chromium,
  expect,
  type Page,
  type BrowserContext,
} from "@playwright/test";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
async function main() {
  assert(
    process.platform === "linux" && process.env.ATLAS_SETTINGS_CHECK === "1",
  );
  const base = process.env.ATLAS_SETTINGS_URL ?? "https://atlassystem.online";
  assert(
    base === "https://atlassystem.online" || base === "http://127.0.0.1:3011",
  );
  assert(process.env.SESSION_SECRET && process.env.ATLAS_GUARDIAN_USER_ID);
  const qa = await db.user.findUniqueOrThrow({
    where: { id: process.env.ATLAS_GUARDIAN_USER_ID },
    select: { platformAdmin: { select: { active: true } } },
  });
  assert(qa.platformAdmin?.active);
  const suffix = randomUUID().slice(0, 8),
    out =
      process.env.ATLAS_SETTINGS_EVIDENCE ?? `/tmp/atlas-settings-${suffix}`;
  mkdirSync(out, { recursive: true, mode: 0o700 });
  const company = await db.organisation.create({
    data: {
      name: `Settings acceptance ${suffix}`,
      slug: `settings-check-${suffix}`,
      isTest: true,
    },
  });
  const foreign = await db.organisation.create({
    data: {
      name: `Settings boundary ${suffix}`,
      slug: `settings-boundary-${suffix}`,
      isTest: true,
    },
  });
  const ids: string[] = [],
    browser = await chromium.launch({ headless: true }),
    errors: string[] = [];
  try {
    const adminRole = await db.role.create({
      data: {
        organisationId: company.id,
        key: `check-admin-${suffix}`,
        name: "Company Admin",
        capabilities: [
          "core.modules.manage",
          "core.users.manage",
          "core.roles.manage",
        ],
      },
    });
    const baseRole = await db.role.create({
      data: {
        organisationId: company.id,
        key: `check-base-${suffix}`,
        name: "Customers reader",
        capabilities: ["customers.read"],
      },
    });
    const foreignRole = await db.role.create({
      data: {
        organisationId: foreign.id,
        key: `check-other-${suffix}`,
        name: "Foreign profile",
        capabilities: ["core.chat.read"],
      },
    });
    async function actor(
      label: string,
      organisationId: string,
      caps: string[],
      roleIds: string[] = [],
    ) {
      const user = await db.user.create({
        data: {
          name: `${label} ${suffix}`,
          email: `settings-${label.toLowerCase().replaceAll(" ", "-")}-${suffix}@example.test`,
          passwordHash: "!acceptance-only-no-password",
        },
      });
      ids.push(user.id);
      const membership = await db.membership.create({
        data: {
          organisationId,
          userId: user.id,
          grantedCapabilities: caps,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
        },
      });
      const context = await browser.newContext({
        baseURL: base,
        locale: "en-GB",
        viewport: { width: 1440, height: 1000 },
      });
      await signIn(context, user.id, organisationId);
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      return { user, membership, context, page };
    }
    async function signIn(
      context: BrowserContext,
      userId: string,
      organisationId: string,
    ) {
      const m = await db.membership.findUniqueOrThrow({
        where: { organisationId_userId: { organisationId, userId } },
        include: { user: true },
      });
      await context.addCookies([
        {
          name: "atlas_session",
          value: jwt.sign(
            {
              userId,
              organisationId,
              authVersion: m.user.authVersion,
              sessionVersion: m.sessionVersion,
            },
            process.env.SESSION_SECRET!,
            { algorithm: "HS256", expiresIn: "30m" },
          ),
          url: base,
          secure: base.startsWith("https"),
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
    }
    const admin = await actor("Admin", company.id, [], [adminRole.id]);
    const viewer = await actor("Profile user", company.id, [
      "core.email.personal",
      "customers.read",
    ]);
    const target = await actor("Team member", company.id, [], [baseRole.id]);
    const other = await actor("Foreign user", foreign.id, [], [foreignRole.id]);
    const page = admin.page;
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Company settings", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Search company settings")).toBeVisible();
    await page.getByLabel("Search company settings").fill("profiles");
    await expect(
      page.getByRole("heading", { name: "Access profiles", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: `${out}/overview.png`, fullPage: true });
    await viewer.page.goto("/settings?tab=roles");
    await expect(viewer.page).toHaveURL(/\/profile\/settings$/);
    await expect(
      viewer.page.getByRole("heading", { name: "Your profile. Your space." }),
    ).toBeVisible();
    await expect(
      viewer.page.getByRole("heading", {
        name: "Company settings",
        exact: true,
      }),
    ).toHaveCount(0);
    await viewer.page.goto("/settings/it/email");
    await expect(viewer.page).toHaveURL(/\/profile\/settings$/);
    await viewer.page.goto("/profile/email");
    await expect(
      viewer.page.getByRole("heading", { name: "Your mailboxes", exact: true }),
    ).toBeVisible();
    await expect(
      viewer.page.getByRole("heading", {
        name: "Company mailboxes",
        exact: true,
      }),
    ).toHaveCount(0);
    await viewer.page.goto("/profile/settings");
    await viewer.page
      .getByLabel("Your name", { exact: true })
      .fill(`My profile ${suffix}`);
    await viewer.page
      .getByRole("button", { name: "Save personal details" })
      .click();
    await expect
      .poll(
        async () =>
          (await db.user.findUniqueOrThrow({ where: { id: viewer.user.id } }))
            .name,
      )
      .toBe(`My profile ${suffix}`);
    await viewer.page
      .getByLabel("Current password", { exact: true })
      .fill("incorrect password");
    await viewer.page
      .getByLabel("New password", { exact: true })
      .fill("safe acceptance password");
    await viewer.page
      .getByLabel("Confirm new password", { exact: true })
      .fill("safe acceptance password");
    await viewer.page
      .getByRole("button", { name: "Change password", exact: true })
      .click();
    await expect(viewer.page.locator('p[role="alert"]')).toContainText(
      "Current password is incorrect",
    );
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id: viewer.user.id } }))
        .passwordHash,
      viewer.user.passwordHash,
    );
    console.log(
      "PASS personal Settings redirects, own-name persistence, password validation and owner-only email workspace.",
    );
    await page.goto("/settings?tab=roles");
    await page
      .getByRole("button", { name: "New profile", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Create an access profile",
    });
    await dialog
      .getByLabel("Profile name", { exact: true })
      .fill(`Commercial ${suffix}`);
    await dialog
      .getByRole("button", { name: "Create profile", exact: true })
      .click();
    await expect
      .poll(async () =>
        db.role.count({
          where: { organisationId: company.id, name: `Commercial ${suffix}` },
        }),
      )
      .toBe(1);
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    const profile = await db.role.findFirstOrThrow({
      where: { organisationId: company.id, name: `Commercial ${suffix}` },
    });
    await page
      .getByRole("button", { name: new RegExp(`^Commercial ${suffix}`) })
      .click();
    async function openSales(p: Page) {
      const controls = p.getByRole("group", {
        name: "Sales access level",
        exact: true,
      });
      const details = controls.locator("xpath=ancestor::details[1]");
      if (!(await details.evaluate((e) => (e as HTMLDetailsElement).open)))
        await details
          .locator("summary")
          .first()
          .click({ position: { x: 12, y: 15 } });
      return details;
    }
    const sales = await openSales(page);
    await sales
      .getByRole("group", { name: "Order access level", exact: true })
      .getByRole("button", { name: "Write", exact: true })
      .click();
    await sales
      .getByRole("group", { name: "Quote access level", exact: true })
      .getByRole("button", { name: "Read", exact: true })
      .click();
    await page
      .locator('input[name="profileName"]')
      .fill(`Commercial mix ${suffix}`);
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await db.role.findUniqueOrThrow({ where: { id: profile.id } })).name,
      )
      .toBe(`Commercial mix ${suffix}`);
    const saved = await db.role.findUniqueOrThrow({
      where: { id: profile.id },
    });
    assert.deepEqual(
      [...saved.capabilities].sort(),
      [
        "sales.order.read",
        "sales.order.create",
        "sales.order.edit_draft",
        "sales.order.amend",
        "sales.quote.read",
      ].sort(),
    );
    await page
      .getByRole("button", { name: "New profile", exact: true })
      .click();
    await dialog
      .getByLabel("Profile name", { exact: true })
      .fill(`Commercial copy ${suffix}`);
    await dialog
      .getByLabel("Start from", { exact: true })
      .selectOption(profile.id);
    await dialog
      .getByRole("button", { name: "Create profile", exact: true })
      .click();
    await expect
      .poll(async () =>
        db.role.count({
          where: {
            organisationId: company.id,
            name: `Commercial copy ${suffix}`,
          },
        }),
      )
      .toBe(1);
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    assert.deepEqual(
      (
        await db.role.findFirstOrThrow({
          where: {
            organisationId: company.id,
            name: `Commercial copy ${suffix}`,
          },
        })
      ).capabilities,
      saved.capabilities,
    );
    await page.reload();
    await page
      .getByRole("button", { name: new RegExp(`^Commercial mix ${suffix}`) })
      .click();
    await expect(page.locator('input[name="profileName"]')).toHaveValue(
      saved.name,
    );
    await db.role.update({
      where: { id: profile.id },
      data: { name: `Updated elsewhere ${suffix}` },
    });
    await page
      .locator('input[name="profileName"]')
      .fill(`Stale edit ${suffix}`);
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(page.locator('p[role="alert"]')).toContainText(
      "profile changed",
    );
    assert.equal(
      (await db.role.findUniqueOrThrow({ where: { id: profile.id } })).name,
      `Updated elsewhere ${suffix}`,
    );
    await page.reload();
    await page.getByRole("button", { name: /^Company Admin/ }).click();
    await page
      .getByRole("group", {
        name: "Company administration & shared tools access level",
        exact: true,
      })
      .getByRole("button", { name: "None", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(page.locator('p[role="alert"]')).toContainText("own access");
    assert.deepEqual(
      (await db.role.findUniqueOrThrow({ where: { id: adminRole.id } }))
        .capabilities,
      adminRole.capabilities,
    );
    await page.reload();
    await page
      .getByRole("button", { name: new RegExp(`^Updated elsewhere ${suffix}`) })
      .click();
    await page.locator('input[name="roleId"]').evaluate((input, id) => {
      (input as HTMLInputElement).value = id;
    }, foreignRole.id);
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();
    assert.deepEqual(
      (await db.role.findUniqueOrThrow({ where: { id: foreignRole.id } }))
        .capabilities,
      foreignRole.capabilities,
    );
    console.log(
      "PASS new mixed-section profile, same-ID rename/reload, stale-write rejection, self-admin preservation and foreign-profile rejection.",
    );
    await page.goto(`/settings/users/${target.membership.id}`);
    await page
      .getByLabel(`Updated elsewhere ${suffix}`, { exact: true })
      .check();
    const memberSales = await openSales(page);
    const order = memberSales.getByRole("region", { name: "Sales: Order" });
    await order.locator("summary").click();
    await order.getByLabel("Create", { exact: true }).uncheck();
    const quote = memberSales.getByRole("region", { name: "Sales: Quote" });
    await quote.locator("summary").click();
    await quote.getByLabel("Approve", { exact: true }).check();
    await page
      .getByRole("button", { name: "Save user access", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await db.membership.findUniqueOrThrow({
              where: { id: target.membership.id },
            })
          ).sessionVersion,
      )
      .toBe(1);
    const changed = await db.membership.findUniqueOrThrow({
      where: { id: target.membership.id },
      include: { roles: true },
    });
    assert(changed.deniedCapabilities.includes("sales.order.create"));
    assert(changed.grantedCapabilities.includes("sales.quote.approve"));
    assert.equal(changed.roles.length, 2);
    const effective = await sessionForUser(company.id, target.user.id);
    assert(effective);
    assert(effective.capabilities.has("sales.quote.approve"));
    assert(!effective.capabilities.has("sales.order.create"));
    await target.page.goto("/profile/settings");
    await expect(target.page).toHaveURL(/\/login(?:\?|$)/);
    await signIn(target.context, target.user.id, company.id);
    await target.page.goto("/settings");
    await expect(target.page).toHaveURL(/\/profile\/settings$/);
    await db.organisation.update({
      where: { id: company.id },
      data: { restrictedAccessAreas: ["sales"] },
    });
    const restricted = await sessionForUser(company.id, target.user.id);
    assert(
      restricted &&
        !restricted.capabilities.has("sales.quote.approve") &&
        restricted.capabilities.has("customers.read"),
    );
    await db.organisation.update({
      where: { id: company.id },
      data: { restrictedAccessAreas: [] },
    });
    await page.goto(`/settings/users/${other.membership.id}`);
    await expect(page.getByText(other.user.name, { exact: true })).toHaveCount(
      0,
    );
    console.log(
      "PASS mixed profiles, explicit grant/denial persistence, session revocation, company restriction precedence and user tenant boundary.",
    );
    for (const [label, width, height] of [
      ["desktop", 1440, 1000],
      ["tablet", 1024, 900],
      ["phone", 390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto("/settings?tab=roles");
      await page
        .getByRole("button", {
          name: new RegExp(`^Updated elsewhere ${suffix}`),
        })
        .click();
      await openSales(page);
      await expect(
        page.getByRole("button", { name: "Save profile", exact: true }),
      ).toBeVisible();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${label} company overflow`,
      );
      await page.screenshot({
        path: `${out}/profiles-${label}.png`,
        fullPage: true,
      });
      await viewer.page.setViewportSize({ width, height });
      await viewer.page.goto("/profile/settings");
      assert(
        await viewer.page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${label} personal overflow`,
      );
      await viewer.page.screenshot({
        path: `${out}/personal-${label}.png`,
        fullPage: true,
      });
      console.log(
        `PASS ${label}: company profiles and personal Settings layout.`,
      );
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS company/personal Settings acceptance; zero browser errors.",
    );
  } finally {
    await browser.close();
    await db.membership.updateMany({
      where: { organisationId: { in: [company.id, foreign.id] } },
      data: { active: false, sessionVersion: { increment: 1 } },
    });
    await db.user.updateMany({
      where: { id: { in: ids } },
      data: { authVersion: { increment: 1 } },
    });
    await db.organisation.updateMany({
      where: { id: { in: [company.id, foreign.id] } },
      data: { status: "SUSPENDED" },
    });
    await db.$disconnect();
    console.log(
      "Synthetic Test companies suspended and sessions revoked; audit history retained.",
    );
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
