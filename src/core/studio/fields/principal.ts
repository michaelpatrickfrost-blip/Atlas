import { z } from "zod";
import { db } from "@/core/db/client";
import { sessionForUser, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { STUDIO_CAPABILITIES } from "../permissions";

const identity = {
  organisationId: z.string().min(1).max(100), userId: z.string().min(1).max(100),
  membershipId: z.string().min(1).max(100),
  authVersion: z.number().int().nonnegative(), sessionVersion: z.number().int().nonnegative(),
};
const principalSchema = z.discriminatedUnion("authority", [
  z.strictObject({ ...identity, authority: z.literal("customer") }),
  z.strictObject({ ...identity, authority: z.literal("staff_support"), auditId: z.string().min(1).max(100) }),
]);
export type FieldMigrationPrincipal = z.infer<typeof principalSchema>;
const SUPPORT_ACTION = "studio.field.migration.support_opened";
function denied(): never { throw new Error("FORBIDDEN: current company access is required for field migration data."); }
function assertStaff(session: Session) {
  assertCapability(session, ATLAS_CAPABILITIES.staff);
  assertCapability(session, ATLAS_CAPABILITIES.companies);
}

async function current(organisationId: string, userId: string) {
  const session = await sessionForUser(organisationId, userId);
  if (!session) denied();
  const membership = await db.membership.findFirst({
    where: { id: session.membershipId, organisationId, userId, active: true,
      organisation: { kind: "CUSTOMER", status: "ACTIVE", archivedAt: null } },
    select: { id: true, sessionVersion: true, user: { select: { authVersion: true } } },
  });
  if (!membership) denied();
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  return { session, stamp: { organisationId, userId, membershipId: membership.id,
    authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion } };
}

/** Called only with the authenticated company session, never client-provided identity. */
export async function captureCustomerFieldMigrationPrincipal(session: Session): Promise<FieldMigrationPrincipal> {
  const fresh = await current(session.organisationId, session.userId);
  if (fresh.session.membershipId !== session.membershipId || fresh.session.capabilities.has(ATLAS_CAPABILITIES.staff)) denied();
  return { ...fresh.stamp, authority: "customer" };
}

/** Explicit support operation. Existing affiliation is required; it never creates one or grants roles. */
export async function openFieldMigrationSupportContext(session: Session, organisationId: string) {
  assertStaff(session);
  // Refresh platform access as well as target membership. A metadata-only target
  // context cannot pass this membership-identity check.
  const staff = await sessionForUser(session.organisationId, session.userId);
  if (!staff || staff.membershipId !== session.membershipId) denied();
  assertStaff(staff);
  const fresh = await current(z.string().min(1).max(100).parse(organisationId), staff.userId);
  assertStaff(fresh.session);
  const audit = await db.auditEntry.create({ data: {
    organisationId: fresh.session.organisationId, actorUserId: staff.userId,
    action: SUPPORT_ACTION, entityType: "Membership", entityId: fresh.stamp.membershipId,
    after: { ...fresh.stamp, fromOrganisationId: staff.organisationId },
  }, select: { id: true } });
  const principal: FieldMigrationPrincipal = { ...fresh.stamp, authority: "staff_support", auditId: audit.id };
  return { session: fresh.session, principal };
}

/** Resolve only server-stored job identity. This is not a client identity/impersonation endpoint. */
export async function resolveFieldMigrationPrincipal(input: unknown): Promise<Session> {
  const principal = principalSchema.parse(input);
  const fresh = await current(principal.organisationId, principal.userId);
  if (fresh.stamp.membershipId !== principal.membershipId || fresh.stamp.authVersion !== principal.authVersion
    || fresh.stamp.sessionVersion !== principal.sessionVersion) denied();
  if (principal.authority === "customer") {
    if (fresh.session.capabilities.has(ATLAS_CAPABILITIES.staff)) denied();
  } else {
    assertStaff(fresh.session);
    const audit = await db.auditEntry.findFirst({ where: {
      id: principal.auditId, organisationId: principal.organisationId, actorUserId: principal.userId,
      action: SUPPORT_ACTION, entityType: "Membership", entityId: principal.membershipId,
    }, select: { after: true } });
    const recorded = z.strictObject({ ...identity, fromOrganisationId: z.string().min(1).max(100) }).safeParse(audit?.after);
    if (!recorded.success) denied();
    for (const key of Object.keys(identity) as Array<keyof typeof identity>) if (recorded.data[key] !== principal[key]) denied();
  }
  // Native owner/private-queue and current/written field policy checks are still
  // mandatory for each row. A refreshed principal grants no record access itself.
  return fresh.session;
}
