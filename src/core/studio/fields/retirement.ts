import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../permissions";
import { Prisma } from "@/generated/prisma/client";

const retirementSchema = z.strictObject({ definitionId: z.uuid(), revision: z.number().int().nonnegative() });
function conflict(): never { throw new Error("CONFLICT: this field is unavailable, retired or changed. Reload before retiring it."); }

/** Metadata retirement only: retain the last active policy and all stored history. */
export async function retireFieldDefinition(session: Session, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const value = retirementSchema.parse(input);
  try { return await db.$transaction(async tx => {
    // A disablement must not race this configuration mutation.
    await tx.$queryRaw`SELECT "id" FROM "module_states" WHERE "organisationId" = ${session.organisationId} AND "moduleId" = 'studio' FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: Studio is unavailable.");
    const retiredAt = new Date();
    const changed = await tx.studioDefinition.updateMany({
      where: { id: value.definitionId, organisationId: session.organisationId, kind: "customField", revision: value.revision, retiredAt: null },
      data: { retiredAt, revision: { increment: 1 } },
    });
    if (changed.count !== 1) conflict();
    // Keep activeVersionId for the subsequent authorised-history reader. Runtime
    // resolution/editing already exclude retired definitions. No value/table purge.
    await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId,
      action: "studio.field.retired", entityType: "StudioDefinition", entityId: value.definitionId,
      before: { revision: value.revision }, after: { revision: value.revision + 1, retiredAt: retiredAt.toISOString() } }, tx);
    return { revision: value.revision + 1, retiredAt };
  }, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") conflict();
    throw error;
  }
}
