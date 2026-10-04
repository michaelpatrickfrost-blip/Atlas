import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { AUTOMATION_CAPABILITIES } from "@/core/permissions/capabilities";

export async function listAutomations(session: Session) {
  assertCapability(session, AUTOMATION_CAPABILITIES.read);
  return db.automation.findMany({ where: { organisationId: session.organisationId }, orderBy: { updatedAt: "desc" } });
}

export async function getAutomation(session: Session, id: string) {
  assertCapability(session, AUTOMATION_CAPABILITIES.read);
  return db.automation.findFirst({ where: { id, organisationId: session.organisationId } });
}

export async function listRuns(session: Session, automationId: string, limit = 20) {
  assertCapability(session, AUTOMATION_CAPABILITIES.read);
  return db.automationRun.findMany({ where: { organisationId: session.organisationId, automationId }, orderBy: { startedAt: "desc" }, take: limit });
}

export async function recentEvents(session: Session, eventName: string, limit = 10) {
  assertCapability(session, AUTOMATION_CAPABILITIES.manage);
  return db.automationEvent.findMany({ where: { organisationId: session.organisationId, name: eventName }, orderBy: { occurredAt: "desc" }, take: limit });
}
