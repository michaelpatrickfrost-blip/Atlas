import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { sessionForUser, sessionAuthorityStamp, type Session, type SessionAuthorityStamp } from "@/core/auth/session";
import { buildRegistry } from "../registry/runtime";
import type { CapabilityRegistry } from "../registry/registry";

export type FieldRuntimeAuthority = { session: Session; stamp: SessionAuthorityStamp; transaction: Prisma.TransactionClient; registry: CapabilityRegistry };
const sqlFailure = z.object({ code: z.string().optional(), driverAdapterError: z.object({ cause: z.object({ originalCode: z.string().optional() }).optional() }).optional() });
function denied(): never { throw new Error("FORBIDDEN: current authenticated company access is required."); }
function sameIdentity(session: Session, stamp: SessionAuthorityStamp) {
  if (session.organisationId !== stamp.organisationId || session.userId !== stamp.userId || session.membershipId !== stamp.membershipId) denied();
}

/** One server-owned ordinary runtime transaction. It does not require Studio
 * authoring grants or enabled authoring UI, nor does it grant native/field/value
 * access. Trusted callers separately check owning-module and current/written
 * record/reference policy before reading or writing. Never a client callback. */
export async function withFieldRuntimeAuthority<T>(authenticated: Session, operation: (authority: FieldRuntimeAuthority) => Promise<T>): Promise<T> {
  const stamp = sessionAuthorityStamp(authenticated);
  if (!stamp) denied();
  sameIdentity(authenticated, stamp);
  try {
    return await db.$transaction(async tx => operation(await refreshAuthority(authenticated, tx)), { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const metadata = sqlFailure.safeParse(error.meta), state = metadata.success ? metadata.data.code ?? metadata.data.driverAdapterError?.cause?.originalCode : undefined;
      if (error.code === "P2034" || (error.code === "P2010" && state !== undefined && ["40001", "40P01"].includes(state)))
        throw new Error("CONFLICT: current record or access changed. Refresh and try again.");
    }
    throw error;
  }
}

/** Internal native-operation bridge. The caller owns commit/rollback and must
 * keep resulting native facts, values and all Audits in this same transaction.
 * This neither opens a nested transaction nor approves any record/field operation.
 * Untrusted Session DTOs fail before querying the supplied transaction. */
export async function fieldRuntimeAuthorityInTransaction(authenticated: Session, transaction: Prisma.TransactionClient): Promise<FieldRuntimeAuthority> {
  const stamp = sessionAuthorityStamp(authenticated);
  if (!stamp) denied();
  sameIdentity(authenticated, stamp);
  const isolation = await transaction.$queryRaw<Array<{ transaction_isolation: string }>>`SHOW transaction_isolation`;
  if (isolation.length !== 1 || isolation[0].transaction_isolation !== "serializable")
    throw new Error("Field runtime requires the owning serializable transaction.");
  return refreshAuthority(authenticated, transaction);
}

async function refreshAuthority(authenticated: Session, tx: Prisma.TransactionClient): Promise<FieldRuntimeAuthority> {
  const stamp = sessionAuthorityStamp(authenticated);
  if (!stamp) denied();
  sameIdentity(authenticated, stamp);
  await tx.$queryRaw`SELECT m.id FROM memberships m JOIN users u ON u.id=m."userId" JOIN organisations o ON o.id=m."organisationId"
    WHERE m.id=${stamp.membershipId} AND m."organisationId"=${stamp.organisationId} AND m."userId"=${stamp.userId} FOR SHARE OF m,u,o`;
  await tx.$queryRaw`SELECT r.id FROM roles r JOIN roles_on_memberships rm ON rm."roleId"=r.id
    WHERE rm."membershipId"=${stamp.membershipId} AND r."organisationId"=${stamp.organisationId} FOR SHARE OF r,rm`;
  await tx.$queryRaw`SELECT "userId" FROM platform_administrators WHERE "userId"=${stamp.userId} FOR SHARE`;
  await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${stamp.organisationId} FOR SHARE`;
  const fresh = await sessionForUser(stamp.organisationId, stamp.userId, tx), currentStamp = fresh && sessionAuthorityStamp(fresh);
  if (!fresh || !currentStamp) denied();
  sameIdentity(fresh, stamp);
  if (currentStamp.authVersion !== stamp.authVersion || currentStamp.sessionVersion !== stamp.sessionVersion) denied();
  const company = await tx.organisation.findFirst({ where: { id: stamp.organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null }, select: { id: true } });
  if (!company) denied();
  const states = await tx.moduleState.findMany({ where: { organisationId: stamp.organisationId }, select: { moduleId: true, enabled: true, entitled: true } });
  const enabled = new Set(states.filter(state => state.enabled && state.entitled).map(state => state.moduleId));
  const registry = buildRegistry(async (session, moduleId) => session.organisationId === stamp.organisationId && enabled.has(moduleId));
  return { session: fresh, stamp: currentStamp, transaction: tx, registry };
}
