import assert from "node:assert/strict";
import { Prisma } from "../../src/generated/prisma/client";
import type { Session } from "../../src/core/auth/session";
import { compileCustomFieldForRead } from "../../src/core/studio/compiler/fields";
import { compileConditionalCustomField } from "../../src/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "../../src/core/studio/fields/required-owner";
import { encodeFieldValue } from "../../src/core/studio/fields/codec";
import { evaluateInitialFieldRequirement, validateResultingFieldRequirements } from "../../src/core/studio/fields/required-runtime";
import { withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "../../src/core/studio/fields/runtime-authority";
import { validateCandidateFieldCoverage } from "../../src/core/studio/fields/required-coverage";

/** Compile using a genuine Test reader before its grants change. The returned
 * probe installs metadata/typed rows only inside the parent's rollback-only Test
 * transaction; it never dispatches unsupported conditional publication. */
export async function prepareFieldResultProbe(reader: Session, intent: "creation" | "coverage" = "creation") {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  const sourceId = crypto.randomUUID(), sourceVersionId = crypto.randomUUID(), rootId = crypto.randomUUID(), rootVersionId = crypto.randomUUID();
  const compiled = await withFieldRuntimeAuthority(reader, async ({ session, registry }) => {
    const reference = (version: number) => { const m = registry.describe("tickets.ticket", version); return { id: m.id, version: m.version, schemaHash: m.schemaHash, contractHash: m.contractHash }; };
    const source = await compileCustomFieldForRead(session, { schemaVersion: 1, entity: reference(2), storageGeneration: crypto.randomUUID(),
      field: { key: "result_probe_flag", label: "Exact Test result flag", classification: "confidential", storage: { type: "boolean" } } }, registry);
    const metadata = { kind: "field" as const, definitionId: sourceId, versionId: sourceVersionId, checksum: source.checksum, organisationId: session.organisationId,
      entity: source.payload.entity, generationId: source.payload.storageGeneration, field: source.payload.field, dependencyClosure: [] };
    const entity = reference(intent === "coverage" ? 8 : 7);
    const root = await compileConditionalCustomField({ session, registry, definitionId: rootId, intent: "read",
      resolveMetadata: async input => input.kind === "native" ? registeredRequiredFactMetadata(session, registry, entity, input.fieldId) : metadata },
    { schemaVersion: 2, entity, storageGeneration: crypto.randomUUID(), field: { key: "result_probe_notes", label: "Exact Test result notes", classification: "confidential", storage: { type: "string" } },
      requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: intent === "coverage" ? "RESOLVED" : "NEW" } },
        { source: { kind: "field", definitionId: sourceId, versionId: sourceVersionId, checksum: source.checksum }, operator: "equals", value: { type: "boolean", value: true } }] } });
    return { source, root, entity };
  });
  return async (authority: FieldRuntimeAuthority, recordId: string, proof?: object, rejectMissing = false) => {
    const { transaction: tx, session, registry } = authority, organisationId = session.organisationId;
    assert.equal(organisationId, reader.organisationId);
    if (intent === "creation") { assert(proof); assert(!session.capabilities.has("tickets.ticket.read")); assert(!session.capabilities.has("tickets.ticket.manage")); }
    else { assert(!proof); assert(session.capabilities.has("tickets.ticket.read")); assert(session.capabilities.has("tickets.ticket.manage")); assert(session.capabilities.has("studio.definition.publish")); }
    for (const [definitionId, versionId, field] of [[sourceId, sourceVersionId, compiled.source], [rootId, rootVersionId, compiled.root]] as const) {
      await tx.studioDefinition.create({ data: { id: definitionId, organisationId, kind: "customField", key: `tickets.ticket.${field.payload.field.key}`, name: field.payload.field.label, createdBy: session.userId } });
      await tx.studioDefinitionVersion.create({ data: { id: versionId, definitionId, organisationId, version: 1, semanticVersion: "1.0.0", schemaVersion: field.plan.schemaVersion,
        payload: field.payload, compiledPlan: field.plan, checksum: field.checksum, createdBy: session.userId } });
      await tx.studioDependency.createMany({ data: field.plan.dependencies.map(dependency => ({ definitionId, versionId, organisationId, ownerModuleId: dependency.ownerModuleId,
        contractId: dependency.id, contractVersion: dependency.version, schemaHash: dependency.schemaHash, contractHash: dependency.contractHash })) });
      await tx.studioFieldBinding.create({ data: { definitionId, organisationId, entityId: "tickets.ticket", fieldKey: field.payload.field.key, originVersionId: versionId, initialGenerationId: field.payload.storageGeneration } });
      await tx.studioFieldGeneration.create({ data: { id: field.payload.storageGeneration, definitionId, organisationId, entityId: "tickets.ticket", valueType: field.payload.field.storage.type, originVersionId: versionId } });
      await tx.studioDefinition.update({ where: { id: definitionId, organisationId }, data: { activeVersionId: intent === "coverage" && definitionId === rootId ? null : versionId, revision: 1, latestVersion: 1 } });
    }
    const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId, entityId: "tickets.ticket", recordId } })
      ?? await tx.studioExtensionRecord.create({ data: { organisationId, entityId: "tickets.ticket", recordId } });
    async function stage(definitionId: string, versionId: string, field: typeof compiled.source | typeof compiled.root, input: unknown) {
      const slot = await tx.studioFieldSlot.findFirst({ where: { organisationId, extensionId: extension.id, definitionId, generationId: field.payload.storageGeneration } })
        ?? await tx.studioFieldSlot.create({ data: { organisationId, entityId: "tickets.ticket", extensionId: extension.id, definitionId, generationId: field.payload.storageGeneration } });
      const encoded = encodeFieldValue(field.payload.field, input), revision = slot.revision + 1;
      const value = await tx.studioFieldValue.create({ data: { organisationId, definitionId, generationId: field.payload.storageGeneration, slotId: slot.id, versionId, revision,
        ...encoded, jsonValue: encoded.jsonValue === null ? Prisma.DbNull : encoded.jsonValue, createdBy: session.userId } });
      await tx.studioFieldSlot.update({ where: { id: slot.id, organisationId }, data: { revision, activeValueId: value.id } });
      await tx.studioExtensionRecord.update({ where: { id: extension.id, organisationId }, data: { revision: { increment: 1 } } });
    }
    await stage(sourceId, sourceVersionId, compiled.source, true);
    if (intent === "coverage") {
      const request = { definitionId: rootId, versionId: rootVersionId, definitionRevision: 1 };
      await assert.rejects(() => validateCandidateFieldCoverage(session, tx, request), /Exact Test result notes is required/);
      await stage(rootId, rootVersionId, compiled.root, "Reviewed final record");
      const count = await tx.serviceWorkItem.count({ where: { organisationId, kind: "TICKET" } });
      const covered = await validateCandidateFieldCoverage(session, tx, request);
      assert.equal(covered.recordCount, count); assert.match(covered.fingerprint, /^[a-f0-9]{64}$/);
      assert.equal((await tx.studioDefinition.findFirstOrThrow({ where: { id: rootId, organisationId } })).activeVersionId, null);
      await stage(sourceId, sourceVersionId, compiled.source, false); await stage(rootId, rootVersionId, compiled.root, null);
      const cleared = await validateCandidateFieldCoverage(session, tx, request);
      assert.equal(cleared.recordCount, count); assert.notEqual(cleared.fingerprint, covered.fingerprint);
      await assert.rejects(() => validateCandidateFieldCoverage(session, tx, { ...request, definitionRevision: 2 }), /FIELD_COVERAGE_CHANGED/);
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
      return;
    }
    assert(proof);
    const request = { entity: compiled.entity, recordId, expectedRevision: 1 };
    assert.equal((await evaluateInitialFieldRequirement(session, tx, { definitionId: rootId, recordId, expectedRevision: 1 }, proof)).required, true);
    if (rejectMissing) return validateResultingFieldRequirements(session, tx, request, proof); // Propagates through db.$transaction.
    await assert.rejects(() => validateResultingFieldRequirements(session, tx, request, proof), /Exact Test result notes is required/);
    await assert.rejects(() => evaluateInitialFieldRequirement(session, tx, { definitionId: rootId, recordId: "existing", expectedRevision: 1 }, proof), /FIELD_STORAGE_INVALID/);
    await assert.rejects(() => registry.invokeInitialRecordFacts({ session, transaction: tx }, compiled.entity, { ...proof }), /FORBIDDEN/);
    await stage(rootId, rootVersionId, compiled.root, "Reviewed");
    const filled = await validateResultingFieldRequirements(session, tx, request, proof); assert.equal(filled.extensionRevision, 2);
    await stage(sourceId, sourceVersionId, compiled.source, false); await stage(rootId, rootVersionId, compiled.root, null);
    const cleared = await validateResultingFieldRequirements(session, tx, request, proof); assert.equal(cleared.extensionRevision, 4); assert.notEqual(cleared.fingerprint, filled.fingerprint);
    await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`; // Prove actual FK/current-pointer/revision guards too.
  };
}
