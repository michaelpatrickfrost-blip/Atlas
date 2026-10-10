import { assertCapability } from "@/core/permissions/check";
import type { Session } from "@/core/auth/session";
import type { CapabilityRegistry } from "../registry/registry";
import type { ContractReference } from "../registry/types";
import type { ContractMetadata } from "../registry/types";
import { entityDetailsSchema } from "../registry/entities";
import { checksum } from "../registry/contracts";
import { fieldStorageSchema } from "./schema";
import { requiredFactMetadataSchema, type RequiredFactMetadata } from "./required-compiler";

/** Server metadata adapter only. It resolves current registered owner declarations;
 * readable native fields are not implicitly approved condition inputs. Business
 * facts still require the owning transactional query and native record policy. */
export async function registeredRequiredFactMetadata(session: Session, registry: CapabilityRegistry, entity: ContractReference, fieldId: string): Promise<Extract<RequiredFactMetadata, { kind: "native" }>> {
  const owner = await registry.resolve(session, entity);
  if (owner.kind !== "entity") throw new Error("FIELD_REQUIREMENT_INVALID: native owner required.");
  const details = entityDetailsSchema.parse(owner.details), requirement = details.record?.requiredFacts;
  const fact = requirement?.facts.find(f => f.fieldId === fieldId), field = details.fields.find(f => f.id === fieldId);
  if (!requirement || !fact || !field) throw new Error("FIELD_REQUIREMENT_INVALID: owner has not approved this native fact.");
  const query = registry.describe(requirement.query.id, requirement.query.version);
  await registry.resolve(session, query);
  return declaredFactMetadata(session, owner, fieldId);
}

/** Explicit current creation fact policy, never a normal native read grant. The
 * owning proof is checked by the provider/runtime before metadata/data access.
 * Legacy native rules without a sealed initialization query are unsupported. */
export async function registeredInitialFactMetadata(session: Session, registry: CapabilityRegistry, entity: ContractReference, fieldId: string) {
  const { source, owner } = await registry.resolveCurrentFieldInitialisation(session, entity);
  const policy = entityDetailsSchema.parse(source.details).record?.requiredFacts, current = entityDetailsSchema.parse(owner.details).record?.requiredFacts;
  const fact = policy?.facts.find(f => f.fieldId === fieldId), approved = current?.facts.find(f => f.fieldId === fieldId);
  if (!policy?.initialQuery || !current?.initialQuery || !fact || !approved || checksum(policy.initialQuery) !== checksum(current.initialQuery) || checksum(fact) !== checksum(approved))
    throw new Error("FIELD_REQUIREMENT_INVALID: current owner does not approve this sealed creation fact.");
  await registry.resolve(session, registry.describe(current.initialQuery.id, current.initialQuery.version));
  declaredFactMetadata(session, owner, fieldId); // Current native field grants too.
  return declaredFactMetadata(session, source, fieldId);
}

function declaredFactMetadata(session: Session, owner: ContractMetadata, fieldId: string): Extract<RequiredFactMetadata, { kind: "native" }> {
  const details = entityDetailsSchema.parse(owner.details), fact = details.record?.requiredFacts?.facts.find(f => f.fieldId === fieldId), field = details.fields.find(f => f.id === fieldId);
  if (!fact || !field) throw new Error("FIELD_REQUIREMENT_INVALID: owner has not approved this native fact.");
  if (field.capability) assertCapability(session, field.capability);
  if (fact.capability) assertCapability(session, fact.capability);
  const storage = fact.type === "enum" ? { type: "enum" as const, codes: fact.codes! }
    : fieldStorageSchema.parse({ type: fact.type, ...(fact.type === "datetime" ? { timezone: "UTC" } : {}) });
  const { id, version, schemaHash, contractHash } = owner;
  const result = requiredFactMetadataSchema.parse({ kind: "native", organisationId: session.organisationId, entity: { id, version, schemaHash, contractHash },
    fieldId: fact.fieldId, classification: fact.classification, ...(fact.capability ? { readCapability: fact.capability } : {}), storage });
  if (result.kind !== "native") throw new Error("FIELD_REQUIREMENT_INVALID: native metadata required.");
  return result;
}
