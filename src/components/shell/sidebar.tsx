import Link from "next/link";
import { LayoutGrid, Settings } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";

export async function Sidebar({ session }: { session: Session }) {
  const modules = await getNavigableModules(session);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-4">
      <div className="px-2 pb-6">
        <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">Atlas</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        <NavLink href="/home" label="Home" />

        {modules.length > 0 && <div className="my-3 h-px bg-[var(--color-border)]" />}

        {modules.map((module) => (
          <NavLink key={module.id} href={module.rootPath} label={module.name} />
        ))}

        <div className="my-3 h-px bg-[var(--color-border)]" />
        <NavLink href="/apps" label="Apps" icon={LayoutGrid} />
        <NavLink href="/settings" label="Settings" icon={Settings} />
      </nav>
    </aside>
  );
}

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon?: typeof LayoutGrid }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-[var(--radius-atlas-sm)] px-2.5 py-1.5 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-atlas-blue)]"
    >
      {Icon && <Icon size={16} />}
      {label}
    </Link>
  );
}
