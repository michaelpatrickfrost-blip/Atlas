import { logoutAction } from "@/core/auth/actions";
import { CommandPalette } from "@/components/shell/command-palette";
import type { Session } from "@/core/auth/session";

export function Topbar({ session }: { session: Session }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
      <CommandPalette />
      <form action={logoutAction} className="flex items-center gap-3">
        <span className="text-sm text-[var(--color-ink-muted)]">{session.userName}</span>
        <button type="submit" className="text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
          Sign out
        </button>
      </form>
    </header>
  );
}
