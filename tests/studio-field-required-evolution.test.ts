import { describe, expect, it } from "vitest";
import { analyseFieldEvolution, analyseRequiredFieldEvolution, createFieldConverter } from "@/core/studio/fields/evolution";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema, type RequiredCondition, type RequiredFactSource } from "@/core/studio/fields/required-contract";
import { sealFieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";

const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const hash = (letter: string) => letter.repeat(64);
const entity = { id: "tickets.ticket", version: 8, schemaHash: hash("a"), contractHash: hash("b") };
const legacy = () => customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(1),
  field: { key: "resolution_detail", label: "Resolution detail", classification: "confidential", storage: { type: "boolean" } } });
const status: RequiredFactSource = { kind: "native", fieldId: "status" };
const pin: RequiredFactSource = { kind: "field", definitionId: uuid(10), versionId: uuid(11), checksum: hash("c") };
function conditional(inputs: RequiredFactSource[] = [status], generation = uuid(1)) {
  const requiredIf: RequiredCondition = { match: "all", predicates: inputs.map(source => ({ operator: "present", source })) };
  return conditionalFieldPayloadSchema.parse({ ...legacy(), schemaVersion: 2, storageGeneration: generation, requiredIf });
}

describe("Version-aware reviewed requirement evolution impact", () => {
  it("preserves v2 cosmetic edits and original metadata without changing a generation", () => {
    const source = conditional(), before = structuredClone(source);
    const target = { ...source, field: { ...source.field, label: "Completion detail", help: "A clear explanation" } };
    expect(analyseRequiredFieldEvolution(source, target)).toMatchObject({ kind: "cosmetic", indexImpact: [],
      rollbackLimit: "unchanged_representation", requirementImpact: { condition: "unchanged", unconditional: "unchanged",
        addedInputs: [], removedInputs: [], repinnedInputs: [], requiresCanonicalReview: false, requiresConditionalValidation: true } });
    expect(source).toEqual(before);
  });

  it("requires reviewed new generations for adding, removing and changing conditional rules", () => {
    const v1 = legacy(), v2 = conditional();
    const changed = { ...v2, requiredIf: { ...v2.requiredIf, match: "any" as const } };
    for (const [source, target] of [[v1, v2], [v2, v1], [v2, changed]])
      expect(() => analyseRequiredFieldEvolution(source, target)).toThrow("new storage generation");
    const added = analyseRequiredFieldEvolution(v1, { ...v2, storageGeneration: uuid(2) });
    expect(added.requirementImpact).toMatchObject({ condition: "added", addedInputs: [status], requiresCanonicalReview: true });
    const removed = analyseRequiredFieldEvolution(v2, { ...v1, storageGeneration: uuid(2) });
    expect(removed.requirementImpact).toMatchObject({ condition: "removed", removedInputs: [status], requiresCanonicalReview: true });
    expect(analyseRequiredFieldEvolution(v2, { ...changed, storageGeneration: uuid(2) }).requirementImpact.condition).toBe("changed");
  });

  it("reports input additions, removals and exact immutable repins without hiding conflicting pins", () => {
    const source = conditional([pin, status, pin]);
    const repinned: RequiredFactSource = { ...pin, versionId: uuid(12), checksum: hash("d") };
    const priority: RequiredFactSource = { kind: "native", fieldId: "priority" };
    const target = conditional([priority, repinned, repinned], uuid(2));
    expect(analyseRequiredFieldEvolution(source, target).requirementImpact).toMatchObject({ condition: "changed",
      addedInputs: [priority], removedInputs: [status], repinnedInputs: [{ source: pin, target: repinned }] });
    expect(() => analyseRequiredFieldEvolution(source, conditional([pin, repinned], uuid(2)))).toThrow("conflicting version pins");
    const reordered = conditional([status, pin, pin], uuid(2));
    expect(analyseRequiredFieldEvolution(source, reordered).requirementImpact).toMatchObject({ condition: "changed",
      addedInputs: [], removedInputs: [], repinnedInputs: [], requiresCanonicalReview: true });
  });

  it("keeps unconditional requirements independent and preserves uniqueness and rollback impact", () => {
    const source = conditional();
    const mandatory = { ...source, storageGeneration: uuid(2), field: { ...source.field, required: true, unique: true, indexed: true } };
    expect(analyseRequiredFieldEvolution(source, mandatory)).toMatchObject({ kind: "migration", requiresUniquenessCheck: true,
      rollbackLimit: "reverse_review_after_target_writes", requirementImpact: { unconditional: "enabled", condition: "unchanged" } });
    expect(analyseRequiredFieldEvolution(source, mandatory).indexImpact.join(" ")).toContain("duplicates");
    const changedRule = conditional([pin], uuid(3));
    const keptMandatory = { ...changedRule, field: { ...mandatory.field } };
    const impact = analyseRequiredFieldEvolution(mandatory, keptMandatory);
    expect(impact.target.field.required).toBe(true);
    expect(impact.requirementImpact).toMatchObject({ unconditional: "unchanged", condition: "changed" });
    expect(analyseRequiredFieldEvolution(mandatory, { ...source, storageGeneration: uuid(3) }).requirementImpact.unconditional).toBe("disabled");
  });

  it("preserves enum IDs/reference/domain boundaries and rejects unsupported or executable metadata", () => {
    const source = conditional(), choices = { ...source, field: { ...source.field, storage: { type: "enum", valueSetVersion: 1,
      options: [{ id: "gold", label: "Gold", retired: false }] } } };
    const renamed = { ...choices, field: { ...choices.field, storage: { ...choices.field.storage, valueSetVersion: 2,
      options: [{ id: "gold", label: "Preferred", retired: false }] } } };
    expect(analyseRequiredFieldEvolution(choices, renamed).kind).toBe("cosmetic");
    const reference = { ...source, field: { ...source.field, storage: { type: "reference", entity } } };
    expect(() => analyseRequiredFieldEvolution(reference, { ...reference, storageGeneration: uuid(2),
      field: { ...reference.field, storage: { type: "reference", entity: { ...entity, version: 9 } } } })).toThrow("new field");
    for (const invalid of [{ ...source, schemaVersion: 3 }, { ...source, field: { ...source.field, key: "another_key" } },
      { ...source, entity: { ...entity, id: "sales.order" } }, { ...source, requiredIf: { ...source.requiredIf, script: "return true" } }])
      expect(() => analyseRequiredFieldEvolution(source, { ...invalid, storageGeneration: uuid(2) })).toThrow();
  });

  it("keeps the old analyser, converter and migration receipts closed and their v1 results unchanged", () => {
    const source = legacy(), target = { ...source, storageGeneration: uuid(2), field: { ...source.field, required: true } };
    const old = analyseFieldEvolution(source, target), next = analyseRequiredFieldEvolution(source, target);
    const { requirementImpact, ...base } = next;
    expect(base).toEqual(old);
    expect(requirementImpact).toMatchObject({ condition: "none", requiresConditionalValidation: false, unconditional: "enabled" });
    expect(createFieldConverter(source, target, { kind: "same_type" })(false)).toEqual({ value: { type: "boolean", value: false }, lossy: false });
    const v2 = conditional([status], uuid(2));
    expect(() => analyseFieldEvolution(source, v2)).toThrow();
    expect(() => createFieldConverter(source, v2, { kind: "same_type" })).toThrow();
    const intent = { schemaVersion: 1, id: uuid(20), organisationId: "company", definitionId: uuid(21), definitionRevision: 1,
      principal: { authority: "customer", organisationId: "company", userId: "user", membershipId: "member", authVersion: 1, sessionVersion: 1 },
      source: { versionId: uuid(22), versionChecksum: hash("e"), payload: source },
      target: { draftId: uuid(23), draftRevision: 1, compiledChecksum: hash("f"), payload: target },
      conversion: { kind: "same_type" }, ownerQuery: { ...entity, id: "tickets.ticket.migration_cohort", version: 1 } };
    expect(sealFieldMigrationIntent(intent).intent).toEqual(intent);
    expect(() => sealFieldMigrationIntent({ ...intent, target: { ...intent.target, payload: v2 } })).toThrow("review is invalid");
  });
});
