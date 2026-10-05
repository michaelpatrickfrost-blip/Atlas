"use client";
import { useEffect, useState, type ReactNode } from "react";

/** Sections of the product record. Every panel stays mounted, so an unsaved bill is not lost by looking at another tab. */
export function ProductTabs({ tabs }: { tabs: Array<{ id: string; label: string; count?: number | string; content: ReactNode }> }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  useEffect(() => {
    const wanted = window.location.hash.replace("#", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is only known in the browser.
    if (tabs.some((tab) => tab.id === wanted)) setActive(wanted);
  }, [tabs]);
  const choose = (id: string) => { setActive(id); window.history.replaceState(null, "", `#${id}`); };
  return <div>
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-slate-200">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} onClick={() => choose(tab.id)} className={`-mb-px rounded-t-xl border border-b-0 px-4 py-2.5 text-sm font-medium ${active === tab.id ? "border-slate-200 bg-white text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{tab.label}{tab.count != null && tab.count !== "" && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">{tab.count}</span>}</button>)}</div>
    {tabs.map((tab) => <div key={tab.id} role="tabpanel" hidden={active !== tab.id} className="space-y-5 pt-5">{tab.content}</div>)}
  </div>;
}
