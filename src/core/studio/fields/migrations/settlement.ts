import { lockFieldEntitiesInTransaction } from "../entity-lock";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import type { FieldMigrationPrincipal } from "../principal-contract";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { studioRegistry } from "../../registry/runtime";
import { compileCustomField } from "../../compiler/fields";
import { activateCompiledVersionInTransaction } from "../../definitions/activation";
import { FieldMigrationReviewError } from "./contracts";
import { withFieldMigrationAuthority } from "./authority";
import { inspectFieldMigrationSettlementIdentity, inspectRequiredFieldMigrationSettlementIdentity, inspectFieldMigrationSettlementWindow } from "./settlement-inspection";
import { validateFieldMigrationSettlementCoverage, validateRequiredFieldMigrationSettlementCoverage } from "./settlement-coverage";
import { fieldMigrationSettlementRequestSchema, createFieldMigrationSettlementPin, assertFieldMigrationSettlementConfirmation, fieldMigrationSettlementTransition } from "./settlement-contract";
import { readStoredFieldMigrationIntent } from "./stored-protocol";
import { compileFieldMigrationMetadata } from "./metadata";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

async function settle(session: Session, serverPrincipal: FieldMigrationPrincipal, input: unknown, disposition: "ROLLED_BACK" | "FINALIZED") {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = fieldMigrationSettlementRequestSchema.parse(input);
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, organisationId: session.organisationId } });
  if (!initial) changed();
  const { intent } = readStoredFieldMigrationIntent(initial, session.organisationId);
  if (initial.definitionId !== intent.definitionId) changed();
  return withFieldMigrationAuthority(session, serverPrincipal, async authority => {
    const { transaction: tx, session: fresh, principal, company } = authority;
    await lockFieldEntitiesInTransaction(tx, fresh.organisationId, [intent.source.payload.entity.id, intent.target.payload.entity.id]);
    const inspection = intent.schemaVersion === 2
      ? { protocol: 2 as const, value: await inspectRequiredFieldMigrationSettlementIdentity(tx, intent) }
      : { protocol: 1 as const, value: await inspectFieldMigrationSettlementIdentity(tx, intent) };
    const inspected = inspection.value;
    const packet = createFieldMigrationSettlementPin(inspected.retained, principal, disposition);
    assertFieldMigrationSettlementConfirmation(request, packet);
    const registry = studioRegistry();
    const coverage = (mode: "rollback" | "history") => inspection.protocol === 2
      ? validateRequiredFieldMigrationSettlementCoverage(authority, registry, inspection.value, mode)
      : validateFieldMigrationSettlementCoverage(authority, registry, inspection.value, mode);
    if (inspected.state !== "ACTIVATED") {
      if (inspected.state !== disposition || !inspected.settlement) changed();
      // Confirm the actual recorded operation, not today's pointer or current actor.
      assertFieldMigrationSettlementConfirmation(request, inspected.settlement);
      await coverage("history");
      return { id: intent.id, state: disposition, replayed: true, settlementChecksum: inspected.settlement.checksum,
        settledBy: inspected.receipt.settledBy, sourceVersionId: inspected.receipt.sourceVersionId, targetVersionId: inspected.receipt.targetVersionId };
    }
    // History/replay and finalization grant no activation. Only a new rollback
    // that reactivates a conditional source remains Test-only before native hooks.
    if (disposition === "ROLLED_BACK" && intent.source.payload.schemaVersion === 2 && !company.isTest)
      throw new Error("STUDIO_FIELD_REQUIRED_NOT_READY: conditional rollback activation is available only in a Test company until native required safeguards are verified.");
    await inspectFieldMigrationSettlementWindow(tx, inspected, disposition);
    await coverage(disposition === "ROLLED_BACK" ? "rollback" : "history");
    const transition = fieldMigrationSettlementTransition(packet.pin), scope = { preparationId: intent.id, organisationId: fresh.organisationId, definitionId: intent.definitionId };
    if ((await tx.studioFieldMigrationCutover.updateMany({ where: { ...scope, state: "ACTIVATED", revision: 0 }, data: { ...transition.cutover,
      settlementPin: packet.pin, settlementChecksum: packet.checksum, settledBy: fresh.userId, settledAt: new Date() } })).count !== 1) changed();
    if ((await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "CUTOVER", revision: packet.pin.publicationRevision }, data: transition.publication })).count !== 1) changed();
    if (disposition === "ROLLED_BACK") {
      const compiled = intent.schemaVersion === 2
        ? await compileFieldMigrationMetadata({ session: fresh, transaction: tx }, registry, company, intent.definitionId, inspected.source.payload)
        : await compileCustomField(fresh, intent.source.payload, registry);
      await activateCompiledVersionInTransaction(tx, fresh, intent.definitionId, packet.pin.definitionRevision, inspected.source, compiled, inspected.target.id);
    }
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: disposition === "ROLLED_BACK" ? "studio.field.migration.rolled_back" : "studio.field.migration.finalized",
      entityType: "StudioFieldMigrationCutover", entityId: intent.id, after: { cutoverChecksum: packet.pin.cutoverChecksum, settlementChecksum: packet.checksum,
        disposition, sourceVersionId: packet.pin.sourceVersionId, targetVersionId: packet.pin.targetVersionId,
        definitionRevision: transition.definition.revision, publicationRevision: transition.publication.revision } }, tx);
    return { id: intent.id, state: disposition, replayed: false, settlementChecksum: packet.checksum,
      settledBy: fresh.userId, sourceVersionId: inspected.receipt.sourceVersionId, targetVersionId: inspected.receipt.targetVersionId };
  });
}

/** Internal server operations; authenticated callers capture a fresh customer or
 * audited support principal. No client mode/tenant/grants/target, reverse conversion
 * or native writes. Exact receipt, publication, activation and Audit commit together. */
export const rollbackReviewedFieldMigration = (session: Session, serverPrincipal: FieldMigrationPrincipal, input: unknown) => settle(session, serverPrincipal, input, "ROLLED_BACK");
export const finalizeReviewedFieldMigration = (session: Session, serverPrincipal: FieldMigrationPrincipal, input: unknown) => settle(session, serverPrincipal, input, "FINALIZED");
