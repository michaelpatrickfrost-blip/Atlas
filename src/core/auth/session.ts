import {auditSessionCapabilities, parseAuditAccess} from "@/core/audit/access";
import {applyCompanyAccessRestrictions} from "@/core/permissions/company-access";
import {getRemoteSession} from "@/core/desktop/data-client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/core/db/client";
import { platformCapabilities } from "@/core/admin/access";
import { STANDARD_ROLES } from "@/core/permissions/capabilities";

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
  const membership = await loadMembership(token.organisationId, token.userId);
  if (!membership || !membership.active || membership.organisation.status !== "ACTIVE") return null;
  if (membership.organisation.kind === "INTERNAL" && !platformCapabilities(membership.user.platformAdmin).length) return null;

  if((token.authVersion??0)!==(membership.user.authVersion??0)||(token.sessionVersion??0)!==(membership.sessionVersion??0))return null;
  return sessionFromMembership(membership);
}

async function loadMembership(organisationId: string, userId: string) {
  return db.membership.findUnique({
    where: { organisationId_userId: { organisationId, userId } },
    include: { user: {include:{platformAdmin:true}}, organisation: true, roles: { include: { role: true } } },
  });
}

type LoadedMembership = NonNullable<Awaited<ReturnType<typeof loadMembership>>>;

function sessionFromMembership(membership: LoadedMembership): Session {
  const capabilities = new Set<string>(["core.profile.self"]);
  for (const roleOnMembership of membership.roles) {
    for (const capability of roleOnMembership.role.capabilities) {
      if (!capability.startsWith("atlas.")) capabilities.add(capability);
    }
  }

  for(const cap of membership.grantedCapabilities??[])if(!cap.startsWith("atlas."))capabilities.add(cap);
  for(const cap of membership.deniedCapabilities??[])capabilities.delete(cap);
  const staffCapabilities = platformCapabilities(membership.user.platformAdmin);
  for (const capability of auditSessionCapabilities(parseAuditAccess(membership.organisation.auditAccess), membership.userId)) capabilities.add(capability);
  const effective = applyCompanyAccessRestrictions(capabilities,membership.organisation.restrictedAccessAreas);
  // Michael's current policy: every active Atlas staff member has full permissions in
  // the explicitly selected company. Customer role/restriction policy is unchanged.
  if (staffCapabilities.length) {
    for (const capability of STANDARD_ROLES.find(role => role.key === "admin")?.capabilities ?? []) effective.add(capability);
    for (const capability of staffCapabilities) effective.add(capability);
  }
  return {
    userId: membership.userId,
    userName: membership.user.name,
    userEmail: membership.user.email,
    organisationId: membership.organisationId,
    organisationName: membership.organisation.name,
    membershipId: membership.id,
    capabilities: effective,
  };
}

/** A person's session without a browser request, for work done on their behalf (Automations, scheduled jobs).
 *  Same capabilities as when they sign in; null if they have left or the company is suspended. */
export async function sessionForUser(organisationId: string, userId: string): Promise<Session | null> {
  const membership = await loadMembership(organisationId, userId);
  if (!membership || !membership.active || membership.organisation.status !== "ACTIVE") return null;
  if (membership.organisation.kind === "INTERNAL" && !platformCapabilities(membership.user.platformAdmin).length) return null;
  return sessionFromMembership(membership);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
