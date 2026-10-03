"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AtlasLogo } from "@/components/shell/atlas-logo";
import type { ReactNode } from "react";

export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(true)} aria-label="Open navigation" className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#1d1d1f] shadow-sm backdrop-blur-xl">
        <Menu size={18} />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Navigation" className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-[#0b1020]/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="atlas-drawer-enter atlas-sidebar relative flex h-full w-72 max-w-[84vw] flex-col px-3.5 py-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-2">
              <Link href="/home" aria-label="Atlas home" onClick={() => setOpen(false)}>
                <AtlasLogo className="h-6 w-auto" />
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Close navigation" className="flex size-8 items-center justify-center rounded-xl text-slate-500 hover:bg-black/5"><X size={16} /></button>
            </div>
            <div onClick={() => setOpen(false)} className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
