"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { createSessionCookie, clearSessionCookie } from "@/core/auth/session";
import { platformCapabilities } from "@/core/admin/access";

export type LoginResult = { error: string } | never;

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findUnique({
    where: { email },
    include: { platformAdmin: true, memberships: { include: { organisation: true } } },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  const active = user.memberships.filter(m => m.active && m.organisation.status === "ACTIVE" && (m.organisation.kind !== "INTERNAL" || platformCapabilities(user.platformAdmin).length > 0));
  const membership = active.find(m => m.organisation.kind === "INTERNAL") ?? active[0];
  if (!membership) {
    return { error: "This account has no active workspace access. Contact your administrator." };
  }

  await db.membership.update({where:{id:membership.id,organisationId:membership.organisationId},data:{lastLoginAt:new Date()}});
  await createSessionCookie({ userId: user.id, organisationId: membership.organisationId });
  redirect("/home");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
