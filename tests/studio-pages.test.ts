import { describe, expect, it } from "vitest";
import {
  compilePage, evaluatePageVisibility, pagePayloadSchema, pageVisibilityFactRequests, resolvePageVariant,
  visibilityPredicateSchema, type PageApprovals, type PageComponent, type PagePayload,
  type PageSelectionContext, type VisibilityPredicate,
} from "@/core/studio/pages";

// Pure compiler/selection fixtures. These approved shapes do not establish genuine
// registry/tenant/publication authority, owner queries, SQL or a live renderer.
const hash = "a".repeat(64), uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ref = (id: string) => ({ id, version: 1, schemaHash: hash, contractHash: "b".repeat(64) });
const entity = ref("tickets.ticket"), list = ref("tickets.ticket.list"), factQuery = ref("tickets.ticket.facts"),
  metric = ref("tickets.ticket.count"), metricQuery = ref("tickets.ticket.count_read"), command = ref("tickets.ticket.close"),
  surface = ref("tickets.ticket.activity"), surfaceQuery = ref("tickets.ticket.activity_read"), previewQuery = ref("tickets.ticket.close_preview");
const fieldPin = { kind: "customField" as const, definitionId: uuid(1), versionId: uuid(2), schemaVersion: 2 as const, checksum: hash };
const forms: PagePayload["formFactors"] = ["desktop", "tablet", "phone"];
const identity = { ownerModuleId: "tickets", classification: "confidential" as const, capability: "tickets.ticket.read" };
const approvals = (): PageApprovals => ({
  entity: { ...entity, ...identity, kind: "entity" },
  recordWriteCapability: "tickets.ticket.manage",
  nativeFields: [{ id: "subject", classification: "confidential", editable: false }, { id: "private_note", classification: "restricted", capability: "tickets.private.read", editable: false }],
  customFields: [{ reference: fieldPin, entity, classification: "restricted", readCapability: "tickets.private.read", writeCapability: "tickets.private.write", editable: true, required: true }],
  facts: [
    { id: "has_owner", contract: entity, query: factQuery, sourceEntityId: entity.id, valueType: "boolean", nullable: false, classification: "confidential", provenance: "owner_native" },
    { id: "open_count", contract: entity, query: factQuery, sourceEntityId: entity.id, valueType: "number", nullable: false, classification: "restricted", capability: "tickets.private.read", provenance: "owner_projection" },
  ],
  contracts: [],
  queries: [
    { ...list, ...identity, kind: "query", sourceEntityId: entity.id, purpose: "list", pagination: "cursor", maxCardinality: 50, costClass: "low", columns: [{ id: "subject", classification: "confidential" }, { id: "private_note", classification: "restricted", capability: "tickets.private.read" }] },
    { ...factQuery, ...identity, kind: "query", sourceEntityId: entity.id, purpose: "fact", pagination: "none", maxCardinality: 1, costClass: "low" },
    { ...metricQuery, ...identity, kind: "query", sourceEntityId: entity.id, purpose: "metric", pagination: "none", maxCardinality: 1, costClass: "medium" },
    { ...surfaceQuery, ...identity, kind: "query", sourceEntityId: entity.id, purpose: "surface", pagination: "cursor", maxCardinality: 20, costClass: "low" },
    { ...previewQuery, ...identity, kind: "query", sourceEntityId: entity.id, purpose: "preview", pagination: "none", maxCardinality: 1, costClass: "low" },
  ],
  commands: [{ ...command, ...identity, capability: "tickets.ticket.manage", kind: "command", sourceEntityId: entity.id, confirmation: "required", previewQuery, formFactors: forms }],
  metrics: [{ ...metric, ...identity, kind: "metric", sourceEntityId: entity.id, query: metricQuery, formFactors: forms }],
  surfaces: [{ ...surface, ...identity, kind: "surface", sourceEntityId: entity.id, family: "activity", queries: [surfaceQuery], formFactors: forms }],
});
const guidance: PageComponent = { id: "guidance", type: "instructions", text: "Choose the next step.", formFactors: forms };
const nativeFields: PageComponent = { id: "fields", type: "fields", fields: [{ source: "native", fieldId: "subject", mode: "read" }], formFactors: forms };
const listComponent: PageComponent = { id: "related", type: "queryList", query: list, pageSize: 20, columns: ["subject"], formFactors: forms };
const payload = (components: PageComponent[] = [guidance, nativeFields]): PagePayload => ({ schemaVersion: 1, entity, formFactors: forms,
  sections: [{ id: "main", label: "Ticket", help: "", columns: { desktop: 2, tablet: 2, phone: 1 }, formFactors: forms, components }], variants: [] });
const context = (grants = ["tickets.ticket.read"], facts: PageSelectionContext["facts"] = new Map()): PageSelectionContext => ({ capabilities: new Set(grants), recordTypeDefinitionId: null, facts });
const cap = (name: string): VisibilityPredicate => ({ kind: "capabilities", mode: "all", capabilities: [name] });
const fact = (factId: string, value: boolean | number): VisibilityPredicate => ({ kind: "fact", factId, operator: "equals", values: [value] });

describe("closed structured page compiler", () => {
  it("compiles flat approved families and exact dependencies without providers, hidden defaults or own version hashes", () => {
    const input = payload([guidance, nativeFields, listComponent,
      { id: "kpi", type: "metric", metric, formFactors: forms },
      { id: "timeline", type: "surface", family: "activity", surface, formFactors: forms },
      { id: "close", type: "action", command, collectInput: "owner_schema", confirm: true, preview: true, formFactors: forms },
    ]);
    const saved = structuredClone(input), plan = compilePage(input, approvals());
    expect(input).toEqual(saved);
    expect(plan.dependencies.map(value => value.id)).toEqual([entity.id, surface.id, surfaceQuery.id, command.id, previewQuery.id, metric.id, metricQuery.id, list.id].sort());
    expect(plan.dependencies.every(value => Object.keys(value).sort().join() === ["id", "version", "schemaHash", "contractHash", "ownerModuleId", "kind", "classification"].sort().join())).toBe(true);
    expect(plan.configurationDependencies).toEqual([]);
    expect(plan.accessMode).toBe("ordinary_read");
    expect(plan.approvals.facts).toEqual([]);
    expect(plan.approvals.customFields).toEqual([]);
    expect(plan).not.toHaveProperty("versionId");
    expect(plan.base.reads.find(value => value.componentId === "close")?.queries).toEqual([]);
    expect(plan.base.queryCost).toBe(5);
  });

  it("normalizes approval and variant order but preserves actual section/component editing order", () => {
    const input = payload(), variant = (id: string, priority: number) => ({ id, label: id, priority, when: cap("tickets.ticket.manage"), patches: [{ operation: "setSection" as const, sectionId: "main", properties: { label: id } }] });
    input.variants = [variant("lower", 1), variant("higher", 2)];
    const supplied = approvals(), reversed = { ...supplied, queries: [...supplied.queries].reverse(), nativeFields: [...supplied.nativeFields].reverse() };
    const first = compilePage(input, supplied), second = compilePage({ ...input, variants: [...input.variants].reverse() }, reversed);
    expect(first).toEqual(second);
    expect(first.base.sections[0].components.map(value => value.id)).toEqual(["guidance", "fields"]);
    const selected = resolvePageVariant(first, context(["tickets.ticket.read", "tickets.ticket.manage"]), "phone");
    expect(selected.variantId).toBe("higher");
    expect(selected.sections[0].label).toBe("higher");
    expect(first.base.sections[0].label).toBe("Ticket");
  });

  it("rejects duplicate nodes, ambiguous priorities, property collisions and missing/self ordering targets", () => {
    expect(() => compilePage(payload([guidance, { ...guidance }]), approvals())).toThrow(/Duplicate/);
    const withPatches = (patches: PagePayload["variants"][number]["patches"]) => ({ ...payload(), variants: [{ id: "special", label: "Special", priority: 1, when: cap("tickets.ticket.manage"), patches }] });
    expect(() => compilePage(withPatches([{ operation: "setSection", sectionId: "main", properties: { label: "A" } }, { operation: "setSection", sectionId: "main", properties: { label: "B" } }]), approvals())).toThrow(/Conflicting/);
    expect(() => compilePage(withPatches([{ operation: "setComponent", componentId: "unknown", properties: { label: "A" } }]), approvals())).toThrow(/missing/);
    expect(() => compilePage(withPatches([{ operation: "moveComponent", componentId: "fields", sectionId: "main", afterComponentId: "fields" }]), approvals())).toThrow(/itself/);
    expect(() => compilePage(withPatches([{ operation: "addComponent", sectionId: "main", afterComponentId: "guidance", component: { ...guidance, id: "added_a" } }, { operation: "addComponent", sectionId: "main", afterComponentId: "guidance", component: { ...guidance, id: "added_b" } }]), approvals())).toThrow(/Ambiguous/);
    const candidate = withPatches([{ operation: "setSection", sectionId: "main", properties: { label: "A" } }]);
    expect(() => compilePage({ ...candidate, variants: [...candidate.variants, { ...candidate.variants[0], id: "other" }] }, approvals())).toThrow(/priority/);
    expect(() => compilePage({ ...candidate, variants: [...candidate.variants, { ...candidate.variants[0], priority: 2 }] }, approvals())).toThrow(/variant ID/);
  });

  it("applies one flat deterministic add/move/remove patch without overlay chains", () => {
    const input = payload();
    input.variants = [{ id: "business", label: "Business", priority: 1, when: cap("tickets.ticket.manage"), patches: [
      { operation: "addSection", afterSectionId: "main", section: { ...input.sections[0], id: "details", label: "Details", components: [{ ...guidance, id: "instructions" }] } },
      { operation: "moveComponent", componentId: "fields", sectionId: "details", afterComponentId: null },
      { operation: "removeComponent", componentId: "instructions" },
      { operation: "moveSection", sectionId: "main", afterSectionId: "details" },
      { operation: "setComponent", componentId: "fields", properties: { label: "Your details", help: "Owner validation still applies" } },
    ] }];
    const plan = compilePage(input, approvals());
    expect(plan.variants[0].layout.sections.map(value => value.id)).toEqual(["details", "main"]);
    expect(plan.variants[0].layout.sections[0].components.map(value => value.id)).toEqual(["fields"]);
    expect(plan.variants[0].layout.sections[0].components[0].label).toBe("Your details");
    expect(() => pagePayloadSchema.parse({ ...input, parentPage: uuid(5) })).toThrow();
    expect(() => pagePayloadSchema.parse({ ...input, variants: [{ ...input.variants[0], variants: [] }] })).toThrow();
  });

  it("enforces usable phone representation, component forms, flat node and query cost/cardinality bounds", () => {
    expect(() => compilePage({ ...payload(), formFactors: ["desktop"] }, approvals())).toThrow(/phone/);
    const desktopOnly = payload([{ ...guidance, formFactors: ["desktop"] }]);
    expect(() => compilePage(desktopOnly, approvals())).toThrow(/tablet|phone/);
    const large = payload(); large.sections = Array.from({ length: 4 }, (_, i) => ({ ...large.sections[0], id: `section_${i}`, components: Array.from({ length: 26 }, (_, j) => ({ ...guidance, id: `note_${i}_${j}` })) }));
    expect(() => compilePage(large, approvals())).toThrow(/budget/);
    expect(() => compilePage(payload([guidance, { ...listComponent, pageSize: 50 }]), { ...approvals(), queries: approvals().queries.map(value => value.id === list.id ? { ...value, maxCardinality: 20 } : value) })).toThrow(/pagination/);
    expect(() => compilePage(payload([guidance, listComponent]), { ...approvals(), queries: approvals().queries.map(value => value.id === list.id ? { ...value, pagination: "none" } : value) })).toThrow(/pagination/);
    const manyLists = payload([guidance, ...Array.from({ length: 9 }, (_, i) => ({ ...listComponent, id: `related_${i}` }))]);
    expect(() => compilePage(manyLists, { ...approvals(), maxQueryCost: 8 })).toThrow(/query-cost/);
    expect(() => compilePage(payload([guidance, { id: "timeline", type: "surface", family: "activity", surface, formFactors: forms }]), { ...approvals(), surfaces: approvals().surfaces.map(value => ({ ...value, formFactors: ["desktop"] })) })).toThrow(/Surface/);
  });

  it("requires exact owner-approved entity/ref/purpose/column/editability/confirmation and rejects generic scripts/endpoints", () => {
    expect(() => compilePage({ ...payload(), entity: { ...entity, version: 2 } }, approvals())).toThrow(/exact/);
    expect(() => compilePage(payload([guidance, { ...listComponent, query: { ...list, schemaHash: "c".repeat(64) } }]), approvals())).toThrow(/incompatible/);
    expect(() => compilePage(payload([guidance, { ...listComponent, columns: ["bank_details"] }]), approvals())).toThrow(/column/);
    expect(() => compilePage(payload([guidance, listComponent]), { ...approvals(), queries: approvals().queries.map(value => value.id === list.id ? { ...value, columns: [{ id: "subject", classification: "confidential" }, { id: "subject", classification: "restricted", capability: "tickets.private.read" }] } : value) })).toThrow(/Duplicate/);
    expect(() => compilePage(payload([guidance, { ...nativeFields, fields: [{ source: "native", fieldId: "subject", mode: "edit" }] }]), approvals())).toThrow(/owner/);
    expect(() => compilePage(payload([guidance, { ...listComponent, query: factQuery }]), approvals())).toThrow(/purpose/);
    expect(() => compilePage(payload([guidance, { id: "close", type: "action", command, collectInput: "owner_schema", confirm: false, preview: false, formFactors: forms }]), approvals())).toThrow(/Action/);
    expect(() => compilePage(payload([guidance, { id: "stage", type: "surface", family: "process_stage", surface, formFactors: forms }]), approvals())).toThrow(/Surface/);
    for (const property of ["endpoint", "sql", "script", "organisationId", "input", "html"]) expect(() => pagePayloadSchema.parse({ ...payload(), [property]: "untrusted" })).toThrow();
    expect(() => pagePayloadSchema.parse(payload([{ ...guidance, type: "process" } as unknown as PageComponent]))).toThrow();
  });

  it("pins current extension presentations without weakening hidden required validation or granting native writes", () => {
    const extension: PageComponent = { id: "bespoke", type: "fields", formFactors: forms, visibleWhen: cap("tickets.private.read"), fields: [{ source: "extension", reference: fieldPin, mode: "edit", label: "Customer reference" }] };
    const plan = compilePage(payload([guidance, extension]), approvals());
    expect(plan.configurationDependencies).toEqual([fieldPin]);
    expect(plan.warnings).toEqual(["Hidden required fields still require a valid value through the owning form."]);
    expect(resolvePageVariant(plan, context(), "phone").sections[0].components.map(value => value.id)).toEqual(["guidance"]);
    const mode = (grants: string[]) => {
      const component = resolvePageVariant(plan, context(grants), "phone").sections[0].components.find(value => value.id === "bespoke");
      return component?.type === "fields" ? component.fields[0].mode : null;
    };
    expect(mode(["tickets.ticket.read", "tickets.private.read"])).toBe("read");
    expect(mode(["tickets.ticket.read", "tickets.private.read", "tickets.ticket.manage"])).toBe("read");
    expect(mode(["tickets.ticket.read", "tickets.private.read", "tickets.ticket.manage", "tickets.private.write"])).toBe("edit");
    expect(() => compilePage(payload([guidance, extension]), { ...approvals(), recordWriteCapability: undefined })).toThrow(/owner/);
    expect(() => compilePage(payload([guidance, extension]), { ...approvals(), customFields: approvals().customFields.map(value => ({ ...value, entity: ref("sales.order") })) })).toThrow(/different entity/);
    expect(() => pagePayloadSchema.parse(payload([{ ...extension, fields: [{ ...extension.fields[0], required: false }] } as unknown as PageComponent]))).toThrow();
  });

  it("handles missing/unreadable facts as false, preserving exact zero/false/null semantics and fact type safety", () => {
    const input = payload([guidance, { ...listComponent, visibleWhen: fact("has_owner", false) }]);
    const plan = compilePage(input, approvals());
    expect(evaluatePageVisibility(plan, fact("has_owner", false), context())).toBe(false);
    expect(evaluatePageVisibility(plan, fact("has_owner", false), context(["tickets.ticket.read"], new Map([["has_owner", false]])))).toBe(true);
    const countPlan = compilePage(payload([guidance, { ...listComponent, visibleWhen: fact("open_count", 0) }]), approvals());
    expect(evaluatePageVisibility(countPlan, fact("open_count", 0), context(["tickets.ticket.read"], new Map([["open_count", 0]])))).toBe(false);
    expect(evaluatePageVisibility(countPlan, fact("open_count", 0), context(["tickets.ticket.read", "tickets.private.read"], new Map([["open_count", 0]])))).toBe(true);
    expect(() => compilePage(payload([guidance, { ...listComponent, visibleWhen: fact("has_owner", 0) }]), approvals())).toThrow(/type/);
    expect(() => compilePage(payload([guidance, { ...listComponent, visibleWhen: { kind: "fact", factId: "unapproved", operator: "equals", values: [true] } }]), approvals())).toThrow(/Fact/);
    const nullable = { ...approvals(), facts: approvals().facts.map(value => ({ ...value, nullable: true })) };
    const nullPredicate: VisibilityPredicate = { kind: "fact", factId: "has_owner", operator: "equals", values: [null] };
    const nullPlan = compilePage(payload([guidance, { ...listComponent, visibleWhen: nullPredicate }]), nullable);
    expect(evaluatePageVisibility(nullPlan, nullPredicate, context(["tickets.ticket.read"], new Map([["has_owner", null]])))).toBe(true);
  });

  it("schedules no hidden/denied component reads and no unnecessary predicate facts after cheap failures", () => {
    const rule: VisibilityPredicate = { kind: "all", predicates: [cap("tickets.ticket.manage"), fact("has_owner", true)] };
    const plan = compilePage(payload([guidance, { ...listComponent, visibleWhen: rule }]), approvals());
    expect(pageVisibilityFactRequests(plan, context(), "phone", "components")).toEqual({ factIds: [], queries: [] });
    expect(resolvePageVariant(plan, context(), "phone").reads.every(value => value.queries.length === 0)).toBe(true);
    const allowed = context(["tickets.ticket.read", "tickets.ticket.manage"]);
    expect(pageVisibilityFactRequests(plan, allowed, "phone", "components")).toEqual({ factIds: ["has_owner"], queries: [factQuery] });
    const hydrated = { ...allowed, facts: new Map([["has_owner", true]]) };
    expect(resolvePageVariant(plan, hydrated, "phone").reads.find(value => value.componentId === "related")?.queries).toEqual([list]);
    const privatePlan = compilePage(payload([guidance, { id: "facts", type: "facts", factIds: ["open_count"], formFactors: forms }]), approvals());
    expect(resolvePageVariant(privatePlan, context(), "phone").reads.every(value => value.queries.length === 0)).toBe(true);
    const fields = compilePage(payload([{ ...nativeFields, fields: [{ source: "native", fieldId: "subject", mode: "read" }, { source: "native", fieldId: "private_note", mode: "read" }] }]), approvals());
    const selected = resolvePageVariant(fields, context(), "phone").sections[0].components[0];
    expect(selected.type === "fields" && selected.fields.map(value => value.source === "native" && value.fieldId)).toEqual(["subject"]);
    expect(resolvePageVariant(fields, context([]), "phone")).toEqual({ variantId: null, sections: [], reads: [] });
  });

  it("selects stable record-type UUID without reverse configuration edges and stages higher-priority facts before component facts", () => {
    const input = payload();
    input.variants = [{ id: "complaint", label: "Complaint", priority: 2, when: { kind: "recordType", definitionId: uuid(50) }, patches: [{ operation: "setSection", sectionId: "main", properties: { label: "Complaint" } }] },
      { id: "unowned", label: "Unowned", priority: 1, when: fact("has_owner", false), patches: [{ operation: "setSection", sectionId: "main", properties: { label: "Unowned" } }] }];
    const plan = compilePage(input, approvals());
    expect(plan.configurationDependencies).toEqual([]);
    const selected = { ...context(), recordTypeDefinitionId: uuid(50) };
    expect(resolvePageVariant(plan, selected, "phone").variantId).toBe("complaint");
    expect(pageVisibilityFactRequests(plan, selected, "phone", "variants")).toEqual({ factIds: [], queries: [] });
    expect(pageVisibilityFactRequests(plan, context(), "phone", "variants")).toEqual({ factIds: ["has_owner"], queries: [factQuery] });
  });

  it("has a finite closed predicate grammar and validates literal membership without source expressions", () => {
    const leaf = cap("tickets.ticket.read");
    expect(visibilityPredicateSchema.parse({ kind: "all", predicates: [{ kind: "any", predicates: [leaf] }] })).toBeDefined();
    expect(() => visibilityPredicateSchema.parse({ kind: "all", predicates: [{ kind: "any", predicates: [{ kind: "all", predicates: [leaf] }] }] })).toThrow();
    expect(() => visibilityPredicateSchema.parse({ kind: "fact", factId: "private.bank.number", operator: "equals", values: [true] })).toThrow();
    expect(() => visibilityPredicateSchema.parse({ kind: "expression", source: "record.balance > 0" })).toThrow();
    expect(() => visibilityPredicateSchema.parse({ kind: "fact", factId: "has_owner", operator: "equals", values: [true, false] })).toThrow();
    expect(() => visibilityPredicateSchema.parse({ kind: "fact", factId: "has_owner", operator: "in", values: [false, false] })).toThrow();
  });
});
