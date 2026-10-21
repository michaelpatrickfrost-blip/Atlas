import { z } from "zod";
import { db } from "@/core/db/client";
import { sessionForUser, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../permissions";
import { fieldRuntimeAuthorityInTransaction, nativeFieldMutationSessionInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import type { Prisma } from "@/generated/prisma/client";

const companyId = z.string().min(1).max(100);
type AuthoringCapability = typeof STUDIO_CAPABILITIES.read | typeof STUDIO_CAPABILITIES.edit | typeof STUDIO_CAPABILITIES.publish;
function denied(): never { throw new Error("FORBIDDEN: open Studio for an authorised business before continuing."); }
async function currentStudioSession(actor: Session, tx: Prisma.TransactionClient, target?: string) {
  const { session: fresh } = await nativeFieldMutationSessionInTransaction(actor, tx);
  if (!fresh.capabilities.has(ATLAS_CAPABILITIES.staff)) {
    if (target) denied();
    return fresh;
  }
  assertCapability(fresh, ATLAS_CAPABILITIES.companies);
  const organisationId = companyId.parse(target);
  const company = await tx.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null }, select: { id: true } });
  if (!company) denied();
  const selected = await sessionForUser(organisationId, fresh.userId, tx);
  if (!selected) denied();
  assertCapability(selected, ATLAS_CAPABILITIES.staff);
  assertCapability(selected, ATLAS_CAPABILITIES.companies);
  return selected;
}

/** Explicit Studio entry follows the existing audited Atlas support-affiliation
 * policy. It does not replace the browser's login or create customer permissions.
 * Subsequent reads/saves never create memberships: they resolve this genuine,
 * current selected-business session and independently enforce owner access. */
export async function openStudioBusiness(actor: Session, target: string) {
  return db.$transaction(async tx => {
    const { session: fresh } = await nativeFieldMutationSessionInTransaction(actor, tx);
    assertCapability(fresh, ATLAS_CAPABILITIES.staff);
    assertCapability(fresh, ATLAS_CAPABILITIES.companies);
    assertCapability(fresh, STUDIO_CAPABILITIES.edit);
    const organisationId = companyId.parse(target);
    const company = await tx.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null }, select: { id: true } });
    if (!company) denied();
    await tx.membership.upsert({ where: { organisationId_userId: { organisationId, userId: fresh.userId } },
      create: { organisationId, userId: fresh.userId }, update: { active: true } });
    await writeAudit({ organisationId, actorUserId: fresh.userId, action: "atlas.studio.opened", entityType: "Organisation", entityId: organisationId,
      after: { fromOrganisationId: fresh.organisationId } }, tx);
    return { organisationId };
  }, { isolationLevel: "Serializable" });
}

/** Trusted server callback only. The browser can select a business only through
 * independently refreshed Atlas staff authority. Draft data grants no access. */
export async function withStudioAuthoringAuthority<T>(actor: Session, capability: AuthoringCapability,
  target: string | undefined, operation: (authority: FieldRuntimeAuthority) => Promise<T>): Promise<T> {
  return db.$transaction(async tx => {
    const selected = await currentStudioSession(actor, tx, target);
    assertCapability(selected, capability);
    const authority = await fieldRuntimeAuthorityInTransaction(selected, tx);
    assertCapability(authority.session, capability);
    if (!await tx.moduleState.findFirst({ where: { organisationId: authority.session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("Studio is disabled in this business.");
    return operation(authority);
  }, { isolationLevel: "Serializable" });
}
