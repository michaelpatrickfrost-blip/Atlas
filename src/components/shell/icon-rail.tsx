import Link from "next/link";
import { LogOut } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { isModuleEnabled } from "@/core/modules/runtime";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { canOpenCompanyAdmin } from "@/app/(app)/settings/settings-menu";
import { logoutAction } from "@/core/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { AppDirectory } from "./app-directory";
import { RailNav, type RailLink } from "./rail-nav";

/** Desktop icon rail: the same permission-filtered utilities and app directory
 *  as before, presented as one quiet vertical strip beside the workspace. */
export async function IconRail({ session }: { session: Session }) {
  const links: RailLink[] = [
    { name: "Home", href: "/home" },
    ...(can(session, "analytics.dashboard.read") && (await isModuleEnabled(session, "analytics")) ? [{ name: "Dashboards" as const, href: "/analytics" }] : []),
    { name: "Reports", href: "/reports" },
    ...(can(session, "core.profile.self") ? [{ name: "My tasks" as const, href: "/profile#assigned" }] : []),
    ...(can(session, CORE_CAPABILITIES.chatRead) ? [{ name: "Messages" as const, href: "/chat" }] : []),
    { name: "Guides", href: "/guides" },
    { name: "Settings", href: canOpenCompanyAdmin(session) ? "/settings" : "/profile/settings" },
  ];
  return (
    <RailNav
      links={links}
      directory={<AppDirectory session={session} />}
      footer={<>
        <Link href="/profile" aria-label="My work" className="atlas-rail-item atlas-rail-avatar"><Avatar name={session.userName} size="sm" /><span className="atlas-rail-label"><span className="block truncate">{session.userName}</span><span className="block truncate text-[11px] font-normal text-[var(--color-ink-faint)]">{session.organisationName}</span></span></Link>
        <form action={logoutAction} className="w-full"><button type="submit" aria-label="Sign out" className="atlas-rail-item"><LogOut size={17} aria-hidden="true" /><span className="atlas-rail-label">Sign out</span></button></form>
      </>}
    />
  );
}
