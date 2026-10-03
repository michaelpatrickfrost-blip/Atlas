import { Boxes, Package, ShoppingBag, Tags } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { ActiveLink } from "@/components/shell/active-link";
import { AppHeader } from "@/components/shell/app-header";
import { getEnabledModuleIds } from "@/core/modules/runtime";

export default async function CatalogueLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  assertCapability(session, "core.products.read");
  const enabled = await getEnabledModuleIds(session.organisationId);
  const links = [
    { label: "Catalogue", href: "/products", icon: Package },
    ...(can(session, "core.pricing.read") ? [{ label: "Pricing", href: "/pricing", icon: Tags }] : []),
    ...(enabled.has("stock") && can(session, "stock.read") ? [{ label: "Stock & availability", href: "/stock", icon: Boxes }] : []),
    ...(can(session, "sales.order.read") ? [{ label: "Sales orders", href: "/sales/orders", icon: ShoppingBag }] : []),
  ];
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AppHeader icon={Package} title="Products" eyebrow="Catalogue">
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
