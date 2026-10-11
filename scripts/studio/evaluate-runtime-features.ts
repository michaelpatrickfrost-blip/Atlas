import assert from "node:assert/strict";
import { resolve } from "node:path";
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
  return ["literalFieldDefaults.v1"];
}
evaluate().then(features => process.stdout.write(JSON.stringify({ schemaVersion: 1, features })))
  .catch(() => { process.stderr.write("Studio runtime reader probe failed.\n"); process.exitCode = 1; });
