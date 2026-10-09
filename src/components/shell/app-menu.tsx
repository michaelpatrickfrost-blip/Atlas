"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";

/** Route-keyed state prevents an open switcher following navigation or reopening on Back. */
export function AppMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/home") return null;
  return <WorkspaceAppMenu key={pathname}>{children}</WorkspaceAppMenu>;
}

function WorkspaceAppMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, open, close);
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div ref={ref} className="shrink-0">
      <button ref={triggerRef} type="button" aria-label="Apps" data-guardian-safe="toggle" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls={open ? panelId : undefined} className={`inline-flex h-11 items-center gap-2.5 rounded-full px-3.5 text-base font-medium text-[#1d1d1f] transition-colors hover:bg-black/[0.075] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:h-12 sm:px-5 sm:text-lg ${open ? "bg-[#ebebed]" : "bg-[#f3f3f4]"}`}>
        <LayoutGrid size={21} strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden sm:inline">Apps</span>
      </button>
      {open && (
        <div id={panelId} role="region" aria-label="Apps menu" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) close(); }} className="fixed inset-x-2 top-[calc(var(--atlas-topbar)+8px)] z-[70] max-h-[calc(100dvh-var(--atlas-topbar)-20px)] overflow-y-auto overscroll-contain rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.2)] sm:inset-x-4 sm:rounded-[28px] sm:p-7 lg:p-8 xl:p-10">
          {children}
        </div>
      )}
    </div>
  );
}
