import { z } from "zod";
import type { Prisma, StudioDefinition, StudioDefinitionVersion } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import type { ContractReference } from "../registry/types";
import { referenceSchema } from "../compiler/kernel";
import { checksum } from "../registry/contracts";
import { compileCustomFieldForRead } from "../compiler/fields";
import { fieldRuntimeAuthorityInTransaction } from "./runtime-authority";
import { inspectSealedFieldVersion } from "./sealed-field";
import { requiredFactSourceSchema, type RequiredFactSource } from "./required-contract";
import { requiredFactMetadataSchema } from "./required-compiler";
import { registeredRequiredFactMetadata } from "./required-owner";

function unavailable(): never { throw new Error("FIELD_REQUIREMENT_INVALID: current approved field dependency is unavailable."); }
type SealedPlan = ReturnType<typeof inspectSealedFieldVersion>;
type Node = { definition: StudioDefinition; version: StudioDefinitionVersion; plan: SealedPlan };
const meaning = (plan: SealedPlan) => ({ entity: plan.payload.entity, generation: plan.payload.storageGeneration,
  field: { ...plan.payload.field, label: "", help: "" } });

/** Internal single-compilation provider. Refresh genuine identity in the caller's
 * Serializable transaction; no client tenant, supplied closure, values or native
 * operations. Do not reuse after changing metadata in that transaction. Integration
 * into mutating paths requires their common lock order, not late graph locks. */
export async function createRequiredMetadataProvider(authenticated: Session, transaction: Prisma.TransactionClient, definitionId: string, entityInput: ContractReference) {
  const root = z.uuid().parse(definitionId), entity = referenceSchema.parse(entityInput);
  const authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction), { session, registry } = authority;
  await registry.resolve(session, entity);
  await transaction.$queryRaw`SELECT id FROM studio_definitions WHERE id=${root}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  const rootDefinition = await transaction.studioDefinition.findFirst({ where: { id: root, organisationId: session.organisationId, kind: "customField", retiredAt: null } });
  if (!rootDefinition || rootDefinition.id !== root || rootDefinition.organisationId !== session.organisationId || rootDefinition.kind !== "customField"
    || rootDefinition.retiredAt !== null || !rootDefinition.key.startsWith(`${entity.id}.`)) unavailable();
  const nodes = new Map<string, Node>(), versions = new Map<string, SealedPlan>();
  async function node(id: string): Promise<Node> {
    if (id === root) unavailable();
    const cached = nodes.get(id); if (cached) return cached;
    if (nodes.size >= 100) unavailable();
    await transaction.$queryRaw`SELECT id FROM studio_definitions WHERE id=${id}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
    const definition = await transaction.studioDefinition.findFirst({ where: { id, organisationId: session.organisationId, kind: "customField", retiredAt: null }, include: { activeVersion: true } });
    if (!definition?.activeVersion || definition.id !== id || definition.organisationId !== session.organisationId || definition.kind !== "customField"
      || definition.retiredAt !== null || definition.activeVersionId !== definition.activeVersion.id) unavailable();
    const plan = inspectSealedFieldVersion(registry, definition.activeVersion, session.organisationId, id);
    if (plan.payload.entity.id !== entity.id || definition.key !== `${entity.id}.${plan.payload.field.key}`) unavailable();
    await transaction.$queryRaw`SELECT g.id FROM studio_field_generations g JOIN studio_field_bindings b ON b."definitionId"=g."definitionId" AND b."organisationId"=g."organisationId"
      WHERE g.id=${plan.payload.storageGeneration}::uuid AND g."definitionId"=${id}::uuid AND g."organisationId"=${session.organisationId} FOR SHARE OF b,g`;
    const generation = await transaction.studioFieldGeneration.findFirst({ where: { id: plan.payload.storageGeneration, definitionId: id, organisationId: session.organisationId,
      entityId: entity.id, valueType: plan.payload.field.storage.type, binding: { organisationId: session.organisationId, entityId: entity.id, fieldKey: plan.payload.field.key } }, select: { id: true } });
    if (!generation) unavailable();
    const result = { definition, version: definition.activeVersion, plan }; nodes.set(id, result);
    return result;
  }
  async function pinned(source: Extract<RequiredFactSource, { kind: "field" }>) {
    const current = await node(source.definitionId), key = `${source.definitionId}@${source.versionId}`;
    let plan = versions.get(key);
    if (!plan) {
      const version = current.version.id === source.versionId ? current.version : await transaction.studioDefinitionVersion.findFirst({ where: { id: source.versionId, definitionId: source.definitionId, organisationId: session.organisationId } });
      if (!version || version.checksum !== source.checksum) unavailable();
      plan = inspectSealedFieldVersion(registry, version, session.organisationId, source.definitionId); versions.set(key, plan);
    }
    // The pin is immutable, while today's active schema controls current meaning.
    // Labels/help may evolve; storage, native identity and policy may not drift.
    if (checksum(plan) !== source.checksum || checksum(meaning(plan)) !== checksum(meaning(current.plan))) unavailable();
    return { current, plan };
  }
  async function closure(id: string, path: ReadonlySet<string>, depth: number, reached: Set<string>, heights: Map<string, number>): Promise<number> {
    if (depth > 20 || id === root || path.has(id)) unavailable();
    const cachedHeight = heights.get(id);
    if (cachedHeight !== undefined) {
      if (depth + cachedHeight - 1 > 20) unavailable();
      return cachedHeight;
    }
    const current = await node(id), next = new Set([...path, id]);
    const facts = current.plan.schemaVersion === 2 ? current.plan.requiredIf.plan.facts : [];
    let height = 1;
    for (const fact of facts) {
      if (fact.kind !== "field") continue;
      const source = await pinned({ kind: "field", definitionId: fact.definitionId, versionId: fact.versionId, checksum: fact.checksum });
      if (fact.generationId !== source.plan.payload.storageGeneration || checksum(fact.entity) !== checksum(source.plan.payload.entity)
        || checksum(fact.field) !== checksum(source.plan.payload.field)) unavailable();
      reached.add(fact.definitionId);
      height = Math.max(height, 1 + await closure(fact.definitionId, next, depth + 1, reached, heights));
    }
    heights.set(id, height);
    return height;
  }
  return {
    authority,
    async resolveMetadata(input: RequiredFactSource) {
      const source = requiredFactSourceSchema.parse(input);
      if (source.kind === "native") return registeredRequiredFactMetadata(session, registry, entity, source.fieldId);
      const { current, plan } = await pinned(source), reached = new Set<string>();
      // Reading a field's own rule inputs would require independent data access.
      // Only its current/written base field policies are needed for this fact.
      for (const candidate of [current.plan, plan]) await compileCustomFieldForRead(session, { schemaVersion: 1, entity: candidate.payload.entity,
        storageGeneration: candidate.payload.storageGeneration, field: candidate.payload.field }, registry);
      await closure(source.definitionId, new Set(), 1, reached, new Map());
      return requiredFactMetadataSchema.parse({ kind: "field", organisationId: session.organisationId, entity: plan.payload.entity,
        definitionId: source.definitionId, versionId: source.versionId, checksum: source.checksum, generationId: plan.payload.storageGeneration,
        field: plan.payload.field, dependencyClosure: [...reached].sort() });
    },
  };
}
