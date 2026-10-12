import type { Metadata } from "next";
import { getSession } from "@/core/auth/session";
import { redirect } from "next/navigation";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";

export const metadata: Metadata = { title: "Atlas Studio", robots: { index: false, follow: false } };
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await getSession();
  if (!actor) redirect("/login");
  assertCapability(actor, STUDIO_CAPABILITIES.read);
  return <main className="min-h-dvh bg-slate-50 text-[var(--color-ink)]">{children}</main>;
}
