"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ModuleNavItem } from "@/core/modules/types";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";
import { iconForNav } from "./nav-icon";

import { moduleNavHref, moduleNavActive } from "./module-nav-url";

type Entry = { kind: "item"; item: ModuleNavItem } | { kind: "group"; label: string; items: ModuleNavItem[] };

function toEntries(items: ModuleNavItem[]): Entry[] {
  const entries: Entry[] = [];
  const groupIndex = new Map<string, number>();
  for (const item of items) {
    if (!item.group) { entries.push({ kind: "item", item }); continue; }
    const at = groupIndex.get(item.group);
    if (at === undefined) { groupIndex.set(item.group, entries.length); entries.push({ kind: "group", label: item.group, items: [item] }); }
    else { const entry = entries[at]; if (entry.kind === "group") entry.items.push(item); }
  }
  return entries;
}

/** Secondary navigation for every module, docked under the app topbar. Tabs stay visible so
 *  clicks are never blocked by the page below. Related sections group under one dropdown. */
export function FloatingModuleNav({ title, items }: { title: string; items: ModuleNavItem[] }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const groupHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- flips a client-only mount flag once; required to avoid an SSR/client markup mismatch for the portal target.
  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => moduleNavActive(href, pathname, new URLSearchParams(search.toString()));
  const hrefFor = (item: ModuleNavItem) => moduleNavHref(item.href, new URLSearchParams(search.toString()), item.preserveQuery);
  const entries = toEntries(items);
  const peers = items.map((item) => item.href);
  const bestMatch = peers.filter((href) => isActive(href)).sort((a, b) => b.length - a.length)[0];

  function clearGroupHide() { if (groupHideTimer.current) { clearTimeout(groupHideTimer.current); groupHideTimer.current = null; } }
  function openGroupNow(label: string) { clearGroupHide(); setOpenGroup(label); }
  // A mouse pointer always enters (triggering openGroupNow) before it can click, so a plain
  // toggle on click would immediately re-close the group the hover just opened. Click keeps
  // it open; only a click outside, a mouse-leave, or picking an item closes it.
  function toggleGroup(label: string) {
    clearGroupHide();
    setOpenGroup(label);
  }
  function scheduleGroupHide() {
    clearGroupHide();
    groupHideTimer.current = setTimeout(() => setOpenGroup(null), 220);
  }

  const closeGroup = useCallback(() => setOpenGroup(null), []);
  useOnClickOutside(navRef, !!openGroup, closeGroup);

  useEffect(() => () => clearGroupHide(), []);

  useEffect(() => {
    if (!openGroup) return;
    const fit = () => {
      const menu = navRef.current?.querySelector<HTMLElement>('[role="menu"]:not([hidden])');
      if (!menu) return;
      menu.style.left = "0px";
      const bounds = menu.getBoundingClientRect();
      const shift = bounds.right > window.innerWidth - 8 ? window.innerWidth - 8 - bounds.right : bounds.left < 8 ? 8 - bounds.left : 0;
      menu.style.left = `${shift}px`;
    };
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [openGroup]);

  if (!items.length || !mounted) return null;
  const slot = document.getElementById("atlas-module-nav-slot");
  if (!slot) return null;

  return createPortal(
    <div ref={navRef}>
      <nav aria-label={`${title} navigation`} className="atlas-float-nav relative z-[62] border-b border-black/[0.06] px-4 py-2.5 sm:px-7 lg:px-9">
        <div className="flex flex-wrap items-center gap-1.5">
          {entries.map((entry) => {
            if (entry.kind === "item") {
              const Ico = iconForNav(entry.item.label);
              const active = entry.item.href === bestMatch;
              return (
                <Link key={entry.item.href} href={hrefFor(entry.item)} aria-current={active ? "page" : undefined}
                  className={`atlas-float-tab inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${active ? "atlas-float-tab-active" : ""}`}>
                  <Ico size={14} strokeWidth={1.8} />
                  {entry.item.label}
                </Link>
              );
            }
            const groupActive = entry.items.some((i) => i.href === bestMatch);
            const open = openGroup === entry.label;
            return (
              <div key={entry.label} className="relative" onKeyDown={event => {
                if (event.key === "Escape") { event.preventDefault(); clearGroupHide(); setOpenGroup(null); event.currentTarget.querySelector("button")?.focus(); }
                if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                  event.preventDefault(); clearGroupHide(); setOpenGroup(entry.label);
                  const group = event.currentTarget;
                  requestAnimationFrame(() => { const links = [...group.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]')]; const at = links.indexOf(document.activeElement as HTMLAnchorElement); const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : event.key === "ArrowUp" ? (at <= 0 ? links.length - 1 : at - 1) : (at + 1) % links.length; links[next]?.focus(); });
                }
              }} onMouseEnter={() => openGroupNow(entry.label)} onMouseLeave={scheduleGroupHide}>
                <button type="button" data-guardian-safe="menu" onClick={() => toggleGroup(entry.label)} aria-expanded={open} aria-haspopup="menu"
                  className={`atlas-float-tab inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${groupActive ? "atlas-float-tab-active" : ""}`}>
                  {entry.label}
                  <ChevronDown size={13} strokeWidth={2} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>
                <div role="menu" aria-label={entry.label} aria-hidden={!open} hidden={!open} className={`absolute left-0 top-full z-[63] w-52 pt-2 transition-[opacity,transform] duration-200 ease-out ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1.5 opacity-0"}`}>
                  <div className="atlas-float-dropdown rounded-2xl p-1.5">
                    {entry.items.map((item) => {
                      const Ico = iconForNav(item.label);
                      const active = item.href === bestMatch;
                      return (
                        <Link key={item.href} href={hrefFor(item)} role="menuitem" aria-current={active ? "page" : undefined}
                          onClick={() => setOpenGroup(null)}
                          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${active ? "atlas-float-dropdown-active" : "text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)]"}`}>
                          <Ico size={14} strokeWidth={1.8} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </div>,
    slot,
  );
}
