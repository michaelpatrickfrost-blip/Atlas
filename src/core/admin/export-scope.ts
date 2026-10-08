/** SQL identifiers come only from PostgreSQL's catalog, never from the request. */
export const quoteIdentifier = (name: string) => `"${name.replaceAll('"', '""')}"`;
export type ExportColumn = { table: string; column: string; type: string };
export type ExportForeignKey = { table: string; parent: string; columns: string[]; parentColumns: string[] };
export const EXCLUDED_EXPORT_TABLES = new Set(["_prisma_migrations", "platform_administrators", "password_resets", "guardian_issues", "guardian_runs", "guardian_workers", "guardian_rate_limits"]);
export const protectedExportField = (field: string) => /password|credential|secret|token|authVersion|sessionVersion/i.test(field);
export function redactExportSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactExportSecrets);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !protectedExportField(key)).map(([key, item]) => [key, redactExportSecrets(item)]));
  return value;
}

/** Follow child -> tenant parent FKs only. Never follow a shared User into another company. */
export function companyExportScopes(columns: ExportColumn[], foreignKeys: ExportForeignKey[], excludedTables = EXCLUDED_EXPORT_TABLES) {
  const tables = [...new Set(columns.map(column => column.table))].sort();
  const scopes = new Map<string, string>();
  let aliasSequence = 0;
  const q = quoteIdentifier;
  for (const table of tables) {
    if (excludedTables.has(table) || table === "users") continue;
    if (table === "organisations") scopes.set(table, 'r."id" = $1');
    else if (columns.some(column => column.table === table && column.column === "organisationId")) scopes.set(table, 'r."organisationId" = $1');
  }
  let changed = true;
  while (changed) {
    changed = false;
    // Each pass uses earlier scopes, so a cyclic FK can never create a recursive predicate.
    const parents = new Map(scopes);
    for (const table of tables) {
      if (scopes.has(table) || excludedTables.has(table) || table === "users") continue;
      const anchors = foreignKeys.filter(key => key.table === table && key.parent !== "users" && parents.has(key.parent));
      if (!anchors.length) continue;
      const exists = anchors.map(key => {
        const alias = `parent${aliasSequence++}`;
        return `EXISTS (SELECT 1 FROM public.${q(key.parent)} ${alias} WHERE ${key.columns.map((column, i) => `r.${q(column)} = ${alias}.${q(key.parentColumns[i])}`).join(" AND ")} AND ${parents.get(key.parent)!.replaceAll('r.', `${alias}.`)})`;
      });
      const guards = anchors.map((key, i) => `(${key.columns.map(column => `r.${q(column)} IS NULL`).join(" OR ")} OR ${exists[i]})`);
      scopes.set(table, `((${exists.join(" OR ")}) AND ${guards.join(" AND ")})`);
      changed = true;
    }
  }
  // A user's global identity is exported only when linked to this tenant. No password or platform grant.
  if (tables.includes("users")) scopes.set("users", 'EXISTS (SELECT 1 FROM public.memberships m WHERE m."userId"=r.id AND m."organisationId"=$1)');
  return scopes;
}
