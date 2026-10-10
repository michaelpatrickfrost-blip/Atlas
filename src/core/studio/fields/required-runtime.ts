import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { inspectSealedFieldVersion } from "./sealed-field";
import { fieldRuntimeAuthorityInTransaction } from "./runtime-authority";
import { createRequiredMetadataProvider } from "./required-source";
import { readVersionedFieldContextInTransaction, readVersionedFieldPlanInTransaction, readVersionedFieldValueInTransaction } from "./runtime-read";
import { evaluateRequiredCondition } from "./required-evaluator";
import type { RequiredFactMetadata } from "./required-compiler";
import type { RequiredFactSource } from "./required-contract";
import { fieldKeySchema } from "./schema";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const requestSchema = z.strictObject({ definitionId: z.uuid(), recordId, expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
const nativeResult = z.strictObject({ recordId, organisationId: z.string().min(1), revision: z.number().int().positive(), fields: z.record(fieldKeySchema, z.unknown()) });
const sourceOf = (fact: RequiredFactMetadata): RequiredFactSource => fact.kind === "native" ? { kind: "native", fieldId: fact.fieldId }
  : { kind: "field", definitionId: fact.definitionId, versionId: fact.versionId, checksum: fact.checksum };
const meaning = (fact: RequiredFactMetadata) => fact.kind === "native" ? fact : { ...fact, dependencyClosure: [] };
function invalid(): never { throw new Error("FIELD_REQUIREMENT_INVALID: approved record facts changed or are unavailable."); }

/** Existing-record requirements only, in the caller's owning Serializable
 * transaction. All input policies resolve before business facts are read. No
 * mutations, supplied native values, authoring grants or publication. Creation
 * and staged values need their separate explicit owner paths, never this read
 * path with invented read/manage grants. Returned fingerprints remain internal. */
export async function evaluateExistingFieldRequirement(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown) {
  const request = requestSchema.parse(input), authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction);
  const current = await readVersionedFieldContextInTransaction(authority, request), { session, registry } = authority;
  const plan = inspectSealedFieldVersion(registry, current.definition.activeVersion!, session.organisationId, request.definitionId);
  let conditional = false, conditionFingerprint: string | null = null;
  if (plan.schemaVersion === 2) {
    const provider = await createRequiredMetadataProvider(session, transaction, request.definitionId, current.payload.entity);
    for (const fact of plan.requiredIf.plan.facts) {
      const metadata = await provider.resolveMetadata(sourceOf(fact));
      if (checksum(meaning(metadata)) !== checksum(meaning(fact))) invalid();
    }
    let native: z.infer<typeof nativeResult> | undefined;
    const evaluated = await evaluateRequiredCondition(plan.requiredIf, async (source, metadata) => {
      if (source.kind === "native") {
        if (metadata.kind !== "native") invalid();
        if (!native) {
          const owner = registry.describe(current.payload.entity.id, current.payload.entity.version), policy = entityDetailsSchema.parse(owner.details).record?.requiredFacts;
          if (!policy) invalid();
          const query = registry.describe(policy.query.id, policy.query.version), reference = { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash };
          native = nativeResult.parse(await registry.invokeQueryInTransaction({ session, transaction }, reference, { recordId: request.recordId, expectedRevision: request.expectedRevision }));
          if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
        }
        if (!Object.hasOwn(native.fields, source.fieldId) || native.fields[source.fieldId] === undefined) invalid();
        const value = native.fields[source.fieldId];
        return value === null ? null : { type: metadata.storage.type, value };
      }
      if (metadata.kind !== "field") invalid();
      const field = await readVersionedFieldContextInTransaction(authority, { definitionId: source.definitionId, recordId: request.recordId, expectedRevision: request.expectedRevision });
      if (field.payload.entity.id !== current.payload.entity.id || field.payload.storageGeneration !== metadata.generationId
        || (field.extension?.id ?? null) !== (current.extension?.id ?? null) || (field.extension?.revision ?? null) !== (current.extension?.revision ?? null)) invalid();
      const version = await transaction.studioDefinitionVersion.findFirst({ where: { id: source.versionId, definitionId: source.definitionId, organisationId: session.organisationId } });
      if (!version || version.checksum !== source.checksum) invalid();
      const pinned = await readVersionedFieldPlanInTransaction(authority, version, source.definitionId);
      const anchor = await registry.authoriseRecord({ session, transaction }, pinned.entity, { recordId: request.recordId, intent: "read" });
      if (anchor.revision !== request.expectedRevision) invalid();
      const slot = field.extension && await transaction.studioFieldSlot.findFirst({ where: { organisationId: session.organisationId, extensionId: field.extension.id,
        definitionId: source.definitionId, generationId: metadata.generationId }, include: { activeValue: { include: { schemaVersion: true } } } });
      if (slot && ((slot.activeValueId === null) !== (slot.activeValue === null))) invalid();
      if (slot?.activeValue && (slot.activeValueId !== slot.activeValue.id || slot.revision !== slot.activeValue.revision)) invalid();
      const value = slot?.activeValue ? await readVersionedFieldValueInTransaction(authority, field.payload, source.definitionId, metadata.generationId, slot.id, request.recordId, slot.activeValue) : null;
      if (value?.type === "reference" && pinned.field.storage.type === "reference") await registry.authoriseRecord({ session, transaction }, pinned.field.storage.entity, { recordId: value.value, intent: "read" });
      return value;
    });
    conditional = evaluated.required; conditionFingerprint = evaluated.fingerprint;
  }
  return { definitionId: request.definitionId, versionId: current.definition.activeVersion!.id, recordRevision: current.anchor.revision,
    extensionRevision: current.extension?.revision ?? null, required: current.payload.field.required || conditional,
    fingerprint: checksum({ versionChecksum: current.definition.activeVersion!.checksum, recordId: request.recordId, recordRevision: current.anchor.revision,
      extensionRevision: current.extension?.revision ?? null, conditionFingerprint }) };
}
