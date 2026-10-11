import { z } from "zod";
import { referenceSchema } from "../compiler/reference";
import { customFieldReferenceSchema } from "../record-types/schema";
import { formFactorSchema, pageNodeIdSchema, surfaceFamilySchema } from "./schema";

const capability = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const classification = z.enum(["public_internal", "confidential", "restricted"]);
const forms = z.array(formFactorSchema).min(1).max(3);
export const pageRegistryApprovalSchema = referenceSchema.extend({
  ownerModuleId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  kind: z.enum(["entity", "query", "command", "decisionFact", "metric", "surface"]),
  classification, capability,
});
const property = { id: pageNodeIdSchema, classification, capability: capability.optional() };
const sourceEntityId = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const queryApprovalSchema = pageRegistryApprovalSchema.extend({
  kind: z.literal("query"), sourceEntityId,
  purpose: z.enum(["list", "fact", "metric", "surface", "preview"]),
  pagination: z.enum(["cursor", "page", "none"]), maxCardinality: z.number().int().min(1).max(200),
  costClass: z.enum(["low", "medium", "high"]),
  columns: z.array(z.strictObject(property)).max(50).default([]),
});

/** Internal server-supplied approvals, not a client authority DTO. Publication
 * constructs these from current compatible registry/field/owner contracts. A
 * labelled preview may use synthetic approvals but cannot publish them. This
 * contract covers ordinary Read-authorised layouts. Create-only metadata needs
 * its separate owning adapter; replacing Read with Create is not permitted. */
export const pageApprovalsSchema = z.strictObject({
  entity: pageRegistryApprovalSchema.extend({ kind: z.literal("entity") }),
  recordWriteCapability: capability.optional(),
  nativeFields: z.array(z.strictObject({ ...property, editable: z.boolean(), writeCapability: capability.optional() })).max(100),
  customFields: z.array(z.strictObject({ reference: customFieldReferenceSchema, entity: referenceSchema,
    classification, readCapability: capability.optional(), writeCapability: capability.optional(), editable: z.boolean(), required: z.boolean() })).max(100),
  facts: z.array(z.strictObject({ id: pageNodeIdSchema, contract: referenceSchema, query: referenceSchema,
    sourceEntityId, valueType: z.enum(["string", "number", "boolean"]), nullable: z.boolean(),
    classification, capability: capability.optional(), provenance: z.enum(["owner_native", "owner_projection"]) })).max(50),
  contracts: z.array(pageRegistryApprovalSchema).max(100),
  queries: z.array(queryApprovalSchema).max(100),
  commands: z.array(pageRegistryApprovalSchema.extend({ kind: z.literal("command"), sourceEntityId,
    confirmation: z.enum(["required", "optional"]), previewQuery: referenceSchema.nullable(), formFactors: forms })).max(50),
  metrics: z.array(pageRegistryApprovalSchema.extend({ kind: z.literal("metric"), sourceEntityId,
    query: referenceSchema, formFactors: forms })).max(50),
  surfaces: z.array(pageRegistryApprovalSchema.extend({ kind: z.literal("surface"), sourceEntityId,
    family: surfaceFamilySchema, queries: z.array(referenceSchema).max(4), formFactors: forms })).max(50),
  maxQueryCost: z.number().int().min(1).max(64).default(24),
});
export type PageApprovals = z.input<typeof pageApprovalsSchema>;
export type ValidatedPageApprovals = z.infer<typeof pageApprovalsSchema>;
export type PageRegistryApproval = z.infer<typeof pageRegistryApprovalSchema>;
export type PageRegistryDependency = Omit<PageRegistryApproval, "capability">;
