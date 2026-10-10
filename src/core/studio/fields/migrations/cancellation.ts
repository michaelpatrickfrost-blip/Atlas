import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import type { FieldMigrationPrincipal } from "../principal-contract";
import { withFieldMigrationAuthority } from "./authority";
import { FieldMigrationReviewError } from "./contracts";
const requestSchema = z.strictObject({ preparationId: z.uuid(), revision: z.number().int().nonnegative().max(2147483646) });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Internal metadata-only recovery. Uses the current authorised publisher's
 * real company principal, not the old creator's stored grants. Returns no record
 * IDs/counts/values. Cancelling never activates or authorises the target.
 */
export async function cancelFieldMigrationPublication(session: Session, serverPrincipal: FieldMigrationPrincipal, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = requestSchema.parse(input);
  return withFieldMigrationAuthority(session, serverPrincipal, async ({ session: fresh, transaction: tx }) => {
    const scope = { preparationId: request.preparationId, organisationId: fresh.organisationId };
    await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${request.preparationId}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    const publication = await tx.studioFieldMigrationPublication.findFirst({ where: scope, select: { preparationId: true, revision: true, state: true } });
    if (!publication || request.revision > publication.revision) changed();
    if (publication.state === "CANCELLED") return { id: publication.preparationId, revision: publication.revision, state: "CANCELLED" as const, replayed: true };
    if (publication.state !== "PUBLISHED" || publication.revision !== request.revision) changed();
    const revision = publication.revision + 1;
    if ((await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "PUBLISHED", revision: publication.revision },
      data: { state: "CANCELLED", revision } })).count !== 1) changed();
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.cancelled",
      entityType: "StudioFieldMigrationPublication", entityId: publication.preparationId, after: { state: "CANCELLED", revision } }, tx);
    return { id: publication.preparationId, revision, state: "CANCELLED" as const, replayed: false };
  });
}
