import { Layers3 } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="atlas-empty-state flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl"><Layers3 size={20} strokeWidth={1.5} aria-hidden="true" /></span>
      <p className="atlas-serif text-[22px] leading-tight text-[var(--color-ink)]">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-[var(--color-ink-muted)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
