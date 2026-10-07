import { createGzip } from "node:zlib";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "./access";
import { companyExportScopes, protectedExportField, redactExportSecrets, quoteIdentifier as q, type ExportColumn, type ExportForeignKey } from "./export-scope";

/** No server archive or local cache: an on-demand, consistent snapshot held in bounded memory. */
export async function buildCompanyExport(session: Session, organisationId: string) {
  assertCapability(session, ATLAS_CAPABILITIES.export);
  const gzip = createGzip(), chunks: Buffer[] = [];
  let bytes = 0;
  gzip.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = once(gzip, "end");
  // Attach rejection handling immediately, including failures before gzip.end().
  void finished.catch(() => {});
  const write = async (record: unknown) => {
    const line = JSON.stringify(record) + "\n";
    bytes += Buffer.byteLength(line);
    if (bytes > 250 * 1024 * 1024) throw new Error("This company exceeds the 250 MB export limit. Arrange a managed server export; no partial file was created.");
    if (!gzip.write(line)) await once(gzip, "drain");
  };
  try {
    const result = await db.$transaction(async tx => {
      const org = await tx.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER" }, select: { id: true, name: true } });
      const columns = await tx.$queryRaw<ExportColumn[]>`SELECT c.table_name AS "table", c.column_name AS "column", c.data_type AS "type" FROM information_schema.columns c JOIN information_schema.tables t ON t.table_name=c.table_name AND t.table_schema=c.table_schema WHERE c.table_schema='public' AND t.table_type='BASE TABLE' ORDER BY c.table_name,c.ordinal_position`;
      const keys = await tx.$queryRaw<ExportForeignKey[]>`SELECT child.relname AS "table", parent.relname AS "parent", array_agg(ca.attname ORDER BY ck.n)::text[] AS "columns", array_agg(pa.attname ORDER BY ck.n)::text[] AS "parentColumns" FROM pg_constraint con JOIN pg_class child ON child.oid=con.conrelid JOIN pg_namespace ns ON ns.oid=child.relnamespace JOIN pg_class parent ON parent.oid=con.confrelid JOIN pg_namespace pn ON pn.oid=parent.relnamespace CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY ck(num,n) JOIN pg_attribute ca ON ca.attrelid=child.oid AND ca.attnum=ck.num JOIN pg_attribute pa ON pa.attrelid=parent.oid AND pa.attnum=con.confkey[ck.n] WHERE con.contype='f' AND ns.nspname='public' AND pn.nspname='public' GROUP BY con.oid,child.relname,parent.relname`;
      const scopes = companyExportScopes(columns, keys), counts: Record<string, number> = {}, files: { key: string; table: string; id: string; sha256?: string }[] = [];
      const excludedFields: Record<string, string[]> = {};
      await write({ type: "header", format: "atlas-company-export", version: 1, organisationId, name: org.name, exportedAt: new Date().toISOString(), binaryEncoding: "PostgreSQL bytea hex (\\x…) in records; base64 in attachment entries" });
      for (const [table, scope] of scopes) {
        const fields = columns.filter(column => column.table === table);
        excludedFields[table] = fields.filter(column => protectedExportField(column.column)).map(column => column.column);
        const selected = fields.filter(column => !protectedExportField(column.column));
        const projection = selected.map(column => `r.${q(column.column)}`).join(",");
        await tx.$executeRawUnsafe(`DECLARE atlas_export_rows NO SCROLL CURSOR FOR SELECT row_to_json(export_row)::text AS row FROM (SELECT ${projection} FROM public.${q(table)} r WHERE ${scope}) export_row`, organisationId);
        counts[table] = 0;
        for (;;) {
          const rows = await tx.$queryRawUnsafe<{ row: string }[]>("FETCH FORWARD 250 FROM atlas_export_rows");
          if (!rows.length) break;
          for (const { row } of rows) {
            const data = redactExportSecrets(JSON.parse(row)) as Record<string, unknown>;
            await write({ type: "record", table, data });
            counts[table]++;
            if (typeof data.storageKey === "string") files.push({ key: data.storageKey, table, id: String(data.id), sha256: typeof data.sha256 === "string" ? data.sha256 : undefined });
          }
        }
        await tx.$executeRawUnsafe("CLOSE atlas_export_rows");
      }
      // External attachment storage is immutable by key. Missing content fails the entire export.
      for (const file of files) {
        const root = process.env.ATLAS_SERVICE_FILE_ROOT;
        if (!root || !path.isAbsolute(root) || !/^[a-f0-9-]{36}$/.test(file.key)) throw new Error("Attachment storage is unavailable. No partial export was created.");
        const content = await readFile(path.join(root, file.key));
        const sha256 = createHash("sha256").update(content).digest("hex");
        if (file.sha256 && file.sha256 !== sha256) throw new Error("Attachment integrity check failed. No partial export was created.");
        await write({ type: "attachment", table: file.table, id: file.id, storageKey: file.key, encoding: "base64", sha256, content: content.toString("base64") });
      }
      const excludedTables = [...new Set(columns.map(column => column.table))].filter(table => !scopes.has(table));
      await write({ type: "manifest", complete: true, counts, attachments: files.length, excludedTables, excludedFields, notes: ["Authentication and service credentials are excluded.", "External document URLs are preserved as references; remotely hosted files are not copied.", "This is a portable data export, not a database restore backup."] });
      await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.company.export.generated", entityType: "Organisation", entityId: organisationId, after: { tables: scopes.size, records: Object.values(counts).reduce((sum, count) => sum + count, 0), attachments: files.length } } });
      return org;
    }, { isolationLevel: "RepeatableRead", timeout: 120_000, maxWait: 10_000 });
    gzip.end();
    await finished;
    return { content: Buffer.concat(chunks), name: result.name };
  } catch (error) {
    gzip.destroy();
    throw error;
  }
}
