import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Actual runtime loader probe, not a native-data acceptance result. Missing
 * bridge entry is unsupported; present broken/unsafe semantics abort preparation.
 * Metadata compiler/evaluator and forged ordinary/native boundaries run without
 * any database or grants. The original guarded candidate checker proves writes. */
export async function probeConditionalFieldReaders(root: string): Promise<boolean> {
  if (!["src/core/studio/fields/conditional-readiness.ts", "src/core/studio/fields/required-runtime.ts",
    "src/core/studio/record-types/runtime-profile.ts", "src/core/service-work/studio-enforcement.ts",
    "src/core/studio/fields/runtime-write-window.ts"].every(path => existsSync(resolve(root, path)))) return false;
  const source = (path: string) => pathToFileURL(resolve(root, path)).href;
  const [readiness, features, registryModule, tickets, compiler, owner, evaluator, validation, runtime, enforcement, windows] = await Promise.all([
    import(source("src/core/studio/fields/conditional-readiness.ts")), import(source("src/core/studio/runtime-features.ts")), import(source("src/core/studio/registry/registry.ts")),
    import(source("src/core/service-work/studio.ts")), import(source("src/core/studio/fields/conditional-compiler.ts")),
    import(source("src/core/studio/fields/required-owner.ts")), import(source("src/core/studio/fields/required-evaluator.ts")),
    import(source("src/core/studio/fields/validation.ts")), import(source("src/core/studio/fields/required-runtime.ts")),
    import(source("src/core/service-work/studio-enforcement.ts")), import(source("src/core/studio/fields/runtime-write-window.ts")),
  ]);
  assert.equal(typeof readiness.assertConditionalFieldActivationReady, "function");
  // EACH actual runtime has its own sealed revision; the parent probe may be
  // running for a different candidate. Do not mistake that parent's env for the
  // rollback's identity or mutate its marker. An unsealed bridge has no marker.
  const originalRevision = process.env.ATLAS_RELEASE_REVISION;
  try {
    if (existsSync(resolve(root, ".atlas-ready"))) process.env.ATLAS_RELEASE_REVISION = readFileSync(resolve(root, ".atlas-ready"), "utf8").trim();
    readiness.assertConditionalFieldActivationReady({ isTest: true });
    if (features.isStudioRuntimeFeatureEnabled(features.STUDIO_CONDITIONAL_FIELD_FEATURE)) readiness.assertConditionalFieldActivationReady({ isTest: false });
    else assert.throws(() => readiness.assertConditionalFieldActivationReady({ isTest: false }), /UNAVAILABLE/);
  } finally { if (originalRevision === undefined) delete process.env.ATLAS_RELEASE_REVISION; else process.env.ATLAS_RELEASE_REVISION = originalRevision; }
  assert.equal(typeof windows.closeAffectedFieldWriteWindows, "function");
  assert.equal(typeof runtime.validateNativeResultingFieldRequirements, "function");
  assert.equal(typeof enforcement.withValidatedTicketMutation, "function");
  const registry = new registryModule.CapabilityRegistry(async () => true);
  registry.register("tickets", tickets.ticketStudioContract);
  const metadata = registry.describe("tickets.ticket", 9);
  const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const session = { userId: "readiness", organisationId: "readiness", membershipId: "readiness", name: "Readiness", email: "readiness@example.test",
    roleIds: [], capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage", "tickets.ticket.create"]) };
  const field = { key: "conditional_readiness", label: "Conditional readiness", classification: "confidential", required: false, storage: { type: "integer" } };
  const compiled = await compiler.compileConditionalCustomField({ session, registry, definitionId: "00000000-0000-4000-8000-000000000001",
    resolveMetadata: async () => owner.registeredRequiredFactMetadata(session, registry, entity, "status") },
  { schemaVersion: 2, entity, storageGeneration: "00000000-0000-4000-8000-000000000002", field,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "NEW" } }] } });
  assert.equal(compiled.plan.schemaVersion, 2);
  assert.equal((await evaluator.evaluateRequiredCondition(compiled.plan.requiredIf, async () => ({ type: "enum", value: "NEW" }))).required, true);
  assert.equal((await evaluator.evaluateRequiredCondition(compiled.plan.requiredIf, async () => ({ type: "enum", value: "IN_PROGRESS" }))).required, false);
  assert.deepEqual(validation.validateFieldValue({ ...field, required: true }, 0), { type: "integer", value: 0 });
  assert.deepEqual(validation.validateFieldValue({ ...field, required: true, storage: { type: "boolean" } }, false), { type: "boolean", value: false });
  assert.throws(() => validation.validateFieldValue({ ...field, required: true }, null), /required/);
  await assert.rejects(() => evaluator.evaluateRequiredCondition(compiled.plan.requiredIf, async () => { throw new Error("FORBIDDEN: unavailable input"); }), /FORBIDDEN/);
  let accesses = 0;
  const blocked = new Proxy({}, { get() { accesses++; throw new Error("Conditional readiness must not access data."); } });
  const authority = { session, stamp: {}, transaction: blocked, registry: blocked };
  await assert.rejects(() => runtime.validateNativeResultingFieldRequirements(authority,
    { entity, recordId: "readiness", expectedRevision: 1 }, "tickets.ticket.manage", {}), /FORBIDDEN/);
  await assert.rejects(() => runtime.validateResultingFieldRequirements(session, blocked, { entity, recordId: "readiness", expectedRevision: 1 }), /FORBIDDEN/);
  await assert.rejects(() => enforcement.withValidatedTicketMutation({ session, transaction: blocked }, "tickets.ticket.manage",
    async () => { throw new Error("Forged native callback must never execute."); }), /FORBIDDEN/);
  assert.equal(accesses, 0);
  return true;
}
