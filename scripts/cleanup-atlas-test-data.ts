/** Explicit operator-authorised central Test cleanup, after public acceptance and backup. */
import assert from "node:assert/strict";
import { db } from "../src/core/db/client";
import { sessionForUser } from "../src/core/auth/session";
import {
  finishCompanyFileCleanup,
  wipeTestCompanies,
} from "../src/core/admin/wipe-company";

async function main() {
  assert(
    process.platform === "linux" &&
      process.env.ATLAS_TEST_CLEANUP === "1" &&
      process.env.ATLAS_RUNTIME !== "desktop",
  );
  assert(
    process.env.ATLAS_TEST_REVISION && process.env.ATLAS_CLEANUP_BACKUP,
    "A verified release and backup are required.",
  );
  const health = await fetch("https://atlassystem.online/api/health/release");
  assert(health.ok);
  assert.equal((await health.json()).revision, process.env.ATLAS_TEST_REVISION);
  const actor = await sessionForUser(
    process.env.ATLAS_GUARDIAN_ORGANISATION_ID!,
    process.env.ATLAS_GUARDIAN_USER_ID!,
  );
  assert(
    actor?.capabilities.has("atlas.companies.manage") &&
      actor.capabilities.has("atlas.staff.manage"),
    "Existing authorised staff required.",
  );
  const ordinary = await db.organisation.findMany({
    where: { NOT: { kind: "CUSTOMER", isTest: true } },
    select: { id: true },
  });
  const companies = await db.organisation.findMany({
    where: { kind: "CUSTOMER", isTest: true },
    select: { id: true, name: true, updatedAt: true },
    orderBy: { id: "asc" },
    take: 1001,
  });
  assert(
    companies.length <= 1000,
    "Review another bounded sweep for more than 1,000 Test companies.",
  );
  assert(!companies.some((company) => company.id === actor.organisationId));
  if (companies.length) {
    const result = await wipeTestCompanies(
      companies.map((company) => company.id),
      {
        actorUserId: actor.userId,
        currentOrganisationId: actor.organisationId,
        selection: companies.map((company) => ({
          id: company.id,
          name: company.name,
          updatedAt: company.updatedAt.toISOString(),
        })),
      },
    );
    assert.equal(
      result.status,
      "COMPLETE",
      "Private-file cleanup must finish.",
    );
    console.log(
      `PASS Deleted ${companies.length} explicitly marked Test companies and their scoped records; cleanup audit ${result.id}.`,
    );
  }
  const pending = await db.companyCleanupRun.findMany({
    where: { status: "FILES_PENDING" },
    select: { id: true },
  });
  for (const run of pending)
    assert.equal((await finishCompanyFileCleanup(run.id)).status, "COMPLETE");
  assert.equal(
    await db.organisation.count({ where: { kind: "CUSTOMER", isTest: true } }),
    0,
  );
  assert.equal(
    await db.organisation.count({
      where: { id: { in: ordinary.map((company) => company.id) } },
    }),
    ordinary.length,
    "Every existing ordinary/internal company must remain.",
  );
  assert(await db.membership.findUnique({ where: { id: actor.membershipId } }));
  assert(await db.user.findUnique({ where: { id: actor.userId } }));
  assert.equal(
    await db.companyCleanupRun.count({ where: { status: "FILES_PENDING" } }),
    0,
  );
  console.log(
    "PASS Zero central Test companies or pending Test-file deletions; ordinary/internal companies, shared staff identity and backups preserved.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
