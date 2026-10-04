import {auditSessionCapabilities, parseAuditAccess} from "@/core/audit/access";
import {applyCompanyAccessRestrictions} from "@/core/permissions/company-access";
import {getRemoteSession} from "@/core/desktop/data-client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/core/db/client";

const SESSION_COOKIE = "atlas_session";
function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) throw new Error("Set a SESSION_SECRET with at least 32 characters.");
  return secret ?? "atlas-dev-secret-change-me";
}

export type SessionToken = {
  userId: string;
  organisationId: string;
  authVersion?: number;
  sessionVersion?: number;
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
  const membership = await db.membership.findUniqueOrThrow({where:{organisationId_userId:{organisationId:token.organisationId,userId:token.userId}},include:{user:true}});
  const jwtToken = jwt.sign({...token,authVersion:membership.user.authVersion,sessionVersion:membership.sessionVersion}, sessionSecret(), { expiresIn: "30d" });
  const store = await cookies();
  store.set(SESSION_COOKIE, jwtToken, {
    httpOnly: true,
    sameSite: "lax",
    // Private test service binds exclusively to loopback and is reached through SSH.
    secure: process.env.NODE_ENV === "production" && process.env.ATLAS_PRIVATE_TUNNEL !== "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  if(process.env.ATLAS_RUNTIME==="desktop")return getRemoteSession();
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let token: SessionToken;
  try {
    token = jwt.verify(raw, sessionSecret(), {algorithms:["HS256"]}) as SessionToken;
  } catch {
    return null;
  }

  if(typeof token.userId!=="string" || typeof token.organisationId!=="string") return null;
  const membership = await db.membership.findUnique({
    where: { organisationId_userId: { organisationId: token.organisationId, userId: token.userId } },
    include: {
      user: {include:{platformAdmin:true}},
      organisation: true,
      roles: { include: { role: true } },
    },
  });
  if (!membership || !membership.active || membership.organisation.status !== "ACTIVE") return null;

  if((token.authVersion??0)!==(membership.user.authVersion??0)||(token.sessionVersion??0)!==(membership.sessionVersion??0))return null;
  const capabilities = new Set<string>(["core.profile.self"]);
  for (const roleOnMembership of membership.roles) {
    for (const capability of roleOnMembership.role.capabilities) {
      if (!capability.startsWith("atlas.")) capabilities.add(capability);
    }
  }

  for(const cap of membership.grantedCapabilities??[])if(!cap.startsWith("atlas."))capabilities.add(cap);
  for(const cap of membership.deniedCapabilities??[])capabilities.delete(cap);
  if (membership.user.platformAdmin) capabilities.add("atlas.companies.manage");
  for (const capability of auditSessionCapabilities(parseAuditAccess(membership.organisation.auditAccess), membership.userId)) capabilities.add(capability);
  return {
    userId: membership.userId,
    userName: membership.user.name,
    userEmail: membership.user.email,
    organisationId: membership.organisationId,
    organisationName: membership.organisation.name,
    membershipId: membership.id,
    capabilities:applyCompanyAccessRestrictions(capabilities,membership.organisation.restrictedAccessAreas),
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
