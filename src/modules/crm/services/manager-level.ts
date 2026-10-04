import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { crmPushAllowed, readManagerPolicy } from "@/core/permissions/manager-level";

export async function assertCrmPush(session: Session) {
  const org = await db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { managerPolicy: true } });
  if (!crmPushAllowed(readManagerPolicy(org.managerPolicy), session.capabilities)) {
    throw new Error("A sales manager pushes prospects and deals while the CRM manager level is on.");
  }
}

export async function crmManagerPolicy(organisationId: string) {
  const org = await db.organisation.findUniqueOrThrow({ where: { id: organisationId }, select: { managerPolicy: true } });
  return readManagerPolicy(org.managerPolicy);
}

export function canAssignCrmWork(session: Session) {
  return session.capabilities.has(SALES_CAPABILITIES.prospectAssign);
}
