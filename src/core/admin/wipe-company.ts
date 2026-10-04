import { db } from "@/core/db/client";

/** Removes a company and everything scoped to it. Callers must already have checked it is a Test company. */
export async function wipeCompany(organisationId: string) {
  const members = await db.membership.findMany({ where: { organisationId }, select: { userId: true } });
  const userIds = members.map((m) => m.userId);
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('atlas.test_wipe','on',true)`;
    const tables = await tx.$queryRaw<{ table_name: string }[]>`SELECT c.table_name FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name WHERE c.table_schema='public' AND t.table_type='BASE TABLE' AND c.column_name='organisationId' AND c.table_name NOT IN ('organisations','_prisma_migrations')`;
    let pending = tables.map((t) => t.table_name);
    while (pending.length) {
      let progress = false;
      for (const table of [...pending]) {
        await tx.$executeRawUnsafe("SAVEPOINT wipe");
        try {
          await tx.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "organisationId"=$1`, organisationId);
          await tx.$executeRawUnsafe("RELEASE SAVEPOINT wipe");
          pending = pending.filter((t) => t !== table);
          progress = true;
        } catch {
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT wipe");
        }
      }
      if (!progress) throw new Error(`Could not remove: ${pending.join(", ")}`);
    }
    await tx.$executeRawUnsafe('DELETE FROM users u WHERE u.id = ANY($1::text[]) AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m."userId"=u.id) AND NOT EXISTS (SELECT 1 FROM platform_administrators p WHERE p."userId"=u.id)', userIds);
    await tx.organisation.delete({ where: { id: organisationId } });
  }, { timeout: 120000, maxWait: 10000 });
}
