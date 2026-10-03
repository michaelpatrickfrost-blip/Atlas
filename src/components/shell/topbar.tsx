import { logoutAction } from "@/core/auth/actions";
import { CommandPalette } from "@/components/shell/command-palette";
import { MobileNav } from "@/components/shell/mobile-nav";
import { NavLinks } from "@/components/shell/nav-links";
import { Avatar } from "@/components/ui/avatar";
import { getNavigableModules } from "@/core/modules/runtime";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";

export async function Topbar({ session }: { session: Session }) {
  const modules = await getNavigableModules(session);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
      <MobileNav>
        <NavLinks modules={modules} showCustomers={can(session, CUSTOMER_CAPABILITIES.read)} />
      </MobileNav>
      <div className="min-w-0 flex-1">
        <CommandPalette />
      </div>
      <form action={logoutAction} className="flex shrink-0 items-center gap-3">
        <Avatar name={session.userName} />
        <button type="submit" className="hidden text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] sm:inline">
          Sign out
        </button>
      </form>
    </header>
  );
}
