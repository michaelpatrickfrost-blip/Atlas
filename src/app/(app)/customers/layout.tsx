import { Building2, Map, Users } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ActiveLink } from "@/components/shell/active-link";
import { AppHeader } from "@/components/shell/app-header";

export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  assertCapability(session, "customers.read");
  const links = [
    { href: "/customers", label: "Accounts", icon: Building2 },
    { href: "/customers/map", label: "Map", icon: Map },
  ];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AppHeader icon={Users} title="Customers" eyebrow="Relationships">
        {links.map((link) => (
          <ActiveLink key={link.href} href={link.href} className="atlas-tab inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium">
            <link.icon size={15} strokeWidth={1.8} />
            {link.label}
          </ActiveLink>
        ))}
      </AppHeader>
      {children}
    </div>
  );
}
