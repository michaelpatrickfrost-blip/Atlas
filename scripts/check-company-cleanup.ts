/** Server-only disposable acceptance. Never selects existing user companies. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { db } from "../src/core/db/client";
import { saveServiceFile, removeServiceFile } from "../src/core/service-work/files";
import { wipeCompany } from "../src/core/admin/wipe-company";
import { cleanupConfirmation } from "../src/core/admin/cleanup-input";
async function main() {
  if (process.env.ATLAS_CLEANUP_LIVE_TEST !== "1") throw new Error("Run only on the deployed server with ATLAS_CLEANUP_LIVE_TEST=1.");
  const base = process.env.ATLAS_CLEANUP_TEST_URL ?? "https://atlassystem.online";
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  const post = async (name: string, fields: Record<string, string>, cookie = "", route = "/atlas/cleanup") => {
    const action = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, value]) => value.exportedName === name); assert(action, `Action ${name}`);
    const data = new FormData(); for (const [key, value] of Object.entries(fields)) data.append(`_1_${key}`, value); data.set("0", '["$K1"]');
    const response = await fetch(`${base}${route}`, { method: "POST", redirect: "manual", headers: { Origin: base, "Next-Action": action[0], Accept: "text/x-component", ...(cookie ? { Cookie: cookie } : {}) }, body: data });
    return { response, body: await response.text() };
  };
  const check = (condition: unknown, label: string) => { assert(condition, label); console.log(`PASS ${label}`); };
  const suffix = randomBytes(8).toString("hex"), password = randomBytes(24).toString("base64url"), userIds: string[] = [], companyIds: string[] = [], fileKeys: string[] = [];
  let internalId = "";
  try {
    const internal = await db.organisation.findUniqueOrThrow({ where: { slug: "atlas-internal-staff" } }); internalId = internal.id;
    const makeUser = async (name: string) => { const user = await db.user.create({ data: { name: `Disposable cleanup ${name}`, email: `atlas-cleanup-${name}-${suffix}@example.test`, passwordHash: await bcrypt.hash(password, 12) } }); userIds.push(user.id); return user; };
    const owner = await makeUser("owner"), shared = await makeUser("shared"), exclusive = await makeUser("exclusive"), employeeLogin = await makeUser("employee");
    await db.platformAdministrator.create({ data: { userId: owner.id, role: "OWNER" } });
    await db.membership.create({ data: { organisationId: internal.id, userId: owner.id } });
    const makeCompany = async (label: string, isTest = true) => { const company = await db.organisation.create({ data: { name: `Disposable cleanup ${label} ${suffix}`, slug: `cleanup-${label}-${suffix}`, isTest } }); companyIds.push(company.id); return company; };
    const a = await makeCompany("A"), b = await makeCompany("B"), keep = await makeCompany("Keep"), ordinary = await makeCompany("Ordinary", false);
    await db.membership.createMany({ data: [{ organisationId: a.id, userId: owner.id }, { organisationId: a.id, userId: shared.id }, { organisationId: keep.id, userId: shared.id }, { organisationId: a.id, userId: exclusive.id }] });
    await db.employee.create({ data: { organisationId: a.id, userId: employeeLogin.id, employeeNumber: "QA", firstName: "Synthetic", lastName: "Cleanup", email: employeeLogin.email, jobTitle: "Test", startDate: new Date() } });
    const party = await db.party.create({ data: { organisationId: a.id, kind: "COMPANY", customerCode: "C000001", name: "Synthetic cleanup customer" } });
    const keptParty = await db.party.create({ data: { organisationId: keep.id, kind: "COMPANY", customerCode: "C000001", name: "Synthetic preserved customer" } });
    const serviceCase = await db.serviceCase.create({ data: { organisationId: a.id, number: "CS-CLEANUP", partyId: party.id, subject: "Synthetic cleanup evidence", ownerUserId: owner.id, createdByUserId: owner.id } });
    const file = await saveServiceFile(new File([Buffer.from("%PDF-1.4\nSynthetic cleanup evidence")], "cleanup.pdf", { type: "application/pdf" })); fileKeys.push(file.storageKey);
    await db.serviceFile.create({ data: { ...file, organisationId: a.id, caseId: serviceCase.id, actorUserId: owner.id } });
    const entity = await db.financeEntity.create({ data: { organisationId: a.id, code: "QA", name: "Synthetic cleanup books" } });
    const period = await db.financePeriod.create({ data: { organisationId: a.id, entityId: entity.id, name: "QA year", startAt: new Date("2026-01-01"), endAt: new Date("2026-12-31T23:59:59.999Z") } });
    const accounts = await Promise.all(["BANK", "EQUITY"].map(code => db.financeAccount.create({ data: { organisationId: a.id, entityId: entity.id, code, name: code, type: code === "BANK" ? "ASSET" : "EQUITY" } })));
    const journal = await db.financeJournal.create({ data: { organisationId: a.id, entityId: entity.id, periodId: period.id, reference: "J-CLEANUP", description: "Synthetic cleanup", sourceKey: randomUUID(), sourceType: "MANUAL", accountingDate: new Date("2026-10-08"), currency: "GBP", creatorUserId: owner.id, lines: { create: accounts.map((account, index) => ({ accountId: account.id, description: "Synthetic balance", debit: index ? 0n : 100n, credit: index ? 100n : 0n, transactionDebit: index ? 0n : 100n, transactionCredit: index ? 100n : 0n })) } } });
    await db.financeJournal.update({ where: { id: journal.id }, data: { status: "POSTED", postedAt: new Date() } });
    const document = await db.financeDocument.create({ data: { organisationId: a.id, entityId: entity.id, kind: "AR_INVOICE", reference: "INV-CLEANUP", title: "Synthetic posted invoice", creatorUserId: owner.id, currency: "GBP", documentDate: new Date(), net: 100n, gross: 100n, lines: { create: { number: 1, description: "Synthetic", quantity: 1, unitPrice: 100n, net: 100n, tax: 0n } } } });
    await db.financeDocument.update({ where: { id: document.id }, data: { status: "POSTED" } });
    await db.financeTimeline.create({ data: { organisationId: a.id, documentId: document.id, actorUserId: owner.id, action: "test", detail: "Synthetic immutable history" } });
    await db.financeCollectionActivity.create({ data: { organisationId: a.id, documentId: document.id, kind: "CALL", notes: "Synthetic collection", actorUserId: owner.id } });
    const supplier = await db.financeSupplier.create({ data: { organisationId: a.id, partyId: party.id, creatorUserId: owner.id } });
    await db.financeBankVersion.create({ data: { organisationId: a.id, supplierId: supplier.id, accountName: "Synthetic", accountNumber: "00000000", fingerprint: createHash("sha256").update(suffix).digest("hex"), status: "VERIFIED", requesterUserId: owner.id, verifierUserId: shared.id, evidence: "Synthetic only" } });
    let locked = false; try { await db.financeJournal.delete({ where: { id: journal.id } }); } catch { locked = true; }
    check(locked, "Posted finance remains immutable outside an explicit Test cleanup");
    let ordinaryDeleteAllowed = false;
    try {
      await db.$transaction(async tx => {
        // This temporary designation exists only in a rolled-back synthetic transaction.
        await tx.organisation.update({ where: { id: a.id }, data: { isTest: false } });
        await tx.$queryRaw`SELECT set_config('atlas.test_wipe','on',true)`;
        await tx.financeJournal.delete({ where: { id: journal.id } });
        ordinaryDeleteAllowed = true;
        throw new Error("Always roll back the synthetic guard probe");
      });
    } catch { /* Expected database guard or forced rollback; no fixture change commits. */ }
    check(!ordinaryDeleteAllowed && (await db.organisation.findUniqueOrThrow({ where: { id: a.id } })).isTest, "Ordinary financial history stays protected even with the wipe flag");
    const signed = await post("loginAction", { email: owner.email, password }, "", "/login"); const cookie = signed.response.headers.get("set-cookie")?.match(/atlas_session=[^;]+/)?.[0]; assert(cookie);
    const page = await fetch(`${base}/atlas/cleanup`, { headers: { Cookie: cookie } }); const html = await page.text();
    check(page.status === 200 && html.includes(a.name) && html.includes(b.name) && !html.includes(ordinary.name), "Cleanup page lists Test companies and excludes ordinary companies");
    const snapshot = (items: { id: string; name: string; updatedAt: Date }[]) => JSON.stringify(items.map(({ id, name, updatedAt }) => ({ id, name, updatedAt: updatedAt.toISOString() })));
    const fields = { selectedCompanies: snapshot([a, b]), confirmation: cleanupConfirmation(2), acknowledge: "on", currentPassword: password };
    check((await post("deleteSelectedTestCompanies", { ...fields, currentPassword: "wrong" }, cookie)).body.includes("password was not recognised") && await db.organisation.count({ where: { id: { in: [a.id, b.id] } } }) === 2, "Wrong password leaves both selected companies intact");
    check((await post("deleteSelectedTestCompanies", { ...fields, confirmation: "DELETE EVERYTHING" }, cookie)).body.includes("confirmation shown"), "Wrong confirmation refuses deletion");
    check((await post("deleteSelectedTestCompanies", { ...fields, selectedCompanies: snapshot([a, ordinary]) }, cookie)).body.includes("Only companies created as Test") && !!await db.organisation.findUnique({ where: { id: a.id } }), "Mixed ordinary/Test selection refuses the entire sweep");
    check((await post("deleteSelectedTestCompanies", { ...fields, selectedCompanies: snapshot([a, { ...b, name: "Stale company name" }]) }, cookie)).body.includes("company list changed"), "Changed company details require a new review");
    const unauthorised = await post("loginAction", { email: shared.email, password }, "", "/login"); const customerCookie = unauthorised.response.headers.get("set-cookie")?.match(/atlas_session=[^;]+/)?.[0]; assert(customerCookie);
    const denied = await post("deleteSelectedTestCompanies", fields, customerCookie);
    check(!denied.body.includes('"deleted":2') && await db.organisation.count({ where: { id: { in: [a.id, b.id] } } }) === 2, "Customer identity cannot invoke platform deletion");
    const deleted = await post("deleteSelectedTestCompanies", fields, cookie);
    check(deleted.body.includes('"deleted":2') && deleted.body.includes('"filesPending":0'), "One sweep deletes both reviewed Test companies and completes file cleanup");
    check(await db.organisation.count({ where: { id: { in: [a.id, b.id] } } }) === 0, "Both company identities are removed");
    check(await db.financeJournal.count({ where: { organisationId: a.id } }) === 0 && await db.financeDocument.count({ where: { organisationId: a.id } }) === 0 && await db.financeTimeline.count({ where: { organisationId: a.id } }) === 0 && await db.financeBankVersion.count({ where: { organisationId: a.id } }) === 0, "Posted journals/invoices, verified bank history and immutable timeline are removed for Test only");
    check(await db.user.count({ where: { id: { in: [exclusive.id, employeeLogin.id] } } }) === 0, "Test-only login and employee identity are removed");
    check(!!await db.user.findUnique({ where: { id: shared.id } }) && !!await db.platformAdministrator.findUnique({ where: { userId: owner.id } }) && !!await db.party.findUnique({ where: { id: keptParty.id } }), "Shared login, Atlas staff and unselected company data remain intact");
    let exists = true; try { await access(path.join(process.env.ATLAS_SERVICE_FILE_ROOT!, file.storageKey)); } catch { exists = false; } check(!exists, "Uploaded evidence is removed from server storage");
    const run = await db.companyCleanupRun.findFirstOrThrow({ where: { actorUserId: owner.id } });
    check(run.status === "COMPLETE" && run.removedFileCount === 1 && !!await db.auditEntry.findFirst({ where: { organisationId: internal.id, entityId: run.id, action: "atlas.companies.deleted" } }), "Cleanup history and platform audit survive the deleted companies");
    check((await post("retryCompanyFileCleanup", { runId: run.id }, cookie)).body.includes('"filesPending":0'), "Repeating completed file cleanup is harmless");
    console.log("LIVE COMPANY CLEANUP ACCEPTANCE PASSED");
  } finally {
    for (const id of companyIds.reverse()) {
      const company = await db.organisation.findUnique({ where: { id } });
      if (company?.isTest) await wipeCompany(id); else if (company) await db.organisation.delete({ where: { id } });
    }
    const helperRuns = await db.companyCleanupRun.findMany({ where: { actorUserId: "acceptance-cleanup" }, select: { id: true, companies: true } });
    const helperIds = helperRuns.filter(run => Array.isArray(run.companies) && run.companies.some(company => company && typeof company === "object" && !Array.isArray(company) && typeof company.id === "string" && companyIds.includes(company.id))).map(run => run.id);
    await db.companyCleanupRun.deleteMany({ where: { OR: [{ actorUserId: { in: userIds } }, { id: { in: helperIds } }] } });
    await db.platformAdministrator.deleteMany({ where: { userId: { in: userIds } } });
    await db.membership.deleteMany({ where: { userId: { in: userIds } } });
    if (internalId) await db.auditEntry.deleteMany({ where: { organisationId: internalId, actorUserId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    for (const key of fileKeys) try { await removeServiceFile(key); } catch { /* Already removed by the sweep. */ }
    await db.$disconnect(); console.log("Disposable cleanup acceptance fixtures removed.");
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
