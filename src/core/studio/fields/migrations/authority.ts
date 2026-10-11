import { db } from "@/core/db/client";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { Prisma, type Organisation } from "@/generated/prisma/client";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { resolveFieldMigrationPrincipal } from "../principal";
import { fieldMigrationPrincipalSchema, type FieldMigrationPrincipal } from "../principal-contract";
import { FieldMigrationReviewError } from "./contracts";

export type FieldMigrationAuthority = {
  session: Session;
  principal: FieldMigrationPrincipal;
  transaction: Prisma.TransactionClient;
  company: Pick<Organisation, "id" | "kind" | "status" | "archivedAt" | "isTest">;
};
function sameActor(session: Session, principal: FieldMigrationPrincipal) {
  if (session.organisationId !== principal.organisationId || session.userId !== principal.userId || session.membershipId !== principal.membershipId)
    throw new Error("FORBIDDEN: preparation requires the authenticated company data principal.");
}
const databaseFailureSchema = z.object({ code: z.string().optional(), driverAdapterError: z.object({
  cause: z.object({ originalCode: z.string().optional() }).optional(),
}).optional() });

/** Internal shared transaction boundary; callbacks still enforce native/field
 * policy and source/draft freshness. A callback is never accepted from a client.
 */
export async function withFieldMigrationAuthority<T>(session: Session, serverPrincipal: FieldMigrationPrincipal,
  operation: (authority: FieldMigrationAuthority) => Promise<T>): Promise<T> {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  const principal = fieldMigrationPrincipalSchema.parse(serverPrincipal);
  sameActor(session, principal); sameActor(await resolveFieldMigrationPrincipal(principal), principal);
  try { return await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT m.id FROM memberships m JOIN users u ON u.id=m."userId" JOIN organisations o ON o.id=m."organisationId"
      WHERE m.id=${principal.membershipId} AND m."organisationId"=${principal.organisationId} AND m."userId"=${principal.userId}
      FOR SHARE OF m,u,o`;
    await tx.$queryRaw`SELECT r.id FROM roles r JOIN roles_on_memberships rm ON rm."roleId"=r.id
      WHERE rm."membershipId"=${principal.membershipId} AND r."organisationId"=${principal.organisationId} FOR SHARE OF r,rm`;
    if (principal.authority === "staff_support")
      await tx.$queryRaw`SELECT "userId" FROM platform_administrators WHERE "userId"=${principal.userId} FOR SHARE`;
    const fresh = await resolveFieldMigrationPrincipal(principal); sameActor(fresh, principal);
    const membership = await tx.membership.findFirst({ where: { id: principal.membershipId, organisationId: principal.organisationId, userId: principal.userId, active: true },
      select: { sessionVersion: true, user: { select: { authVersion: true } } } });
    if (!membership || membership.sessionVersion !== principal.sessionVersion || membership.user.authVersion !== principal.authVersion)
      throw new Error("FORBIDDEN: preparation authority changed.");
    await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${fresh.organisationId} AND "moduleId"='studio' FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: fresh.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: Studio is unavailable.");
    const company = await tx.organisation.findFirst({ where: { id: fresh.organisationId }, select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
    if (!company) throw new Error("FORBIDDEN: current company data access is required.");
    return operation({ session: fresh, principal, transaction: tx, company });
  }, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const metadata = databaseFailureSchema.safeParse(error.meta);
      const sqlState = metadata.success ? metadata.data.code ?? metadata.data.driverAdapterError?.cause?.originalCode : undefined;
      if (["P2034", "P2002"].includes(error.code) || (error.code === "P2010" && sqlState !== undefined && ["40001", "40P01"].includes(sqlState)))
        throw new FieldMigrationReviewError("REVIEW_CHANGED");
    }
    throw error;
  }
}
