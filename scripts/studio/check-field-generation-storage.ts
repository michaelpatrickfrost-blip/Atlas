import assert from "node:assert/strict";
import { writeGenerationFixture } from "./check-field-generation-continuation";
import type { Prisma, StudioFieldMigrationCutover } from "../../src/generated/prisma/client";
import type { Session } from "../../src/core/auth/session";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { compileCustomField } from "../../src/core/studio/compiler/fields";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { publishCompiledDefinitionInTransaction } from "../../src/core/studio/definitions/publication";
import { activateCompiledVersionInTransaction } from "../../src/core/studio/definitions/activation";

/** Called only inside the owner-authorised, rollback-only exact Test settlement
 * transaction. Exercises actual shared publisher/activation and SQL integrity;
 * never grants domain authority or introduces a production settlement service. */
export async function checkFieldGenerationStorage(tx: Prisma.TransactionClient, session: Session,
  settled: StudioFieldMigrationCutover, activeVersionId: string, parentId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert.equal(settled.organisationId, session.organisationId);
  assert(await tx.organisation.findFirst({ where: { id: session.organisationId, isTest: true, kind: "CUSTOMER",
    slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  const scope = { definitionId: settled.definitionId, organisationId: session.organisationId };
  const active = await tx.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, id: activeVersionId } });
  const payload = customFieldPayloadSchema.parse(active.payload);
  const cosmetic = customFieldPayloadSchema.parse({ ...payload, field: { ...payload.field, label: "Safe continued label", help: "Safe continued help" } });
  const compatible = async (candidate: unknown) => {
    const rows = await tx.$queryRaw<Array<{ compatible: boolean }>>`SELECT atlas_studio_field_cosmetic_compatible(${JSON.stringify(payload)}::jsonb,${JSON.stringify(candidate)}::jsonb) AS compatible`;
    return rows[0].compatible;
  };
  assert(await compatible(cosmetic));
  for (const candidate of [null, {}, { ...payload, field: null }, { ...cosmetic, storageGeneration: crypto.randomUUID() },
    { ...cosmetic, entity: { ...payload.entity, version: 999 } }, { ...cosmetic, field: { ...cosmetic.field, writeCapability: "foreign.write" } },
    { ...cosmetic, field: { ...cosmetic.field, classification: "restricted" } }, { ...cosmetic, field: { ...cosmetic.field, required: !cosmetic.field.required } }])
    assert.equal(await compatible(candidate), false);
  const generations = await tx.studioFieldGeneration.findMany({ where: scope, orderBy: { id: "asc" } });
  const versions = await tx.studioDefinitionVersion.findMany({ where: scope, orderBy: { version: "asc" } });
  const retainedVersionId = settled.state === "ROLLED_BACK" ? settled.targetVersionId : settled.sourceVersionId;
  const retainedVersion = await tx.studioDefinitionVersion.findFirstOrThrow({ where: { ...scope, id: retainedVersionId } });
  const retainedPayload = customFieldPayloadSchema.parse(retainedVersion.payload);
  await tx.$executeRaw`SAVEPOINT generation_retained_denial`;
  const definition = await tx.studioDefinition.findFirstOrThrow({ where: { id: scope.definitionId, organisationId: scope.organisationId } });
  await assert.rejects(() => tx.studioDefinition.update({ where: { id: definition.id, organisationId: scope.organisationId },
    data: { activeVersionId: retainedVersionId, revision: definition.revision + 1 } }), /retained history|explicit cutover/i);
  await tx.$executeRaw`ROLLBACK TO SAVEPOINT generation_retained_denial`;
  const retainedSlot = await tx.studioFieldSlot.findFirstOrThrow({ where: { ...scope, generationId: retainedPayload.storageGeneration } });
  await assert.rejects(() => tx.studioFieldSlot.update({ where: { id: retainedSlot.id, organisationId: scope.organisationId }, data: { revision: retainedSlot.revision + 1 } }),
    /retained history|target writes require reviewed execution/i);
  await tx.$executeRaw`ROLLBACK TO SAVEPOINT generation_retained_denial`;
  await tx.$executeRaw`RELEASE SAVEPOINT generation_retained_denial`;
  // Flush terminal proof before the later, independent cosmetic continuation.
  // The caller already did SET CONSTRAINTS IMMEDIATE for the exact settlement.
  const draftBefore = await tx.studioDraft.findFirstOrThrow({ where: scope });
  assert.equal((await tx.studioDraft.updateMany({ where: { ...scope, revision: draftBefore.revision },
    data: { payload: cosmetic, revision: draftBefore.revision + 1 } })).count, 1);
  const draft = await tx.studioDraft.findFirstOrThrow({ where: scope, include: { definition: true, baseVersion: { select: { version: true } } } });
  const compiled = await compileCustomField(session, cosmetic, studioRegistry());
  const published = await publishCompiledDefinitionInTransaction(tx, session, draft, draft.revision, compiled);
  await activateCompiledVersionInTransaction(tx, session, scope.definitionId, draft.definition.revision + 1, published.version, compiled, activeVersionId);
  await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
  assert.equal((await tx.studioDefinition.findFirstOrThrow({ where: { id: scope.definitionId, organisationId: scope.organisationId } })).activeVersionId, published.version.id);
  assert.deepEqual(await tx.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: settled.preparationId } }), settled);
  assert.deepEqual(await tx.studioFieldGeneration.findMany({ where: scope, orderBy: { id: "asc" } }), generations);
  assert.deepEqual(await tx.studioDefinitionVersion.findMany({ where: { ...scope, id: { in: versions.map(v => v.id) } }, orderBy: { version: "asc" } }), versions);
  const rows = await tx.$queryRaw<Array<{ active: boolean; foreign: boolean; retired: boolean }>>`SELECT
    atlas_studio_field_generation_active(${scope.organisationId},${scope.definitionId}::uuid,${payload.storageGeneration}::uuid,${published.version.id}::uuid) AS active,
    atlas_studio_field_generation_active('foreign',${scope.definitionId}::uuid,${payload.storageGeneration}::uuid,${published.version.id}::uuid) AS foreign,
    atlas_studio_field_generation_active(${scope.organisationId},${scope.definitionId}::uuid,${retainedPayload.storageGeneration}::uuid,${retainedVersion.id}::uuid) AS retired`;
  assert.deepEqual(rows, [{ active: true, foreign: false, retired: false }]);
  const written = await writeGenerationFixture(tx, session, scope.definitionId, cosmetic, published.version.id, parentId, cosmetic.field.storage.type === "integer" ? 26 : "26");
  assert.equal(written.versionId, published.version.id);
  await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
  console.log(`PASS rollback-only ${settled.state} continuation: actual same-generation label/help publish+activate; owner-authorised active-value fixture and schema/tenant/history guards, retained source or target writes/activation denied, original versions/generations/receipt unchanged.`);
}
