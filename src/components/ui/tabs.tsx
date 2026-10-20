"use client";
import { ViewTransition, startTransition, useEffect, useState, type ReactNode } from "react";

/** Tabbed sections of a record. Every panel stays mounted, so unsaved input survives a tab change. The tab is kept in the address. */
export function Tabs({ tabs }: { tabs: Array<{ id: string; label: string; count?: number | string; content: ReactNode }> }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  useEffect(() => {
    const wanted = window.location.hash.replace("#", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is only known in the browser.
    if (tabs.some((tab) => tab.id === wanted)) setActive(wanted);
  }, [tabs]);
  const choose = (id: string) => { startTransition(() => setActive(id)); window.history.replaceState(null, "", `#${id}`); };
  const panels = <div>{tabs.map((tab) => <div key={tab.id} role="tabpanel" hidden={active !== tab.id} className="atlas-record-panel space-y-5 pt-5">{tab.content}</div>)}</div>;
  return <div>
    <div role="tablist" className="atlas-record-tabs">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} onClick={() => choose(tab.id)} className="atlas-record-tab">{tab.label}{tab.count != null && tab.count !== "" && <span className="ml-1.5 text-xs font-normal text-[var(--color-ink-faint)] tabular-nums">{tab.count}</span>}</button>)}</div>
    {ViewTransition ? <ViewTransition default="none" update="atlas-tab-content">{panels}</ViewTransition> : panels}
  </div>;
}
