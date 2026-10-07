/** Server-only acceptance. Creates disposable Test companies; no real user credentials needed. */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import bcrypt from "bcryptjs";
import { db } from "../src/core/db/client";
import { wipeCompany } from "../src/core/admin/wipe-company";
async function main() {
  if (process.env.ATLAS_ADMIN_LIVE_TEST !== "1") throw new Error("Set ATLAS_ADMIN_LIVE_TEST=1 on the deployed server.");
  const base = process.env.ATLAS_ADMIN_TEST_URL ?? "https://atlassystem.online";
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  const post = async (name: string, fields: Record<string, string | string[]>, cookie = "", route = "/atlas") => {
    const action = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, value]) => value.exportedName === name); assert(action, `Action exists: ${name}`);
    const data = new FormData();
    for (const [key, values] of Object.entries(fields)) for (const value of Array.isArray(values) ? values : [values]) data.append(`_1_${key}`, value);
    // Match this Next version's encodeReply: nested fields precede the root model.
    data.set("0", '["$K1"]');
    const response = await fetch(`${base}${route}`, { method: "POST", redirect: "manual", headers: { Origin: base, "Next-Action": action[0], Accept: "text/x-component", ...(cookie ? { Cookie: cookie } : {}) }, body: data });
    return { response, body: await response.text() };
  };
  const login = async (email: string, password: string) => {
    const result = await post("loginAction", { email, password }, "", "/login");
    const cookie = result.response.headers.get("set-cookie")?.match(/atlas_session=[^;]+/)?.[0]; assert(cookie, "Normal password sign-in issues a session: " + JSON.stringify({status: result.response.status, redirect: result.response.headers.get("x-action-redirect"), error: result.body.includes("Incorrect email"), noWorkspace: result.body.includes("no active workspace"), length: result.body.length})); return cookie;
  };
  const page = async (route: string, cookie: string) => { const response = await fetch(`${base}${route}`, { headers: { Cookie: cookie }, redirect: "manual" }); return { response, body: await response.text() }; };
  const check = (condition: unknown, label: string) => { assert(condition, label); console.log(`PASS ${label}`); };
  const suffix = randomBytes(8).toString("hex"), password = randomBytes(22).toString("base64url");
  const companyIds: string[] = [], userIds: string[] = [], roleIds: string[] = [];
  try {
    const owner = await db.user.create({ data: { email: `atlas-check-owner-${suffix}@example.test`, name: "Disposable Atlas acceptance owner", passwordHash: await bcrypt.hash(password, 12) } }); userIds.push(owner.id);
    await db.platformAdministrator.create({ data: { userId: owner.id, role: "OWNER" } });
    const internal = await db.organisation.findUniqueOrThrow({ where: { slug: "atlas-internal-staff" } });
    await db.membership.create({ data: { organisationId: internal.id, userId: owner.id } });
    const a = await db.organisation.create({ data: { name: `Disposable Admin A ${suffix}`, slug: `atlas-check-a-${suffix}`, isTest: true } }); companyIds.push(a.id);
    const b = await db.organisation.create({ data: { name: `Disposable Admin B ${suffix}`, slug: `atlas-check-b-${suffix}`, isTest: true } }); companyIds.push(b.id);
    const reader = await db.role.create({ data: { organisationId: a.id, key: "check-reader", name: "Check customer reader", capabilities: ["customers.read"] } }); roleIds.push(reader.id);
    const forged = await db.role.create({ data: { organisationId: a.id, key: "check-forged", name: "Check forged platform role", capabilities: ["customers.read", "atlas.staff.manage", "atlas.companies.manage"] } }); roleIds.push(forged.id);
    const customer = await db.user.create({ data: { email: `atlas-check-customer-${suffix}@example.test`, name: "Disposable customer", passwordHash: await bcrypt.hash(password, 12) } }); userIds.push(customer.id);
    const member = await db.membership.create({ data: { organisationId: a.id, userId: customer.id, roles: { create: { roleId: forged.id } } } });
    const partyA = await db.party.create({ data: { organisationId: a.id, kind: "COMPANY", name: `EXPORT_ONLY_A_${suffix}`, customerCode: "CHECK-A", tags: [] } });
    await db.contact.create({ data: { partyId: partyA.id, firstName: "Export child", surname: suffix } });
    const partyB = await db.party.create({ data: { organisationId: b.id, kind: "COMPANY", name: `NEVER_EXPORT_B_${suffix}`, customerCode: "CHECK-B", tags: [] } });
    const document = Buffer.from(`Disposable document ${suffix}`);
    await db.hrPolicy.create({ data: { organisationId: a.id, title: "Export document", category: "Test", effectiveOn: new Date(), fileName: "test.txt", checksum: createHash("sha256").update(document).digest("hex"), content: document, uploadedByUserId: owner.id } });
    const ownerCookie = await login(owner.email, password), customerCookie = await login(customer.email, password);
    for (const [route, text] of [["/atlas", "Company accounts"], ["/atlas/team", "Atlas team"], ["/atlas/activity", "Admin activity"], [`/atlas/${a.id}`, "Registered company profile"], [`/atlas/${a.id}/users`, "Users &amp; access"], [`/atlas/${a.id}/users/${member.id}`, "Roles &amp; individual access"], [`/atlas/${a.id}/offboarding`, "Download company data"]]) {
      const result = await page(route, ownerCookie); check(result.response.status === 200 && result.body.includes(text), `Authenticated portal ${text}`);
    }
    const forbidden = await page("/atlas", customerCookie);
    check(!forbidden.body.includes("Company accounts") && !forbidden.body.includes("Atlas team"), "Customer roles cannot forge platform access");
    await post("archiveAtlasCompany", { organisationId: b.id, confirmName: b.name, reason: "Forged", currentPassword: password }, customerCookie, `/atlas/${b.id}/offboarding`);
    check((await db.organisation.findUniqueOrThrow({ where: { id: b.id } })).status === "ACTIVE", "Customer cannot change another company lifecycle");
    await post("saveAtlasUserAccess", { organisationId: b.id, membershipId: member.id, roleId: reader.id, capability: "customers.read" }, ownerCookie, `/atlas/${a.id}/users/${member.id}`);
    check((await db.membership.findUniqueOrThrow({ where: { id: member.id } })).sessionVersion === 0, "Foreign-company user target rejected");
    await post("saveAtlasUserAccess", { organisationId: a.id, membershipId: member.id, roleId: reader.id, capability: "customers.read" }, ownerCookie, `/atlas/${a.id}/users/${member.id}`);
    check((await db.membership.findUniqueOrThrow({ where: { id: member.id }, include: { roles: true } })).roles[0]?.roleId === reader.id, "Company roles and granular access saved");
    await post("saveAtlasUserProfile", { organisationId: a.id, membershipId: member.id, name: "Changed disposable profile", email: customer.email }, ownerCookie, `/atlas/${a.id}/users/${member.id}`);
    check((await db.user.findUniqueOrThrow({ where: { id: customer.id } })).name === "Changed disposable profile", "Customer profile changed and sessions revoked");
    const reset = await post("issueAtlasUserRecovery", { organisationId: a.id, membershipId: member.id, currentPassword: password }, ownerCookie, `/atlas/${a.id}/users/${member.id}`);
    const code = reset.body.match(/"code":"([a-f0-9]{64})"/)?.[1]; check(!!code, "Customer recovery code issued");
    const recovered = await post("completePasswordRecovery", { code: code!, password: `${password}-new`, confirmPassword: `${password}-new` }, "", "/reset-password");
    check(recovered.response.headers.has("set-cookie"), "Customer recovery opens signed session");
    const reused = await post("completePasswordRecovery", { code: code!, password: `${password}-again`, confirmPassword: `${password}-again` }, "", "/reset-password");
    check(!reused.response.headers.has("set-cookie") && await bcrypt.compare(`${password}-new`, (await db.user.findUniqueOrThrow({ where: { id: customer.id } })).passwordHash), "Recovery code cannot be reused");
    const addedEmail = `atlas-check-added-${suffix}@example.test`;
    const added = await post("createCompanyUser", { organisationId: a.id, name: "Added disposable customer", email: addedEmail, roleId: reader.id }, ownerCookie, `/atlas/${a.id}/users`);
    const addedUser = await db.user.findUnique({ where: { email: addedEmail } }); assert(addedUser, "Company user creation succeeds"); userIds.push(addedUser.id);
    const addedMember = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId: a.id, userId: addedUser.id } } });
    check(/"code":"[a-f0-9]{64}"/.test(added.body), "Customer user added with one-time setup code");
    await post("setCompanyUserStatus", { organisationId: a.id, membershipId: addedMember.id, status: "SUSPENDED" }, ownerCookie, `/atlas/${a.id}/users`);
    check(!(await db.membership.findUniqueOrThrow({ where: { id: addedMember.id } })).active, "Customer user suspension saved");
    await post("setCompanyUserStatus", { organisationId: a.id, membershipId: addedMember.id, status: "ACTIVE" }, ownerCookie, `/atlas/${a.id}/users`);
    check((await db.membership.findUniqueOrThrow({ where: { id: addedMember.id } })).active, "Customer user access restored");
    await post("saveAtlasCompanyBrand", { organisationId: a.id, legalName: "Selected company legal name", accentColour: "#123456" }, ownerCookie, `/atlas/${a.id}/setup`);
    const branded = (await db.organisation.findUniqueOrThrow({ where: { id: a.id } })).companyProfile as { legalName?: string };
    check(branded.legalName === "Selected company legal name" && (await db.organisation.findUniqueOrThrow({ where: { id: internal.id } })).name === "Atlas team", "Brand saved to selected company");
    const exportForm = new FormData(); exportForm.set("confirmName", a.name); exportForm.set("currentPassword", password);
    const exported = await fetch(`${base}/api/atlas/companies/${a.id}/export`, { method: "POST", headers: { Cookie: ownerCookie, Origin: base }, body: exportForm });
    check(exported.status === 200, `Full export endpoint succeeds (HTTP ${exported.status})`);
    const raw = gunzipSync(Buffer.from(await exported.arrayBuffer())).toString();
    const records = raw.trim().split("\n").map(line => JSON.parse(line));
    const summary = records.at(-1); check(summary.type === "manifest" && summary.complete && summary.counts.contacts === 1 && summary.counts.hr_policies === 1, "Export includes children, documents and complete manifest");
    check(raw.includes(partyA.name) && !raw.includes(partyB.name) && !raw.includes('"passwordHash":') && !raw.includes('"tokenHash":') && !raw.includes('"passwordEnc":'), "Export excludes other company records and credential values");
    check(records.some(row => row.table === "hr_policies" && row.data?.content === `\\x${document.toString("hex")}`), "Stored binary document exported intact");
    const staffEmail = `atlas-check-employee-${suffix}@example.test`;
    const created = await post("createAtlasStaff", { name: "Disposable Atlas employee", email: staffEmail, staffRole: "EMPLOYEE", currentPassword: password }, ownerCookie, "/atlas/team");
    const staff = await db.user.findUnique({ where: { email: staffEmail } }); assert(staff, `Atlas employee creation succeeds (HTTP ${created.response.status})`); userIds.push(staff.id);
    const staffCode = created.body.match(/"code":"([a-f0-9]{64})"/)?.[1]; check(!!staffCode, "Atlas employee created with platform setup code");
    await post("completePasswordRecovery", { code: staffCode!, password, confirmPassword: password }, "", "/reset-password");
    const staffCookie = await login(staffEmail, password);
    check((await page("/atlas/team", staffCookie)).body.includes("Add Atlas employee"), "Atlas employee has full platform administration");
    const opened = await post("openCompanyWorkspace", { organisationId: a.id }, staffCookie, `/atlas/${a.id}`);
    const companyCookie = opened.response.headers.get("set-cookie")?.match(/atlas_session=[^;]+/)?.[0]; assert(companyCookie);
    const workspaceSettings = await page("/settings?tab=workspace", companyCookie);
    check(workspaceSettings.response.status === 200 && workspaceSettings.body.includes("Workspace controls"), "Atlas employee opens full company settings");
    await post("updateAtlasStaff", { userId: staff.id, staffRole: "EMPLOYEE", status: "SUSPENDED", currentPassword: password }, ownerCookie, "/atlas/team");
    check((await page("/atlas", staffCookie)).response.status === 307, "Suspending staff revokes existing platform session");
    await post("archiveAtlasCompany", { organisationId: a.id, confirmName: a.name, currentPassword: password, reason: "Disposable offboarding acceptance" }, ownerCookie, `/atlas/${a.id}/offboarding`);
    check((await db.organisation.findUniqueOrThrow({ where: { id: a.id } })).status === "ARCHIVED" && await db.party.count({ where: { organisationId: a.id } }) === 1, "Archive blocks access and preserves records");
    const archivedExportForm = new FormData(); archivedExportForm.set("confirmName", a.name); archivedExportForm.set("currentPassword", password);
    const archivedExport = await fetch(`${base}/api/atlas/companies/${a.id}/export`, { method: "POST", headers: { Cookie: ownerCookie, Origin: base }, body: archivedExportForm });
    check(archivedExport.status === 200 && gunzipSync(Buffer.from(await archivedExport.arrayBuffer())).toString().includes(partyA.name), "Archived company remains fully exportable");
    const archivedLogin = await post("loginAction", { email: customer.email, password: `${password}-new` }, "", "/login");
    check(!archivedLogin.response.headers.has("set-cookie"), "Archived customer cannot sign in");
    await post("archiveAtlasCompany", { organisationId: a.id, confirmName: a.name, currentPassword: password, mode: "restore" }, ownerCookie, `/atlas/${a.id}/offboarding`);
    check((await db.organisation.findUniqueOrThrow({ where: { id: a.id } })).status === "SUSPENDED", "Restore stays suspended until reopened");
    console.log("LIVE ATLAS ADMIN ACCEPTANCE PASSED");
  } finally {
    await db.platformAdministrator.deleteMany({ where: { userId: { in: userIds } } });
    await db.membership.deleteMany({ where: { userId: { in: userIds }, organisation: { kind: "INTERNAL" } } });
    await db.auditEntry.deleteMany({ where: { actorUserId: { in: userIds }, organisation: { kind: "INTERNAL" } } });
    for (const id of companyIds.reverse()) await wipeCompany(id);
    await db.role.deleteMany({ where: { id: { in: roleIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect(); console.log("Disposable acceptance records removed.");
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Acceptance failed"); process.exitCode = 1; });
