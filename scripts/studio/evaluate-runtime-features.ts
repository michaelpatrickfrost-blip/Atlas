import assert from "node:assert/strict";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Executed in EACH actual runtime by that runtime's own tsx loader. No database,
 * session, generated metadata or configuration writes. Unsupported parsers fail
 * closed; process/import failures are separately rejected by the parent probe. */
async function evaluate() {
  const root = resolve(process.argv[2] ?? "");
  if (root !== process.cwd()) throw new Error("Probe must run in the actual runtime directory.");
  const source = (path: string) => pathToFileURL(resolve(root, path)).href;
  const schema = await import(source("src/core/studio/fields/schema.ts"));
  const field = { key: "readiness", label: "Readiness", classification: "confidential", storage: { type: "integer", min: 0 },
    defaultValue: { type: "integer", value: 0 } };
  if (!schema.customFieldSchema.safeParse(field).success) return [];
  // The first bridge may retain a genuine predecessor without ANY form receipt
  // implementation. Its strict field parser proves unsupported before optional
  // newer modules are imported; missing legacy modules cannot abort the bridge.
  const receipt = await import(source("src/core/service-work/form-receipt-contract.ts"));
  const required = await import(source("src/core/studio/fields/required-contract.ts"));
  const validation = await import(source("src/core/studio/fields/validation.ts"));
  assert.deepEqual(validation.validateFieldConstraints(field).defaultValue, field.defaultValue);
  assert.throws(() => validation.validateFieldConstraints({ ...field, defaultValue: { type: "integer", value: -1 } }));
  const uuid = "00000000-0000-4000-8000-000000000001", hash = "a".repeat(64);
  const payload = { schemaVersion: 2, entity: { id: "tickets.ticket", version: 9, schemaHash: hash, contractHash: hash },
    storageGeneration: uuid, field, requiredIf: { match: "all", predicates: [{ operator: "present", source: { kind: "native", fieldId: "status" } }] } };
  assert.deepEqual(required.versionedFieldPayloadSchema.parse(payload).field.defaultValue, field.defaultValue);
  const savedField = { operationId: uuid, definitionId: uuid, definitionRevision: 0, versionId: uuid, generationId: uuid, fingerprint: hash,
    requestChecksum: hash, extensionId: uuid, extensionRevision: 1, slotId: uuid, slotRevision: 1, valueRevision: 1, defaulted: true };
  const saved = { schemaVersion: 1, organisationId: "readiness", actorUserId: "readiness", operationId: "00000000-0000-4000-8000-000000000002",
    operation: "create", recordId: "readiness", recordRevision: 1, requestRecordRevision: 1, fieldRecordRevision: 1,
    nativeRequestChecksum: hash, packetChecksum: hash, fields: [savedField] };
  assert.equal(receipt.ticketFormReceiptSchema.parse(saved).fields[0].defaulted, true);
  const legacyField = { ...field }; Reflect.deleteProperty(legacyField, "defaultValue");
  const legacyParsed = schema.customFieldSchema.parse(legacyField);
  assert.equal(Object.hasOwn(legacyParsed, "defaultValue"), false);
  const legacySavedField = { ...savedField }; Reflect.deleteProperty(legacySavedField, "defaulted");
  assert.equal(Object.hasOwn(receipt.ticketFormReceiptSchema.parse({ ...saved, fields: [legacySavedField] }).fields[0], "defaulted"), false);
  const features = ["literalFieldDefaults.v1"];
  // Absence is only a negative compatibility check. Existing modules must run
  // their actual strict parsers/engines; import or semantic failures are fatal.
  if (await pages(root, source, uuid, hash)) features.push("structuredPages.v1");
  if (await profiles(root, source, uuid, hash)) features.push("recordProfiles.v1");
  return features;
}
function available(root: string, paths: string[]) { return paths.every(path => existsSync(resolve(root, path))); }
const denyAccess = () => {
  let accesses = 0;
  const blocked = new Proxy({}, { get() { accesses++; throw new Error("Readiness must not access records or transactions."); } });
  return { blocked, accesses: () => accesses };
};
const forgedSession = () => ({ userId: "readiness", membershipId: "readiness", organisationId: "readiness", capabilities: new Set(["readiness.record.read"]) });
async function pages(root: string, source: (path: string) => string, uuid: string, hash: string): Promise<boolean> {
  if (!available(root, ["src/core/studio/pages/schema.ts", "src/core/studio/pages/compiler.ts", "src/core/studio/pages/runtime.ts", "src/core/studio/pages/render-model.ts"])) return false;
  const [schema, compiler, runtime, selection, display, contracts] = await Promise.all([
    import(source("src/core/studio/pages/schema.ts")), import(source("src/core/studio/pages/compiler.ts")),
    import(source("src/core/studio/pages/runtime.ts")), import(source("src/core/studio/pages/selection.ts")),
    import(source("src/core/studio/pages/render-model.ts")), import(source("src/core/studio/registry/contracts.ts")),
  ]);
  if (typeof runtime.readPublishedPageInTransaction !== "function") return false;
  const ref = (id: string) => ({ id, version: 1, schemaHash: hash, contractHash: hash });
  const identity = { ownerModuleId: "readiness", classification: "confidential", capability: "readiness.record.read" };
  const query = ref("readiness.record.page_get"), forms = ["desktop", "tablet", "phone"];
  const format = { kind: "money_minor", currencyColumnId: "currency" };
  const approvals = { entity: { ...ref("readiness.record"), ...identity, kind: "entity" }, sourcePage: { ...ref("readiness.record.page"), ...identity, kind: "surface" },
    variants: false, fieldSourceVersions: [], nativeFields: [{ id: "amount", label: "Total", classification: "confidential", editable: false, query, format },
      { id: "done", label: "Complete", classification: "confidential", editable: false, query }], customFields: [], facts: [], contracts: [],
    queries: [{ ...query, ...identity, kind: "query", sourceEntityId: "readiness.record", purpose: "fact", pagination: "none", maxCardinality: 1, costClass: "low",
      columns: [{ id: "amount", label: "Total", classification: "confidential", format }, { id: "currency", classification: "confidential" }, { id: "done", classification: "confidential" }] }],
    commands: [], metrics: [], surfaces: [], maxQueryCost: 4 };
  const payload = { schemaVersion: 1, entity: ref("readiness.record"), formFactors: forms, variants: [], sections: [{ id: "main", label: "Overview", help: "",
    formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: "details", type: "fields", formFactors: forms,
      fields: [{ source: "native", fieldId: "amount", mode: "read" }, { source: "native", fieldId: "done", mode: "read" }] }] }] };
  assert.equal(schema.pagePayloadSchema.safeParse({ ...payload, organisationId: "forged" }).success, false);
  assert.equal(schema.pagePayloadSchema.safeParse({ ...payload, schemaVersion: 999 }).success, false);
  const plan = compiler.compilePage(payload, approvals), digest = contracts.checksum(plan);
  assert.equal(digest, contracts.checksum(compiler.compilePage(payload, approvals)));
  assert.notEqual(digest, contracts.checksum(compiler.compilePage({ ...payload, sections: [{ ...payload.sections[0], label: "Changed" }] }, approvals)));
  const layout = selection.resolvePageVariant(plan, { capabilities: new Set([identity.capability]), recordTypeDefinitionId: null, facts: new Map() }, "phone");
  const values = { amount: 1234, currency: "KWD", done: false };
  const model = display.createPageDisplayModel(plan, layout, "phone", new Map(), new Map([["amount", { value: values.amount, values }], ["done", { value: false, values }]]));
  assert.equal(model.sections[0].columns, 1); assert.match(model.sections[0].components[0].cells[0].text, /1\.234/);
  assert.equal(model.sections[0].components[0].cells[1].text, "No");
  const unavailable = display.createPageDisplayModel(plan, layout, "phone", new Map(), new Map([["amount", { value: 1234, values: { ...values, currency: "ZZZ" } }]]));
  assert.equal(unavailable.sections[0].components[0].cells[0].unavailable, true);
  const access = denyAccess(), authority = { session: forgedSession(), stamp: {}, transaction: access.blocked, registry: access.blocked };
  await assert.rejects(() => runtime.readPublishedPageInTransaction(authority, { page: { kind: "page", definitionId: uuid, versionId: uuid, schemaVersion: 1, checksum: hash },
    request: { kind: "record", recordId: "readiness" }, formFactor: "phone", cursors: {} }), /DEPENDENCY_BROKEN/);
  assert.equal(access.accesses(), 0);
  return true;
}
async function profiles(root: string, source: (path: string) => string, uuid: string, hash: string): Promise<boolean> {
  if (!available(root, ["src/core/studio/record-types/schema.ts", "src/core/studio/record-types/compiler.ts", "src/core/studio/record-types/resolver.ts", "src/core/studio/record-types/runtime-profile.ts"])) return false;
  const [schema, compiler, resolver, runtime, contracts, registryModule] = await Promise.all([
    import(source("src/core/studio/record-types/schema.ts")), import(source("src/core/studio/record-types/compiler.ts")),
    import(source("src/core/studio/record-types/resolver.ts")), import(source("src/core/studio/record-types/runtime-profile.ts")),
    import(source("src/core/studio/registry/contracts.ts")), import(source("src/core/studio/registry/registry.ts")),
  ]);
  if (typeof runtime.resolveRecordProfileInTransaction !== "function") return false;
  // Only synthetic metadata: an empty profile needs no sealed rows or values.
  // This is not an issued data principal; the real runtime denial is separate.
  const registry = new registryModule.CapabilityRegistry(async () => true);
  const { z } = await import(source("node_modules/zod/index.js"));
  const projections = ["list", "get"].map(name => contracts.query({
    id: `readiness.record.${name}`, version: 1, label: "Readiness", capability: "readiness.record.read", kind: "query", lifecycle: "active", classification: "confidential",
    input: z.strictObject({}), output: z.strictObject({}), pagination: "none", maxCardinality: 1, costClass: "low",
    execute: () => { throw new Error("Readiness projections must never execute."); } }));
  registry.register("readiness", { contributions: [...projections, contracts.entity({ id: "readiness.record", version: 1, label: "Readiness", capability: "readiness.record.read", kind: "entity",
    lifecycle: "active", classification: "confidential", key: "string",
    fields: [{ id: "name", type: "string", nullable: false, classification: "confidential", filterable: false, sortable: false, decision: false, template: false }],
    record: { writeCapability: "readiness.record.write", detailRoute: "/readiness/{recordId}", labelField: "name",
      listQuery: { id: "readiness.record.list", version: 1 }, getQuery: { id: "readiness.record.get", version: 1 },
      nativeFields: "read_only", revision: "owner_positive_integer", authorise: () => { throw new Error("Readiness record policy must never execute."); } },
    extensionPolicy: { customFields: false, recordTypes: true, pageVariants: false } })] });
  const metadata = registry.describe("readiness.record", 1), entity = { id: metadata.id, version: 1, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const base = schema.entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] } });
  assert.equal(schema.entityProfilePayloadSchema.safeParse({ ...base, organisationId: "forged" }).success, false);
  assert.equal(schema.entityProfilePayloadSchema.safeParse({ ...base, schemaVersion: 999 }).success, false);
  const access = denyAccess(), compiled = await compiler.compileRecordProfile({ session: forgedSession(), transaction: access.blocked, registry, definitionId: uuid }, "entityProfile", base);
  assert.equal(compiled.checksum, contracts.checksum(compiled.plan));
  assert.deepEqual(compiled.plan.resolvedProfile, resolver.resolveEntityProfile(base).profile);
  assert.equal(access.accesses(), 0);
  const basePin = { kind: "entityProfile", definitionId: uuid, versionId: uuid, schemaVersion: 1, checksum: compiled.checksum };
  const ownId = "00000000-0000-4000-8000-000000000003";
  const overlay = schema.recordTypePayloadSchema.parse({ schemaVersion: 1, entity, label: "Readiness type", baseProfile: basePin, overlay: { page: null } });
  assert.deepEqual(resolver.resolveRecordTypeProfile({ reference: basePin, payload: base }, overlay, ownId).profile, compiled.plan.resolvedProfile);
  assert.throws(() => resolver.resolveRecordTypeProfile({ reference: { ...basePin, checksum: hash }, payload: base }, overlay, ownId));
  assert.throws(() => resolver.resolveEntityProfile(base, [overlay, overlay]));
  await assert.rejects(() => runtime.resolveRecordProfileInTransaction({ session: forgedSession(), stamp: {}, transaction: access.blocked, registry: access.blocked },
    { entity, recordId: "readiness", expectedRevision: 1 }), /FORBIDDEN: genuine current record design authority/);
  assert.equal(access.accesses(), 0);
  return true;
}
evaluate().then(features => process.stdout.write(JSON.stringify({ schemaVersion: 1, features })))
  .catch(() => { process.stderr.write("Studio runtime reader probe failed.\n"); process.exitCode = 1; });
