"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, FileSpreadsheet, House, ListTodo, MessageSquare, PanelLeftClose, Plus, Search, Settings } from "lucide-react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";
import { useTaskCount } from "./task-notifications";

const ICONS = { Home: House, Dashboards: ChartNoAxesCombined, Reports: FileSpreadsheet, "My tasks": ListTodo, Messages: MessageSquare, Guides: BookOpen, Settings };
export type RailLink = { name: keyof typeof ICONS; href: string };
const STORAGE_KEY = "atlas.rail";

function readPinned(): boolean {
  try { return window.localStorage.getItem(STORAGE_KEY) === "pinned"; } catch { return false; }
}
function writePinned(pinned: boolean) {
  try { window.localStorage.setItem(STORAGE_KEY, pinned ? "pinned" : "hidden"); } catch { /* per-viewer convenience only */ }
}

/** Hidden rail. It glides in from the left edge on hover or keyboard focus and
 *  slides away again; the top-bar toggle (or ⌘.) pins it open beside the work. */
export function RailNav({ links, directory, footer }: { links: RailLink[]; directory: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  const tasks = useTaskCount();
  const [messages, setMessages] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [peek, setPeek] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const hold = useRef(false); // true while the Apps popup is open, so the rail stays uncovered

  useEffect(() => {
    const update = (event: Event) => setMessages((event as CustomEvent<number>).detail);
    window.addEventListener("atlas:chat-unread", update);
    return () => window.removeEventListener("atlas:chat-unread", update);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the preference is only known in the browser.
    setPinned(readPinned());
  }, []);
  useEffect(() => {
    document.documentElement.dataset.rail = pinned ? "pinned" : "hidden";
    window.dispatchEvent(new CustomEvent("atlas:rail-state", { detail: pinned }));
    return () => { delete document.documentElement.dataset.rail; };
  }, [pinned]);
  useEffect(() => {
    const toggle = () => setPinned((current) => { writePinned(!current); return !current; });
    const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key === ".") { event.preventDefault(); toggle(); } };
    window.addEventListener("atlas:toggle-rail", toggle);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("atlas:toggle-rail", toggle); window.removeEventListener("keydown", onKey); };
  }, []);

  const open = useCallback(() => { if (leaveTimer.current) window.clearTimeout(leaveTimer.current); setPeek(true); }, []);
  const scheduleClose = useCallback(() => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => { if (!hold.current) setPeek(false); }, 260);
  }, []);
  const onAppsChange = useCallback((isOpen: boolean) => { hold.current = isOpen; if (isOpen) open(); else scheduleClose(); }, [open, scheduleClose]);
  useEffect(() => {
    hold.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- slide away once you have arrived somewhere.
    setPeek(false);
  }, [pathname]);

  const isActive = (name: RailLink["name"], href: string) => pathname === href.split("#")[0]
    || (name === "Guides" && pathname.startsWith("/guides/"))
    || (name === "Settings" && (pathname.startsWith("/settings/") || pathname === "/profile/email"));

  return (
    <div className="atlas-rail" data-state={pinned ? "pinned" : peek ? "peek" : "hidden"} onMouseEnter={open} onMouseLeave={scheduleClose} onFocusCapture={open} onBlurCapture={scheduleClose}>
      <button type="button" aria-label="Show navigation" className="atlas-rail-handle" onClick={() => setPeek(true)} onFocus={open}>
        <span aria-hidden="true" />
      </button>
      <div className="atlas-rail-sheet">
        <div className="atlas-rail-head">
          <RailApps key={pathname} onOpenChange={onAppsChange}>{directory}</RailApps>
          <button type="button" aria-label={pinned ? "Unpin navigation" : "Pin navigation open"} title={pinned ? "Unpin (⌘.)" : "Keep open (⌘.)"} aria-pressed={pinned} className="atlas-rail-pin" onClick={() => setPinned((current) => { writePinned(!current); return !current; })}>
            <PanelLeftClose size={16} aria-hidden="true" />
          </button>
        </div>
        <button type="button" aria-label="Search" className="atlas-rail-item" onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-search"))}>
          <Search size={18} aria-hidden="true" /><span className="atlas-rail-label">Search<kbd>⌘K</kbd></span>
        </button>
        <span className="atlas-rail-gap" aria-hidden="true" />
        <nav aria-label="Workspace utilities" className="atlas-rail-links">
          {links.map(({ name, href }, index) => {
            const Icon = ICONS[name];
            const count = name === "My tasks" ? tasks ?? 0 : name === "Messages" ? messages : 0;
            const event = name === "My tasks" ? "atlas:open-tasks" : name === "Messages" ? "atlas:open-chat" : null;
            return (
              <Link key={href} href={href} prefetch={false} aria-label={name} style={{ "--i": index } as React.CSSProperties}
                aria-current={isActive(name, href) ? "page" : undefined}
                onClick={event ? (e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); window.dispatchEvent(new CustomEvent(event)); } } : undefined}
                className="atlas-rail-item">
                <Icon size={18} aria-hidden="true" />
                <span className="atlas-rail-label">{name}{count > 0 && <span className="atlas-rail-count">{Math.min(99, count)}</span>}</span>
                {count > 0 && <span className="atlas-rail-dot" aria-label={`${count} new`} />}
              </Link>
            );
          })}
        </nav>
        <div className="atlas-rail-footer">{footer}</div>
      </div>
    </div>
  );
}

/** Top-bar control that pins or hides the rail; mirrors the rail's pinned state. */
export function RailToggle() {
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const update = (event: Event) => setPinned(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("atlas:rail-state", update);
    return () => window.removeEventListener("atlas:rail-state", update);
  }, []);
  return (
    <button type="button" aria-label="Toggle navigation" title="Navigation (⌘.)" aria-expanded={pinned} data-guardian-safe="toggle" className="atlas-top-icon atlas-rail-toggle hidden size-9 items-center justify-center rounded-lg lg:inline-flex" onClick={() => window.dispatchEvent(new CustomEvent("atlas:toggle-rail"))}>
      <span className="atlas-rail-toggle-glyph" aria-hidden="true"><i /><i /><i /></span>
    </button>
  );
}

/** The black “+” opens every app the person can use, grouped by area. */
function RailApps({ children, onOpenChange }: { children: ReactNode; onOpenChange: (open: boolean) => void }) {
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    setOpenState((current) => { const value = typeof next === "function" ? next(current) : next; if (value !== current) onOpenChange(value); return value; });
  }, [onOpenChange]);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), [setOpen]);
  useOnClickOutside(ref, open, close);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);
  return (
    <div ref={ref} className="atlas-rail-apps" data-open={open || undefined}>
      <button ref={triggerRef} type="button" aria-label="Apps" data-guardian-safe="toggle" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen((v) => !v)} className="atlas-rail-item atlas-rail-new-row">
        <span className="atlas-rail-new"><Plus size={17} strokeWidth={2} aria-hidden="true" /></span>
        <span className="atlas-rail-label">All apps</span>
      </button>
      <div id={panelId} role="region" aria-label="Apps menu" hidden={!open} inert={!open} aria-hidden={!open}
        onClick={(event) => { if ((event.target as HTMLElement).closest("a")) close(); }}
        className="atlas-menu-motion atlas-apps-popup atlas-rail-popup">
        {children}
      </div>
    </div>
  );
}
