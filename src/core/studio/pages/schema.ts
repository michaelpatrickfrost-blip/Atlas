import { z } from "zod";
import { referenceSchema } from "../compiler/reference";
import { viewVersionReferenceSchema } from "../views/schema";
import { customFieldReferenceSchema } from "../record-types/schema";

export const pageNodeIdSchema = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);
const capability = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
export const formFactorSchema = z.enum(["desktop", "tablet", "phone"]);
const formFactors = z.array(formFactorSchema).min(1).max(3)
  .refine(values => new Set(values).size === values.length, "Duplicate form factor.");
export const pageScalarSchema = z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]);
export type PageScalar = z.infer<typeof pageScalarSchema>;

export type VisibilityPredicate =
  | { kind: "capabilities"; mode: "all" | "any"; capabilities: string[] }
  | { kind: "recordType"; definitionId: string }
  | { kind: "fact"; factId: string; operator: "equals" | "in"; values: PageScalar[] }
  | { kind: "all"; predicates: VisibilityPredicate[] }
  | { kind: "any"; predicates: VisibilityPredicate[] };

// Construct a finite grammar instead of recursively parsing arbitrary-depth input.
function predicate(depth: number): z.ZodType<VisibilityPredicate> {
  const leaves = [
    z.strictObject({ kind: z.literal("capabilities"), mode: z.enum(["all", "any"]), capabilities: z.array(capability).min(1).max(20)
      .refine(values => new Set(values).size === values.length, "Duplicate capability.") }),
    z.strictObject({ kind: z.literal("recordType"), definitionId: z.uuid().transform(value => value.toLowerCase()) }),
    z.strictObject({ kind: z.literal("fact"), factId: pageNodeIdSchema, operator: z.enum(["equals", "in"]), values: z.array(pageScalarSchema).min(1).max(30)
      .refine(values => new Set(values.map(value => JSON.stringify(value))).size === values.length, "Duplicate fact comparison.") })
      .refine(value => value.operator !== "equals" || value.values.length === 1, "Equality requires one scalar."),
  ];
  if (depth === 3) return z.union(leaves);
  const child = predicate(depth + 1);
  return z.union([...leaves,
    z.strictObject({ kind: z.literal("all"), predicates: z.array(child).min(1).max(8) }),
    z.strictObject({ kind: z.literal("any"), predicates: z.array(child).min(1).max(8) }),
  ]);
}
export const visibilityPredicateSchema = predicate(1);
const presentation = {
  label: z.string().trim().min(1).max(100).optional(), help: z.string().max(500).optional(),
};
const component = {
  id: pageNodeIdSchema, ...presentation, formFactors,
  visibleWhen: visibilityPredicateSchema.optional(),
};
const field = {
  ...presentation,
  // Presentation cannot waive required-if, uniqueness or owning-domain validation.
  mode: z.enum(["read", "edit"]).default("read"),
};
export const pageFieldSchema = z.discriminatedUnion("source", [
  z.strictObject({ source: z.literal("native"), fieldId: pageNodeIdSchema, ...field }),
  z.strictObject({ source: z.literal("extension"), reference: customFieldReferenceSchema, ...field }),
]);
export const surfaceFamilySchema = z.enum(["activity", "documents", "relationships", "approvals", "tasks", "process_stage", "module"]);
export const pageComponentSchema = z.discriminatedUnion("type", [
  z.strictObject({ ...component, type: z.literal("fields"), fields: z.array(pageFieldSchema).min(1).max(30) }),
  z.strictObject({ ...component, type: z.literal("facts"), factIds: z.array(pageNodeIdSchema).min(1).max(20) }),
  z.strictObject({ ...component, type: z.literal("queryList"), query: referenceSchema, pageSize: z.number().int().min(1).max(50), columns: z.array(pageNodeIdSchema).min(1).max(12) }),
  z.strictObject({ ...component, type: z.literal("metric"), metric: referenceSchema }),
  z.strictObject({ ...component, type: z.literal("analyticsView"), view: viewVersionReferenceSchema }),
  z.strictObject({ ...component, type: z.literal("instructions"), text: z.string().min(1).max(2000) }),
  z.strictObject({ ...component, type: z.literal("callout"), text: z.string().min(1).max(1000), tone: z.enum(["info", "success", "warning"]) }),
  z.strictObject({ ...component, type: z.literal("action"), command: referenceSchema,
    collectInput: z.literal("owner_schema"), confirm: z.boolean().default(true), preview: z.boolean().default(false),
    icon: z.enum(["arrow", "check", "plus", "document", "send", "settings"]).optional() }),
  z.strictObject({ ...component, type: z.literal("surface"), family: surfaceFamilySchema, surface: referenceSchema }),
]);
export type PageComponent = z.infer<typeof pageComponentSchema>;
const columns = z.strictObject({ desktop: z.number().int().min(1).max(3), tablet: z.number().int().min(1).max(2), phone: z.literal(1) });
export const pageSectionSchema = z.strictObject({
  id: pageNodeIdSchema, label: z.string().trim().min(1).max(100), help: z.string().max(500).default(""),
  formFactors, columns, visibleWhen: visibilityPredicateSchema.optional(),
  components: z.array(pageComponentSchema).min(1).max(30),
});
export type PageSection = z.infer<typeof pageSectionSchema>;

const sectionProperties = z.strictObject({ label: z.string().trim().min(1).max(100).optional(), help: z.string().max(500).optional(),
  formFactors: formFactors.optional(), columns: columns.optional(), visibleWhen: visibilityPredicateSchema.nullable().optional() })
  .refine(value => Object.keys(value).length > 0, "Choose a property to change.");
const componentProperties = z.strictObject({ ...presentation, formFactors: formFactors.optional(), visibleWhen: visibilityPredicateSchema.nullable().optional() })
  .refine(value => Object.keys(value).length > 0, "Choose a property to change.");
export const pagePatchSchema = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("setSection"), sectionId: pageNodeIdSchema, properties: sectionProperties }),
  z.strictObject({ operation: z.literal("setComponent"), componentId: pageNodeIdSchema, properties: componentProperties }),
  z.strictObject({ operation: z.literal("addSection"), afterSectionId: pageNodeIdSchema.nullable(), section: pageSectionSchema }),
  z.strictObject({ operation: z.literal("removeSection"), sectionId: pageNodeIdSchema }),
  z.strictObject({ operation: z.literal("moveSection"), sectionId: pageNodeIdSchema, afterSectionId: pageNodeIdSchema.nullable() }),
  z.strictObject({ operation: z.literal("addComponent"), sectionId: pageNodeIdSchema, afterComponentId: pageNodeIdSchema.nullable(), component: pageComponentSchema }),
  z.strictObject({ operation: z.literal("removeComponent"), componentId: pageNodeIdSchema }),
  z.strictObject({ operation: z.literal("moveComponent"), componentId: pageNodeIdSchema, sectionId: pageNodeIdSchema, afterComponentId: pageNodeIdSchema.nullable() }),
]);
export type PagePatch = z.infer<typeof pagePatchSchema>;
export const pagePayloadSchema = z.strictObject({
  schemaVersion: z.literal(1), entity: referenceSchema, formFactors,
  sections: z.array(pageSectionSchema).min(1).max(20),
  variants: z.array(z.strictObject({ id: pageNodeIdSchema, label: z.string().trim().min(1).max(100),
    priority: z.number().int().min(1).max(1000), when: visibilityPredicateSchema,
    patches: z.array(pagePatchSchema).min(1).max(50) })).max(20).default([]),
});
export type PagePayload = z.infer<typeof pagePayloadSchema>;
