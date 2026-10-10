import { z } from "zod";
import { canonicalJson, checksum } from "../registry/contracts";
import { normaliseRequiredPredicate, requiredConditionPlanSchema, type RequiredFactMetadata } from "./required-compiler";
import { requiredFactLiteralSchema, requiredFactSourceSchema, type RequiredFactSource } from "./required-contract";
import { validateFieldValue } from "./validation";
import type { FieldValue } from "./schema";

const sealedSchema = z.strictObject({ plan: requiredConditionPlanSchema, checksum: z.string().regex(/^[a-f0-9]{64}$/) });
const typedValue = z.strictObject({ type: z.string(), value: z.unknown().refine(value => value !== undefined && value !== null, "Use explicit null for an absent fact.") }).nullable();
const key = (source: RequiredFactSource) => canonicalJson(requiredFactSourceSchema.parse(source));
function invalid(): never { throw new Error("FIELD_REQUIREMENT_INVALID: approved rule facts are missing or changed."); }
function sourceOf(fact: RequiredFactMetadata): RequiredFactSource {
  return fact.kind === "native" ? { kind: "native", fieldId: fact.fieldId }
    : { kind: "field", definitionId: fact.definitionId, versionId: fact.versionId, checksum: fact.checksum };
}
function normaliseFact(fact: RequiredFactMetadata, input: unknown): FieldValue | null {
  const value = typedValue.parse(input), storage = fact.kind === "native" ? fact.storage : fact.field.storage;
  if (value === null) return null;
  if (value.type !== storage.type) invalid();
  if (storage.type === "enum" && "codes" in storage) {
    const literal = requiredFactLiteralSchema.parse(value);
    if (literal.type !== "enum" || !storage.codes.includes(literal.value)) invalid();
    return literal;
  }
  const retained = storage.type === "enum" || storage.type === "multi_enum"
    ? { ...storage, options: storage.options.map(option => ({ ...option, retired: false })) } : storage;
  return validateFieldValue({ key: "condition_fact", label: "Condition value", classification: "public_internal", required: false, storage: retained }, value.value);
}
function present(value: FieldValue | null): boolean { return value !== null && (value.type !== "multi_enum" || value.value.length > 0); }

/** Pure evaluator, no data access/grants. The server runtime must authorise native,
 * current/written field and reference policy before returning each value. Missing
 * metadata/unavailable/denied input is an error, not an absent/false condition.
 * All sources resolve before aggregation so short circuit cannot hide denial. */
// The returned condition result never relaxes the field's unconditional required
// flag; the future owning runtime must combine that flag with this result by OR.
export async function evaluateRequiredCondition(input: unknown, resolveValue: (source: RequiredFactSource, metadata: RequiredFactMetadata) => Promise<unknown>) {
  const sealed = sealedSchema.parse(input), plan = sealed.plan;
  const rawPlan = z.object({ plan: z.unknown() }).parse(input).plan;
  if (checksum(rawPlan) !== sealed.checksum || checksum(plan) !== sealed.checksum) invalid();
  const facts = new Map(plan.facts.map(fact => [key(sourceOf(fact)), fact]));
  const used = new Set(plan.condition.predicates.map(predicate => key(predicate.source)));
  if (facts.size !== plan.facts.length || facts.size !== used.size || [...used].some(id => !facts.has(id))) invalid();
  const predicates = plan.condition.predicates;
  if (new Set(predicates.map(canonicalJson)).size !== predicates.length) invalid();
  const organisations = new Set(plan.facts.map(fact => fact.organisationId));
  if (organisations.size !== 1 || plan.facts.some(fact => fact.entity.id !== plan.entity.id)) invalid();
  for (const predicate of predicates) {
    const fact = facts.get(key(predicate.source))!, storage = fact.kind === "native" ? fact.storage : fact.field.storage;
    if (canonicalJson(normaliseRequiredPredicate(predicate, storage)) !== canonicalJson(predicate)) invalid();
  }
  const values = new Map<string, FieldValue | null>();
  // Sequential deterministic reads suit a shared Postgres transaction and locks.
  for (const [id, fact] of [...facts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
    values.set(id, normaliseFact(fact, await resolveValue(sourceOf(fact), fact)));
  const outcomes = predicates.map(predicate => {
    const value = values.get(key(predicate.source))!;
    if (predicate.operator === "present") return present(value);
    if (predicate.operator === "absent") return !present(value);
    if (!present(value)) return false;
    if (predicate.operator === "contains") return value!.type === "multi_enum" && value!.value.includes(predicate.optionId);
    const equal = canonicalJson(value) === canonicalJson(predicate.value);
    return predicate.operator === "equals" ? equal : !equal;
  });
  const required = plan.condition.match === "all" ? outcomes.every(Boolean) : outcomes.some(Boolean);
  return { required, fingerprint: checksum({ conditionChecksum: sealed.checksum,
    observations: [...values].map(([source, value]) => ({ source, fingerprint: checksum(value) })) }) };
}
