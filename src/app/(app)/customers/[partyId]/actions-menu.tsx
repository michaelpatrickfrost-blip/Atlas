"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";
import type { CustomerOverviewAction } from "@/core/modules/types";

/** Module-contributed record actions (View pipeline, Create case, ...) used to render
 *  as an ever-growing row of equal-weight pills. Collapsed into one menu so the header
 *  stays calm no matter how many modules contribute an action. */
export function HeaderActionsMenu({ actions }: { actions: CustomerOverviewAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, open, () => setOpen(false));

  if (actions.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-atlas-blue)] hover:text-[var(--color-atlas-blue)]"
      >
        Actions
        <ChevronDown size={14} strokeWidth={2} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-lg sm:left-auto sm:right-0">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
