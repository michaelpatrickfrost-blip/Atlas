import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { checksum } from "../registry/contracts";
import { sealFieldMigrationIntent } from "./migrations/contracts";
import { inspectFieldMigrationSettlementIdentity, inspectFieldMigrationSettlementWindow } from "./migrations/settlement-inspection";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "./migrations/settlement-contract";
import type { FieldMigrationPrincipal } from "./principal-contract";
import type { FieldRuntimeAuthority } from "./runtime-authority";
import type { FieldWriteRequest } from "./runtime-write-contract";

/** Internal only, AFTER ordinary owner/current/written/reference/CAS validation.
 * A valid target save ends the unchanged-data rollback window in the SAME atomic
 * value/Audit transaction. It grants no source read, activation or rollback right.
 * Unlike the administrator settlement operation, no whole-cohort data is read. */
export async function closeFieldWriteWindow(authority: FieldRuntimeAuthority, request: FieldWriteRequest) {
  const { session, stamp, transaction: tx } = authority;
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: { organisationId: session.organisationId, definitionId: request.definitionId,
    state: { in: ["PUBLISHED", "CUTOVER"] }, OR: [{ sourceGenerationId: request.generationId }, { targetGenerationId: request.generationId }] } });
  if (!publication) return;
  if (publication.state === "PUBLISHED" || publication.targetGenerationId !== request.generationId)
    throw new Error("FIELD_MIGRATION_IN_PROGRESS: this field is temporarily frozen while an approved change completes.");
  const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: publication.preparationId, organisationId: session.organisationId, definitionId: request.definitionId } });
  if (!preparation) throw new Error("FIELD_STORAGE_INVALID: the field migration window is unavailable.");
  const sealed = sealFieldMigrationIntent(preparation.intent);
  if (sealed.checksum !== preparation.intentChecksum || checksum(preparation.intent) !== sealed.checksum) throw new Error("FIELD_STORAGE_INVALID: the field migration window is unavailable.");
  const inspected = await inspectFieldMigrationSettlementIdentity(tx, sealed.intent);
  await inspectFieldMigrationSettlementWindow(tx, inspected, "FINALIZED");
  if (inspected.target.id !== request.versionId || inspected.definition.revision !== request.definitionRevision || inspected.publication.targetGenerationId !== request.generationId)
    throw new Error("CONFLICT: the published field changed. Refresh before saving.");
  let principal: FieldMigrationPrincipal;
  if (session.capabilities.has(ATLAS_CAPABILITIES.staff)) {
    assertCapability(session, ATLAS_CAPABILITIES.companies);
    // Existing purpose-bound support evidence, actual affiliated staff identity,
    // committed with the value. Never label staff as a customer or borrow a grant.
    const audit = await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId,
      action: "studio.field.migration.support_opened", entityType: "Membership", entityId: session.membershipId,
      before: { operationId: request.operationId, purpose: "ordinary_field_save" }, after: { ...stamp, fromOrganisationId: session.organisationId } }, select: { id: true } });
    principal = { ...stamp, authority: "staff_support", auditId: audit.id };
  } else principal = { ...stamp, authority: "customer" };
  const packet = createFieldMigrationSettlementPin(inspected.retained, principal, "FINALIZED"), transition = fieldMigrationSettlementTransition(packet.pin);
  const scope = { preparationId: publication.preparationId, organisationId: session.organisationId, definitionId: request.definitionId };
  if ((await tx.studioFieldMigrationCutover.updateMany({ where: { ...scope, state: "ACTIVATED", revision: 0 }, data: { ...transition.cutover,
    settlementPin: packet.pin, settlementChecksum: packet.checksum, settledBy: session.userId, settledAt: new Date() } })).count !== 1
    || (await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "CUTOVER", revision: packet.pin.publicationRevision }, data: transition.publication })).count !== 1)
    throw new Error("CONFLICT: the field migration window changed. Refresh before saving.");
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "studio.field.migration.finalized",
    entityType: "StudioFieldMigrationCutover", entityId: publication.preparationId,
    after: { cutoverChecksum: packet.pin.cutoverChecksum, settlementChecksum: packet.checksum, disposition: "FINALIZED",
      sourceVersionId: packet.pin.sourceVersionId, targetVersionId: packet.pin.targetVersionId, definitionRevision: transition.definition.revision,
      publicationRevision: transition.publication.revision, operationId: request.operationId, trigger: "ordinary_field_save" } }, tx);
}
