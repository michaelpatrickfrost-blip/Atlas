"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";

/** The Apps menu in the top bar. It replaces the permanent sidebar: the launcher
 *  opens over the page when asked for and closes once an app is chosen. */
export function AppMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, open, close);
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // The home screen already is the launcher.
  if (pathname === "/home") return null;
  return (
    <div ref={ref} className="shrink-0">
      <button type="button" data-guardian-safe="toggle" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="true" className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-[#1d1d1f] hover:bg-black/[0.05] ${open ? "bg-black/[0.05]" : ""}`}>
        <LayoutGrid size={15} strokeWidth={1.75} />
        <span className="hidden sm:inline">Apps</span>
      </button>
      {open && (
        <div onClick={close} className="fixed inset-x-3 top-[calc(var(--atlas-topbar)+4px)] z-[70] max-h-[calc(100vh-var(--atlas-topbar)-24px)] overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.28)] sm:inset-x-5 lg:right-auto lg:w-[880px]">
          {children}
        </div>
      )}
    </div>
  );
}
