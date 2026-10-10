import Link from "next/link";
import {
  UserRound,
  LockKeyhole,
  ShieldCheck,
  Mail,
  ArrowUpRight,
} from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import {
  changeOwnPassword,
  signOutOtherSessions,
} from "@/core/auth/security-actions";
import { saveProfile } from "../actions";
const card = "rounded-[26px] border border-blue-100/60 bg-white p-6 shadow-sm";
const input =
  "mt-2 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-normal";
export default async function PersonalSettings() {
  const session = await requireSession();
  const membership = await db.membership.findFirstOrThrow({
    where: {
      id: session.membershipId,
      organisationId: session.organisationId,
      userId: session.userId,
    },
    select: { roles: { select: { role: { select: { name: true } } } } },
  });
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-[28px] border border-white bg-white/80 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-blue-600">
          Your account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Your profile. Your space.
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Manage your details and sign-in security for{" "}
          {session.organisationName}.
        </p>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className="flex items-center gap-3 text-lg font-semibold">
            <UserRound size={22} className="text-blue-500" />
            Personal details
          </h2>
          <ActionForm action={saveProfile} className="mt-5 space-y-4">
            <label className="block text-xs font-semibold">
              Your name
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={session.userName}
                autoComplete="name"
                className={input}
              />
            </label>
            <div>
              <p className="text-xs font-semibold">Sign-in email</p>
              <p className="mt-2 break-all text-sm text-slate-500">
                {session.userEmail}
              </p>
            </div>
            <button className="min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white">
              Save personal details
            </button>
          </ActionForm>
          <Link
            href="/profile#contact"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs text-blue-600"
          >
            Your work, contact and employee details
            <ArrowUpRight size={15} />
          </Link>
        </section>
        <section className={card}>
          <h2 className="flex items-center gap-3 text-lg font-semibold">
            <ShieldCheck size={22} className="text-blue-500" />
            Your company access
          </h2>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Your company administrator manages access profiles. You can update
            your own details here.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {membership.roles.map(({ role }, index) => (
              <span
                key={index}
                className="rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-700"
              >
                {role.name}
              </span>
            ))}
            {!membership.roles.length && (
              <p className="text-xs text-slate-500">
                No assigned access profiles.
              </p>
            )}
          </div>
          <Link
            href="/profile#account"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs text-blue-600"
          >
            View your workspace access
            <ArrowUpRight size={15} />
          </Link>
        </section>
        <section className={`${card} lg:col-span-2`}>
          <h2 className="flex items-center gap-3 text-lg font-semibold">
            <LockKeyhole size={22} className="text-blue-500" />
            Password & sessions
          </h2>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Confirm your current password to change it. Other devices sign out;
            this device stays signed in.
          </p>
          <ActionForm
            action={changeOwnPassword}
            className="mt-5 grid gap-4 md:grid-cols-3"
          >
            {[
              ["currentPassword", "Current password"],
              ["password", "New password"],
              ["confirmPassword", "Confirm new password"],
            ].map(([name, label]) => (
              <label key={name} className="text-xs font-semibold">
                {label}
                <input
                  type="password"
                  name={name}
                  required
                  minLength={name === "currentPassword" ? undefined : 12}
                  maxLength={128}
                  autoComplete={
                    name === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                  className={input}
                />
              </label>
            ))}
            <button className="min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white md:col-span-3 md:justify-self-start">
              Change password
            </button>
          </ActionForm>
          <ActionForm
            action={signOutOtherSessions}
            className="mt-5 border-t border-blue-50 pt-5"
          >
            <button className="min-h-11 rounded-xl border border-blue-100 px-4 text-xs font-semibold text-blue-700">
              Sign out other company devices
            </button>
          </ActionForm>
        </section>
        {can(session, "core.email.personal") && (
          <section className={`${card} lg:col-span-2`}>
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <Mail size={22} className="text-blue-500" />
              Your email accounts
            </h2>
            <p className="mt-3 text-xs text-slate-500">
              Connect and manage your personal mailboxes.
            </p>
            <Link
              href="/profile/email"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs text-blue-600"
            >
              Manage your mailboxes
              <ArrowUpRight size={15} />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
