import type { Prisma } from "@/generated/prisma/client";

/** Internal transaction coordination only. Callers supply the server's tenant
 * and complete owning entity set before configuration/native/value row locks,
 * and retain their independent authentication, capabilities and binding checks.
 * Keep the existing first-publication key byte-for-byte; locks grant no access. */
export async function lockFieldEntitiesInTransaction(tx: Prisma.TransactionClient, organisationId: string, entityIds: readonly string[]): Promise<void> {
  for (const entityId of [...new Set(entityIds)].sort()) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify([organisationId, entityId])}, 0))::text`;
  }
}

/** Existing published binding only, scoped before any definition/record lookup.
 * Compact JSON has the same bytes as the JavaScript key above. An absent binding
 * takes no lock and grants nothing: callers must still reject an unbound field.
 * Native creators/first publishers already know the server-approved entity and
 * must use the explicit helper even before its first binding exists. */
export async function lockBoundFieldEntityInTransaction(tx: Prisma.TransactionClient, organisationId: string, definitionId: string): Promise<void> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(
    '[' || to_json(b."organisationId")::text || ',' || to_json(b."entityId")::text || ']', 0))::text
    FROM studio_field_bindings b WHERE b."organisationId"=${organisationId} AND b."definitionId"=${definitionId}::uuid
    ORDER BY b."entityId"`;
}
