import { z } from "zod";

const logicalId = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const fieldId = z.string().regex(/^[a-z][a-z0-9_]*$/).max(100);
const classification = z.enum(["public_internal", "confidential", "restricted"]);
const queryReference = z.strictObject({ id: logicalId, version: z.number().int().positive() });
export const nativeRequiredFactSchema = z.strictObject({ fieldId,
  type: z.enum(["string", "integer", "boolean", "date", "datetime", "enum"]), classification,
  capability: logicalId.optional(), codes: z.array(z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/)).min(1).max(200).optional(),
}).superRefine((fact, ctx) => {
  if ((fact.type === "enum") !== Boolean(fact.codes)) ctx.addIssue({ code: "custom", message: "Only enum facts require approved codes." });
  if (fact.codes && new Set(fact.codes).size !== fact.codes.length) ctx.addIssue({ code: "custom", message: "Duplicate native fact code." });
});
const versions = z.array(z.number().int().positive()).min(1).max(20)
  .refine(value => new Set(value).size === value.length, "Duplicate settlement entity version.");
export const fieldSettlementPolicySchema = z.strictObject({ entityId: logicalId, sourceVersions: versions, targetVersions: versions,
  referenceVersions: z.array(z.number().int().positive()).max(20).refine(value => new Set(value).size === value.length, "Duplicate settlement reference version.") });
export const extensionFieldPolicySchema = z.strictObject({
  types: z.array(z.enum(["string", "integer", "decimal", "money", "boolean", "date", "datetime", "duration", "email", "url", "phone", "enum", "multi_enum", "reference", "address"])).min(1).max(15),
  reservedKeys: z.array(fieldId).max(200), referenceEntities: z.array(logicalId).max(30),
  maxFields: z.number().int().min(1).max(100),
}).superRefine((value, ctx) => {
  for (const list of [value.types, value.reservedKeys, value.referenceEntities]) if (new Set(list).size !== list.length) ctx.addIssue({ code: "custom", message: "Duplicate extension policy entry." });
});

/** Only native read projections are exposed; extension storage is owned by Studio. */
export const entityDetailsSchema = z.strictObject({
  key: z.enum(["uuid", "string"]),
  fields: z.array(z.strictObject({
    id: fieldId, label: z.string().min(1).max(200).optional(),
    type: z.enum(["string", "integer", "decimal", "money", "boolean", "date", "datetime", "enum", "reference"]),
    nullable: z.boolean(), classification, capability: logicalId.optional(),
    filterable: z.boolean(), sortable: z.boolean(), decision: z.boolean(), template: z.boolean(),
  })).max(200),
  extensionPolicy: z.strictObject({ customFields: z.boolean(), recordTypes: z.boolean(), pageVariants: z.boolean() }),
  record: z.strictObject({
    writeCapability: logicalId,
    detailRoute: z.string().regex(/^\/[a-z0-9/_-]+\/\{recordId\}$/),
    labelField: fieldId, listQuery: queryReference, getQuery: queryReference,
    fieldPolicy: extensionFieldPolicySchema.optional(),
    requiredFacts: z.strictObject({ query: queryReference, initialQuery: queryReference.optional(), facts: z.array(nativeRequiredFactSchema).min(1).max(30) }).optional(),
    initialisation: z.strictObject({ capability: logicalId, acceptedFieldVersions: versions.optional() }).optional(),
    migrationSnapshot: z.strictObject({ query: queryReference,
      sourceVersions: z.array(z.number().int().positive()).min(1).max(20)
        .refine(versions => new Set(versions).size === versions.length, "Duplicate migration source version."),
      referenceVersions: z.array(z.number().int().positive()).min(1).max(20)
        .refine(versions => new Set(versions).size === versions.length, "Duplicate migration reference version.").optional(),
    }).optional(),
    migrationRepresentation: z.strictObject({ query: queryReference,
      sourceVersions: z.array(z.number().int().positive()).min(1).max(20)
        .refine(versions => new Set(versions).size === versions.length, "Duplicate representation source version."),
    }).optional(),
    nativeFields: z.literal("read_only"), revision: z.literal("owner_positive_integer"),
  }).optional(),
}).superRefine((value, ctx) => {
  if (new Set(value.fields.map(f => f.id)).size !== value.fields.length) ctx.addIssue({ code: "custom", message: "Duplicate native field ID." });
  if (Object.values(value.extensionPolicy).some(Boolean) && !value.record) ctx.addIssue({ code: "custom", message: "Extensible entities need an owner record policy." });
  if (value.record && !value.fields.some(f => f.id === value.record!.labelField)) ctx.addIssue({ code: "custom", message: "Record label must reference an approved native field." });
  const requirement = value.record?.requiredFacts;
  if (value.record?.initialisation && !value.record.fieldPolicy) ctx.addIssue({ code: "custom", message: "Initialisation needs typed owner field policy." });
  if (requirement?.initialQuery && !value.record?.initialisation?.acceptedFieldVersions)
    ctx.addIssue({ code: "custom", message: "Creation facts need explicit current owner field-version coverage." });
  if (requirement) {
    const rank = { public_internal: 0, confidential: 1, restricted: 2 };
    if (!value.record!.fieldPolicy) ctx.addIssue({ code: "custom", message: "Required facts need typed owner field policy." });
    if (new Set(requirement.facts.map(f => f.fieldId)).size !== requirement.facts.length) ctx.addIssue({ code: "custom", message: "Duplicate required fact." });
    for (const fact of requirement.facts) {
      const field = value.fields.find(f => f.id === fact.fieldId);
      if (!field || field.type !== fact.type || rank[fact.classification] < rank[field.classification])
        ctx.addIssue({ code: "custom", message: "Required facts must match approved native fields and sensitivity." });
    }
  }
  if (value.record?.migrationSnapshot && !value.record.fieldPolicy) ctx.addIssue({ code: "custom", message: "Migration snapshots require an owner field policy." });
  if (value.record?.migrationSnapshot?.referenceVersions && !value.record.fieldPolicy?.types.includes("reference"))
    ctx.addIssue({ code: "custom", message: "Reference coverage requires the owner's reference field policy." });
  if (value.record?.migrationRepresentation && (!value.record.migrationSnapshot
    || value.record.migrationRepresentation.sourceVersions.some(version => !value.record!.migrationSnapshot!.sourceVersions.includes(version))))
    ctx.addIssue({ code: "custom", message: "Representation approval requires explicitly snapshot-supported source versions." });
});

export const recordRequestSchema = z.strictObject({
  recordId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  intent: z.enum(["read", "extend"]), expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
}).superRefine((value, ctx) => {
  if (value.intent === "extend" && value.expectedRevision === undefined) ctx.addIssue({ code: "custom", message: "Extension writes require an expected owner revision." });
});
export const recordAnchorSchema = z.strictObject({
  recordId: z.string().min(1).max(100), organisationId: z.string().min(1),
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
