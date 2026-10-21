"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, FileSpreadsheet, House, ListTodo, MessageSquare, Plus, Search, Settings } from "lucide-react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";
import { useTaskCount } from "./task-notifications";

const ICONS = { Home: House, Dashboards: ChartNoAxesCombined, Reports: FileSpreadsheet, "My tasks": ListTodo, Messages: MessageSquare, Guides: BookOpen, Settings };
export type RailLink = { name: keyof typeof ICONS; href: string };

/** Icon rail that slides open over the workspace on hover or keyboard focus,
 *  revealing labels, and glides closed again when the pointer leaves. */
export function RailNav({ links, directory, footer }: { links: RailLink[]; directory: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  const tasks = useTaskCount();
  const [messages, setMessages] = useState(0);
  useEffect(() => {
    const update = (event: Event) => setMessages((event as CustomEvent<number>).detail);
    window.addEventListener("atlas:chat-unread", update);
    return () => window.removeEventListener("atlas:chat-unread", update);
  }, []);
  const isActive = (name: RailLink["name"], href: string) => pathname === href.split("#")[0]
    || (name === "Guides" && pathname.startsWith("/guides/"))
    || (name === "Settings" && (pathname.startsWith("/settings/") || pathname === "/profile/email"));
  return (
    <div className="atlas-rail">
      <div className="atlas-rail-sheet">
        <RailApps key={pathname}>{directory}</RailApps>
        <button type="button" aria-label="Search" className="atlas-rail-item" onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-search"))}>
          <Search size={18} aria-hidden="true" /><span className="atlas-rail-label">Search<kbd>⌘K</kbd></span>
        </button>
        <span className="atlas-rail-gap" aria-hidden="true" />
        <nav aria-label="Workspace utilities" className="atlas-rail-links">
          {links.map(({ name, href }) => {
            const Icon = ICONS[name];
            const count = name === "My tasks" ? tasks ?? 0 : name === "Messages" ? messages : 0;
            const event = name === "My tasks" ? "atlas:open-tasks" : name === "Messages" ? "atlas:open-chat" : null;
            return (
              <Link key={href} href={href} prefetch={false} aria-label={name}
                aria-current={isActive(name, href) ? "page" : undefined}
                onClick={event ? (e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); window.dispatchEvent(new CustomEvent(event)); } } : undefined}
                className="atlas-rail-item">
                <Icon size={18} aria-hidden="true" />
                <span className="atlas-rail-label">{name}</span>
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

/** The black “+” opens every app the person can use, grouped by area. */
function RailApps({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, open, close);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
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
