import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import { captureCustomerFieldMigrationPrincipal, openFieldMigrationSupportContext, resolveFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";

/** Only the driver's freshly provisioned business user and explicit Test support affiliation. */
export async function checkFieldPrincipal(customerUserId: string, staff: Session, organisationId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [organisationId, otherOrganisationId])
    assert(await db.organisation.findFirst({ where: { id, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  const user = await db.user.findFirstOrThrow({ where: { id: customerUserId, email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } });
  const customer = await sessionForUser(organisationId, user.id); assert(customer);
  const original = await db.membership.findUniqueOrThrow({ where: { id: customer.membershipId, organisationId, userId: user.id } });
  const principal = await captureCustomerFieldMigrationPrincipal(customer);
  assert.equal((await resolveFieldMigrationPrincipal(principal)).membershipId, customer.membershipId);
  await assert.rejects(() => captureCustomerFieldMigrationPrincipal({ ...customer, membershipId: staff.membershipId }), /FORBIDDEN/);
  await assert.rejects(() => resolveFieldMigrationPrincipal({ ...principal, organisationId: otherOrganisationId }), /FORBIDDEN/);
  await assert.rejects(() => resolveFieldMigrationPrincipal({ ...principal, capabilities: ["studio.definition.publish"] }));
  try {
    await db.membership.update({ where: { id: original.id, organisationId }, data: { sessionVersion: { increment: 1 } } });
    await assert.rejects(() => resolveFieldMigrationPrincipal(principal), /FORBIDDEN/);
    const renewed = await captureCustomerFieldMigrationPrincipal(customer);
    await db.membership.update({ where: { id: original.id, organisationId }, data: { deniedCapabilities: [...original.deniedCapabilities, "studio.definition.publish"] } });
    await assert.rejects(() => resolveFieldMigrationPrincipal(renewed), /FORBIDDEN/);
    await db.membership.update({ where: { id: original.id, organisationId }, data: { deniedCapabilities: original.deniedCapabilities, active: false } });
    await assert.rejects(() => resolveFieldMigrationPrincipal(renewed), /FORBIDDEN/);
  } finally {
    // This account was created by this run, never the existing QA person. Keep the
    // incremented session version so its prior synthetic cookie stays revoked.
    await db.membership.update({ where: { id: original.id, organisationId }, data: { active: true, deniedCapabilities: original.deniedCapabilities } });
  }
  await assert.rejects(() => openFieldMigrationSupportContext(customer, organisationId), /FORBIDDEN/);
  await assert.rejects(() => openFieldMigrationSupportContext({ ...staff, organisationId }, organisationId), /FORBIDDEN/);
  const targetMember = await db.membership.findFirstOrThrow({ where: { organisationId, userId: staff.userId, active: true } });
  assert.notEqual(targetMember.id, staff.membershipId);
  const opened = await openFieldMigrationSupportContext(staff, organisationId);
  assert.equal(opened.session.membershipId, targetMember.id);
  assert.equal((await resolveFieldMigrationPrincipal(opened.principal)).membershipId, targetMember.id);
  assert.equal(await db.auditEntry.count({ where: { id: opened.principal.authority === "staff_support" ? opened.principal.auditId : "impossible",
    organisationId, actorUserId: staff.userId, action: "studio.field.migration.support_opened", entityId: targetMember.id } }), 1);
  await assert.rejects(() => resolveFieldMigrationPrincipal({ ...opened.principal, auditId: "unrelated-audit" }), /FORBIDDEN/);
  await assert.rejects(() => resolveFieldMigrationPrincipal({ ...opened.principal, sessionVersion: opened.principal.sessionVersion + 1 }), /FORBIDDEN/);
  await db.membership.update({ where: { id: targetMember.id, organisationId }, data: { active: false, sessionVersion: { increment: 1 } } });
  await assert.rejects(() => resolveFieldMigrationPrincipal(opened.principal), /FORBIDDEN/);
  console.log("PASS real refreshed customer/support principals: no metadata impersonation or forged audit, revoked session/permission/membership denied; explicit support audit and existing affiliation only, QA original identity/grants unchanged.");
}
