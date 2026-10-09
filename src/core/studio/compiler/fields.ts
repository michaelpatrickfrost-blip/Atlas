import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { CapabilityRegistry } from "../registry/registry";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { customFieldPayloadSchema } from "../fields/schema";
import { validateFieldConstraints } from "../fields/validation";

const sensitivity = { public_internal: 0, confidential: 1, restricted: 2 } as const;
/** Closed field compiler; native fields are aliases, never additional-value storage. */
export async function compileCustomField(session: Session, input: unknown, registry: CapabilityRegistry) {
  const payload = customFieldPayloadSchema.parse(input);
  payload.field = validateFieldConstraints(payload.field);
  const entity = await registry.resolve(session, payload.entity);
  if (entity.kind !== "entity") throw new Error("Custom fields require an entity contract.");
  const details = entityDetailsSchema.parse(entity.details), policy = details.record?.fieldPolicy;
  if (!details.extensionPolicy.customFields || !policy) throw new Error("This owner has not approved typed additional fields.");
  if (!policy.types.includes(payload.field.storage.type)) throw new Error("This field type is not approved by the owner.");
  if (policy.reservedKeys.includes(payload.field.key) || details.fields.some(f => f.id === payload.field.key)) throw new Error("Native fields cannot be replaced with additional fields.");
  if (sensitivity[payload.field.classification] < sensitivity[entity.classification]) throw new Error("A field cannot downgrade its owner's data classification.");
  if (payload.field.readCapability) assertCapability(session, payload.field.readCapability);
  if (payload.field.writeCapability) assertCapability(session, payload.field.writeCapability);
  const dependencies = [{ ...payload.entity, ownerModuleId: entity.ownerModuleId, kind: entity.kind, classification: entity.classification }];
  const warnings: string[] = [];
  if (entity.lifecycle === "deprecated") warnings.push(`Deprecated: ${entity.id}@${entity.version} supported until ${entity.supportedUntil}`);
  if (payload.field.storage.type === "reference") {
    const ref = payload.field.storage.entity;
    if (!policy.referenceEntities.includes(ref.id)) throw new Error("This reference target is not approved by the owner.");
    const target = await registry.resolve(session, ref);
    if (target.kind !== "entity" || !entityDetailsSchema.parse(target.details).record) throw new Error("References require an owner-authorised canonical entity.");
    if (sensitivity[payload.field.classification] < sensitivity[target.classification]) throw new Error("A reference cannot downgrade target classification.");
    if (!dependencies.some(d => d.id === ref.id && d.version === ref.version)) dependencies.push({ ...ref, ownerModuleId: target.ownerModuleId, kind: target.kind, classification: target.classification });
    if (target.lifecycle === "deprecated") warnings.push(`Deprecated: ${target.id}@${target.version} supported until ${target.supportedUntil}`);
  }
  dependencies.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version - b.version);
  const plan = { kind: "customField" as const, schemaVersion: 1, payload, dependencies };
  return { payload, plan, checksum: checksum(plan), warnings };
}
