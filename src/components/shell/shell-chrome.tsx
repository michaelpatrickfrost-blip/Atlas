"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AppWindow, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Refresh } from "./refresh";

const ChromeContext = createContext({ collapsed: false, toggleSidebar: () => {} });

/** Display preference for this Mac only. It is not a business record. */
const SIDEBAR_KEY = "atlas-sidebar";

export function ShellChrome({ sidebar, topbar, children }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "hidden");
  }, []);
  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_KEY, next ? "hidden" : "open");
      return next;
    });
  }
  return (
    <ChromeContext.Provider value={{ collapsed, toggleSidebar }}>
      <Refresh />
      <div className="atlas-shell flex h-screen min-w-0">
        <div inert={collapsed || undefined} className={`hidden h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out md:block ${collapsed ? "pointer-events-none md:w-0" : "md:w-[248px]"}`}>{sidebar}</div>
        <div id="atlas-content-column" className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {topbar}
          <div id="atlas-module-nav-slot" className="relative z-[62] shrink-0" />
          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-7 lg:px-9">
            <div className="atlas-page-enter">{children}</div>
          </main>
        </div>
      </div>
    </ChromeContext.Provider>
  );
}

export function WindowControls() {
  const { collapsed, toggleSidebar } = useContext(ChromeContext);
  return (
    <>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-pressed={collapsed}
        aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
        title={collapsed ? "Show sidebar" : "Hide sidebar"}
        className="hidden size-9 items-center justify-center rounded-full text-[#6e6e73] hover:bg-white/80 hover:text-[#1d1d1f] md:inline-flex"
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
      <button
        type="button"
        onClick={() => window.open(window.location.href, "_blank", "width=1280,height=840")}
        aria-label="Open this page in a new window"
        title="Open this page in a new window"
        className="inline-flex size-9 items-center justify-center rounded-full text-[#6e6e73] hover:bg-white/80 hover:text-[#1d1d1f]"
      >
        <AppWindow size={16} />
      </button>
    </>
  );
}
