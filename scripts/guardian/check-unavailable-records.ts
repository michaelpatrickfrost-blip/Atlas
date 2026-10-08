/** Opt-in central disposable Test fixtures. Browser business writes are blocked. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import { responseOutcome } from "./response-check";
import { readFileSync } from "node:fs";

let phase = "configuration";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_GUARDIAN_RECORD_TEST === "1" && process.env.ATLAS_RUNTIME !== "desktop");
  const base = new URL(process.env.ATLAS_RECORD_TEST_URL ?? "https://atlassystem.online");
  assert((base.protocol === "https:" && base.hostname === "atlassystem.online") || (base.protocol === "http:" && base.hostname === "127.0.0.1"));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const suffix = randomBytes(12).toString("hex"), prefix = `guardian-record-${suffix}`;
  const reproduce = process.argv.includes("--reproduce");
  const release = async () => { const r = await fetch(new URL("/api/health/release", base)); assert(r.ok); const result = await r.json() as { revision: string }; assert(/^[a-f0-9]{40}$/.test(result.revision)); return result.revision; };
  const revision = await release();
  if (process.env.ATLAS_RECORD_TEST_REVISION) assert.equal(revision, process.env.ATLAS_RECORD_TEST_REVISION);
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName?: string }> };
  const backgroundReads = new Set(Object.entries(manifest.node).filter(([, entry]) => entry.exportedName === "loadNotices").map(([id]) => id));
  const fixtures: { organisationId: string; slug: string; userIds: string[] }[] = [];
  const browser = await chromium.launch({ headless: true });
  try {
    phase = "central Test fixture";
    const caps = ["core.profile.self", "meetings.meeting.read", "maintenance.work.read", "fleet.vehicle.read", "engineering.revision.read", "core.products.read", "fieldservice.job.read", "customers.read"];
    const seeded = await db.$transaction(async tx => {
      const profiles = [];
      for (const side of ["inside", "outside"]) {
        const slug = `${prefix}-${side}`;
        const org = await tx.organisation.create({ data: { name: "Disposable Guardian record verification", slug, isTest: true, moduleStates: { create: ["meetings", "maintenance", "fleet", "engineering", "products", "fieldservice"].map(moduleId => ({ moduleId, enabled: true, entitled: true })) } } });
        const user = await tx.user.create({ data: { name: "Guardian record reader", email: `${slug}@example.test`, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) } });
        const member = await tx.membership.create({ data: { organisationId: org.id, userId: user.id, grantedCapabilities: caps } });
        fixtures.push({ organisationId: org.id, slug, userIds: [user.id] });
        profiles.push({ org, user, token: jwt.sign({ userId: user.id, organisationId: org.id, authVersion: user.authVersion, sessionVersion: member.sessionVersion }, process.env.SESSION_SECRET!, { algorithm: "HS256", expiresIn: "15m" }) });
      }
      const { org, user } = profiles[0];
      const hidden = await tx.user.create({ data: { name: "Guardian private organiser", email: `${prefix}-private@example.test`, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) } });
      await tx.membership.create({ data: { organisationId: org.id, userId: hidden.id, grantedCapabilities: caps } });
      fixtures[0].userIds.push(hidden.id);
      const organisationId = org.id, startsAt = new Date();
      const product = await tx.product.create({ data: { organisationId, code: "GUARDIAN-PART", name: "Guardian connected product", basePriceAmount: 0 } });
      const party = await tx.party.create({ data: { organisationId, name: "Guardian connected customer", kind: "COMPANY", customerCode: "GUARDIAN-CUSTOMER", status: "ACTIVE", tags: [] } });
      const meeting = await tx.meeting.create({ data: { organisationId, title: "Guardian visible meeting", startsAt, organiserUserId: user.id, attendeeUserIds: [] } });
      const privateMeeting = await tx.meeting.create({ data: { organisationId, title: "Guardian hidden meeting", agenda: "Guardian hidden agenda", visibility: "PRIVATE", startsAt, organiserUserId: hidden.id, attendeeUserIds: [] } });
      const equipment = await tx.maintenanceEquipment.create({ data: { organisationId, code: "GUARDIAN-ASSET", name: "Guardian visible equipment" } });
      const vehicle = await tx.fleetVehicle.create({ data: { organisationId, registration: "GUARDIAN-VAN", name: "Guardian visible vehicle" } });
      const work = await tx.maintenanceWorkOrder.create({ data: { organisationId, equipmentId: equipment.id, title: "Guardian visible work", kind: "REPAIR", reportedByUserId: user.id } });
      const vehicleWork = await tx.maintenanceWorkOrder.create({ data: { organisationId, vehicleId: vehicle.id, title: "Guardian vehicle work", kind: "SERVICE", reportedByUserId: user.id } });
      const revision = await tx.engineeringRevision.create({ data: { organisationId, productId: product.id, revision: "A", title: "Guardian visible revision", reason: "Recovery test", specification: "Guardian specification", authorUserId: user.id } });
      const job = await tx.fieldServiceJob.create({ data: { organisationId, partyId: party.id, title: "Guardian visible job", kind: "REPAIR", site: "Guardian Test site", instructions: "Guardian Test instructions", scheduledStart: startsAt, scheduledEnd: new Date(+startsAt + 3600000), createdByUserId: user.id } });
      return { profiles, meeting, privateMeeting, equipment, vehicle, work, vehicleWork, revision, job, product, party };
    });
    // Full exact fixture snapshots stay in process memory; no record data is exported.
    const snapshot = async () => {
      const organisationId = seeded.profiles[0].org.id, where = { organisationId };
      return JSON.stringify(await Promise.all([
        db.meeting.findMany({ where, orderBy: { id: "asc" } }), db.meetingEntry.findMany({ where }),
        db.maintenanceEquipment.findMany({ where }), db.maintenanceWorkOrder.findMany({ where, orderBy: { id: "asc" } }), db.maintenancePart.findMany({ where }),
        db.fleetVehicle.findMany({ where }), db.fleetLog.findMany({ where }), db.engineeringRevision.findMany({ where }), db.engineeringAttachment.findMany({ where }),
        db.fieldServiceJob.findMany({ where }), db.fieldServiceEntry.findMany({ where }), db.product.findMany({ where }), db.party.findMany({ where }),
        db.auditEntry.count({ where }), db.domainOutbox.count({ where }), db.financeDocument.count({ where }), db.inventoryMovement.count({ where }),
      ]));
    };
    const before = await snapshot();
    let writes = 0, blockedBackground = 0, errors = 0;
    const contexts = [];
    for (const profile of seeded.profiles) {
      const context = await browser.newContext({ baseURL: base.origin });
      await context.addCookies([{ name: "atlas_session", value: profile.token, url: base.origin, httpOnly: true, secure: base.protocol === "https:", sameSite: "Lax" }]);
      await context.route("**/*", route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== base.origin) return route.abort();
        if (url.pathname === "/api/guardian/telemetry") return route.fulfill({ status: 204 });
        if (["GET", "HEAD"].includes(request.method())) return route.continue();
        if (request.method() === "POST" && backgroundReads.has(request.headers()["next-action"])) blockedBackground++;
        else writes++;
        return route.abort();
      });
      context.on("page", page => page.on("pageerror", () => errors++));
      contexts.push(context);
    }
    const inside = await contexts[0].newPage(), outside = await contexts[1].newPage();
    const cases = [
      { root: "/meetings", id: seeded.meeting.id, title: seeded.meeting.title, unavailable: "Meeting unavailable", back: "Meetings calendar", destination: "/meetings", list: "Shared calendar" },
      { root: "/maintenance/equipment", id: seeded.equipment.id, title: seeded.equipment.name, unavailable: "Equipment unavailable", back: "Equipment register", destination: "/maintenance?view=equipment", list: "Equipment register" },
      { root: "/maintenance/work", id: seeded.work.id, title: seeded.work.title, unavailable: "Work order unavailable", back: "Maintenance work", destination: "/maintenance", list: "Maintenance work orders" },
      { root: "/fleet", id: seeded.vehicle.id, title: seeded.vehicle.name, unavailable: "Vehicle unavailable", back: "Vehicle register", destination: "/fleet", list: "Vehicle register" },
      { root: "/engineering", id: seeded.revision.id, title: seeded.revision.title, unavailable: "Revision unavailable", back: "Product revisions", destination: "/engineering", list: "Product revisions" },
      { root: "/fieldservice", id: seeded.job.id, title: seeded.job.title, unavailable: "Job unavailable", back: "Engineer schedule", destination: "/fieldservice", list: "Engineer schedule" },
    ];
    for (const c of cases) {
      phase = `authorised ${c.root}`;
      await inside.goto(`${c.root}/${c.id}`, { waitUntil: "networkidle" });
      await expect(inside.getByRole("heading", { name: c.title, exact: true })).toBeVisible();
      assert.equal(responseOutcome(200, await inside.content()), "http-render-pass");
      console.log(`PASS authorised record renders: ${c.root}/[id]`);
    }
    assert.equal(errors, 0, "Valid pages have no browser runtime errors");
    for (const c of cases) for (const variant of ["missing", "foreign"]) {
      phase = `${variant} ${c.root}`;
      const page = variant === "foreign" ? outside : inside;
      const response = await page.goto(`${c.root}/${variant === "foreign" ? c.id : `missing-${suffix}`}`, { waitUntil: "networkidle" });
      assert(response);
      const html = await page.content();
      if (reproduce) console.log(`Original safe classification: ${c.root} ${variant}, HTTP ${response.status()}, generic=${html.includes("Something went wrong.")}, headings=${await page.getByRole("heading").count()}`);
      phase = `${variant} ${c.root} content and heading`;
      assert(!(await page.locator("body").innerText()).includes(c.title), "Unavailable record content must not leak");
      if (reproduce) {
        await expect(page.getByText("Something went wrong.", { exact: true })).toBeVisible();
        assert.equal(responseOutcome(response.status(), html), "failed");
      } else {
        await expect(page.getByRole("heading", { name: c.unavailable, exact: true })).toBeVisible();
        assert.equal(responseOutcome(response.status(), html), "unavailable");
        assert.equal(await page.locator('main form[method="post"]').count(), 0);
        await page.getByRole("link", { name: c.back, exact: true }).click();
        await expect(page).toHaveURL(base.origin + c.destination);
        await expect(page.getByRole("heading", { name: c.list, exact: true })).toBeVisible();
      }
      console.log(`${reproduce ? "REPRODUCED generic error" : "PASS explicit unavailable state and working return link"}: ${variant} ${c.root}/[id]`);
    }
    phase = "private non-attendee meeting";
    const response = await inside.goto(`/meetings/${seeded.privateMeeting.id}`, { waitUntil: "networkidle" });
    assert(response);
    const privateHtml = await inside.content();
    assert(!privateHtml.includes(seeded.privateMeeting.title) && !privateHtml.includes(seeded.privateMeeting.agenda!));
    await expect(reproduce ? inside.getByText("Something went wrong.", { exact: true }) : inside.getByRole("heading", { name: "Meeting unavailable", exact: true })).toBeVisible();
    assert.equal(responseOutcome(response.status(), privateHtml), reproduce ? "failed" : "unavailable");
    if (!reproduce) {
      await inside.getByRole("link", { name: "Meetings calendar", exact: true }).click();
      await expect(inside.getByRole("heading", { name: "Shared calendar", exact: true })).toBeVisible();
      assert(!await inside.getByText(seeded.privateMeeting.title, { exact: true }).count());
    }
    console.log(`${reproduce ? "REPRODUCED generic error" : "PASS private meeting unavailable and working return"}; private title/agenda remain hidden.`);
    phase = "connected maintenance recovery";
    await inside.goto(`/maintenance/work/${seeded.work.id}`, { waitUntil: "networkidle" });
    await inside.locator(`main a[href="/maintenance/equipment/${seeded.equipment.id}"]`).click();
    await expect(inside.getByRole("heading", { name: seeded.equipment.name, exact: true })).toBeVisible();
    await inside.locator(`main a[href="/maintenance/work/${seeded.work.id}"]`).click();
    await expect(inside.getByRole("heading", { name: seeded.work.title, exact: true })).toBeVisible();
    await inside.goto(`/fleet/${seeded.vehicle.id}`, { waitUntil: "networkidle" });
    await inside.locator(`main a[href="/maintenance/work/${seeded.vehicleWork.id}"]`).click();
    await expect(inside.getByRole("heading", { name: seeded.vehicleWork.title, exact: true })).toBeVisible();
    await inside.locator(`main a[href="/fleet/${seeded.vehicle.id}"]`).click();
    await expect(inside.getByRole("heading", { name: seeded.vehicle.name, exact: true })).toBeVisible();
    phase = "unchanged central records";
    assert.equal(await snapshot(), before, "Exact central fixture records, versions, history, canonical connections and audit/outbox unchanged");
    phase = "blocked-write count";
    assert.equal(writes, 0, "No business write attempted; background notice reads are also blocked");
    assert.equal(await release(), revision, "Runtime must remain unchanged throughout proof");
    if (!reproduce) assert.equal(errors, 0, "No browser runtime errors");
    console.log(`Blocked ${blockedBackground} background notification reads; every non-GET/HEAD business request blocked.`);
    console.log("PASS equipment/work and fleet/work links round-trip; all exact central records/history and connections unchanged; no business write attempted.");
    console.log(reproduce ? "ORIGINAL REPRODUCTION PASSED: 13 unavailable record failures; 6 valid record pages." : "RECORD RECOVERY PASSED: 13 unavailable states/returns, 6 valid record pages, connected record round-trips, zero browser errors.");
  } finally {
    await browser.close();
    for (const f of fixtures) await db.$transaction(async tx => {
      const org = await tx.organisation.findFirst({ where: { id: f.organisationId, slug: f.slug, isTest: true } });
      if (!org) return; // Rolled-back setup transaction leaves no fixture to retire.
      await tx.organisation.update({ where: { id: org.id }, data: { status: "SUSPENDED", name: "Retired Guardian record verification" } });
      await tx.membership.updateMany({ where: { organisationId: org.id }, data: { active: false, sessionVersion: { increment: 1 } } });
      await tx.user.updateMany({ where: { id: { in: f.userIds } }, data: { authVersion: { increment: 1 } } });
    });
    await db.$disconnect();
    console.log("Exact disposable Test companies suspended and synthetic sessions revoked; history retained.");
  }
}
main().catch(error => { console.error(`Record recovery check failed at ${phase} (${error instanceof Error ? error.name : "UnknownError"}); inspect securely. No private record data or credentials logged.`); process.exitCode = 1; });
