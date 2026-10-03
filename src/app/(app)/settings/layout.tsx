import Link from "next/link";
import { Settings2 } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { AppHeader } from "@/components/shell/app-header";
import { iconForNav } from "@/components/shell/nav-icon";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const links = [
    { label: "Users", href: "/settings?tab=users", show: can(session, "core.users.manage") },
    { label: "Management groups", href: "/settings/groups", show: can(session, "core.users.manage") },
    { label: "Roles & permissions", href: "/settings?tab=roles", show: can(session, "core.roles.manage") },
    { label: "Brand", href: "/settings?tab=brand", show: true },
    { label: "Workspace", href: "/settings?tab=workspace", show: true },
    { label: "Security", href: "/settings?tab=security", show: true },
    { label: "Audit", href: "/settings/audit", show: can(session, "core.audit.read") },
    { label: "My profile", href: "/profile", show: true },
  ].filter((link) => link.show);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AppHeader icon={Settings2} title="Company administration" eyebrow={session.organisationName}>
        {links.map((link) => {
          const Icon = iconForNav(link.label);
          return (
            <Link key={link.label} href={link.href} className="atlas-tab inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium">
              <Icon size={15} strokeWidth={1.8} />
              {link.label}
            </Link>
          );
        })}
      </AppHeader>
      {children}
    </div>
  );
}
