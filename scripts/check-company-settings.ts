/** Central synthetic Test-company acceptance. No existing company/user settings are changed. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  createRecoveryCredential,
  hashRecoveryCode,
} from "../src/core/auth/recovery";
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
  const adminPassword = randomUUID() + "Atlas!",
    accountPassword = randomUUID() + "Account!";
  const fixtureHash = await bcrypt.hash(adminPassword, 12);
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
          passwordHash: fixtureHash,
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
      .locator('select[name="sourceRoleId"]')
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
    const order = memberSales.getByRole("region", {
      name: "Sales: Order",
      exact: true,
    });
    await order.locator("summary").click();
    await order.getByLabel("Create", { exact: true }).uncheck();
    const quote = memberSales.getByRole("region", {
      name: "Sales: Quote",
      exact: true,
    });
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
    // Actual company-admin details, password assignment, login and one-use recovery.
    await page.goto(`/settings/users/${target.membership.id}?tab=details`);
    await page
      .getByLabel("Full name", { exact: true })
      .fill(`Updated member ${suffix}`);
    const newEmail = `updated-member-${suffix}@example.test`;
    await page.getByLabel("Sign-in email", { exact: true }).fill(newEmail);
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill("incorrect password");
    await page
      .getByRole("button", { name: "Save account details", exact: true })
      .click();
    await expect(page.locator('p[role="alert"]')).toContainText(
      "Confirm your own password",
    );
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id: target.user.id } }))
        .email,
      target.user.email,
    );
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill(adminPassword);
    await page
      .getByRole("button", { name: "Save account details", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await db.user.findUniqueOrThrow({ where: { id: target.user.id } }))
            .email,
      )
      .toBe(newEmail);
    await page.reload();
    await db.user.update({
      where: { id: target.user.id },
      data: { name: `Concurrent member ${suffix}` },
    });
    await page.getByLabel("Full name", { exact: true }).fill("Stale update");
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill(adminPassword);
    await page
      .getByRole("button", { name: "Save account details", exact: true })
      .click();
    await expect(page.locator('p[role="alert"]')).toContainText(
      "account changed",
    );
    const oldCode = createRecoveryCredential();
    const oldReset = await db.passwordReset.create({
      data: {
        membershipId: target.membership.id,
        tokenHash: oldCode.tokenHash,
        expiresAt: oldCode.expiresAt,
        createdAt: new Date(Date.now() - 120_000),
      },
    });
    await page.goto(`/settings/users/${target.membership.id}?tab=security`);
    const assignment = page.locator("form").filter({
      has: page.getByRole("button", {
        name: "Set user password",
        exact: true,
      }),
    });
    await assignment
      .getByLabel("New user password", { exact: true })
      .fill(accountPassword);
    await assignment
      .getByLabel("Confirm user password", { exact: true })
      .fill(accountPassword);
    await assignment
      .getByLabel("Confirm your password", { exact: true })
      .fill(adminPassword);
    await assignment
      .getByRole("button", { name: "Set user password", exact: true })
      .click();
    await expect
      .poll(async () =>
        bcrypt.compare(
          accountPassword,
          (await db.user.findUniqueOrThrow({ where: { id: target.user.id } }))
            .passwordHash,
        ),
      )
      .toBe(true);
    assert(
      (await db.passwordReset.findUniqueOrThrow({ where: { id: oldReset.id } }))
        .usedAt,
    );
    await target.page.goto("/profile/settings");
    await expect(target.page).toHaveURL(/\/login(?:\?|$)/);
    await target.context.clearCookies();
    await target.page.goto(`/business/${company.slug}/login`);
    await target.page.getByLabel("Email", { exact: true }).fill(newEmail);
    await target.page
      .getByLabel("Password", { exact: true })
      .fill(accountPassword);
    await target.page.getByRole("button", { name: /Sign in/ }).click();
    await expect(target.page).toHaveURL(/\/home$/);
    await page.reload();
    const recovery = page.locator("form").filter({
      has: page.getByRole("button", {
        name: "Generate recovery code",
        exact: true,
      }),
    });
    await recovery
      .getByLabel("Confirm your password", { exact: true })
      .fill(adminPassword);
    await recovery
      .getByRole("button", { name: "Generate recovery code", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Recovery code ready" }),
    ).toBeVisible();
    const code = await page.locator("code").innerText();
    const ownPassword = randomUUID() + "Recovered!";
    await target.context.clearCookies();
    await target.page.goto(`/business/${company.slug}/reset-password`);
    await target.page.getByLabel("Code", { exact: true }).fill(code);
    await target.page
      .getByLabel("New password", { exact: true })
      .fill(ownPassword);
    await target.page
      .getByLabel("Confirm password", { exact: true })
      .fill(ownPassword);
    await target.page
      .getByRole("button", { name: "Save password", exact: true })
      .click();
    await expect(target.page).toHaveURL(/\/home$/);
    assert(
      (
        await db.passwordReset.findUniqueOrThrow({
          where: { tokenHash: hashRecoveryCode(code) },
        })
      ).usedAt,
    );
    await target.page.goto(`/business/${company.slug}/reset-password`);
    await target.page.getByLabel("Code", { exact: true }).fill(code);
    await target.page
      .getByLabel("New password", { exact: true })
      .fill(ownPassword);
    await target.page
      .getByLabel("Confirm password", { exact: true })
      .fill(ownPassword);
    await target.page
      .getByRole("button", { name: "Save password", exact: true })
      .click();
    await expect(target.page.locator('p[role="alert"]')).toBeVisible();
    const audits = await db.auditEntry.findMany({
      where: { organisationId: company.id, entityId: target.membership.id },
    });
    assert(
      !JSON.stringify(audits).includes(accountPassword) &&
        !JSON.stringify(audits).includes(code),
    );
    console.log(
      "PASS account name/email, wrong-password/stale rejection, password assignment, old session/code revocation, actual login and one-use recovery; no credential Audit leakage.",
    );

    // Build the user's stated example through the profile and assignment forms.
    await page.goto("/settings?tab=roles");
    await page
      .getByRole("button", { name: "New profile", exact: true })
      .click();
    await dialog
      .getByLabel("Profile name", { exact: true })
      .fill(`Service manager ${suffix}`);
    await dialog
      .locator('select[name="sourceRoleId"]')
      .selectOption("starter:customer-service-manager");
    await dialog
      .getByRole("button", { name: "Create profile", exact: true })
      .click();
    await expect
      .poll(async () =>
        db.role.count({
          where: {
            organisationId: company.id,
            name: `Service manager ${suffix}`,
          },
        }),
      )
      .toBe(1);
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await page.goto(`/settings/users/${target.membership.id}`);
    await page.getByLabel(`Service manager ${suffix}`, { exact: true }).check();
    await page
      .getByRole("button", { name: "Review access", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Access review" }),
    ).toContainText("Invoices & customer balances");
    await page
      .getByRole("button", { name: "Save user access", exact: true })
      .click();
    await expect
      .poll(async () =>
        (await sessionForUser(company.id, target.user.id))?.capabilities.has(
          "finance.request.create",
        ),
      )
      .toBe(true);
    await db.moduleState.create({
      data: {
        organisationId: company.id,
        moduleId: "finance",
        enabled: true,
        entitled: true,
      },
    });
    const entity = await db.financeEntity.create({
      data: {
        organisationId: company.id,
        name: "Acceptance books",
        code: `QA-${suffix}`,
        currency: "GBP",
      },
    });
    const invoice = await db.financeDocument.create({
      data: {
        organisationId: company.id,
        entityId: entity.id,
        kind: "AR_INVOICE",
        reference: `QA-INVOICE-${suffix}`,
        title: "Visible customer invoice",
        creatorUserId: admin.user.id,
        currency: "GBP",
        documentDate: new Date(),
        net: 1000n,
        gross: 1000n,
      },
    });
    const hidden = await db.financeDocument.create({
      data: {
        organisationId: company.id,
        entityId: entity.id,
        kind: "REQUEST",
        reference: `QA-OTHER-${suffix}`,
        title: "Another user's request",
        creatorUserId: admin.user.id,
        currency: "GBP",
        documentDate: new Date(),
      },
    });
    await signIn(target.context, target.user.id, company.id);
    await target.page.goto("/finance/receivables");
    const invoiceLink = target.page.locator(`a[href="/finance/documents/${invoice.id}"]`);
    await expect(invoiceLink).toBeVisible();
    await expect(invoiceLink).toContainText(invoice.reference);
    await invoiceLink.click();
    await target.page.waitForURL(`**/finance/documents/${invoice.id}`);
    await expect(
      target.page.getByRole("heading", {
        name: invoice.reference,
        exact: true,
      }),
    ).toBeVisible();
    await target.page.goto("/finance/banking");
    await expect(
      target.page.getByText("Banking is restricted", { exact: true }),
    ).toBeVisible();
    await expect(
      target.page.getByRole("heading", { name: "Banking", exact: true }),
    ).toHaveCount(0);
    await target.page.goto("/finance/documents/new");
    await expect(
      target.page.getByRole("heading", {
        name: "Create a financial document",
        exact: true,
      }),
    ).toBeVisible();
    // Exact label text includes nested option text; the combobox name is the native accessible label.
    await target.page
      .getByRole("combobox", { name: "Document", exact: true })
      .selectOption("REQUEST");
    await target.page
      .getByLabel("Description", { exact: true })
      .fill(`Procurement acceptance ${suffix}`);
    await target.page
      .getByLabel("Line 1 description", { exact: true })
      .fill("Replacement service supplies");
    await target.page.getByLabel("Unit price", { exact: true }).fill("10.00");
    await target.page
      .getByRole("button", { name: "Save draft", exact: true })
      .click();
    await expect
      .poll(() =>
        db.financeDocument.count({
          where: {
            organisationId: company.id,
            creatorUserId: target.user.id,
            kind: "REQUEST",
            title: `Procurement acceptance ${suffix}`,
          },
        }),
      )
      .toBe(1);
    const request = await db.financeDocument.findFirstOrThrow({
      where: {
        organisationId: company.id,
        creatorUserId: target.user.id,
        kind: "REQUEST",
        title: `Procurement acceptance ${suffix}`,
      },
    });
    await expect(target.page).toHaveURL(
      new RegExp(`/finance/documents/${request.id}$`),
    );
    await expect(
      target.page.getByRole("heading", {
        name: request.reference,
        exact: true,
      }),
    ).toBeVisible();
    await target.page.goto("/finance/spend");
    const requestLink = target.page.locator(`a[href="/finance/documents/${request.id}"]`);
    await expect(requestLink).toBeVisible();
    await expect(requestLink).toContainText(request.reference);
    await expect(target.page.locator(`a[href="/finance/documents/${hidden.id}"]`)).toHaveCount(0);
    await expect(
      target.page.getByText(hidden.reference, { exact: true }),
    ).toHaveCount(0);
    await target.page.goto(`/finance/documents/${hidden.id}`);
    await expect(
      target.page.getByText(hidden.title, { exact: false }),
    ).toHaveCount(0);
    console.log(
      "PASS service-manager starter and actual assignment: invoice view, procurement draft/save/own request view, banking denial and other-user request isolation.",
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
      for (const userTab of ["access", "details", "security"]) {
        await page.goto(
          `/settings/users/${target.membership.id}?tab=${userTab}`,
        );
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${label} user ${userTab} overflow`,
        );
        await page.screenshot({
          path: `${out}/user-${userTab}-${label}.png`,
          fullPage: true,
        });
      }
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
