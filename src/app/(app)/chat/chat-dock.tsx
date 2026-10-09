"use client";
import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageDraftContext,
  type MessageDraft,
} from "@/components/shell/message-drafts";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckSquare,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  StickyNote,
  UserPlus,
  X,
  Info,
  ChevronRight,
  Maximize2,
  Plus,
  Users,
  Check,
  LoaderCircle,
} from "lucide-react";
import type {
  chatSnapshot,
  searchChatRecords,
  searchChatPeople,
} from "./actions";

type Snapshot = Awaited<ReturnType<typeof chatSnapshot>>;
type LinkHit = Awaited<ReturnType<typeof searchChatRecords>>[number];
type PersonHit = Awaited<ReturnType<typeof searchChatPeople>>[number];

async function chatCall<T>(op: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, ...payload }),
  });
  const result = (await response.json()) as { value?: T; error?: string };
  if (!response.ok || result.error)
    throw new Error(result.error || "Chat could not be reached.");
  return result.value as T;
}
type Mode = "message" | "note" | "task" | "follow" | "request" | "meeting";
const LINK_LABELS: Record<string, string> = {
  SALES_ORDER: "Order",
  QUOTE: "Quotation",
  CUSTOMER: "Customer",
  PROJECT: "Project",
  PRODUCT: "Product",
};

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
  const sameDay =
    new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" }) ===
    date.toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  return date.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    ...(compact && sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  });
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
  return parts.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <span
        key={index}
        className={`rounded px-1 font-semibold ${mine ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}
      >
        @{part.mention}
      </span>
    ),
  );
}

export function ChatDock({ variant = "dock" }: { variant?: "dock" | "page" }) {
  const page = variant === "page";
  const pathname = usePathname();
  const duplicate = !page && pathname === "/chat";
  const sharedDrafts = useContext(MessageDraftContext);
  const localDrafts = useRef({
    drafts: new Map<string, MessageDraft>(),
    lastConversation: null as string | null,
  });
  const buffer = sharedDrafts ?? localDrafts;
  const initialConversation = useRef(
    page ? buffer.current.lastConversation : null,
  ).current;
  const initialDraft = useRef(
    initialConversation
      ? buffer.current.drafts.get(initialConversation)
      : undefined,
  ).current;

  const [open, setOpen] = useState(page);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [activeId, setActiveId] = useState<string | null>(initialConversation);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>(initialDraft?.mode ?? "message");
  const [draft, setDraft] = useState(initialDraft?.body ?? "");
  const [assignee, setAssignee] = useState(initialDraft?.assignee ?? "");
  const [due, setDue] = useState(initialDraft?.due ?? "");
  const [starts, setStarts] = useState(initialDraft?.starts ?? "");
  const [priority, setPriority] = useState(initialDraft?.priority ?? "NORMAL");
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
  const [attached, setAttached] = useState<LinkHit[]>(
    initialDraft?.links ?? [],
  );
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachQuery, setAttachQuery] = useState("");
  const [hits, setHits] = useState<LinkHit[]>([]);
  const [recordSearching, setRecordSearching] = useState(false);
  const [toasts, setToasts] = useState<Snapshot["notices"]>([]);
  const [menu, setMenu] = useState(false);
  const [details, setDetails] = useState(false);
  const [threadQuery, setThreadQuery] = useState("");
  const [historyBefore, setHistoryBefore] = useState("");
  const [historyPending, setHistoryPending] = useState(false);
  const historyOptions = useRef({ query: "", before: "" });
  const requestNumber = useRef(0);
  const pendingRef = useRef(false);
  const nearBottom = useRef(true);
  const focusPanel = useRef<HTMLDivElement>(null);
  const drafts = buffer.current.drafts;
  const seen = useRef(new Set<string>());
  const primed = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(initialConversation);
  const openRef = useRef(page);
  useEffect(() => {
    activeIdRef.current = activeId;
    openRef.current = open || page;
  }, [activeId, open, page]);

  async function load(nextId = activeIdRef.current) {
    const number = ++requestNumber.current;
    const data = await chatCall<Snapshot>("snapshot", {
      activeId: nextId ?? undefined,
      ...(nextId ? historyOptions.current : {}),
    });
    if (
      number !== requestNumber.current ||
      nextId !== (openRef.current ? activeIdRef.current : null)
    )
      return data;
    setLoadError("");
    setSnapshot(data);
    const fresh = data.notices.filter((notice) => !seen.current.has(notice.id));
    if (primed.current) {
      const visible = fresh.filter(
        (notice) =>
          !(openRef.current && notice.conversationId === activeIdRef.current),
      );
      if (visible.length) {
        setToasts((current) => [...visible, ...current].slice(0, 3));
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          for (const notice of visible)
            new Notification(notice.title, { body: notice.body });
        }
      }
    }
    for (const notice of data.notices) seen.current.add(notice.id);
    primed.current = true;
    return data;
  }

  useEffect(() => {
    if (duplicate) return;
    let stop = false;
    const tick = () => {
      if (!stop && document.visibilityState === "visible")
        void load(openRef.current ? activeIdRef.current : null).catch(
          (reason) =>
            setLoadError(
              reason instanceof Error
                ? reason.message
                : "Chat could not be opened.",
            ),
        );
    };
    tick();
    const timer = setInterval(tick, 8000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [duplicate]);

  const lastMessage = snapshot?.thread.at(-1)?.id;
  useEffect(() => {
    if (nearBottom.current)
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lastMessage, activeId, open]);

  useEffect(() => {
    if (!activeId || !open || duplicate) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      historyOptions.current = {
        query: threadQuery.trim(),
        before: historyBefore,
      };
      setHistoryPending(true);
      void load(activeId)
        .catch((reason) => {
          if (!cancelled)
            setError(
              reason instanceof Error
                ? reason.message
                : "History could not be loaded.",
            );
        })
        .finally(() => {
          if (!cancelled) setHistoryPending(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [activeId, threadQuery, historyBefore, open, duplicate]);

  useEffect(() => {
    if (page || !open || duplicate) return;
    const previous = document.activeElement as HTMLElement | null;
    focusPanel.current?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const scope =
        focusPanel.current?.querySelector<HTMLElement>('[role="dialog"]') ??
        focusPanel.current;
      const nodes = Array.from(
        scope?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((node) => node.getClientRects().length);
      const first = nodes[0],
        last = nodes.at(-1);
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === focusPanel.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => {
      window.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [open, page, duplicate]);

  useEffect(() => {
    if (!open && !page) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (attachOpen) setAttachOpen(false);
        else if (newChatOpen) closeNewChat();
        else if (details) setDetails(false);
        else if (!page) setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, page, attachOpen, newChatOpen, details]);

  useEffect(() => {
    if (!attachOpen) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      void chatCall<LinkHit[]>("search", { query: attachQuery })
        .then((rows) => {
          if (!cancelled) setHits(rows);
        })
        .catch((reason) =>
          setError(
            reason instanceof Error
              ? reason.message
              : "Records could not be searched.",
          ),
        )
        .finally(() => {
          if (!cancelled) setRecordSearching(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [attachOpen, attachQuery]);

  useEffect(() => {
    if (!newChatOpen) return;
    const needle = peopleQuery.trim();
    if (!needle) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      setPeopleSearching(true);
      void chatCall<PersonHit[]>("searchPeople", { query: needle })
        .then((rows) => {
          if (!cancelled) setPeopleHits(rows);
        })
        .catch((reason) =>
          setError(
            reason instanceof Error
              ? reason.message
              : "People could not be searched.",
          ),
        )
        .finally(() => {
          if (!cancelled) setPeopleSearching(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [newChatOpen, peopleQuery]);

  const conversations = snapshot?.conversations ?? [];
  const listed = conversations.filter(
    (conversation) =>
      !query.trim() ||
      conversation.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const active =
    conversations.find((conversation) => conversation.id === activeId) ?? null;
  const work = mode !== "message";

  function choose(id: string, peerId: string | null, force = false) {
    if (pendingRef.current && !force) return;
    buffer.current.lastConversation = id;
    const saved = drafts.get(id);
    setDraft(saved?.body ?? "");
    setAttached(saved?.links ?? []);
    setMode(saved?.mode ?? "message");
    setDue(saved?.due ?? "");
    setStarts(saved?.starts ?? "");
    setPriority(saved?.priority ?? "NORMAL");
    setAttachOpen(false);
    setDetails(false);
    setThreadQuery("");
    setHistoryBefore("");
    historyOptions.current = { query: "", before: "" };
    nearBottom.current = true;
    setSnapshot((current) => (current ? { ...current, thread: [] } : current));
    activeIdRef.current = id;
    setActiveId(id);
    setAssignee(saved?.assignee ?? peerId ?? "");
    setError("");
    setMenu(false);
    if (openRef.current)
      void load(id).catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Chat could not be opened.",
        ),
      );
  }

  useEffect(() => {
    if (duplicate) return;
    const onOpenChat = (event: Event) => {
      const id = (event as CustomEvent<{ conversationId?: string }>).detail
        ?.conversationId;
      setOpen(true);
      openRef.current = true;
      if (id) choose(id, null);
    };
    window.addEventListener("atlas:open-chat", onOpenChat);
    return () => window.removeEventListener("atlas:open-chat", onOpenChat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicate]);

  useEffect(() => {
    pendingRef.current = pending;
    if (activeId)
      drafts.set(activeId, {
        body: draft,
        links: attached,
        mode,
        assignee,
        due,
        starts,
        priority,
      });
  }, [
    drafts,
    activeId,
    draft,
    attached,
    mode,
    assignee,
    due,
    starts,
    priority,
    pending,
  ]);

  useEffect(() => {
    if (!page && !duplicate && buffer.current.lastConversation)
      choose(buffer.current.lastConversation, null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicate, page]);

  useEffect(() => {
    if (open)
      void load().catch((reason) =>
        setLoadError(
          reason instanceof Error
            ? reason.message
            : "Chat could not be opened.",
        ),
      );
  }, [open]);

  const tagQuery = /(?:^|\s)@([\p{L}\p{N}.'-]*)$/u.exec(draft)?.[1];
  const tagMatches =
    tagQuery === undefined
      ? []
      : (snapshot?.people ?? [])
          .filter((person) =>
            person.name.toLowerCase().includes(tagQuery.toLowerCase()),
          )
          .slice(0, 5);

  function tagPerson(name: string) {
    setDraft((current) => current.replace(/@[\p{L}\p{N}.'-]*$/u, `@${name} `));
  }

  function togglePersonHit(hit: PersonHit) {
    setPickedNames((current) => ({ ...current, [hit.id]: hit.name }));
    if (hit.type === "user") {
      setPicked((current) =>
        current.includes(hit.id)
          ? current.filter((id) => id !== hit.id)
          : [...current, hit.id].slice(0, 11),
      );
    } else {
      setPickedContacts((current) =>
        current.includes(hit.id)
          ? current.filter((id) => id !== hit.id)
          : [...current, hit.id].slice(0, 11),
      );
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
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      const opened = await chatCall<{ conversationId: string }>("open", {
        userIds,
        contactIds,
      });
      choose(
        opened.conversationId,
        userIds.length === 1 && !contactIds.length ? userIds[0] : null,
        true,
      );
      closeNewChat();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "That chat could not be opened.",
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  async function submit() {
    if (
      pendingRef.current ||
      (!draft.trim() && !attached.length) ||
      !activeId ||
      !snapshot?.canWrite
    )
      return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      const kind =
        mode === "note"
          ? "NOTE"
          : mode === "meeting"
            ? "MEETING"
            : mode === "message"
              ? "TEXT"
              : "TASK";
      await chatCall("send", {
        input: {
          conversationId: activeId,
          body: draft,
          kind,
          assigneeUserId: assignee || undefined,
          dueAt: due,
          startsAt: starts,
          priority,
          taskType:
            mode === "follow"
              ? "FOLLOW_UP"
              : mode === "request"
                ? "REQUEST"
                : "TASK",
          links: attached.map((item) => ({ type: item.type, id: item.id })),
        },
      });
      drafts.delete(activeId);
      nearBottom.current = true;
      historyOptions.current = { query: "", before: "" };
      setThreadQuery("");
      setHistoryBefore("");
      setDraft("");
      setAttached([]);
      setAttachOpen(false);
      setAttachQuery("");
      setMode("message");
      setMenu(false);
      await load(activeId);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "That could not be sent.",
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  const shared = [
    ...new Map(
      (snapshot?.thread ?? [])
        .flatMap((entry) => entry.links)
        .map((link) => [`${link.type}:${link.href}:${link.title}`, link]),
    ).values(),
  ];
  const threadReady =
    !historyPending &&
    historyOptions.current.query === threadQuery.trim() &&
    historyOptions.current.before === historyBefore;
  if (duplicate) return null;
  const panel = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_24px_90px_-25px_rgba(35,77,140,0.28)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-blue-100/70 bg-gradient-to-r from-[#f1f7ff] via-white to-white px-5 py-4">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#075bff] text-white shadow-lg shadow-blue-500/15">
          <MessageCircle size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Messages
          </h2>
          <p className="text-xs text-[#71809a]">
            Conversations, connected to your work
          </p>
        </div>
        {!page && (
          <Link
            href="/chat"
            aria-label="Expand messages"
            title="Expand messages"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2.5 text-[#526587] hover:bg-blue-50"
          >
            <Maximize2 size={17} />
          </Link>
        )}
        <button
          type="button"
          className="hidden rounded-xl p-2.5 text-[#526587] hover:bg-blue-50 sm:block"
          aria-label="Turn on notifications"
          onClick={() => {
            if (typeof Notification !== "undefined")
              void Notification.requestPermission();
          }}
        >
          <Bell size={18} />
        </button>
        {page ? (
          <Link
            href="/home"
            className="rounded-xl p-2.5 text-[#526587] hover:bg-blue-50"
            aria-label="Close messages"
          >
            <X size={18} />
          </Link>
        ) : (
          <button
            type="button"
            className="rounded-xl p-2.5 text-[#526587] hover:bg-blue-50"
            aria-label="Close messages"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        )}
      </header>
      <div className="relative grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          className={`${active ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-blue-100/70 bg-[#f9fbff]`}
        >
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-[#71809a]">
              Your conversations
            </h3>
            <button
              type="button"
              aria-label="Start a new chat"
              title="New chat"
              onClick={() => setNewChatOpen(true)}
              className="flex size-8 items-center justify-center rounded-xl bg-[#075bff] text-white hover:bg-blue-700"
            >
              <Plus size={17} />
            </button>
          </div>
          <label className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-[#71809a]">
            <Search size={16} />
            <input
              aria-label="Search conversations"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className="w-full min-w-0 border-0 bg-transparent text-xs text-slate-800 outline-none"
            />
          </label>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {listed.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                disabled={pending}
                onClick={() => choose(conversation.id, conversation.peerId)}
                aria-pressed={conversation.id === activeId}
                className={`mb-1 flex w-full items-start gap-3 rounded-2xl border px-3 py-3.5 text-left transition ${conversation.id === activeId ? "border-blue-100 bg-[#eaf3ff]" : "border-transparent hover:bg-white"}`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold ${conversation.kind === "GROUP" ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-[#075bff]"}`}
                >
                  {conversation.kind === "GROUP" ? (
                    <Users size={19} />
                  ) : (
                    initials(conversation.title)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-slate-900">
                      {conversation.title}
                    </span>
                    {conversation.unread > 0 && (
                      <span className="rounded-full bg-[#075bff] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        {conversation.unread > 99 ? "99+" : conversation.unread}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#71809a]">
                    {conversation.preview}
                  </span>
                  <time className="mt-1.5 block text-[10px] text-[#8b99af]">
                    {when(conversation.at, true)}
                  </time>
                </span>
              </button>
            ))}
            {!snapshot && !loadError && (
              <p className="px-3 py-8 text-center text-sm text-[#71809a]">
                Opening messages…
              </p>
            )}
            {snapshot && !listed.length && (
              <div className="px-3 py-8 text-center text-sm text-[#71809a]">
                <p>
                  {query.trim()
                    ? "No matching conversations."
                    : "Your conversations start here."}
                </p>
                {!query.trim() && (
                  <button
                    type="button"
                    onClick={() => setNewChatOpen(true)}
                    className="mt-3 font-medium text-[#075bff]"
                  >
                    Start a new chat
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
        <section
          className={`${active ? "flex" : "hidden md:flex"} relative min-h-0 min-w-0 flex-col`}
        >
          {!active && (
            <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,#eef5ff,white_70%)] px-8 text-center">
              <img
                src="/brand/atlas-mark.png"
                alt=""
                className="mb-6 w-24 mix-blend-multiply"
              />
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Bring the conversation together
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#71809a]">
                Chat with your team, share an order or quotation, and turn a
                conversation into work.
              </p>
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="mt-6 rounded-2xl bg-[#075bff] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/15"
              >
                New conversation
              </button>
            </div>
          )}
          {active && (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-blue-100/70 px-4 py-3.5">
                <button
                  type="button"
                  aria-label="Back to conversations"
                  onClick={() => {
                    if (!pending) setActiveId(null);
                  }}
                  className="rounded-xl p-2 text-[#526587] hover:bg-blue-50 md:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3ff] text-xs font-semibold text-[#075bff]">
                  {active.kind === "GROUP" ? (
                    <Users size={19} />
                  ) : (
                    initials(active.title)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-950">
                    {active.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#71809a]">
                    {active.kind === "GROUP"
                      ? `${active.peopleCount} participants`
                      : active.participants.some(
                            (person) => person.type === "contact",
                          )
                        ? "Customer contact · Stored in Atlas"
                        : "Direct conversation"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Conversation details"
                  aria-expanded={details}
                  onClick={() => setDetails((value) => !value)}
                  className={`rounded-xl p-2.5 ${details ? "bg-blue-50 text-[#075bff]" : "text-[#526587] hover:bg-blue-50"}`}
                >
                  <Info size={19} />
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-2 border-b border-blue-100/50 px-4 py-2">
                <Search size={14} className="text-[#8b99af]" />
                <input
                  aria-label="Search message history"
                  value={threadQuery}
                  onChange={(event) => {
                    setThreadQuery(event.target.value);
                    setHistoryBefore("");
                    nearBottom.current = false;
                  }}
                  placeholder="Search in this conversation"
                  maxLength={120}
                  className="min-w-0 flex-1 border-0 bg-transparent py-1 text-xs text-slate-700 outline-none"
                />
                {threadQuery && (
                  <button
                    type="button"
                    aria-label="Clear message search"
                    onClick={() => {
                      setThreadQuery("");
                      setHistoryBefore("");
                      nearBottom.current = true;
                    }}
                    className="p-1 text-[#71809a]"
                  >
                    <X size={14} />
                  </button>
                )}
                {historyPending && (
                  <LoaderCircle
                    aria-label="Loading history"
                    size={14}
                    className="animate-spin text-blue-600"
                  />
                )}
              </div>
              <div
                ref={scroller}
                onScroll={(event) => {
                  const element = event.currentTarget;
                  nearBottom.current =
                    element.scrollHeight -
                      element.scrollTop -
                      element.clientHeight <
                    80;
                }}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#fcfdff] px-4 py-4 sm:px-6"
              >
                <div className="flex justify-center gap-3 text-xs">
                  {snapshot?.history.hasOlder && (
                    <button
                      type="button"
                      disabled={historyPending}
                      onClick={() => {
                        setHistoryBefore(snapshot.history.oldestId ?? "");
                        nearBottom.current = false;
                        scroller.current?.scrollTo({ top: 0 });
                      }}
                      className="rounded-full border border-blue-100 bg-white px-4 py-2 font-medium text-[#075bff]"
                    >
                      Earlier {threadQuery ? "matches" : "messages"}
                    </button>
                  )}
                  {historyBefore && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryBefore("");
                        nearBottom.current = true;
                      }}
                      className="rounded-full bg-blue-50 px-4 py-2 font-medium text-[#075bff]"
                    >
                      Latest {threadQuery ? "matches" : "messages"}
                    </button>
                  )}
                </div>
                {threadReady &&
                  snapshot?.thread.map((entry, index, entries) => (
                    <div key={entry.id}>
                      {(index === 0 ||
                        new Date(entries[index - 1].at).toDateString() !==
                          new Date(entry.at).toDateString()) && (
                        <p className="mb-5 text-center text-[10px] font-medium text-[#8b99af]">
                          {new Date(entry.at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      <article
                        className={`flex items-end gap-2 ${entry.mine ? "justify-end" : "justify-start"}`}
                      >
                        {!entry.mine && (
                          <span
                            title={entry.authorName}
                            className="mb-5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[9px] font-semibold text-[#075bff]"
                          >
                            {initials(entry.authorName)}
                          </span>
                        )}
                        <div className="max-w-[88%] sm:max-w-[80%]">
                          {!entry.mine && (
                            <p className="mb-1 pl-1 text-[10px] font-semibold text-[#71809a]">
                              {entry.authorName}
                            </p>
                          )}
                          <div
                            className={`rounded-[20px] px-4 py-3 text-sm leading-relaxed ${entry.mine ? "rounded-br-md bg-gradient-to-br from-[#1675ff] to-[#0753ef] text-white shadow-sm" : "rounded-bl-md border border-blue-100/80 bg-white text-slate-800 shadow-sm"}`}
                          >
                            {entry.kind !== "TEXT" && (
                              <p
                                className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[.14em] ${entry.mine ? "text-blue-100" : "text-[#075bff]"}`}
                              >
                                {entry.kind === "NOTE"
                                  ? "Note"
                                  : entry.kind === "MEETING"
                                    ? "Meeting"
                                    : entry.task?.taskType === "FOLLOW_UP"
                                      ? "Follow-up"
                                      : entry.task?.taskType === "REQUEST"
                                        ? "Request"
                                        : "Task"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                              {renderBody(
                                entry.body,
                                [
                                  ...(snapshot?.people ?? []).map(
                                    (person) => person.name,
                                  ),
                                  entry.authorName,
                                ],
                                entry.mine,
                              )}
                            </p>
                            {entry.links.map((link, linkIndex) =>
                              link.href ? (
                                <Link
                                  key={linkIndex}
                                  href={link.href}
                                  className={`mt-3 flex items-center gap-3 rounded-2xl border p-3 text-xs ${entry.mine ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-blue-100 bg-[#f5f9ff] hover:bg-blue-50"}`}
                                >
                                  <Paperclip size={17} className="shrink-0" />
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block text-[9px] font-semibold uppercase tracking-wider ${entry.mine ? "text-blue-100" : "text-[#075bff]"}`}
                                    >
                                      {LINK_LABELS[link.type]}
                                    </span>
                                    <span className="mt-0.5 block break-words font-semibold">
                                      {link.title}
                                    </span>
                                    <span
                                      className={`block break-words ${entry.mine ? "text-blue-100" : "text-[#71809a]"}`}
                                    >
                                      {link.subtitle}
                                    </span>
                                  </span>
                                  <ChevronRight
                                    size={15}
                                    className="shrink-0"
                                  />
                                </Link>
                              ) : (
                                <p
                                  key={linkIndex}
                                  className="mt-3 rounded-xl bg-black/5 p-3 text-xs"
                                >
                                  {link.title} · {link.subtitle}
                                </p>
                              ),
                            )}
                            {entry.task && (
                              <div
                                className={`mt-3 rounded-2xl p-3 text-xs ${entry.mine ? "bg-white/10" : "bg-blue-50"}`}
                              >
                                <p className="font-semibold">
                                  {entry.task.title}
                                </p>
                                <p className="mt-1 opacity-75">
                                  {entry.task.assignee} ·{" "}
                                  {entry.task.priority.toLowerCase()} ·{" "}
                                  {entry.task.status
                                    .toLowerCase()
                                    .replace(/_/g, " ")}
                                  {entry.task.due
                                    ? ` · due ${when(entry.task.due)}`
                                    : ""}
                                </p>
                                <Link
                                  href={`/projects/tasks/${entry.task.id}`}
                                  className="mt-2 inline-flex items-center gap-1 font-semibold"
                                >
                                  Open task <ChevronRight size={12} />
                                </Link>
                              </div>
                            )}
                            {entry.meeting && (
                              <div
                                className={`mt-3 rounded-2xl p-3 text-xs ${entry.mine ? "bg-white/10" : "bg-blue-50"}`}
                              >
                                <p className="font-semibold">
                                  {entry.meeting.title}
                                </p>
                                <p className="mt-1 opacity-75">
                                  {when(entry.meeting.startsAt)}
                                </p>
                              </div>
                            )}
                          </div>
                          <div
                            className={`mt-1.5 flex items-center gap-1 text-[10px] text-[#8b99af] ${entry.mine ? "justify-end" : "justify-start"}`}
                          >
                            <time>{when(entry.at, true)}</time>
                            {entry.mine && (
                              <Check size={12} aria-label="Sent" />
                            )}
                          </div>
                        </div>
                      </article>
                    </div>
                  ))}
                {threadReady && !snapshot?.thread.length && (
                  <p className="py-10 text-center text-sm text-[#8b99af]">
                    {threadQuery
                      ? "No messages match this search."
                      : "Say hello to start the conversation."}
                  </p>
                )}
              </div>
              {snapshot?.canWrite ? (
                <form
                  aria-label="Message composer"
                  className="shrink-0 border-t border-blue-100/70 bg-white p-3 sm:p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                  }}
                >
                  <fieldset disabled={pending} className="min-w-0">
                    {work && (
                      <div className="mb-3 flex flex-wrap items-end gap-2 rounded-2xl bg-[#f5f9ff] p-3">
                        <p className="w-full text-xs font-semibold text-[#075bff]">
                          {MODES.find((item) => item.id === mode)?.label}
                          <button
                            type="button"
                            aria-label="Cancel work item"
                            onClick={() => setMode("message")}
                            className="float-right text-[#71809a]"
                          >
                            <X size={14} />
                          </button>
                        </p>
                        {mode !== "note" && (
                          <>
                            <label className="min-w-0 flex-1 text-xs text-[#71809a]">
                              Assign to
                              <select
                                value={assignee}
                                onChange={(event) =>
                                  setAssignee(event.target.value)
                                }
                                className="mt-1 w-full rounded-xl border border-blue-100 bg-white p-2 text-xs text-slate-800"
                              >
                                <option value="">Me</option>
                                {snapshot.people.map((person) => (
                                  <option key={person.id} value={person.id}>
                                    {person.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-xs text-[#71809a]">
                              {mode === "meeting" ? "When" : "Due"}
                              <input
                                required={mode === "meeting"}
                                type={
                                  mode === "meeting" ? "datetime-local" : "date"
                                }
                                value={mode === "meeting" ? starts : due}
                                onChange={(event) =>
                                  mode === "meeting"
                                    ? setStarts(event.target.value)
                                    : setDue(event.target.value)
                                }
                                className="mt-1 block max-w-full rounded-xl border border-blue-100 bg-white p-2 text-xs"
                              />
                            </label>
                            {mode !== "meeting" && (
                              <label className="text-xs text-[#71809a]">
                                Priority
                                <select
                                  value={priority}
                                  onChange={(event) =>
                                    setPriority(event.target.value)
                                  }
                                  className="mt-1 block rounded-xl border border-blue-100 bg-white p-2 text-xs"
                                >
                                  <option value="NORMAL">Normal</option>
                                  <option value="HIGH">High</option>
                                  <option value="LOW">Low</option>
                                </select>
                              </label>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {attached.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {attached.map((item) => (
                          <button
                            key={`${item.type}:${item.id}`}
                            type="button"
                            aria-label={`Remove ${item.title}`}
                            onClick={() =>
                              setAttached((current) =>
                                current.filter(
                                  (link) =>
                                    !(
                                      link.type === item.type &&
                                      link.id === item.id
                                    ),
                                ),
                              )
                            }
                            className="inline-flex max-w-full items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-[#075bff]"
                          >
                            <Paperclip size={12} />
                            <span className="truncate">
                              {LINK_LABELS[item.type]} · {item.title}
                            </span>
                            <X size={12} className="shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                    {tagMatches.length > 0 && (
                      <div
                        role="listbox"
                        aria-label="Tag someone"
                        className="mb-2 flex flex-wrap gap-1"
                      >
                        {tagMatches.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => tagPerson(person.name)}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                          >
                            @{person.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="rounded-2xl border border-blue-100 bg-[#fafcff] p-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50">
                      <textarea
                        aria-label="Message"
                        disabled={pending}
                        required={!attached.length || work}
                        value={draft}
                        maxLength={4000}
                        rows={2}
                        placeholder={
                          mode === "message"
                            ? `Message ${active.title}…`
                            : mode === "note"
                              ? "Write a note…"
                              : mode === "meeting"
                                ? "Meeting title…"
                                : "What needs doing?"
                        }
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing &&
                            mode === "message"
                          ) {
                            event.preventDefault();
                            void submit();
                          }
                        }}
                        className="max-h-32 min-h-12 w-full resize-y border-0 bg-transparent px-2 py-1.5 text-sm outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pending || attached.length >= 8}
                          aria-label="Attach a record"
                          title="Attach a record"
                          onClick={() => {
                            setAttachOpen(true);
                            setHits([]);
                            setRecordSearching(true);
                          }}
                          className="rounded-xl p-2.5 text-[#71809a] hover:bg-blue-50 hover:text-[#075bff] disabled:opacity-40"
                        >
                          <Paperclip size={18} />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            disabled={pending}
                            aria-label="Create work from chat"
                            aria-expanded={menu}
                            title="Create work"
                            onClick={() => setMenu((value) => !value)}
                            className="rounded-xl p-2.5 text-[#71809a] hover:bg-blue-50"
                          >
                            <Plus size={19} />
                          </button>
                          {menu && (
                            <div className="absolute bottom-12 left-0 z-10 w-44 rounded-2xl border border-blue-100 bg-white p-1.5 shadow-xl">
                              {MODES.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  disabled={
                                    !snapshot.projectsReady &&
                                    item.id !== "note"
                                  }
                                  onClick={() => {
                                    setMode(item.id);
                                    setMenu(false);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 disabled:opacity-40"
                                >
                                  <item.icon
                                    size={15}
                                    className="text-[#075bff]"
                                  />
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="hidden flex-1 pl-1 text-[10px] text-[#8b99af] sm:block">
                          Enter to send · Shift + Enter for a new line
                        </span>
                        <button
                          type="submit"
                          disabled={
                            pending || (!draft.trim() && !attached.length)
                          }
                          aria-label="Send message"
                          className="ml-auto flex items-center gap-2 rounded-xl bg-[#075bff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                        >
                          {pending ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <Send size={15} />
                          )}
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </form>
              ) : (
                <p className="border-t border-blue-100 p-4 text-center text-xs text-[#71809a]">
                  You have read-only access to messages.
                </p>
              )}
              {details && (
                <aside
                  aria-label="Conversation information"
                  className="absolute inset-y-0 right-0 z-10 flex w-full max-w-[300px] flex-col border-l border-blue-100 bg-white shadow-[-12px_0_40px_-24px_rgba(35,77,140,0.35)]"
                >
                  <div className="flex items-center justify-between border-b border-blue-100 p-4">
                    <h4 className="text-sm font-semibold">
                      Conversation details
                    </h4>
                    <button
                      type="button"
                      aria-label="Close conversation details"
                      onClick={() => setDetails(false)}
                      className="rounded-xl p-2 text-[#71809a] hover:bg-blue-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8b99af]">
                      Participants · {active.peopleCount}
                    </p>
                    <div className="mt-4 space-y-3">
                      {active.participants.map((person) => (
                        <div
                          key={`${person.type}:${person.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[10px] font-semibold text-[#075bff]">
                            {initials(person.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-slate-900">
                              {person.name}
                              {person.mine ? " (you)" : ""}
                            </span>
                            <span className="block text-[10px] text-[#71809a]">
                              {person.type === "contact"
                                ? "Customer contact · Stored in Atlas"
                                : "Colleague"}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-[#8b99af]">
                      Shared in these messages
                    </p>
                    <div className="mt-3 space-y-2">
                      {shared.map((link, index) =>
                        link.href ? (
                          <Link
                            key={index}
                            href={link.href}
                            className="block rounded-xl border border-blue-100 p-3 hover:bg-blue-50"
                          >
                            <span className="block text-[9px] font-semibold uppercase text-[#075bff]">
                              {LINK_LABELS[link.type]}
                            </span>
                            <span className="mt-1 block break-words text-xs font-semibold">
                              {link.title}
                            </span>
                            <span className="block break-words text-[10px] text-[#71809a]">
                              {link.subtitle}
                            </span>
                          </Link>
                        ) : (
                          <p
                            key={index}
                            className="rounded-xl bg-slate-50 p-3 text-xs text-[#71809a]"
                          >
                            Attached record · Not available to you
                          </p>
                        ),
                      )}
                      {!shared.length && (
                        <p className="text-xs leading-relaxed text-[#71809a]">
                          Orders, quotations and other records shared in the
                          displayed messages will appear here.
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </>
          )}
        </section>
        {newChatOpen && (
          <div
            role="dialog"
            aria-label="New conversation"
            className="absolute inset-0 z-20 flex flex-col bg-white"
          >
            <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
              <UserPlus size={20} className="text-[#075bff]" />
              <div className="flex-1">
                <h3 className="font-semibold">New conversation</h3>
                <p className="mt-0.5 text-xs text-[#71809a]">
                  Choose colleagues or customer contacts
                </p>
              </div>
              <button
                type="button"
                aria-label="Cancel new conversation"
                onClick={closeNewChat}
                className="p-2 text-[#71809a]"
              >
                <X size={18} />
              </button>
            </div>
            <label className="mx-5 mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-[#f9fbff] p-3">
              <Search size={17} className="text-[#71809a]" />
              <input
                autoFocus
                aria-label="Search people"
                value={peopleQuery}
                onChange={(event) => {
                  setPeopleQuery(event.target.value);
                  setPeopleHits([]);
                  setPeopleSearching(Boolean(event.target.value.trim()));
                }}
                placeholder="Search by name or customer…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {(peopleQuery.trim() ? peopleHits : []).map((hit) => {
                const selected =
                  hit.type === "user"
                    ? picked.includes(hit.id)
                    : pickedContacts.includes(hit.id);
                return (
                  <label
                    key={`${hit.type}:${hit.id}`}
                    className={`mb-2 flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${selected ? "border-blue-200 bg-blue-50" : "border-transparent hover:bg-[#f9fbff]"}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xs font-semibold text-[#075bff]">
                      {initials(hit.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {hit.name}
                      </span>
                      <span className="block truncate text-xs text-[#71809a]">
                        {hit.subtitle}
                        {hit.type === "contact" ? " · Contact" : ""}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={
                        pending ||
                        (!selected &&
                          picked.length + pickedContacts.length >= 11)
                      }
                      aria-label={`Add ${hit.name}`}
                      onChange={() => togglePersonHit(hit)}
                      className="size-4 accent-blue-600"
                    />
                  </label>
                );
              })}
              {peopleSearching && (
                <p className="py-6 text-center text-sm text-[#71809a]">
                  Searching…
                </p>
              )}
              {!peopleSearching && !peopleHits.length && (
                <p className="py-8 text-center text-sm text-[#71809a]">
                  {peopleQuery.trim()
                    ? "No matching people."
                    : "Search for someone to start a conversation."}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 border-t border-blue-100 p-5">
              <p className="min-w-0 flex-1 truncate text-xs text-[#71809a]">
                {[...picked, ...pickedContacts]
                  .map((id) => pickedNames[id])
                  .join(", ") || "Up to 11 other participants"}
              </p>
              <button
                type="button"
                disabled={pending || (!picked.length && !pickedContacts.length)}
                onClick={() => void start(picked, pickedContacts)}
                className="shrink-0 rounded-xl bg-[#075bff] px-4 py-3 text-xs font-semibold text-white disabled:opacity-40"
              >
                {pending ? "Opening…" : "Start chat"}
              </button>
            </div>
          </div>
        )}
        {attachOpen && (
          <div
            role="dialog"
            aria-label="Attach Atlas records"
            className="absolute inset-0 z-20 flex flex-col bg-white"
          >
            <div className="flex items-center gap-3 border-b border-blue-100 p-5">
              <Paperclip size={20} className="text-[#075bff]" />
              <div className="flex-1">
                <h3 className="font-semibold">Attach Atlas records</h3>
                <p className="mt-1 text-xs text-[#71809a]">
                  Share the real record · {attached.length} of 8 selected
                </p>
              </div>
              <button
                type="button"
                aria-label="Done attaching records"
                onClick={() => setAttachOpen(false)}
                className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-[#075bff]"
              >
                Done
              </button>
            </div>
            <label className="mx-5 mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-[#f9fbff] p-3">
              <Search size={17} className="text-[#71809a]" />
              <input
                autoFocus
                aria-label="Search records to attach"
                value={attachQuery}
                onChange={(event) => {
                  setAttachQuery(event.target.value);
                  setHits([]);
                  setRecordSearching(true);
                }}
                maxLength={80}
                placeholder="Order number, customer, product…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {Object.entries(LINK_LABELS).map(([type, label]) => {
                const records = hits.filter((item) => item.type === type);
                return records.length ? (
                  <div key={type} className="mb-5">
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b99af]">
                      {label}
                    </h4>
                    {records.map((item) => {
                      const selected = attached.some(
                        (link) =>
                          link.type === item.type && link.id === item.id,
                      );
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!selected && attached.length >= 8}
                          onClick={() =>
                            setAttached((current) =>
                              selected
                                ? current.filter(
                                    (link) =>
                                      !(
                                        link.type === item.type &&
                                        link.id === item.id
                                      ),
                                  )
                                : [...current, item],
                            )
                          }
                          aria-pressed={selected}
                          className={`mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left disabled:opacity-40 ${selected ? "border-blue-200 bg-blue-50" : "border-blue-100 hover:bg-[#f9fbff]"}`}
                        >
                          <Paperclip
                            size={16}
                            className="shrink-0 text-[#075bff]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-sm font-semibold">
                              {item.title}
                            </span>
                            <span className="block break-words text-xs text-[#71809a]">
                              {item.subtitle}
                            </span>
                          </span>
                          {selected ? (
                            <Check
                              size={17}
                              className="shrink-0 text-[#075bff]"
                            />
                          ) : (
                            <Plus
                              size={17}
                              className="shrink-0 text-[#8b99af]"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null;
              })}
              {recordSearching && (
                <p className="py-8 text-center text-sm text-[#71809a]">
                  Searching records…
                </p>
              )}
              {!recordSearching && !hits.length && (
                <p className="py-8 text-center text-sm text-[#71809a]">
                  No available records match this search.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {(error || loadError) && (
        <p
          role="alert"
          className="shrink-0 border-t border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-700"
        >
          {error || loadError}
        </p>
      )}
    </div>
  );
  return (
    <>
      {!page && (
        <button
          type="button"
          aria-label="Open messages"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-[#526587] hover:bg-blue-50"
        >
          <MessageCircle size={20} strokeWidth={1.7} />
          {(snapshot?.unread ?? 0) > 0 && (
            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#075bff] px-1 text-[9px] font-semibold text-white">
              {snapshot!.unread > 9 ? "9+" : snapshot!.unread}
            </span>
          )}
        </button>
      )}
      {!page && open && (
        <button
          type="button"
          aria-label="Dismiss messages"
          className="fixed inset-0 z-[70] bg-slate-900/10 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}
      {!page && open && (
        <div
          ref={focusPanel}
          role="dialog"
          aria-modal="true"
          aria-label="Messages"
          tabIndex={-1}
          className="fixed bottom-3 right-3 top-3 z-[71] w-[calc(100%-1.5rem)] outline-none md:bottom-5 md:right-5 md:top-auto md:h-[min(760px,calc(100dvh-2.5rem))] md:w-[min(960px,calc(100%-2.5rem))]"
        >
          {panel}
        </div>
      )}
      {page && (
        <div className="h-[calc(100dvh-220px)] min-h-[520px] lg:h-[calc(100dvh-112px)]">
          {panel}
        </div>
      )}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[72] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className="pointer-events-auto rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-xl"
            onClick={() => {
              setOpen(true);
              choose(toast.conversationId, null);
              setToasts((current) =>
                current.filter((item) => item.id !== toast.id),
              );
            }}
          >
            <p className="text-xs font-semibold text-slate-900">
              {toast.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-[#71809a]">
              {toast.body}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}
