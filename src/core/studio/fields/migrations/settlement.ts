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
import { sealFieldMigrationIntent, FieldMigrationReviewError } from "./contracts";
import { withFieldMigrationAuthority } from "./authority";
import { inspectFieldMigrationSettlementIdentity, inspectFieldMigrationSettlementWindow } from "./settlement-inspection";
import { validateFieldMigrationSettlementCoverage } from "./settlement-coverage";
import { fieldMigrationSettlementRequestSchema, createFieldMigrationSettlementPin, assertFieldMigrationSettlementConfirmation, fieldMigrationSettlementTransition } from "./settlement-contract";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

async function settle(session: Session, serverPrincipal: FieldMigrationPrincipal, input: unknown, disposition: "ROLLED_BACK" | "FINALIZED") {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = fieldMigrationSettlementRequestSchema.parse(input);
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: { id: request.preparationId, organisationId: session.organisationId } });
  if (!initial) changed();
  const sealed = sealFieldMigrationIntent(initial.intent), intent = sealed.intent;
  if (sealed.checksum !== initial.intentChecksum || intent.id !== initial.id || intent.organisationId !== session.organisationId) changed();
  return withFieldMigrationAuthority(session, serverPrincipal, async authority => {
    const { transaction: tx, session: fresh, principal } = authority;
    const inspected = await inspectFieldMigrationSettlementIdentity(tx, intent);
    const packet = createFieldMigrationSettlementPin(inspected.retained, principal, disposition);
    assertFieldMigrationSettlementConfirmation(request, packet);
    const registry = studioRegistry();
    if (inspected.state !== "ACTIVATED") {
      if (inspected.state !== disposition || !inspected.settlement) changed();
      // Confirm the actual recorded operation, not today's pointer or current actor.
      assertFieldMigrationSettlementConfirmation(request, inspected.settlement);
      await validateFieldMigrationSettlementCoverage(authority, registry, inspected, "history");
      return { id: intent.id, state: disposition, replayed: true, settlementChecksum: inspected.settlement.checksum,
        settledBy: inspected.receipt.settledBy, sourceVersionId: inspected.receipt.sourceVersionId, targetVersionId: inspected.receipt.targetVersionId };
    }
    await inspectFieldMigrationSettlementWindow(tx, inspected, disposition);
    await validateFieldMigrationSettlementCoverage(authority, registry, inspected, disposition === "ROLLED_BACK" ? "rollback" : "history");
    const transition = fieldMigrationSettlementTransition(packet.pin), scope = { preparationId: intent.id, organisationId: fresh.organisationId, definitionId: intent.definitionId };
    if ((await tx.studioFieldMigrationCutover.updateMany({ where: { ...scope, state: "ACTIVATED", revision: 0 }, data: { ...transition.cutover,
      settlementPin: packet.pin, settlementChecksum: packet.checksum, settledBy: fresh.userId, settledAt: new Date() } })).count !== 1) changed();
    if ((await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "CUTOVER", revision: packet.pin.publicationRevision }, data: transition.publication })).count !== 1) changed();
    if (disposition === "ROLLED_BACK") {
      const compiled = await compileCustomField(fresh, inspected.source.payload, registry);
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
