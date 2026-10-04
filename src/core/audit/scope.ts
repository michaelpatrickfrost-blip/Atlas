import type { Session } from "@/core/auth/session";
import { ECHO_TARGETS } from "./systems";

/** Echo notes are readable on records the person can already open, and on
 *  notes that mention them. The Audit app must be enabled for the company. */
export function echoNoteScope(session: Session) {
  const types = ECHO_TARGETS.filter((target) => session.capabilities.has(target.capability)).map((target) => target.type);
  return {
    organisationId: session.organisationId,
    organisation: { moduleStates: { some: { moduleId: "audit", enabled: true, entitled: true } } },
    OR: [
      ...(types.length ? [{ entityType: { in: types } }] : []),
      { mentions: { some: { organisationId: session.organisationId, userId: session.userId } } },
    ],
  };
}

export function echoMentionScope(session: Session) {
  return {
    organisationId: session.organisationId,
    userId: session.userId,
    organisation: { moduleStates: { some: { moduleId: "audit", enabled: true, entitled: true } } },
  };
}
