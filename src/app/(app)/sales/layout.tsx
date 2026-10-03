import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { getModuleNavigation } from "@/core/modules/runtime";
import { salesManifest } from "@/modules/sales/manifest";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const navItems = getModuleNavigation(salesManifest, session);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-border)] pb-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[var(--radius-atlas-sm)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
