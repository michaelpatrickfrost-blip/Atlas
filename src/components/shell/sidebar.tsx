import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";
import { NavLinks } from "@/components/shell/nav-links";
import { Avatar } from "@/components/ui/avatar";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";

/** Desktop sidebar. Hidden below `md`; the mobile drawer (`MobileNav`) in the
 *  topbar renders the same `NavLinks` for small screens instead of duplicating
 *  markup that could drift out of sync. */
export async function Sidebar({ session }: { session: Session }) {
  const modules = await getNavigableModules(session);

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-4 md:flex">
      <div className="flex items-center gap-2 px-2 pb-6">
        <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">Atlas</span>
      </div>

      <NavLinks modules={modules} showCustomers={can(session, CUSTOMER_CAPABILITIES.read)} />

      <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-[var(--color-border)] px-2 pt-3">
        <Avatar name={session.userName} size="sm" />
        <span className="truncate text-sm text-[var(--color-ink-muted)]">{session.userName}</span>
      </div>
    </aside>
  );
}
