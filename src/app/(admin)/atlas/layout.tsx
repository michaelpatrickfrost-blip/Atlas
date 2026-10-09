import { notFound, redirect } from "next/navigation";
import { ADMIN_ROBOTS } from "@/core/auth/admin-address";
import { getSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { AdminShell } from "@/components/admin/shell";

export const metadata = { robots: ADMIN_ROBOTS, referrer: "no-referrer" as const };

export default async function AtlasAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) notFound();
  if (!can(session, ATLAS_CAPABILITIES.companies)) redirect("/home");
  assertCapability(session, ATLAS_CAPABILITIES.companies);
  return <AdminShell session={session}>{children}</AdminShell>;
}
