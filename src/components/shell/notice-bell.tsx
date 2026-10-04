"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell } from "lucide-react";
import { clearNotice, clearNotices, loadNotices } from "@/app/(app)/notices/actions";
import type { Notice } from "@/app/(app)/notices/shape";

function Section({ title, items, pending, onOpen, onClear }: { title: string; items: Notice[]; pending: string | null; onOpen: () => void; onClear: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <section>
      <p className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{title}</p>
      {items.map((item) => {
        const openChat = item.conversationId ? () => { onOpen(); window.dispatchEvent(new CustomEvent("atlas:open-chat", { detail: { conversationId: item.conversationId } })); } : null;
        const body = (
          <>
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            {item.detail && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.detail}</p>}
          </>
        );
        return (
          <div key={item.id} className="flex items-start gap-2 px-3 py-2.5">
            {openChat ? (
              <button type="button" onClick={openChat} className="min-w-0 flex-1 rounded-xl px-1 py-0.5 text-left hover:bg-slate-50">{body}</button>
            ) : item.href ? (
              <Link href={item.href} onClick={onOpen} className="min-w-0 flex-1 rounded-xl px-1 py-0.5 hover:bg-slate-50">{body}</Link>
            ) : (
              <div className="min-w-0 flex-1 px-1 py-0.5">{body}</div>
            )}
            <button type="button" disabled={pending !== null} onClick={() => onClear(item.id)} className="mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40">Clear</button>
          </div>
        );
      })}
    </section>
  );
}

export function NoticeBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [place, setPlace] = useState({ top: 56, right: 12 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef<string | null>(null);

  async function refresh() {
    if (pendingRef.current) return;
    const next = await loadNotices();
    if (pendingRef.current) return;
    setItems(next);
    setError("");
  }

  useEffect(() => {
    let stop = false;
    const tick = () => {
      if (stop || document.visibilityState !== "visible") return;
      void refresh().catch(() => { if (!stop) setError("Notifications could not be loaded."); });
    };
    tick();
    const timer = setInterval(tick, 10000);
    window.addEventListener("focus", tick);
    return () => { stop = true; clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(352, window.innerWidth - 24);
      let right = window.innerWidth - rect.right;
      if (right < 12) right = 12;
      if (window.innerWidth - right - width < 12) right = Math.max(12, window.innerWidth - width - 12);
      setPlace({ top: rect.bottom + 8, right });
    }
    setOpen((value) => !value);
    if (!open) void refresh().catch(() => setError("Notifications could not be loaded."));
  }

  async function clear(id: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    pendingRef.current = id;
    setPending(id);
    setError("");
    const result = await clearNotice(id);
    if (result.error) {
      setItems(previous);
      setError(result.error);
    }
    pendingRef.current = null;
    setPending(null);
  }

  async function clearAll() {
    pendingRef.current = "all";
    setPending("all");
    setError("");
    const result = await clearNotices();
    if (result.error) setError(result.error);
    pendingRef.current = null;
    try {
      setItems(await loadNotices());
    } catch {
      setError("Notifications could not be loaded.");
    }
    setPending(null);
  }

  const count = items.length;
  const tagged = items.filter((item) => item.group === "Tagged");
  const assigned = items.filter((item) => item.group === "Assigned");
  const messages = items.filter((item) => item.group === "Messages");

  return (
    <>
      <button ref={buttonRef} type="button" aria-label="Notifications" aria-expanded={open} onClick={toggle} className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
        <Bell size={20} strokeWidth={1.7} />
        {count > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && createPortal(
        <>
      <button type="button" aria-label="Close notifications" className="fixed inset-0 z-[70] cursor-default bg-transparent" onClick={() => setOpen(false)} />
      <div role="dialog" aria-label="Notifications" style={{ top: place.top, right: place.right }} className="fixed z-[80] flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-1.5rem),22rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)]">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs text-[#6e6e73]">For you</p>
              <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
            </div>
            {count > 0 && <button type="button" disabled={pending !== null} onClick={() => void clearAll()} className="rounded-full bg-black/[0.05] px-3 py-1 text-xs font-medium text-[#1d1d1f] disabled:opacity-40">Clear all</button>}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto pb-2">
            {error && <p role="alert" className="px-4 pt-3 text-xs text-rose-600">{error}</p>}
            <Section title="Tagged" items={tagged} pending={pending} onOpen={() => setOpen(false)} onClear={(id) => void clear(id)} />
            <Section title="Assigned" items={assigned} pending={pending} onOpen={() => setOpen(false)} onClear={(id) => void clear(id)} />
            <Section title="Messages" items={messages} pending={pending} onOpen={() => setOpen(false)} onClear={(id) => void clear(id)} />
            {!count && !error && <p className="px-4 py-8 text-sm text-slate-500">Nothing tagged, assigned or waiting.</p>}
          </div>
        </div>
        </>,
        document.body,
      )}
    </>
  );
}
