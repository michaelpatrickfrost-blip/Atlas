import { Building2, Map, ShoppingBag, Tags, Users } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { ActiveLink } from "@/components/shell/active-link";
import { AppHeader } from "@/components/shell/app-header";

export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  assertCapability(session, "customers.read");
  const links = [
    { href: "/customers", label: "Accounts", icon: Building2 },
    { href: "/customers/map", label: "Account networks", icon: Map },
    ...(can(session, "core.pricing.read") ? [{ href: "/pricing", label: "Pricing", icon: Tags }] : []),
    ...(can(session, "sales.order.read") ? [{ href: "/sales/orders", label: "Sales orders", icon: ShoppingBag }] : []),
  ];
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
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
