"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Calendar, CheckSquare, MessageCircle, Paperclip, Search, Send, StickyNote, UserPlus, X } from "lucide-react";
import type { chatSnapshot, searchChatRecords, searchChatPeople } from "./actions";

type Snapshot = Awaited<ReturnType<typeof chatSnapshot>>;
type LinkHit = Awaited<ReturnType<typeof searchChatRecords>>[number];
type PersonHit = Awaited<ReturnType<typeof searchChatPeople>>[number];

async function chatCall<T>(op: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, ...payload }) });
  const result = await response.json() as { value?: T; error?: string };
  if (!response.ok || result.error) throw new Error(result.error || "Chat could not be reached.");
  return result.value as T;
}
type Mode = "message" | "note" | "task" | "follow" | "request" | "meeting";
const LINK_LABELS: Record<string, string> = { SALES_ORDER: "Order", QUOTE: "Quotation", CUSTOMER: "Customer", PROJECT: "Project", PRODUCT: "Product" };

const MODES: Array<{ id: Mode; label: string; icon: typeof CheckSquare }> = [
  { id: "task", label: "Task", icon: CheckSquare },
  { id: "follow", label: "Follow-up", icon: CheckSquare },
  { id: "request", label: "Request", icon: CheckSquare },
  { id: "meeting", label: "Meeting", icon: Calendar },
  { id: "note", label: "Note", icon: StickyNote },
];

function when(iso: string | null, compact = false) {
  if (!iso) return "";
  const date = new Date(iso);
  const sameDay = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" }) === date.toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  return date.toLocaleString("en-GB", { timeZone: "Europe/London", ...(compact && sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderBody(body: string, names: string[], mine: boolean) {
  const known = [...new Set(names)].sort((a, b) => b.length - a.length);
  if (!known.length) return body;
  const pattern = new RegExp(`@(${known.map(escapeRegExp).join("|")})\\b`, "g");
  const parts: Array<string | { mention: string }> = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    if (match.index > last) parts.push(body.slice(last, match.index));
    parts.push({ mention: match[1] });
    last = match.index + match[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts.map((part, index) => typeof part === "string" ? part : <span key={index} className={`rounded px-1 font-semibold ${mine ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>@{part.mention}</span>);
}

export function ChatDock({ variant = "dock" }: { variant?: "dock" | "page" }) {
  const page = variant === "page";
  const [open, setOpen] = useState(page);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("message");
  const [draft, setDraft] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const [starts, setStarts] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [pending, setPending] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [pickedContacts, setPickedContacts] = useState<string[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleHits, setPeopleHits] = useState<PersonHit[]>([]);
  const [peopleSearching, setPeopleSearching] = useState(false);
  const [pickedNames, setPickedNames] = useState<Record<string, string>>({});
  const [attached, setAttached] = useState<LinkHit[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachQuery, setAttachQuery] = useState("");
  const [hits, setHits] = useState<LinkHit[]>([]);
  const [toasts, setToasts] = useState<Snapshot["notices"]>([]);
  const [menu, setMenu] = useState(false);
  const seen = useRef(new Set<string>());
  const primed = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const openRef = useRef(page);
  useEffect(() => {
    activeIdRef.current = activeId;
    openRef.current = open || page;
  }, [activeId, open, page]);

  async function load(nextId = activeIdRef.current) {
    const data = await chatCall<Snapshot>("snapshot", { activeId: nextId ?? undefined });
    setLoadError("");
    setSnapshot(data);
    const fresh = data.notices.filter((notice) => !seen.current.has(notice.id));
    if (primed.current) {
      const visible = fresh.filter((notice) => !(openRef.current && notice.conversationId === activeIdRef.current));
      if (visible.length) {
        setToasts((current) => [...visible, ...current].slice(0, 3));
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          for (const notice of visible) new Notification(notice.title, { body: notice.body });
        }
      }
    }
    for (const notice of data.notices) seen.current.add(notice.id);
    primed.current = true;
    return data;
  }

  useEffect(() => {
    let stop = false;
    const tick = () => { if (!stop && document.visibilityState === "visible") void load().catch((reason) => setLoadError(reason instanceof Error ? reason.message : "Chat could not be opened.")); };
    tick();
    const timer = setInterval(tick, 8000);
    return () => { stop = true; clearInterval(timer); };
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [snapshot?.thread, activeId, open]);

  useEffect(() => {
    if (!open && !page) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { if (page) setActiveId(null); else setOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, page]);

  useEffect(() => {
    if (!attachOpen) return;
    const handle = setTimeout(() => { void chatCall<LinkHit[]>("search", { query: attachQuery }).then(setHits).catch((reason) => setError(reason instanceof Error ? reason.message : "Records could not be searched.")); }, 200);
    return () => clearTimeout(handle);
  }, [attachOpen, attachQuery]);

  useEffect(() => {
    if (!newChatOpen) return;
    const needle = peopleQuery.trim();
    if (!needle) return;
    const handle = setTimeout(() => {
      setPeopleSearching(true);
      void chatCall<PersonHit[]>("searchPeople", { query: needle })
        .then((rows) => setPeopleHits(rows))
        .catch((reason) => setError(reason instanceof Error ? reason.message : "People could not be searched."))
        .finally(() => setPeopleSearching(false));
    }, 220);
    return () => clearTimeout(handle);
  }, [newChatOpen, peopleQuery]);

  const conversations = snapshot?.conversations ?? [];
  const listed = conversations.filter((conversation) => !query.trim() || conversation.title.toLowerCase().includes(query.trim().toLowerCase()));
  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const work = mode !== "message";

  function choose(id: string, peerId: string | null) {
    activeIdRef.current = id;
    setActiveId(id);
    setAssignee(peerId ?? "");
    setError("");
    setMenu(false);
    void load(id).catch((reason) => setError(reason instanceof Error ? reason.message : "Chat could not be opened."));
  }

  useEffect(() => {
    const onOpenChat = (event: Event) => {
      const id = (event as CustomEvent<{ conversationId?: string }>).detail?.conversationId;
      if (!id) return;
      setOpen(true);
      openRef.current = true;
      choose(id, null);
    };
    window.addEventListener("atlas:open-chat", onOpenChat);
    return () => window.removeEventListener("atlas:open-chat", onOpenChat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tagQuery = /(?:^|\s)@([\p{L}\p{N}.'-]*)$/u.exec(draft)?.[1];
  const tagMatches = tagQuery === undefined ? [] : (snapshot?.people ?? []).filter((person) => person.name.toLowerCase().includes(tagQuery.toLowerCase())).slice(0, 5);

  function tagPerson(name: string) {
    setDraft((current) => current.replace(/@[\p{L}\p{N}.'-]*$/u, `@${name} `));
  }

  function togglePersonHit(hit: PersonHit) {
    setPickedNames((current) => ({ ...current, [hit.id]: hit.name }));
    if (hit.type === "user") {
      setPicked((current) => current.includes(hit.id) ? current.filter((id) => id !== hit.id) : [...current, hit.id].slice(0, 11));
    } else {
      setPickedContacts((current) => current.includes(hit.id) ? current.filter((id) => id !== hit.id) : [...current, hit.id].slice(0, 11));
    }
  }

  function closeNewChat() {
    setNewChatOpen(false);
    setPeopleQuery("");
    setPeopleHits([]);
    setPicked([]);
    setPickedContacts([]);
    setPickedNames({});
  }

  async function start(userIds: string[], contactIds: string[] = []) {
    setPending(true);
    setError("");
    try {
      const opened = await chatCall<{ conversationId: string }>("open", { userIds, contactIds });
      choose(opened.conversationId, userIds.length === 1 && !contactIds.length ? userIds[0] : null);
      closeNewChat();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That chat could not be opened.");
    } finally {
      setPending(false);
    }
  }

  async function submit() {
    if (!activeId || !snapshot?.canWrite) return;
    setPending(true);
    setError("");
    try {
      const kind = mode === "note" ? "NOTE" : mode === "meeting" ? "MEETING" : mode === "message" ? "TEXT" : "TASK";
      await chatCall("send", { input: {
        conversationId: activeId,
        body: draft,
        kind,
        assigneeUserId: assignee || undefined,
        dueAt: due,
        startsAt: starts,
        priority,
        taskType: mode === "follow" ? "FOLLOW_UP" : mode === "request" ? "REQUEST" : "TASK",
        links: attached.map((item) => ({ type: item.type, id: item.id })),
      } });
      setDraft("");
      setAttached([]);
      setAttachOpen(false);
      setAttachQuery("");
      setMode("message");
      setMenu(false);
      await load(activeId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That could not be sent.");
    } finally {
      setPending(false);
    }
  }

  const panel = (
    <div className={page ? "flex h-[calc(100dvh-var(--atlas-topbar)-3.5rem)] min-h-0 overflow-hidden rounded-3xl border border-white/80 bg-white/75 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.28)] backdrop-blur-xl" : "flex h-full min-h-0 flex-col bg-transparent"}>
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {!page && active && <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Back to chats" onClick={() => setActiveId(null)}><ArrowLeft size={18} /></button>}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#6e6e73]">Chat</p>
          <h2 className="truncate text-base font-semibold text-slate-900">{active && !page ? active.title : "Messages"}</h2>
        </div>
        {!page && <Link href="/chat" className="rounded-full bg-black/[0.05] px-3 py-1 text-xs font-medium text-[#1d1d1f]" onClick={() => setOpen(false)}>Open</Link>}
        <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Turn on notifications" onClick={() => { if (typeof Notification !== "undefined") void Notification.requestPermission(); }}><Bell size={18} /></button>
        {page ? <Link href="/home" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close chat"><X size={18} /></Link> : <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close chat" onClick={() => setOpen(false)}><X size={18} /></button>}
      </header>
      <div className={page ? "relative grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]" : "relative flex min-h-0 flex-1 flex-col"}>
        <aside className={`${page ? (active ? "hidden md:flex" : "flex") : active ? "hidden" : "flex"} min-h-0 flex-col border-slate-100 ${page ? "md:border-r" : ""}`}>
          <div className="flex items-center gap-2 p-3">
            <label className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats" className="w-full border-0 bg-transparent p-0 text-slate-800 shadow-none outline-none placeholder:text-slate-400 focus:shadow-none" />
            </label>
            <button type="button" aria-label="Start a new chat" title="New chat" onClick={() => setNewChatOpen(true)} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"><UserPlus size={16} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {(loadError || error) && <p role="alert" className="px-3 py-2 text-xs text-rose-600">{loadError || error}</p>}
            {listed.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => choose(conversation.id, conversation.peerId)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${conversation.id === activeId ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${conversation.kind === "GROUP" ? "bg-indigo-600" : "bg-blue-600"}`}>{conversation.kind === "GROUP" ? conversation.peopleCount : initials(conversation.title)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2"><span className="truncate text-sm font-semibold text-slate-800">{conversation.title}</span><time className="shrink-0 text-[10px] text-slate-400">{when(conversation.at, true)}</time></span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{conversation.preview}</span>
                </span>
                {conversation.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{conversation.unread > 9 ? "9+" : conversation.unread}</span>}
              </button>
            ))}
            {!snapshot && !loadError && <p className="px-3 py-8 text-center text-sm text-slate-400">Opening chat…</p>}
            {snapshot && !listed.length && <p className="px-3 py-6 text-center text-sm text-slate-400">{query.trim() ? "No matching chats." : "No chats yet. Start one with the people icon above."}</p>}
          </div>
        </aside>
        {newChatOpen && <div role="dialog" aria-label="New chat" className="absolute inset-0 z-20 flex flex-col bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 p-3">
            <button type="button" aria-label="Cancel new chat" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={closeNewChat}><ArrowLeft size={18} /></button>
            <label className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Search size={16} />
              <input autoFocus value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Search colleagues and customer contacts" className="w-full border-0 bg-transparent p-0 text-slate-800 shadow-none outline-none placeholder:text-slate-400 focus:shadow-none" />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {(picked.length + pickedContacts.length) > 0 && <button type="button" disabled={pending} onClick={() => void start(picked, pickedContacts)} className="mb-2 w-full rounded-2xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{picked.length + pickedContacts.length === 1 ? `Message ${pickedNames[picked[0] ?? pickedContacts[0]] ?? "1 person"}` : `Start a group chat with ${picked.length + pickedContacts.length} people`}</button>}
            {(peopleQuery.trim() ? peopleHits : []).map((hit) => {
              const isPicked = hit.type === "user" ? picked.includes(hit.id) : pickedContacts.includes(hit.id);
              return (
                <div key={`${hit.type}:${hit.id}`} className="mb-1 flex items-center gap-2 rounded-2xl px-3 py-2.5 hover:bg-slate-50">
                  <input type="checkbox" className="size-4 accent-blue-600" checked={isPicked} aria-label={`Add ${hit.name}`} onChange={() => togglePersonHit(hit)} />
                  <button type="button" disabled={pending} onClick={() => void (hit.type === "user" ? start([hit.id]) : start([], [hit.id]))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">{initials(hit.name)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{hit.name}</span>
                      <span className="block truncate text-xs text-slate-500">{hit.subtitle}{hit.type === "contact" ? " · Customer contact" : ""}</span>
                    </span>
                  </button>
                </div>
              );
            })}
            {peopleSearching && <p className="px-3 py-4 text-center text-xs text-slate-400">Searching…</p>}
            {!peopleSearching && peopleQuery.trim() && !peopleHits.length && <p className="px-3 py-6 text-center text-sm text-slate-400">No one matches &ldquo;{peopleQuery.trim()}&rdquo;.</p>}
            {!peopleQuery.trim() && <p className="px-3 py-6 text-center text-sm text-slate-400">Search by name to message a colleague or customer contact.</p>}
          </div>
        </div>}
        <section className={`${page ? (active ? "flex" : "hidden md:flex") : active ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col`}>
          {!active && <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><MessageCircle className="text-blue-600" size={28} /><p className="mt-3 text-sm font-medium text-slate-700">Choose a conversation</p><p className="mt-1 text-xs text-slate-400">Message a colleague or customer contact, or tick several for one chat. Attach orders, quotations, customers, projects and products. Nothing is sent to the whole company.</p></div>}
          {active && <>
            {page && <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3"><span className={`flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white ${active.kind === "GROUP" ? "bg-indigo-600" : "bg-blue-600"}`}>{active.kind === "GROUP" ? active.peerIds.length + 1 : initials(active.title)}</span><div><p className="text-sm font-semibold text-slate-900">{active.title}</p><p className="text-xs text-slate-400">{active.kind === "GROUP" ? `${active.peopleCount} people` : "Direct message"}</p></div></div>}
            <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {snapshot?.thread.map((entry) => (
                <article key={entry.id} className={`flex ${entry.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${entry.mine ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-800"}`}>
                    {!entry.mine && <p className="mb-1 text-[11px] font-semibold text-slate-500">{entry.authorName}</p>}
                    {entry.kind !== "TEXT" && <p className={`mb-1 text-[10px] font-semibold uppercase tracking-[.14em] ${entry.mine ? "text-blue-100" : "text-blue-600"}`}>{entry.kind === "NOTE" ? "Note" : entry.kind === "MEETING" ? "Meeting" : entry.task?.taskType === "FOLLOW_UP" ? "Follow-up" : entry.task?.taskType === "REQUEST" ? "Request" : "Task"}</p>}
                    <p className="whitespace-pre-wrap break-words">{renderBody(entry.body, [...(snapshot?.people ?? []).map((person) => person.name), entry.authorName], entry.mine)}</p>
                    {entry.links.map((link, index) => link.href ? <Link key={`${entry.id}:${index}`} href={link.href} className={`mt-2 block rounded-2xl px-3 py-2 text-xs ${entry.mine ? "bg-white/15 text-white" : "bg-white text-slate-700"}`}><span className={`font-semibold uppercase tracking-[.12em] ${entry.mine ? "text-blue-100" : "text-blue-600"}`}>{LINK_LABELS[link.type] ?? "Record"}</span><span className="mt-0.5 block font-medium">{link.title}</span><span className={entry.mine ? "text-blue-100" : "text-slate-500"}>{link.subtitle}</span></Link> : <p key={`${entry.id}:${index}`} className={`mt-2 rounded-2xl px-3 py-2 text-xs ${entry.mine ? "bg-white/15" : "bg-white text-slate-500"}`}>{link.title}. {link.subtitle}</p>)}
                    {entry.task && <div className={`mt-2 rounded-2xl px-3 py-2 text-xs ${entry.mine ? "bg-white/15" : "bg-white"}`}>
                      <p className="font-semibold">{entry.task.title}</p>
                      <p className={entry.mine ? "text-blue-100" : "text-slate-500"}>{entry.task.assignee} · {entry.task.priority.toLowerCase()} · {entry.task.status.toLowerCase().replace(/_/g, " ")}{entry.task.due ? ` · due ${when(entry.task.due)}` : ""}</p>
                      <Link href={`/projects/tasks/${entry.task.id}`} className={`mt-1 inline-block font-medium underline ${entry.mine ? "text-white" : "text-blue-600"}`}>Open task</Link>
                    </div>}
                    {entry.meeting && <div className={`mt-2 rounded-2xl px-3 py-2 text-xs ${entry.mine ? "bg-white/15" : "bg-white"}`}><p className="font-semibold">{entry.meeting.title}</p><p className={entry.mine ? "text-blue-100" : "text-slate-500"}>{when(entry.meeting.startsAt)}</p></div>}
                    <time className={`mt-1 block text-[10px] ${entry.mine ? "text-blue-100" : "text-slate-400"}`}>{when(entry.at, true)}</time>
                  </div>
                </article>
              ))}
              {!snapshot?.thread.length && <p className="py-10 text-center text-sm text-slate-400">Start the conversation.</p>}
            </div>
            {snapshot?.canWrite && <form className="border-t border-slate-100 p-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
              {work && <div className="mb-2 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
                <label className="text-xs text-slate-500">Assign to<select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"><option value="">Me</option>{snapshot.people.map((person) => <option key={person.id} value={person.id}>{person.name}{person.jobTitle ? ` — ${person.jobTitle}` : ""}</option>)}</select></label>
                {mode === "meeting" ? <label className="text-xs text-slate-500">When<input required type="datetime-local" value={starts} onChange={(event) => setStarts(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label> : <label className="text-xs text-slate-500">Due<input type="date" value={due} onChange={(event) => setDue(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>}
                {mode !== "meeting" && mode !== "note" && <label className="text-xs text-slate-500 sm:col-span-2">Priority<select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="HIGH">High</option><option value="NORMAL">Normal</option><option value="LOW">Low</option></select></label>}
              </div>}
              {attached.length > 0 && <div className="mb-2 flex flex-wrap gap-1">{attached.map((item) => <button key={`${item.type}:${item.id}`} type="button" className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700" onClick={() => setAttached((current) => current.filter((link) => !(link.type === item.type && link.id === item.id)))}>{LINK_LABELS[item.type]} {item.title} ×</button>)}</div>}
              {attachOpen && <div className="mb-2 rounded-2xl bg-slate-50 p-2">
                <input value={attachQuery} onChange={(event) => setAttachQuery(event.target.value)} placeholder="Orders, quotations, customers, projects, products" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" />
                <div className="mt-2 max-h-36 overflow-y-auto">
                  {hits.filter((item) => !attached.some((link) => link.type === item.type && link.id === item.id)).map((item) => <button key={`${item.type}:${item.id}`} type="button" className="flex w-full items-baseline justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-xs hover:bg-white" onClick={() => setAttached((current) => current.length >= 8 ? current : [...current, item])}><span className="font-medium text-slate-800">{item.title}</span><span className="shrink-0 text-slate-400">{LINK_LABELS[item.type]}</span></button>)}
                  {!hits.length && <p className="px-2 py-2 text-xs text-slate-400">No records you can attach.</p>}
                </div>
              </div>}
              {tagMatches.length > 0 && <div role="listbox" aria-label="Tag someone" className="mb-2 flex flex-wrap gap-1">{tagMatches.map((person) => <button key={person.id} type="button" role="option" aria-selected={false} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100" onClick={() => tagPerson(person.name)}>@{person.name}{person.jobTitle ? <span className="text-amber-600"> · {person.jobTitle}</span> : null}</button>)}</div>}
              <div className="flex items-end gap-2">
                <div className="relative">
                  <button type="button" aria-label="Attach a record" className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200" onClick={() => setAttachOpen((value) => !value)}><Paperclip size={16} /></button>
                  <button type="button" aria-label="Add work" className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200" onClick={() => setMenu((value) => !value)}>+</button>
                  {menu && <div className="absolute bottom-14 left-0 z-10 w-44 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">{MODES.map((item) => <button key={item.id} type="button" disabled={!snapshot.projectsReady && item.id !== "note"} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40" onClick={() => { setMode(item.id); setMenu(false); }}><item.icon size={15} className="text-blue-600" />{item.label}</button>)}</div>}
                </div>
                <textarea required value={draft} maxLength={4000} rows={work ? 2 : 1} placeholder={mode === "message" ? "Message" : mode === "note" ? "Write a note" : mode === "meeting" ? "Meeting title" : "What needs doing?"} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && mode === "message") { event.preventDefault(); void submit(); } }} className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-none outline-none focus:border-blue-400" />
                <button type="submit" disabled={pending} aria-label="Send" className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"><Send size={16} /></button>
              </div>
              {mode !== "message" && <button type="button" className="mt-2 text-xs text-slate-400 hover:text-slate-600" onClick={() => setMode("message")}>Back to a message</button>}
              {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
            </form>}
          </>}
        </section>
      </div>
    </div>
  );

  return <>
    {!page && <button type="button" aria-label="Open chat" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"><MessageCircle size={20} strokeWidth={1.7} />{(snapshot?.unread ?? 0) > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">{snapshot!.unread > 9 ? "9+" : snapshot!.unread}</span>}</button>}
    {!page && open && <button type="button" aria-label="Dismiss chat" className="fixed inset-0 top-[var(--atlas-topbar)] z-30 bg-black/10 backdrop-blur-[2px]" onClick={() => setOpen(false)} />}
    {!page && open && <div role="dialog" aria-label="Chat" className="fixed bottom-3 right-3 top-[calc(var(--atlas-topbar)+0.75rem)] z-40 w-[min(100%-1.5rem,400px)] overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl">{panel}</div>}
    {page && panel}
    <div className={`pointer-events-none fixed bottom-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2 ${open && !page ? "right-4 sm:right-[432px]" : "right-4"}`}>{toasts.map((toast) => <button key={toast.id} type="button" className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl" onClick={() => { setOpen(true); choose(toast.conversationId, null); setToasts((current) => current.filter((item) => item.id !== toast.id)); }}><p className="text-xs font-semibold text-slate-900">{toast.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{toast.body}</p></button>)}</div>
  </>;
}
