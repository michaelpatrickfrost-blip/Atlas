import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { AdminShell } from "@/components/admin/shell";

export default async function AtlasAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/atlas/login");
  if (!can(session, ATLAS_CAPABILITIES.companies)) redirect("/home");
  assertCapability(session, ATLAS_CAPABILITIES.companies);
  return <AdminShell session={session}>{children}</AdminShell>;
}
