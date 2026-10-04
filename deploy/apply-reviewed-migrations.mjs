// Apply an explicit reviewed migration list on the central server. Does not switch the runtime.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import pg from "pg";

const root = process.argv[2];
const reviewed = [
  "20261003430000_finance_connections",
  "20261003520000_company_logo",
  "20261003530000_sales_projects_call_offs",
  "20261003630000_logistics_execution",
];
if (!root || !fs.existsSync(path.join(root, reviewed[0], "migration.sql"))) throw new Error("Expected the reviewed migration directory.");
const env = Object.fromEntries(fs.readFileSync("/etc/atlas-test/migration.env", "utf8").trim().split("\n").map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
const backup = "/var/backups/atlas-test/pre-logistics-20261003";
fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
execFileSync("/usr/bin/pg_dump", ["--dbname", env.DATABASE_URL, "--format=custom", "--file", path.join(backup, "database.dump")], { stdio: ["ignore", "ignore", "pipe"] });
fs.writeFileSync(path.join(backup, "previous-release.txt"), fs.realpathSync("/opt/atlas-test/current") + "\n", { mode: 0o600 });
execFileSync("/usr/bin/pg_restore", ["--list", path.join(backup, "database.dump")], { stdio: "ignore" });
const db = new pg.Client({ connectionString: env.DATABASE_URL });
await db.connect();
try {
  const applied = new Set((await db.query(`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`)).rows.map((row) => row.migration_name));
  const unexpected = reviewed.filter((name) => applied.has(name));
  if (unexpected.length) throw new Error("Already applied: " + unexpected.join(", "));
  for (const name of reviewed) {
    const sql = fs.readFileSync(path.join(root, name, "migration.sql"));
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");
    await db.query("BEGIN");
    try {
      await db.query(sql.toString());
      await db.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
         VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
        [crypto.randomUUID(), checksum, name],
      );
      await db.query("COMMIT");
      console.log("Applied " + name);
    } catch (error) {
      await db.query("ROLLBACK");
      throw new Error(name + " failed: " + (error instanceof Error ? error.message : "unknown"));
    }
  }
  console.log("Backup verified and reviewed migrations applied. Runtime was not switched.");
} finally {
  await db.end();
}
