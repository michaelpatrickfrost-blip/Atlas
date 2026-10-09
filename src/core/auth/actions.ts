"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { signInAddress } from "./address-context";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { createSessionCookie, clearSessionCookie } from "@/core/auth/session";
import { platformCapabilities } from "@/core/admin/access";
import { ADMIN_LOGIN_PATH } from "./admin-address";
import { allowAuthenticationAttempt, AUTH_LIMIT_ERROR } from "./attempt-limit";

export type LoginResult = { error: string } | never;

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const requestHeaders = await headers();
  let address;
  try { address = signInAddress(requestHeaders.get("x-atlas-request-path") ?? "/login", { portal: String(formData.get("portal") ?? ""), companySlug: String(formData.get("companySlug") ?? "").trim() }); }
  catch { return { error: "Use the sign-in address provided for your account." }; }
  if (!email || email.length > 254 || !password || password.length > 128 || Buffer.byteLength(password, "utf8") > 72) return { error: "Incorrect email or password." };
  try {
    if (!await allowAuthenticationAttempt(requestHeaders, email, "login")) return { error: AUTH_LIMIT_ERROR };
  } catch { return { error: "Sign-in is temporarily unavailable. Try again shortly." }; }

  const user = await db.user.findUnique({
    where: { email },
    include: { platformAdmin: true, memberships: { include: { organisation: true } } },
  });

  // A missing account still performs bcrypt work; the response does not disclose it.
  const validPassword = await bcrypt.compare(password, user?.passwordHash ?? "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW");
  if (!user || !validPassword) {
    return { error: "Incorrect email or password." };
  }

  const { portal, companySlug } = address;
  const staff = platformCapabilities(user.platformAdmin).length > 0;
  const active = user.memberships.filter(m => m.active && m.organisation.status === "ACTIVE" && !m.organisation.archivedAt);
  let membership;
  if (portal === "atlas") {
    if (!staff) return { error: "This account does not have Atlas administration access." };
    membership = active.find(m => m.organisation.kind === "INTERNAL");
  } else if (companySlug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(companySlug) || staff) return { error: "Use the sign-in address provided for your account." };
    membership = active.find(m => m.organisation.kind === "CUSTOMER" && m.organisation.slug === companySlug);
  } else if (!portal) {
    // Existing single-company links remain usable; a multi-company identity must
    // choose a company's dedicated address rather than silently choosing active[0].
    if (staff) return { error: "Use the sign-in address provided for your account." };
    else {
      const companies = active.filter(m => m.organisation.kind === "CUSTOMER");
      if (companies.length > 1) return { error: "Use your company's sign-in address to choose the correct business." };
      membership = companies[0];
    }
  }
  if (!membership) return { error: "This account has no active access to this workspace. Contact your administrator." };

  await db.membership.update({where:{id:membership.id,organisationId:membership.organisationId},data:{lastLoginAt:new Date()}});
  await createSessionCookie({ userId: user.id, organisationId: membership.organisationId });
  redirect(staff ? "/atlas" : "/home");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

/** Atlas console sign-out returns to its own staff login. */
export async function logoutAdminAction() {
  await clearSessionCookie();
  redirect(ADMIN_LOGIN_PATH);
}
