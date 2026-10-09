"use client";

import { AppWindow } from "lucide-react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Refresh } from "./refresh";

/** Home has a utility rail; module workspaces retain their existing app menus. */
export function ShellChrome({ topbar, homeNavigation, children }: { topbar: ReactNode; homeNavigation: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/home" || pathname === "/reports" || pathname === "/chat" || pathname === "/analytics";
  return (
    <>
      <Refresh />
      <div id="atlas-content-column" className={`atlas-shell flex h-dvh min-w-0 flex-col overflow-hidden ${home ? "atlas-home-shell" : ""}`}>
        {topbar}
        <div id="atlas-module-nav-slot" className="relative z-[62] shrink-0" />
        {home && <aside className="shrink-0 px-3 pb-2 lg:hidden">{homeNavigation}</aside>}
        <div className="flex min-h-0 min-w-0 flex-1">
        {home && <aside className="hidden w-[166px] shrink-0 pb-5 pl-5 pr-2 lg:block">{homeNavigation}</aside>}
        <main className={`min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${home ? "px-3 pb-6 sm:px-5 lg:pl-4 lg:pr-6" : "px-4 py-6 sm:px-7 sm:py-7 lg:px-9"}`}>
          <div className="atlas-page-enter">{children}</div>
        </main>
        </div>
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
