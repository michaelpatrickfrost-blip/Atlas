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
    <div ref={ref} className="relative shrink-0">
      <button ref={triggerRef} type="button" aria-label="Apps" data-guardian-safe="toggle" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls={open ? panelId : undefined} className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#1d1d1f] transition-colors hover:bg-black/[0.075] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-3.5 ${open ? "bg-[#ebebed]" : "bg-[#f3f3f4]"}`}>
        <LayoutGrid size={18} strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden sm:inline">Apps</span>
      </button>
      {open && (
        <div id={panelId} role="region" aria-label="Apps menu" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) close(); }} className="fixed left-3 top-[calc(var(--atlas-topbar)+8px)] z-[70] w-[900px] max-w-[calc(100vw-24px)] rounded-2xl border border-black/[0.08] bg-white p-3 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] sm:absolute sm:left-0 sm:top-[calc(100%+8px)] sm:max-w-[calc(100vw-112px)] sm:p-4">
          {children}
        </div>
      )}
    </div>
  );
}
