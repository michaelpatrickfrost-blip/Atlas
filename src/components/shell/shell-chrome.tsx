"use client";

import { AppWindow } from "lucide-react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Refresh } from "./refresh";
import { PageMotion } from "./page-motion";
import { appAppearance } from "./app-appearance";

/** Macro-style frame: a quiet icon rail beside one bordered workspace panel.
 *  Home-area utilities also show as a strip on phones and tablets. */
export function ShellChrome({ rail, topbar, homeNavigation, children }: { rail: ReactNode; topbar: ReactNode; homeNavigation: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/home" || pathname.startsWith('/guides') || pathname === "/reports" || pathname === "/chat" || (pathname === "/analytics" || pathname.startsWith("/settings") || pathname.startsWith("/profile/settings") || pathname === "/profile/email");
  return (
    <>
      <Refresh />
      <div className="atlas-shell flex h-dvh min-w-0 overflow-hidden">
        <div className="hidden lg:contents">{rail}</div>
        <div className="atlas-frame flex min-w-0 flex-1 flex-col lg:p-2">
          <div id="atlas-content-column" style={appAppearance(pathname.split("/")[1] || "home")} className={`atlas-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${home ? "atlas-home-shell" : ""}`}>
            {topbar}
            <div id="atlas-module-nav-slot" className="relative z-[62] shrink-0" />
            {home && <aside className="shrink-0 px-3 pb-2 pt-2 lg:hidden">{homeNavigation}</aside>}
            <main className={`min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${home ? "px-4 pb-8 pt-2 sm:px-7 lg:px-10" : "px-4 py-6 sm:px-7 sm:py-7 lg:px-10"}`}>
              <PageMotion>{children}</PageMotion>
            </main>
          </div>
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
      className="atlas-top-icon hidden size-9 items-center justify-center rounded-lg sm:inline-flex"
    >
      <AppWindow size={15} />
    </button>
  );
}
