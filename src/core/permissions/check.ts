import type { Session } from "@/core/auth/session";

export function can(session: Session, capability: string): boolean {
  return session.capabilities.has(capability);
}

export function canAny(session: Session, capabilities: string[]): boolean {
  return capabilities.some((capability) => session.capabilities.has(capability));
}

/** Throws if the session lacks the capability. Use at the top of server actions/route handlers. */
export function assertCapability(session: Session, capability: string): void {
  if (!can(session, capability)) {
    throw new Error(`FORBIDDEN: missing capability "${capability}"`);
  }
}
