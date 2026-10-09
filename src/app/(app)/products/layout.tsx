import { Package } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ActiveLink } from "@/components/shell/active-link";
import { AppHeader } from "@/components/shell/app-header";
import { ConsoleReturn } from "@/modules/manufacturing/components/console-return";

export default async function CatalogueLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  assertCapability(session, "core.products.read");
  const links = [
    { label: "Catalogue", href: "/products", icon: Package },
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
      <ConsoleReturn />{children}
    </div>
  );
}
