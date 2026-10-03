import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] border border-white/80 bg-white/80 px-6 py-16 text-center shadow-[var(--shadow-atlas)]">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-atlas-blue-soft)] text-[var(--color-atlas-blue)]"><Sparkles size={20} /></span>
      <p className="text-base font-semibold text-[var(--color-ink)]">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
