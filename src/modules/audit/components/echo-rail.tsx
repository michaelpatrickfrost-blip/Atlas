"use client";

import { useEffect, useState, useTransition } from "react";
import { AudioLines, X } from "lucide-react";
import { loadEcho, postEchoNote, type EchoThread } from "@/modules/audit/services/actions";

export function EchoRail({
  entityType,
  entityId,
  title,
  canWrite,
  startOpen = false,
}: {
  entityType: string;
  entityId: string;
  title: string;
  canWrite: boolean;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [thread, setThread] = useState<EchoThread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [tagged, setTagged] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    start(async () => {
      try {
        const next = await loadEcho(entityType, entityId);
        if (!cancelled) setThread(next);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Echo could not be opened.");
      }
    });
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, entityType, entityId, start]);

  function togglePerson(id: string) {
    setTagged((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= 8 ? current : [...current, id]);
  }

  function send() {
    setError(null);
    start(async () => {
      try {
        await postEchoNote(entityType, entityId, body, tagged);
        setBody("");
        setTagged([]);
        setPicking(false);
        setThread(await loadEcho(entityType, entityId));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The note could not be saved.");
      }
    });
  }

  const people = thread?.people.filter((person) => person.name.toLowerCase().includes(query.trim().toLowerCase())) ?? [];
  const selected = thread?.people.filter((person) => tagged.includes(person.id)) ?? [];

  return (
    <>
      <button type="button" onClick={() => { setError(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
        <AudioLines size={15} />
        Echo
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/25" onClick={() => setOpen(false)}>
          <aside role="dialog" aria-label={`Echo for ${title}`} className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-600">Echo</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{thread?.title ?? title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Leave a note on this record and tag the people who should look at it.</p>
              </div>
              <button type="button" aria-label="Close Echo" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"><X size={16} /></button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              {!thread && !error && <p className="text-sm text-slate-400">Opening Echo…</p>}
              {thread && !thread.items.length && <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm leading-relaxed text-slate-500">Nothing here yet. Write a note and tag someone to point them at {thread.title}.</p>}
              {thread?.items.map((item) => item.kind === "change" ? (
                <p key={item.id} className="px-2 text-center text-xs leading-relaxed text-slate-400">
                  {item.actor} · {item.label}
                  {item.detail ? ` · ${item.detail}` : ""}
                  <span className="mt-1 block">{new Date(item.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </p>
              ) : (
                <article key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">{item.author}</p>
                    <time className="text-[11px] text-slate-400">{new Date(item.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.body}</p>
                  {item.mentions.length > 0 && <p className="mt-2 text-xs text-blue-700">Pointed at {item.mentions.join(", ")}</p>}
                </article>
              ))}
            </div>
            {(thread?.canWrite ?? canWrite) && (
              <form className="space-y-3 border-t border-slate-100 px-5 py-4" onSubmit={(event) => { event.preventDefault(); send(); }}>
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selected.map((person) => (
                      <button type="button" key={person.id} onClick={() => togglePerson(person.id)} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{person.name} ×</button>
                    ))}
                  </div>
                )}
                <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={2000} placeholder="Write a note for the people who need to see this." className="w-full resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
                {picking && (
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-100">
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a person" className="w-full border-b border-slate-100 px-3 py-2 text-sm" />
                    {people.slice(0, 12).map((person) => (
                      <button type="button" key={person.id} onClick={() => togglePerson(person.id)} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">{person.name}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setPicking((value) => !value)} className="text-sm text-blue-700">Tag someone</button>
                  <button type="submit" disabled={pending || !body.trim()} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? "Saving…" : "Post note"}</button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
