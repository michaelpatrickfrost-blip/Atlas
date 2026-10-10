import { z } from "zod";
import type { StudioDefinitionVersion } from "@/generated/prisma/client";
import type { CapabilityRegistry } from "../registry/registry";
import type { ContractReference } from "../registry/types";
import { referenceSchema } from "../compiler/kernel";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { conditionalFieldPlanSchema } from "./conditional-compiler";
import { inspectRequiredCondition } from "./required-evaluator";
import { customFieldPayloadSchema, fieldStorageSchema } from "./schema";
import { validateFieldConstraints } from "./validation";

const dependency = referenceSchema.extend({ ownerModuleId: z.string(), kind: z.literal("entity"), classification: z.enum(["public_internal", "confidential", "restricted"]) });
const legacyPlan = z.strictObject({ kind: z.literal("customField"), schemaVersion: z.literal(1), payload: customFieldPayloadSchema, dependencies: z.array(dependency).min(1).max(2) });
const ranks = { public_internal: 0, confidential: 1, restricted: 2 };
function invalid(): never { throw new Error("FIELD_STORAGE_INVALID: sealed field metadata changed."); }

/** Inspect immutable metadata without impersonating a data principal or executing
 * the field's own condition. Direct current/written field access is checked by
 * callers separately; inspecting dependency graphs does not read their values. */
export function inspectSealedFieldVersion(registry: CapabilityRegistry, version: StudioDefinitionVersion, organisationId: string, definitionId: string) {
  if (version.organisationId !== organisationId || version.definitionId !== definitionId) invalid();
  const schema = version.schemaVersion === 1 ? legacyPlan : version.schemaVersion === 2 ? conditionalFieldPlanSchema : null;
  if (!schema) invalid();
  const plan = schema.parse(version.compiledPlan), payload = plan.payload;
  if (checksum(version.compiledPlan) !== version.checksum || checksum(plan) !== version.checksum || checksum(version.payload) !== checksum(payload)
    || checksum(validateFieldConstraints(payload.field)) !== checksum(payload.field)) invalid();
  const expected = new Map<string, (typeof plan.dependencies)[number]>();
  function add(ref: ContractReference, kind: "entity" | "query") {
    const m = registry.describe(ref.id, ref.version);
    if (m.kind !== kind || m.schemaHash !== ref.schemaHash || m.contractHash !== ref.contractHash) invalid();
    expected.set(`${m.id}@${m.version}`, { ...ref, ownerModuleId: m.ownerModuleId, kind: m.kind, classification: m.classification });
    return m;
  }
  const owner = add(payload.entity, "entity"), details = entityDetailsSchema.parse(owner.details), policy = details.record?.fieldPolicy;
  if (!policy || !details.extensionPolicy.customFields || !policy.types.includes(payload.field.storage.type)
    || policy.reservedKeys.includes(payload.field.key) || details.fields.some(f => f.id === payload.field.key)
    || ranks[payload.field.classification] < ranks[owner.classification]) invalid();
  if (payload.field.storage.type === "reference") {
    const target = add(payload.field.storage.entity, "entity");
    if (!policy.referenceEntities.includes(target.id) || !entityDetailsSchema.parse(target.details).record || ranks[payload.field.classification] < ranks[target.classification]) invalid();
  }
  if (plan.schemaVersion === 2) {
    const condition = inspectRequiredCondition(plan.requiredIf).plan;
    if (condition.definitionId !== definitionId || condition.fieldKey !== payload.field.key || checksum(condition.entity) !== checksum(payload.entity)
      || checksum(condition.condition) !== checksum(plan.payload.requiredIf)) invalid();
    const fields = new Map<string, (typeof plan.fieldDependencies)[number]>();
    for (const fact of condition.facts) {
      if (fact.organisationId !== organisationId) invalid();
      const source = add(fact.entity, "entity");
      if (fact.kind === "field") {
        if (fact.definitionId === definitionId || fact.field.key === payload.field.key || fact.dependencyClosure.includes(definitionId)
          || ranks[payload.field.classification] < ranks[fact.field.classification]) invalid();
        fields.set(`${fact.definitionId}@${fact.versionId}`, { definitionId: fact.definitionId, versionId: fact.versionId, checksum: fact.checksum });
        if (fact.field.storage.type === "reference") add(fact.field.storage.entity, "entity");
      } else {
        const declaration = entityDetailsSchema.parse(source.details).record?.requiredFacts;
        const approved = declaration?.facts.find(f => f.fieldId === fact.fieldId);
        if (!declaration || !approved || checksum(fact.entity) !== checksum(payload.entity)
          || fact.classification !== approved.classification || fact.readCapability !== approved.capability || fact.storage.type !== approved.type
          || ranks[payload.field.classification] < ranks[fact.classification]) invalid();
        const storage = approved.type === "enum" ? { type: "enum", codes: approved.codes }
          : fieldStorageSchema.parse({ type: approved.type, ...(approved.type === "datetime" ? { timezone: "UTC" } : {}) });
        if (checksum(fact.storage) !== checksum(storage)) invalid();
        const m = registry.describe(declaration.query.id, declaration.query.version), query = add({ id: m.id, version: m.version, schemaHash: m.schemaHash, contractHash: m.contractHash }, "query");
        if (query.ownerModuleId !== source.ownerModuleId || query.capability !== source.capability || query.details.transaction !== "required" || ranks[payload.field.classification] < ranks[query.classification]) invalid();
        if (declaration.initialQuery) {
          const metadata = registry.describe(declaration.initialQuery.id, declaration.initialQuery.version), initial = add({ id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }, "query");
          const policy = entityDetailsSchema.parse(source.details).record?.initialisation;
          if (!policy || initial.ownerModuleId !== source.ownerModuleId || initial.capability !== policy.capability || initial.details.transaction !== "required"
            || ranks[payload.field.classification] < ranks[initial.classification]) invalid();
        }
      }
    }
    const pins = [...fields].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, pin]) => pin);
    if (checksum(pins) !== checksum(plan.fieldDependencies)) invalid();
  }
  const dependencies = [...expected.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version - b.version);
  if (checksum(dependencies) !== checksum(plan.dependencies)) invalid();
  return plan;
}
