"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";

/** Client-side drawer shell. Takes already-rendered nav markup as `children`
 *  (built server-side in Topbar) rather than raw module data — passing React
 *  elements across the server/client boundary works; passing component
 *  references (icons) inside plain objects does not. */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-atlas-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Navigation" className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="atlas-drawer-enter relative flex h-full w-64 max-w-[80vw] flex-col bg-[#101d37] px-3 py-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-6">
              <span className="text-[15px] font-semibold tracking-tight text-white">Atlas</span>
              <button onClick={() => setOpen(false)} aria-label="Close navigation" className="flex size-7 items-center justify-center rounded-[var(--radius-atlas-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]">
                <X size={16} />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
