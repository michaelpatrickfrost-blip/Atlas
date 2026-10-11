/** Strict synthetic central acceptance child, never a production worker. */
import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  const [mode, organisationId, preparationId, rawRevision] = process.argv.slice(2);
  assert((mode === "abort-before-commit" || mode === "resume") && process.argv.length === 6);
  assert(/^[a-zA-Z0-9_-]+$/.test(organisationId) && /^[a-f0-9-]{36}$/.test(preparationId) && /^\d+$/.test(rawRevision));
  const revision = Number(rawRevision); assert(Number.isSafeInteger(revision) && revision <= 2147483646);
  assert(await db.organisation.findFirst({ where: { id: organisationId, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  // Initialise db before runtime registration, matching the existing acceptance bootstrap.
  const { sealFieldMigrationIntent } = await import("../../src/core/studio/fields/migrations/contracts");
  const { resolveFieldMigrationPrincipal } = await import("../../src/core/studio/fields/principal");
  const initial = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId } });
  const sealed = sealFieldMigrationIntent(initial.intent); assert.equal(sealed.checksum, initial.intentChecksum);
  const session = await resolveFieldMigrationPrincipal(sealed.intent.principal);
  if (mode === "resume") {
    const { executeFieldMigrationBatch } = await import("../../src/core/studio/fields/migrations/execution-batch");
    const result = await executeFieldMigrationBatch(session, { preparationId, revision, limit: 1 });
    console.log(JSON.stringify({ revision: result.revision, state: result.state, processedCount: result.processedCount, appended: result.appended, replayed: result.replayed }));
    return;
  }
  const { withFieldMigrationAuthority } = await import("../../src/core/studio/fields/migrations/authority");
  const { inspectFieldMigrationExecution } = await import("../../src/core/studio/fields/migrations/execution-inspection");
  const { writeFieldMigrationRepresentation } = await import("../../src/core/studio/fields/migrations/representation");
  await withFieldMigrationAuthority(session, sealed.intent.principal, async authority => {
    const inspected = await inspectFieldMigrationExecution(authority, sealed.intent);
    assert(inspected.progress?.state === "RUNNING" && inspected.progress.revision === revision);
    const rows = await authority.transaction.$queryRaw<Array<{ id: string }>>`SELECT id FROM studio_field_migration_observations
      WHERE "preparationId"=${preparationId}::uuid AND "organisationId"=${organisationId}
        AND (${inspected.progress.cursor}::text IS NULL OR "recordId" COLLATE "C">${inspected.progress.cursor}::text COLLATE "C") ORDER BY "recordId" COLLATE "C" LIMIT 1`;
    assert.equal(rows.length, 1);
    await writeFieldMigrationRepresentation(authority, inspected, rows[0].id);
    // Deliberately die after actual target/outcome writes, before cursor/Audit/commit.
    process.kill(process.pid, "SIGKILL");
    throw new Error("Acceptance termination did not occur");
  });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
