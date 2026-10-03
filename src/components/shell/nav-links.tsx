import Link from "next/link";
import { Home as HomeIcon, LayoutGrid, Settings } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { IconChip } from "@/components/ui/icon-chip";
import { accentColorForModule } from "@/core/shared/module-colors";

/** Shared nav markup used by both the desktop sidebar and the mobile drawer —
 *  one source of truth so the two never drift apart. */
export function NavLinks({ modules }: { modules: ModuleManifest[] }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
      <NavLink href="/home" label="Home" icon={<HomeIcon size={16} className="shrink-0" />} />

      {modules.length > 0 && <div className="my-3 h-px shrink-0 bg-[var(--color-border)]" />}

      {modules.map((module) => (
        <NavLink
          key={module.id}
          href={module.rootPath}
          label={module.name}
          icon={<IconChip icon={module.icon} color={accentColorForModule(module.id)} size="sm" />}
        />
      ))}

      <div className="my-3 h-px shrink-0 bg-[var(--color-border)]" />
      <NavLink href="/apps" label="Apps" icon={<LayoutGrid size={16} className="shrink-0" />} />
      <NavLink href="/settings" label="Settings" icon={<Settings size={16} className="shrink-0" />} />
    </nav>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-2.5 rounded-[var(--radius-atlas-sm)] px-2 py-1.5 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-atlas-blue)]"
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
