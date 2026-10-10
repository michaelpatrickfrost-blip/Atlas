import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { CapabilityRegistry } from "../registry/registry";
import { entityDetailsSchema } from "../registry/entities";
import { canonicalJson, checksum } from "../registry/contracts";
import { referenceSchema } from "../compiler/kernel";
import { compileCustomField, compileCustomFieldForRead } from "../compiler/fields";
import { customFieldSchema, fieldKeySchema, fieldStorageSchema } from "./schema";
import { validateFieldValue } from "./validation";
import { conditionalFieldPayloadSchema, requiredConditionSchema, requiredFactSourceSchema, type RequiredFactSource, type RequiredPredicate } from "./required-contract";

const classification = z.enum(["public_internal", "confidential", "restricted"]), sensitivity = { public_internal: 0, confidential: 1, restricted: 2 } as const;
const capability = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/), digest = z.string().regex(/^[a-f0-9]{64}$/);
const nativeEnum = z.strictObject({ type: z.literal("enum"), codes: z.array(z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/)).min(1).max(200)
  .refine(codes => new Set(codes).size === codes.length, "Duplicate native code.") });
/** Server-resolved metadata only. The provider must validate stored version/plan/
 * binding integrity and supply complete dependency closure, never business values.
 * Native declarations come only from the owning registered contract (d2).
 * No client endpoint or provider is wired by this pure compiler. */
export const requiredFactMetadataSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("native"), organisationId: z.string().min(1).max(100), entity: referenceSchema,
    fieldId: fieldKeySchema, classification, readCapability: capability.optional(), storage: z.union([nativeEnum, fieldStorageSchema]) }),
  z.strictObject({ kind: z.literal("field"), organisationId: z.string().min(1).max(100), entity: referenceSchema,
    definitionId: z.uuid(), versionId: z.uuid(), checksum: digest, generationId: z.uuid(), field: customFieldSchema,
    dependencyClosure: z.array(z.uuid()).max(100).refine(ids => new Set(ids).size === ids.length, "Duplicate field dependency.") }),
]);
export type RequiredFactMetadata = z.infer<typeof requiredFactMetadataSchema>;
export const requiredConditionPlanSchema = z.strictObject({ kind: z.literal("requiredIf"), schemaVersion: z.literal(1),
  definitionId: z.uuid(), entity: referenceSchema, fieldKey: fieldKeySchema, condition: requiredConditionSchema,
  facts: z.array(requiredFactMetadataSchema).min(1).max(20) });
export type RequiredCompilerContext = {
  session: Session; registry: CapabilityRegistry; definitionId: string;
  /** Rule metadata validation; read intent never requires target field write. */
  intent?: "read" | "write";
  /** Explicit owner declarations, not every readable native field automatically. */
  approvedNativeFacts: ReadonlySet<string>;
  resolveMetadata(source: RequiredFactSource): Promise<unknown>;
};
function invalid(message: string): never { throw new Error(`FIELD_REQUIREMENT_INVALID: ${message}`); }
function sourceKey(source: RequiredFactSource) { return canonicalJson(requiredFactSourceSchema.parse(source)); }

export function normaliseRequiredPredicate(predicate: RequiredPredicate, storage: z.infer<typeof fieldStorageSchema> | z.infer<typeof nativeEnum>): RequiredPredicate {
  if (predicate.operator === "present" || predicate.operator === "absent") return predicate;
  if (predicate.operator === "contains") {
    if (storage.type !== "multi_enum" || !storage.options.some(option => option.id === predicate.optionId)) invalid("Selection condition needs an approved multi-selection option.");
    return predicate;
  }
  if (predicate.value.type !== storage.type) invalid("The condition value type must match its source.");
  if (storage.type === "enum" && "codes" in storage) {
    if (predicate.value.type !== "enum" || !storage.codes.includes(predicate.value.value)) invalid("Choose an approved native code.");
    return predicate;
  }
  const retained = storage.type === "enum"
    ? { ...storage, options: storage.options.map(option => ({ ...option, retired: false })) } : storage;
  const value = validateFieldValue({ key: "condition_fact", label: "Condition value", classification: "public_internal", storage: retained }, predicate.value.value);
  if (value === null) invalid("Use present or absent for an empty value.");
  return requiredConditionSchema.shape.predicates.element.parse({ ...predicate, value });
}

/** Pure typed subplan for a field's versioned requiredIf. It neither evaluates
 * records nor publishes configurations. Complete native/coverage enforcement is
 * required before wiring this into the field definition compiler. */
export async function compileRequiredCondition(context: RequiredCompilerContext, input: unknown) {
  const target = conditionalFieldPayloadSchema.parse(input), definitionId = z.uuid().parse(context.definitionId);
  // Reuse existing owner/constraint/access validation without altering a v1
  // artefact or treating this subplan as a publishable field configuration.
  const compileTarget = context.intent === "read" ? compileCustomFieldForRead : compileCustomField;
  await compileTarget(context.session, { schemaVersion: 1, entity: target.entity,
    storageGeneration: target.storageGeneration, field: target.field }, context.registry);
  const owner = await context.registry.resolve(context.session, target.entity), details = entityDetailsSchema.parse(owner.details);
  if (owner.kind !== "entity" || !details.record?.fieldPolicy) invalid("An approved native field owner is required.");
  const facts = new Map<string, RequiredFactMetadata>(), predicates: RequiredPredicate[] = [];
  for (const predicate of target.requiredIf.predicates) {
    const key = sourceKey(predicate.source);
    let fact = facts.get(key);
    if (!fact) {
      fact = requiredFactMetadataSchema.parse(await context.resolveMetadata(predicate.source));
      if (fact.organisationId !== context.session.organisationId || fact.entity.id !== target.entity.id || fact.kind !== predicate.source.kind) invalid("The condition source must belong to this business and entity.");
      await context.registry.resolve(context.session, fact.entity);
      if (fact.kind === "native") {
        if (predicate.source.kind !== "native" || fact.fieldId !== predicate.source.fieldId || !context.approvedNativeFacts.has(fact.fieldId)) invalid("The owner has not approved this native fact.");
        const nativeFact = fact;
        const field = details.fields.find(field => field.id === nativeFact.fieldId);
        if (!field || fact.entity.version !== target.entity.version || fact.entity.schemaHash !== target.entity.schemaHash || fact.entity.contractHash !== target.entity.contractHash
          || field.type !== fact.storage.type || sensitivity[fact.classification] < sensitivity[field.classification]) invalid("The fact does not match its owner's declaration.");
        if (field.capability) assertCapability(context.session, field.capability);
        if (fact.readCapability) assertCapability(context.session, fact.readCapability);
        if (sensitivity[target.field.classification] < sensitivity[fact.classification]) invalid("A condition cannot downgrade source sensitivity.");
      } else {
        if (predicate.source.kind !== "field" || fact.definitionId !== predicate.source.definitionId || fact.versionId !== predicate.source.versionId || fact.checksum !== predicate.source.checksum) invalid("The field version pin changed.");
        if (fact.definitionId === definitionId || fact.field.key === target.field.key || fact.dependencyClosure.includes(definitionId)) invalid("Cyclic field requirements are not allowed.");
        await compileCustomFieldForRead(context.session, { schemaVersion: 1, entity: fact.entity, storageGeneration: fact.generationId, field: fact.field }, context.registry);
        if (sensitivity[target.field.classification] < sensitivity[fact.field.classification]) invalid("A condition cannot downgrade source sensitivity.");
      }
      facts.set(key, fact);
    }
    predicates.push(normaliseRequiredPredicate(predicate, fact.kind === "native" ? fact.storage : fact.field.storage));
  }
  const canonical = predicates.map(predicate => ({ predicate, key: canonicalJson(predicate) })).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  if (new Set(canonical.map(item => item.key)).size !== canonical.length) invalid("Duplicate field condition.");
  const condition = requiredConditionSchema.parse({ match: target.requiredIf.match, predicates: canonical.map(item => item.predicate) });
  const orderedFacts = [...facts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, fact]) => fact);
  const plan = requiredConditionPlanSchema.parse({ kind: "requiredIf", schemaVersion: 1, definitionId, entity: target.entity, fieldKey: target.field.key, condition, facts: orderedFacts });
  return { plan, checksum: checksum(plan) };
}
