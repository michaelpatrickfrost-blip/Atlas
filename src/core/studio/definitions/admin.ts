import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { assertCapability } from "@/core/permissions/check";
/** Portal-only target selection; customer roles never authorise another tenant. */
export async function adminStudioContext(session: Session, organisationId: string): Promise<Session> {
  assertCapability(session, ATLAS_CAPABILITIES.staff);
  assertCapability(session, ATLAS_CAPABILITIES.companies);
  if (!organisationId || organisationId.length > 100) throw new Error("Choose a company for Studio setup.");
  const company = await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null }, select: { id: true, name: true } });
  if (!company) throw new Error("This company is unavailable for Studio setup.");
  // Metadata-only context: preserve staff identity and its independently resolved
  // capabilities. Do not use this helper to impersonate customers or query records.
  return { ...session, organisationId: company.id, organisationName: company.name };
}
export async function studioActionContext(session: Session, target?: string): Promise<Session> {
  if (session.capabilities.has(ATLAS_CAPABILITIES.staff)) return adminStudioContext(session,target ?? "");
  if (target) throw new Error("FORBIDDEN: customer Studio cannot select another company.");
  return session;
}
