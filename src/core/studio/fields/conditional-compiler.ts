import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { CapabilityRegistry } from "../registry/registry";
import type { ContractMetadata, ContractReference } from "../registry/types";
import { entityDetailsSchema } from "../registry/entities";
import { referenceSchema } from "../compiler/kernel";
import { compileCustomField, compileCustomFieldForRead } from "../compiler/fields";
import { checksum } from "../registry/contracts";
import { conditionalFieldPayloadSchema, requiredFactSourceSchema, type RequiredFactSource } from "./required-contract";
import { compileRequiredCondition, requiredConditionPlanSchema } from "./required-compiler";
import { registeredRequiredFactMetadata } from "./required-owner";

const dependency = referenceSchema.extend({ ownerModuleId: z.string().regex(/^[a-z][a-z0-9_]*$/), kind: z.enum(["entity", "query"]),
  classification: z.enum(["public_internal", "confidential", "restricted"]) });
const fieldDependency = requiredFactSourceSchema.options[1].omit({ kind: true });
export const conditionalFieldPlanSchema = z.strictObject({ kind: z.literal("customField"), schemaVersion: z.literal(2), payload: conditionalFieldPayloadSchema,
  dependencies: z.array(dependency).min(1).max(100), fieldDependencies: z.array(fieldDependency).max(20),
  requiredIf: z.strictObject({ plan: requiredConditionPlanSchema, checksum: z.string().regex(/^[a-f0-9]{64}$/) }) });
export type ConditionalFieldPlan = z.infer<typeof conditionalFieldPlanSchema>;
export type ConditionalCompilerContext = { session: Session; registry: CapabilityRegistry; definitionId: string;
  resolveMetadata(source: RequiredFactSource): Promise<unknown>; intent?: "read" | "write" };

/** Full upcoming v2 metadata compiler, intentionally outside definition dispatch.
 * Resolving metadata is not native data access or condition evaluation. A source
 * provider must establish exact current/pinned binding, checksum and graph closure.
 * Read intent is for rule metadata, not a request to fetch/evaluate rule inputs. */
export async function compileConditionalCustomField(context: ConditionalCompilerContext, input: unknown) {
  const parsed = conditionalFieldPayloadSchema.parse(input), compileBase = context.intent === "read" ? compileCustomFieldForRead : compileCustomField;
  const base = await compileBase(context.session, { schemaVersion: 1, entity: parsed.entity, storageGeneration: parsed.storageGeneration, field: parsed.field }, context.registry);
  const owner = await context.registry.resolve(context.session, parsed.entity), details = entityDetailsSchema.parse(owner.details);
  const required = await compileRequiredCondition({ ...context, approvedNativeFacts: new Set(details.record?.requiredFacts?.facts.map(f => f.fieldId) ?? []) },
    { ...parsed, field: base.payload.field });
  const dependencies = new Map<string, z.infer<typeof dependency>>();
  const warnings = new Set(base.warnings);
  function add(metadata: ContractMetadata) {
    if (metadata.kind !== "entity" && metadata.kind !== "query") throw new Error("Conditional fields only depend on approved entity/read-query contracts.");
    const { id, version, schemaHash, contractHash, ownerModuleId, kind, classification } = metadata;
    dependencies.set(`${id}@${version}`, { id, version, schemaHash, contractHash, ownerModuleId, kind, classification });
    if (metadata.lifecycle === "deprecated") warnings.add(`Deprecated: ${id}@${version} supported until ${metadata.supportedUntil}`);
  }
  async function resolve(reference: ContractReference) { const metadata = await context.registry.resolve(context.session, reference); add(metadata); return metadata; }
  for (const ref of base.plan.dependencies) await resolve(ref);
  const fields = new Map<string, z.infer<typeof fieldDependency>>();
  for (const fact of required.plan.facts) {
    const factOwner = await resolve(fact.entity);
    if (fact.kind === "native") {
      if (checksum(await registeredRequiredFactMetadata(context.session, context.registry, fact.entity, fact.fieldId)) !== checksum(fact))
        throw new Error("FIELD_REQUIREMENT_INVALID: native fact metadata differs from its registered owner.");
      const policy = entityDetailsSchema.parse(factOwner.details).record?.requiredFacts;
      if (!policy) throw new Error("FIELD_REQUIREMENT_INVALID: approved native fact query is unavailable.");
      const query = await resolve(context.registry.describe(policy.query.id, policy.query.version));
      if (query.kind !== "query" || query.details.transaction !== "required" || query.ownerModuleId !== factOwner.ownerModuleId || query.capability !== factOwner.capability)
        throw new Error("FIELD_REQUIREMENT_INVALID: approved native fact query changed.");
      const sensitivity = { public_internal: 0, confidential: 1, restricted: 2 };
      if (sensitivity[parsed.field.classification] < sensitivity[query.classification]) throw new Error("A condition cannot downgrade native query sensitivity.");
      if (policy.initialQuery) {
        // Sealing metadata does not invoke the creation query or require an
        // author's native create grant; the runtime proof path enforces that.
        const initial = context.registry.describe(policy.initialQuery.id, policy.initialQuery.version);
        const create = entityDetailsSchema.parse(factOwner.details).record?.initialisation;
        if (!create || initial.kind !== "query" || initial.details.transaction !== "required" || initial.ownerModuleId !== factOwner.ownerModuleId
          || initial.capability !== create.capability || sensitivity[parsed.field.classification] < sensitivity[initial.classification]
          || (initial.lifecycle === "deprecated" && Date.parse(initial.supportedUntil!) <= Date.now())) throw new Error("FIELD_REQUIREMENT_INVALID: approved creation fact query changed.");
        add(initial);
      }
    } else {
      fields.set(`${fact.definitionId}@${fact.versionId}`, { definitionId: fact.definitionId, versionId: fact.versionId, checksum: fact.checksum });
      if (fact.field.storage.type === "reference") await resolve(fact.field.storage.entity);
    }
  }
  const order = <T>(map: Map<string, T>) => [...map].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, value]) => value);
  const contracts = [...dependencies.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version - b.version);
  const payload = conditionalFieldPayloadSchema.parse({ ...parsed, field: base.payload.field, requiredIf: required.plan.condition });
  const plan = conditionalFieldPlanSchema.parse({ kind: "customField", schemaVersion: 2, payload,
    dependencies: contracts, fieldDependencies: order(fields), requiredIf: required });
  return { payload, plan, checksum: checksum(plan), warnings: [...warnings].sort() };
}
