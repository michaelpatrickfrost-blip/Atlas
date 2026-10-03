"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { createSessionCookie, clearSessionCookie } from "@/core/auth/session";

export type LoginResult = { error: string } | never;

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { include: { organisation: true } } },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  const membership = user.memberships[0];
  if (!membership) {
    return { error: "This account has no organisation to sign in to." };
  }

  await createSessionCookie({ userId: user.id, organisationId: membership.organisationId });
  redirect("/home");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
