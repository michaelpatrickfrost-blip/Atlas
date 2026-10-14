import { PageMotion } from "@/components/shell/page-motion";
import type { Metadata } from "next";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";

export const metadata: Metadata = { title: "Atlas Studio", robots: { index: false, follow: false } };
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireSession();
  assertCapability(actor, STUDIO_CAPABILITIES.read);
  return <main className="atlas-studio-surface min-h-dvh bg-slate-50 text-[var(--color-ink)]"><PageMotion>{children}</PageMotion></main>;
}
