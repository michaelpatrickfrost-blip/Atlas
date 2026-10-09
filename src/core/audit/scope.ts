import type { Session } from "@/core/auth/session";
import { ECHO_TARGETS } from "./systems";

/** True when this session holds the independent Atlas staff grant. */
function isAtlasStaff(session: Session): boolean {
  return session.capabilities.has("atlas.staff.manage");
}

/** Echo notes are readable on records the person can already open, and on
 *  notes that mention them. The Audit app must be enabled for the company. */
export function echoNoteScope(session: Session) {
  const types = ECHO_TARGETS.filter((target) => session.capabilities.has(target.capability)).map((target) => target.type);
  return {
    organisationId: session.organisationId,
    ...(isAtlasStaff(session) ? {} : { organisation: { moduleStates: { some: { moduleId: "audit", enabled: true, entitled: true } } } }),
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
    ...(isAtlasStaff(session) ? {} : { organisation: { moduleStates: { some: { moduleId: "audit", enabled: true, entitled: true } } } }),
  };
}
