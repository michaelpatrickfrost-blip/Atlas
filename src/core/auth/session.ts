import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/core/db/client";

const SESSION_COOKIE = "atlas_session";
const SECRET = process.env.SESSION_SECRET ?? "atlas-dev-secret-change-me";

export type SessionToken = {
  userId: string;
  organisationId: string;
};

/** Current request's session, resolved to membership + role capabilities. Null when signed out. */
export type Session = {
  userId: string;
  userName: string;
  userEmail: string;
  organisationId: string;
  organisationName: string;
  membershipId: string;
  capabilities: Set<string>;
};

export async function createSessionCookie(token: SessionToken) {
  const jwtToken = jwt.sign(token, SECRET, { expiresIn: "30d" });
  const store = await cookies();
  store.set(SESSION_COOKIE, jwtToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let token: SessionToken;
  try {
    token = jwt.verify(raw, SECRET) as SessionToken;
  } catch {
    return null;
  }

  const membership = await db.membership.findUnique({
    where: { organisationId_userId: { organisationId: token.organisationId, userId: token.userId } },
    include: {
      user: true,
      organisation: true,
      roles: { include: { role: true } },
    },
  });
  if (!membership) return null;

  const capabilities = new Set<string>();
  for (const roleOnMembership of membership.roles) {
    for (const capability of roleOnMembership.role.capabilities) {
      capabilities.add(capability);
    }
  }

  return {
    userId: membership.userId,
    userName: membership.user.name,
    userEmail: membership.user.email,
    organisationId: membership.organisationId,
    organisationName: membership.organisation.name,
    membershipId: membership.id,
    capabilities,
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
