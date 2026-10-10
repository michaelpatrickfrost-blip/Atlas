import { z } from "zod";
import { checksum } from "../registry/contracts";
import { customFieldPayloadSchema, fieldKeySchema, type CustomFieldPayload, type FieldValue } from "./schema";
import { versionedFieldPayloadSchema, type VersionedFieldPayload, type RequiredFactSource } from "./required-contract";
import { validateFieldConstraints, validateFieldValue } from "./validation";

/** Pure analysis only. Reviewed publication, owner access and durable jobs follow. */
export const fieldConversionSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("same_type") }),
  z.strictObject({ kind: z.literal("integer_to_decimal") }),
  z.strictObject({ kind: z.literal("string_to_enum"),
    mapping: z.array(z.strictObject({ from: z.string().min(1).max(4000), to: fieldKeySchema })).max(1000)
      .refine(rows => new Set(rows.map(row => row.from)).size === rows.length, "Duplicate source mapping."),
    unmapped: z.enum(["reject", "empty"]),
  }),
  z.strictObject({ kind: z.literal("date_to_datetime"), timezone: z.literal("UTC"), time: z.literal("start_of_day") }),
  z.strictObject({ kind: z.literal("datetime_to_date"), timezone: z.literal("UTC"), loss: z.enum(["reject", "allow_time_loss"]) }),
]);
export type FieldConversion = z.infer<typeof fieldConversionSchema>;
export type FieldEvolution<Payload = CustomFieldPayload> = {
  kind: "cosmetic" | "migration";
  source: Payload;
  target: Payload;
  indexImpact: string[];
  requiresUniquenessCheck: boolean;
  rollbackLimit: "unchanged_representation" | "reverse_review_after_target_writes";
};

function checkedPayload(input: unknown) {
  const payload = customFieldPayloadSchema.parse(input);
  payload.field = validateFieldConstraints(payload.field);
  return payload;
}

function withoutPresentation(payload: VersionedFieldPayload) {
  const storage = payload.field.storage;
  return { ...payload, field: { ...payload.field, label: "", help: "",
    storage: storage.type === "enum" || storage.type === "multi_enum"
      ? { ...storage, valueSetVersion: 0, options: storage.options.map(option => ({ ...option, label: "" })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) }
      : storage } };
}

export function analyseFieldEvolution(sourceInput: unknown, targetInput: unknown): FieldEvolution {
  const source = checkedPayload(sourceInput), target = checkedPayload(targetInput);
  return analyseCheckedEvolution(source, target);
}

/** Shared structural rules, preserving the legacy analyser's exact result. */
function analyseCheckedEvolution<Payload extends VersionedFieldPayload>(source: Payload, target: Payload): FieldEvolution<Payload> {
  if (source.entity.id !== target.entity.id || source.field.key !== target.field.key)
    throw new Error("Published field/entity identity cannot change; create a new field.");
  const from = source.field.storage, to = target.field.storage;
  if (from.type === "reference" && to.type === "reference" && checksum(from.entity) !== checksum(to.entity))
    throw new Error("A changed reference target requires a new field.");
  if ((from.type === "enum" || from.type === "multi_enum") && from.type === to.type && (to.type === "enum" || to.type === "multi_enum")) {
    const order = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    const fromOptions = [...from.options].sort(order);
    const toOptions = [...to.options].sort(order);
    const changed = checksum(fromOptions) !== checksum(toOptions);
    if (changed ? to.valueSetVersion !== from.valueSetVersion + 1 : to.valueSetVersion !== from.valueSetVersion)
      throw new Error("Changed choices require the next value-set version; unchanged choices retain their version.");
    if (from.options.some(option => !to.options.some(candidate => candidate.id === option.id)))
      throw new Error("Retire an existing choice instead of removing its stable ID.");
  }
  const cosmetic = checksum(withoutPresentation(source)) === checksum(withoutPresentation(target));
  if (!cosmetic && source.storageGeneration === target.storageGeneration)
    throw new Error("Reviewed structural evolution requires a new storage generation.");
  const kind = cosmetic ? "cosmetic" : "migration";
  const indexImpact: string[] = [];
  if (kind === "migration") {
    indexImpact.push("Populate the new generation; existing source values and indexes remain.");
    if (target.field.indexed) indexImpact.push("Validate typed values before enabling target filtering and sorting.");
    if (target.field.unique) indexImpact.push("Check all target values for duplicates before cutover.");
    if (source.field.unique && !target.field.unique) indexImpact.push("The target removes the field's uniqueness policy.");
  }
  return { kind, source, target, indexImpact, requiresUniquenessCheck: kind === "migration" && target.field.unique,
    rollbackLimit: kind === "cosmetic" ? "unchanged_representation" : "reverse_review_after_target_writes" };
}

export type RequiredFieldEvolution = FieldEvolution<VersionedFieldPayload> & {
  requirementImpact: {
    unconditional: "unchanged" | "enabled" | "disabled";
    condition: "none" | "added" | "removed" | "changed" | "unchanged";
    addedInputs: RequiredFactSource[];
    removedInputs: RequiredFactSource[];
    repinnedInputs: { source: RequiredFactSource; target: RequiredFactSource }[];
    requiresCanonicalReview: boolean;
    requiresConditionalValidation: boolean;
  };
};

function conditionInputs(payload: VersionedFieldPayload) {
  const inputs = new Map<string, RequiredFactSource>();
  if (payload.schemaVersion === 2) for (const { source } of payload.requiredIf.predicates) {
    const identity = source.kind === "native" ? `native:${source.fieldId}` : `field:${source.definitionId}`;
    // Multiple predicates may use one input. Different immutable pins for that
    // same field cannot silently collapse into one impact row.
    const previous = inputs.get(identity);
    if (previous && checksum(previous) !== checksum(source))
      throw new Error("FIELD_REQUIREMENT_INVALID: one condition input has conflicting version pins.");
    inputs.set(identity, source);
  }
  return new Map([...inputs].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}

/** Pure v1/v2 impact analysis for the upcoming reviewed migration protocol.
 * No conversion, owner approval, business values or publication authority. The
 * legacy analyser/converter/receipts deliberately still accept only v1.
 * Rule syntax/pins remain part of structural identity; even removing a rule
 * requires a reviewed new generation rather than changing published history.
 */
export function analyseRequiredFieldEvolution(sourceInput: unknown, targetInput: unknown): RequiredFieldEvolution {
  function checked(input: unknown): VersionedFieldPayload {
    const payload = versionedFieldPayloadSchema.parse(input);
    payload.field = validateFieldConstraints(payload.field);
    return payload;
  }
  const source = checked(sourceInput), target = checked(targetInput);
  const fromInputs = conditionInputs(source), toInputs = conditionInputs(target);
  const analysis = analyseCheckedEvolution(source, target);
  const fromCondition = source.schemaVersion === 2 ? source.requiredIf : null;
  const toCondition = target.schemaVersion === 2 ? target.requiredIf : null;
  const condition = fromCondition === null ? toCondition === null ? "none" : "added"
    : toCondition === null ? "removed" : checksum(fromCondition) === checksum(toCondition) ? "unchanged" : "changed";
  return { ...analysis, requirementImpact: {
    unconditional: source.field.required === target.field.required ? "unchanged" : target.field.required ? "enabled" : "disabled",
    condition,
    addedInputs: [...toInputs].filter(([id]) => !fromInputs.has(id)).map(([, input]) => input),
    removedInputs: [...fromInputs].filter(([id]) => !toInputs.has(id)).map(([, input]) => input),
    repinnedInputs: [...toInputs].flatMap(([id, input]) => {
      const previous = fromInputs.get(id);
      return previous && checksum(previous) !== checksum(input) ? [{ source: previous, target: input }] : [];
    }),
    requiresCanonicalReview: analysis.kind === "migration",
    requiresConditionalValidation: source.schemaVersion === 2 || target.schemaVersion === 2,
  } };
}

export class FieldConversionError extends Error {
  constructor(public readonly code: "INVALID_SOURCE" | "INVALID_TARGET" | "UNMAPPED_VALUE" | "LOSS_REQUIRES_REVIEW") {
    super({ INVALID_SOURCE: "The source value does not satisfy its schema.", INVALID_TARGET: "The converted value does not satisfy the target schema.",
      UNMAPPED_VALUE: "A source value has no explicit mapping.", LOSS_REQUIRES_REVIEW: "This conversion would discard a time; review the loss policy." }[code]);
    this.name = "FieldConversionError";
  }
}

/** No coercion, rounding, currency inference or arbitrary executable conversion. */
export function createFieldConverter(sourceInput: unknown, targetInput: unknown, ruleInput: unknown) {
  const analysis = analyseFieldEvolution(sourceInput, targetInput), rule = fieldConversionSchema.parse(ruleInput);
  const source = analysis.source.field, target = analysis.target.field;
  const from = source.storage.type, to = target.storage.type;
  const compatible = rule.kind === "same_type" ? from === to
    : rule.kind === "integer_to_decimal" ? from === "integer" && to === "decimal"
    : rule.kind === "string_to_enum" ? from === "string" && to === "enum"
    : rule.kind === "date_to_datetime" ? from === "date" && to === "datetime"
    : from === "datetime" && to === "date";
  if (!compatible) throw new Error("The selected conversion does not match the source and target types.");
  const mapping = rule.kind === "string_to_enum" ? new Map(rule.mapping.map(row => [row.from, row.to])) : null;
  const targetStorage = target.storage;
  if (rule.kind === "string_to_enum" && targetStorage.type === "enum" && rule.mapping.some(row => !targetStorage.options.some(option => option.id === row.to && !option.retired)))
    throw new Error("Mappings must select a current target choice.");
  // Retirement removes new selection eligibility, not readability of stable IDs.
  const historicalSource = source.storage.type === "enum" || source.storage.type === "multi_enum"
    ? { ...source, storage: { ...source.storage, options: source.storage.options.map(option => ({ ...option, retired: false })) } }
    : source;
  return (raw: unknown): { value: FieldValue | null; lossy: boolean } => {
    let value: FieldValue | null;
    try { value = validateFieldValue(historicalSource, raw); }
    catch { throw new FieldConversionError("INVALID_SOURCE"); }
    let converted: unknown = value?.value ?? null, lossy = false;
    if (value) {
      if (rule.kind === "integer_to_decimal" && value.type === "integer") converted = value.value.toString();
      else if (rule.kind === "string_to_enum" && value.type === "string") {
        if (mapping!.has(value.value)) converted = mapping!.get(value.value)!;
        else if (rule.unmapped === "empty") { converted = null; lossy = true; }
        else throw new FieldConversionError("UNMAPPED_VALUE");
      } else if (rule.kind === "date_to_datetime" && value.type === "date") converted = `${value.value}T00:00:00.000Z`;
      else if (rule.kind === "datetime_to_date" && value.type === "datetime") {
        converted = value.value.slice(0, 10);
        lossy = value.value !== `${converted}T00:00:00.000Z`;
        if (lossy && rule.loss === "reject") throw new FieldConversionError("LOSS_REQUIRES_REVIEW");
      }
    }
    // A representation migration may retain an existing retired choice. New user
    // writes still use the normal validator; string mappings cannot select it.
    const retainedTarget = rule.kind === "same_type" && (target.storage.type === "enum" || target.storage.type === "multi_enum")
      ? { ...target, storage: { ...target.storage, options: target.storage.options.map(option => ({ ...option, retired: false })) } }
      : target;
    try { return { value: validateFieldValue(retainedTarget, converted), lossy }; }
    catch { throw new FieldConversionError("INVALID_TARGET"); }
  };
}
