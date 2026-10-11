import { z } from "zod";
import { sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { Prisma } from "@/generated/prisma/client";
import { compileCustomField } from "../compiler/fields";
import { STUDIO_CAPABILITIES } from "../permissions";
import { checksum } from "../registry/contracts";
import { fieldDefinitionKey } from "./binding";
import { lockFieldEntitiesInTransaction } from "./entity-lock";
import { validateCandidateFieldCoverage } from "./required-coverage";
import { fieldRuntimeAuthorityInTransaction } from "./runtime-authority";
import { readVersionedFieldPlanInTransaction } from "./runtime-read";
import { inspectSealedFieldVersion } from "./sealed-field";
import type { CustomFieldPayload } from "./schema";

const requestSchema = z.strictObject({ definitionId: z.uuid(), versionId: z.uuid(), definitionRevision: z.number().int().nonnegative().max(2147483646) });
type CompiledField = Awaited<ReturnType<typeof compileCustomField>>;
const structuralChecksum = (payload: CustomFieldPayload) => checksum({ ...payload, field: { ...payload.field, label: "", help: "" } });
function changed(): never { throw new Error("CONFLICT: this field or its published version changed. Refresh before activating."); }

/** Ordinary required-field activation only. Reviewed cutover/rollback retain
 * their own stronger lineage and current-principal coverage before calling the
 * shared activation primitive. No public waiver or metadata Admin data grant.
 * This prerequisite and the subsequent pointer CAS/Audit share one transaction.
 */
export async function prepareRequiredFieldActivationInTransaction(authenticated: Session, transaction: Prisma.TransactionClient,
  input: unknown, compiled: CompiledField): Promise<Session> {
  const request = requestSchema.parse(input);
  if (!sessionAuthorityStamp(authenticated))
    throw new Error("FORBIDDEN: required-field activation needs an authorised business session or an explicitly opened, audited support session. The Admin setup context cannot inspect business records.");
  const authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction), { session, registry } = authority;
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (!await transaction.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Studio is unavailable.");
  if (compiled.plan.kind !== "customField" || compiled.plan.schemaVersion !== 1 || !compiled.plan.payload.field.required
    || checksum(compiled.plan) !== compiled.checksum || checksum(compiled.payload) !== checksum(compiled.plan.payload)) changed();
  await lockFieldEntitiesInTransaction(transaction, session.organisationId, [compiled.plan.payload.entity.id]);
  await transaction.$queryRaw`SELECT id FROM studio_definitions WHERE id=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR UPDATE`;
  const definition = await transaction.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: session.organisationId, kind: "customField", retiredAt: null }, include: { activeVersion: true } });
  if (!definition || definition.id !== request.definitionId || definition.organisationId !== session.organisationId || definition.kind !== "customField"
    || definition.retiredAt !== null || definition.revision !== request.definitionRevision) changed();
  const versionIds = [...new Set([request.versionId, ...(definition.activeVersionId ? [definition.activeVersionId] : [])])].sort();
  await transaction.$queryRaw`SELECT id FROM studio_definition_versions WHERE id=ANY(${versionIds}::uuid[]) AND "definitionId"=${definition.id}::uuid AND "organisationId"=${session.organisationId} ORDER BY id FOR SHARE`;
  const version = await transaction.studioDefinitionVersion.findFirst({ where: { id: request.versionId, definitionId: definition.id, organisationId: session.organisationId } });
  if (!version || version.id !== request.versionId || version.schemaVersion !== 1 || version.checksum !== compiled.checksum) changed();
  const target = inspectSealedFieldVersion(registry, version, session.organisationId, definition.id);
  if (target.schemaVersion !== 1 || !target.payload.field.required || definition.key !== fieldDefinitionKey(target.payload)
    || structuralChecksum(target.payload) !== structuralChecksum(compiled.plan.payload)) changed();
  // Today's independent target Read/Write, native/reference metadata and binding
  // checks apply even when no business record values need to be inspected.
  await readVersionedFieldPlanInTransaction(authority, version, definition.id);
  const freshCompiled = await compileCustomField(session, target.payload, registry);
  if (freshCompiled.checksum !== version.checksum) changed();
  let unchangedRequirement = false;
  if (definition.activeVersionId !== null) {
    const active = definition.activeVersion;
    if (!active || active.id !== definition.activeVersionId) changed();
    const current = inspectSealedFieldVersion(registry, active, session.organisationId, definition.id);
    if (definition.key !== fieldDefinitionKey(current.payload)) changed();
    await readVersionedFieldPlanInTransaction(authority, active, definition.id);
    unchangedRequirement = active.id === version.id || (current.schemaVersion === 1
      && current.payload.storageGeneration === target.payload.storageGeneration
      && structuralChecksum(current.payload) === structuralChecksum(target.payload));
  } else if (definition.activeVersion !== null) changed();
  if (!unchangedRequirement) {
    const coverage = await validateCandidateFieldCoverage(session, transaction, request);
    if (coverage.definitionId !== definition.id || coverage.definitionRevision !== definition.revision
      || coverage.versionId !== version.id || coverage.versionChecksum !== version.checksum) changed();
  }
  return session;
}
