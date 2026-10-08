import { db } from "@/core/db/client";
import { companyExportScopes, quoteIdentifier, type ExportColumn, type ExportForeignKey } from "./export-scope";
import { CleanupValidationError, type CleanupSelection } from "./cleanup-input";
import { removeServiceFile } from "@/core/service-work/files";

type WipeOptions = { actorUserId: string; currentOrganisationId: string; selection: CleanupSelection[] };
/** A sweep either deletes all selected Test companies' database records or rolls back. */
export async function wipeTestCompanies(organisationIds: string[], options?: WipeOptions) {
  if (!organisationIds.length || new Set(organisationIds).size !== organisationIds.length || organisationIds.length > 1000) throw new CleanupValidationError("Choose distinct test companies to delete.");
  const result = await db.$transaction(async tx => {
    const companies = await tx.$queryRawUnsafe<{ id: string; name: string; kind: string; isTest: boolean; updatedAt: Date }[]>('SELECT id,name,kind,"isTest","updatedAt" FROM organisations WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE', organisationIds);
    if (companies.length !== organisationIds.length) throw new CleanupValidationError("A selected company no longer exists. Refresh and review the selection.");
    if (companies.some(company => company.kind !== "CUSTOMER" || !company.isTest)) throw new CleanupValidationError("Only companies created as Test can be permanently deleted. Archive an ordinary company instead.");
    if (options && companies.some(company => company.id === options.currentOrganisationId)) throw new CleanupValidationError("Switch out of a selected company before deleting it.");
    if (options && companies.some(company => !options.selection.some(item => item.id === company.id && item.name === company.name && item.updatedAt === company.updatedAt.toISOString()))) throw new CleanupValidationError("The company list changed. Refresh and review the selection again.");
    const members = await tx.membership.findMany({ where: { organisationId: { in: organisationIds } }, select: { userId: true } });
    const employees = await tx.employee.findMany({ where: { organisationId: { in: organisationIds }, userId: { not: null } }, select: { userId: true } });
    const userIds = [...new Set([...members.map(member => member.userId), ...employees.map(employee => employee.userId).filter((id): id is string => !!id)])];
    const files = await tx.serviceFile.findMany({ where: { organisationId: { in: organisationIds } }, select: { storageKey: true } });
    await tx.$queryRaw`SELECT set_config('atlas.test_wipe','on',true)`;
    const columns = await tx.$queryRaw<ExportColumn[]>`SELECT c.table_name AS "table", c.column_name AS "column", c.data_type AS "type" FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name WHERE c.table_schema='public' AND t.table_type='BASE TABLE'`;
    const keys = await tx.$queryRaw<ExportForeignKey[]>`SELECT child.relname AS "table", parent.relname AS "parent", array_agg(ca.attname ORDER BY ck.n)::text[] AS "columns", array_agg(pa.attname ORDER BY ck.n)::text[] AS "parentColumns" FROM pg_constraint con JOIN pg_class child ON child.oid=con.conrelid JOIN pg_namespace ns ON ns.oid=child.relnamespace JOIN pg_class parent ON parent.oid=con.confrelid JOIN pg_namespace pn ON pn.oid=parent.relnamespace CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY ck(num,n) JOIN pg_attribute ca ON ca.attrelid=child.oid AND ca.attnum=ck.num JOIN pg_attribute pa ON pa.attrelid=parent.oid AND pa.attnum=con.confkey[ck.n] WHERE con.contype='f' AND ns.nspname='public' AND pn.nspname='public' GROUP BY con.oid,child.relname,parent.relname`;
    const scopes = companyExportScopes(columns, keys, new Set(["users", "platform_administrators", "_prisma_migrations", "company_cleanup_runs"]));
    scopes.delete("users"); scopes.delete("organisations");
    let pending = [...scopes.keys()];
    while (pending.length) {
      let progress = false;
      for (const table of [...pending]) {
        await tx.$executeRawUnsafe("SAVEPOINT atlas_wipe");
        try {
          const scope = scopes.get(table)!.replaceAll(" = $1", " = ANY($1::text[])");
          await tx.$executeRawUnsafe(`DELETE FROM public.${quoteIdentifier(table)} r WHERE ${scope}`, organisationIds);
          await tx.$executeRawUnsafe("RELEASE SAVEPOINT atlas_wipe");
          pending = pending.filter(item => item !== table); progress = true;
        } catch (error) {
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT atlas_wipe");
          await tx.$executeRawUnsafe("RELEASE SAVEPOINT atlas_wipe");
          // Only FK dependencies are retried. Other failures roll back the whole sweep.
          if (!error || typeof error !== "object" || !("meta" in error) || !["23503", "23001"].includes((error.meta as { code?: string } | undefined)?.code ?? "")) throw error;
        }
      }
      if (!progress) throw new Error(`Company cleanup could not resolve dependencies: ${pending.join(", ")}`);
    }
    const identityGuards = keys.filter(key => key.parent === "users").map(key => `NOT EXISTS (SELECT 1 FROM public.${quoteIdentifier(key.table)} linked WHERE ${key.columns.map((column, index) => `linked.${quoteIdentifier(column)} = u.${quoteIdentifier(key.parentColumns[index])}`).join(" AND ")})`);
    await tx.$executeRawUnsafe(`DELETE FROM users u WHERE u.id = ANY($1::text[]) AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m."userId"=u.id) AND NOT EXISTS (SELECT 1 FROM platform_administrators p WHERE p."userId"=u.id)${identityGuards.length ? ` AND ${identityGuards.join(" AND ")}` : ""}`, userIds);
    await tx.organisation.deleteMany({ where: { id: { in: organisationIds }, kind: "CUSTOMER", isTest: true } });
    const details = companies.map(({ id, name, isTest }) => ({ id, name, isTest }));
    const run = await tx.companyCleanupRun.create({ data: { actorUserId: options?.actorUserId ?? "acceptance-cleanup", companies: details, remainingFileKeys: files.map(file => file.storageKey) } });
    if (options) await tx.auditEntry.create({ data: { organisationId: options.currentOrganisationId, actorUserId: options.actorUserId, action: "atlas.companies.deleted", entityType: "CompanyCleanupRun", entityId: run.id, after: { companies: details } } });
    return run;
  }, { timeout: 120_000, maxWait: 10_000 });
  return finishCompanyFileCleanup(result.id);
}

/** Idempotent after commit; remaining keys survive process/network/storage failures. */
export async function finishCompanyFileCleanup(runId: string) {
  const run = await db.companyCleanupRun.findUniqueOrThrow({ where: { id: runId } });
  if (run.status === "COMPLETE") return run;
  const remaining: string[] = [];
  for (const key of run.remainingFileKeys) {
    try { await removeServiceFile(key); }
    catch (error) { if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") remaining.push(key); }
  }
  await db.companyCleanupRun.updateMany({ where: { id: run.id, version: run.version }, data: { version: { increment: 1 }, remainingFileKeys: remaining, removedFileCount: { increment: run.remainingFileKeys.length - remaining.length }, status: remaining.length ? "FILES_PENDING" : "COMPLETE" } });
  return db.companyCleanupRun.findUniqueOrThrow({ where: { id: run.id } });
}

/** Server-only acceptance helper. The same Test/internal safety checks apply. */
export async function wipeCompany(organisationId: string) {
  await wipeTestCompanies([organisationId]);
}
