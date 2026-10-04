"use client";

import { AppWindow } from "lucide-react";
import type { ReactNode } from "react";
import { Refresh } from "./refresh";

/** The frame around every signed-in page: one top bar, then the page. There is no
 *  permanent sidebar; apps open from the home screen or the top bar's Apps menu. */
export function ShellChrome({ topbar, children }: { topbar: ReactNode; children: ReactNode }) {
  return (
    <>
      <Refresh />
      <div id="atlas-content-column" className="atlas-shell flex h-screen min-w-0 flex-col overflow-hidden">
        {topbar}
        <div id="atlas-module-nav-slot" className="relative z-[62] shrink-0" />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-7 lg:px-9">
          <div className="atlas-page-enter">{children}</div>
        </main>
      </div>
    </>
  );
}

export function NewWindow() {
  return (
    <button
      type="button"
      onClick={() => window.open(window.location.href, "_blank", "width=1280,height=840")}
      aria-label="Open this page in a new window"
      title="Open this page in a new window"
      className="hidden size-9 items-center justify-center rounded-full text-[#6e6e73] hover:bg-black/[0.05] hover:text-[#1d1d1f] sm:inline-flex"
    >
      <AppWindow size={15} />
    </button>
  );
}
