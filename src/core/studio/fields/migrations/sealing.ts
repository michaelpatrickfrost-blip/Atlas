import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { studioRegistry } from "../../registry/runtime";
import { checksum } from "../../registry/contracts";
import { analyseFieldEvolution } from "../evolution";
import { sealFieldMigrationIntent, readSealedFieldMigrationReview, FieldMigrationReviewError } from "./contracts";
import { withFieldMigrationAuthority } from "./authority";
import { inspectFieldMigrationReview } from "./inspection";

const requestSchema = z.strictObject({ preparationId: z.uuid(), revision: z.number().int().nonnegative().max(2147483646) });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Internal reviewed field change, not publication/activation or a public action.
 * Reference coverage requires an explicit versioned owning-domain proof.
 */
export async function sealFieldMigrationPreparation(session: Session, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = requestSchema.parse(input), scope = { id: request.preparationId, organisationId: session.organisationId };
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: scope });
  if (!initial) changed();
  const pinned = sealFieldMigrationIntent(initial.intent);
  if (pinned.checksum !== initial.intentChecksum || pinned.intent.id !== initial.id || pinned.intent.organisationId !== session.organisationId) changed();
  return withFieldMigrationAuthority(session, pinned.intent.principal, async ({ session: fresh, transaction: tx, company }) => {
    await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${request.preparationId}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: scope, include: { review: true } });
    if (!preparation || !["PREPARING", "REVIEWED"].includes(preparation.state) || preparation.intentChecksum !== pinned.checksum
      || checksum(preparation.intent) !== pinned.checksum || request.revision > preparation.revision) changed();
    if (preparation.state === "PREPARING" && (preparation.review || preparation.revision !== request.revision)) changed();
    const intent = pinned.intent, registry = studioRegistry();
    const sealed = await inspectFieldMigrationReview({ session: fresh, transaction: tx }, registry, company, intent);
    const impact = analyseFieldEvolution(intent.source.payload, intent.target.payload);
    if (preparation.state === "REVIEWED") {
      if (!preparation.review || readSealedFieldMigrationReview({ review: preparation.review.review, checksum: preparation.review.checksum }).checksum !== sealed.checksum) changed();
      return { id: preparation.id, revision: preparation.revision, state: "REVIEWED" as const, checksum: sealed.checksum, cohort: sealed.review.cohort,
        summary: sealed.review.summary, indexImpact: impact.indexImpact, rollbackLimit: impact.rollbackLimit, replayed: true };
    }
    await tx.studioFieldMigrationReview.create({ data: { id: preparation.id, organisationId: fresh.organisationId, definitionId: intent.definitionId,
      review: sealed.review, checksum: sealed.checksum } });
    const revision = preparation.revision + 1;
    if ((await tx.studioFieldMigrationPreparation.updateMany({ where: { ...scope, state: "PREPARING", revision: preparation.revision }, data: { state: "REVIEWED", revision } })).count !== 1) changed();
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.reviewed",
      entityType: "StudioFieldMigrationPreparation", entityId: preparation.id, after: { revision, checksum: sealed.checksum, cohort: sealed.review.cohort, summary: sealed.review.summary } }, tx);
    return { id: preparation.id, revision, state: "REVIEWED" as const, checksum: sealed.checksum, cohort: sealed.review.cohort,
      summary: sealed.review.summary, indexImpact: impact.indexImpact, rollbackLimit: impact.rollbackLimit, replayed: false };
  });
}
