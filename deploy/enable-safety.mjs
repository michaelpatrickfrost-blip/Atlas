// Explicit individual activation. Never upgrade shared roles or other profiles.
import fs from "node:fs";
import pg from "pg";

const [slug, email] = process.argv.slice(2);
if (!slug || !email) throw new Error("Usage: enable-safety.mjs <company-slug> <existing-administrator-email>");
const env = Object.fromEntries(fs.readFileSync("/etc/atlas-test/migration.env", "utf8").trim().split("\n").map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
const capabilities = [
  "safety.today.read", "safety.risk.read", "safety.risk.create", "safety.risk.approve",
  "safety.incident.report", "safety.incident.read", "safety.incident.investigate", "safety.sensitive_incident.read",
  "safety.riddor.review", "safety.riddor.manage",
  "safety.coshh.read", "safety.coshh.manage",
  "safety.permit.request", "safety.permit.issue", "safety.permit.authorise", "safety.permit.close",
  "safety.isolation.apply", "safety.isolation.verify", "safety.isolation.remove",
  "safety.audit.execute", "safety.audit.manage", "safety.inspection.execute", "safety.inspection.manage",
  "safety.action.read", "safety.action.manage", "safety.action.verify",
  "safety.hold.manage", "safety.equipment.read", "safety.statutory.manage",
  "safety.competence.read", "safety.competence.manage", "safety.health_surveillance.read",
  "safety.document.read", "safety.document.manage", "safety.report.read",
  "safety.profile.manage", "safety.change.manage",
];
const db = new pg.Client({ connectionString: env.DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN");
  const row = (await db.query(
    `SELECT m.id, m."organisationId", m."userId", m."grantedCapabilities", m."deniedCapabilities"
     FROM memberships m JOIN users u ON u.id = m."userId" JOIN organisations o ON o.id = m."organisationId"
     WHERE o.slug = $1 AND u.email = $2 AND m.active = true AND o.status = $3 FOR UPDATE OF m`,
    [slug, email, "ACTIVE"],
  )).rows;
  if (row.length !== 1) throw new Error("Choose one existing active membership.");
  const membership = row[0];
  const roles = (await db.query(
    `SELECT r.capabilities FROM roles r JOIN roles_on_memberships rm ON rm."roleId" = r.id WHERE rm."membershipId" = $1`,
    [membership.id],
  )).rows.flatMap((role) => role.capabilities);
  if (!roles.includes("core.modules.manage") && !membership.grantedCapabilities.includes("core.modules.manage")) {
    throw new Error("Intended user must already administer this company.");
  }
  const grants = [...new Set([...membership.grantedCapabilities, ...capabilities.filter((capability) => !membership.deniedCapabilities.includes(capability))])];
  await db.query(`UPDATE memberships SET "grantedCapabilities" = $1 WHERE id = $2`, [grants, membership.id]);
  for (const moduleId of ["people", "safety"]) {
    await db.query(
      `INSERT INTO module_states (id, "organisationId", "moduleId", enabled, entitled, "updatedAt")
       VALUES ($1, $2, $3, true, true, now())
       ON CONFLICT ("organisationId", "moduleId") DO UPDATE SET enabled = true, entitled = true, "updatedAt" = now()`,
      [crypto.randomUUID(), membership.organisationId, moduleId],
    );
  }
  await db.query(
    `INSERT INTO audit_entries (id, "organisationId", "actorUserId", action, "entityType", "entityId", before, after)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [crypto.randomUUID(), membership.organisationId, membership.userId, "safety.profile.enabled", "Membership", membership.id, JSON.stringify({ grantedCapabilities: membership.grantedCapabilities }), JSON.stringify({ grantedCapabilities: grants, moduleId: "safety" })],
  );
  await db.query("COMMIT");
  console.log("Safety activated for the specified administrator. People dependency entitled. Explicit denials preserved.");
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
