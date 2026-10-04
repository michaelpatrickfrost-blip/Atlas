// Enable Plan for one existing company administrator. Does not change other people.
import fs from "node:fs";
import pg from "pg";

const [slug, email] = process.argv.slice(2);
if (!slug || !email) throw new Error("Usage: enable-plan.mjs <company-slug> <existing-administrator-email>");
const env = Object.fromEntries(fs.readFileSync("/etc/atlas-test/migration.env", "utf8").trim().split("\n").map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
const capabilities = ["read", "create", "edit", "submit", "review", "approve", "lock", "scenario.create", "scenario.share", "metric.manage", "model.manage", "sensitive.read"].map((item) => `plan.${item}`);
const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const rows = (await client.query('SELECT m.id, m."organisationId", m."userId", m."grantedCapabilities", m."deniedCapabilities" FROM memberships m JOIN users u ON u.id = m."userId" JOIN organisations o ON o.id = m."organisationId" WHERE o.slug = $1 AND u.email = $2 AND m.active = true AND o.status = $3 FOR UPDATE OF m', [slug, email, "ACTIVE"])).rows;
  if (rows.length !== 1) throw new Error("Choose one existing active membership.");
  const membership = rows[0];
  const roles = (await client.query('SELECT r.capabilities FROM roles r JOIN roles_on_memberships rm ON rm."roleId" = r.id WHERE rm."membershipId" = $1', [membership.id])).rows.flatMap((row) => row.capabilities);
  if (!roles.includes("core.modules.manage") && !membership.grantedCapabilities.includes("core.modules.manage")) throw new Error("Intended user must already administer this company.");
  const grants = [...new Set([...membership.grantedCapabilities, ...capabilities.filter((item) => !membership.deniedCapabilities.includes(item))])];
  await client.query('UPDATE memberships SET "grantedCapabilities" = $1 WHERE id = $2', [grants, membership.id]);
  await client.query('INSERT INTO module_states (id, "organisationId", "moduleId", enabled, entitled, "updatedAt") VALUES ($1, $2, $3, true, true, now()) ON CONFLICT ("organisationId", "moduleId") DO UPDATE SET enabled = true, entitled = true, "updatedAt" = now()', [crypto.randomUUID(), membership.organisationId, "plan"]);
  await client.query('INSERT INTO audit_entries (id, "organisationId", "actorUserId", action, "entityType", "entityId", before, after) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [crypto.randomUUID(), membership.organisationId, membership.userId, "plan.enabled", "Membership", membership.id, JSON.stringify({ grantedCapabilities: membership.grantedCapabilities }), JSON.stringify({ moduleId: "plan" })]);
  await client.query("COMMIT");
  console.log("Plan activated only for the specified existing administrator.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
