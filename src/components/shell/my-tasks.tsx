"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, CheckCheck, ChevronRight, Circle, ListTodo, LoaderCircle, Paperclip, RefreshCw, Search, X } from "lucide-react";
import { loadMyTask, loadMyTasks, updateMyTaskStatus } from "@/app/(app)/profile/task-actions";
import { taskClosed, taskStatusLabel, type MyTask, type MyTaskDetail, type MyTaskPage, type TaskFilter } from "@/core/shared/my-tasks";

const empty: MyTaskPage = { items: [], openCount: 0, completedCount: 0, hasMore: false };
const keyOf = (task: MyTask) => `${task.source}:${task.id}`;
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50";
function dueLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }).format(new Date(value)) : "No due date";
}
function overdue(task: MyTask) {
  if (!task.dueAt || taskClosed(task.status)) return false;
  const day = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return day(new Date(task.dueAt)) < day(new Date());
}
function failure(error: unknown, fallback: string) {
  return error instanceof Error && error.name === "UnrecognizedActionError"
    ? "Atlas was updated. Close this panel and refresh the page before trying again."
    : fallback;
}

/** One modal in the company/user keyed business shell; no local task cache. */
export function MyTasksPanel() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false), [open, setOpen] = useState(false);
  const [data, setData] = useState<MyTaskPage>(empty), [filter, setFilter] = useState<TaskFilter>("open"), [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MyTask | null>(null), [detail, setDetail] = useState<MyTaskDetail | null>(null);
  const [loading, setLoading] = useState(false), [detailLoading, setDetailLoading] = useState(false), [saving, setSaving] = useState(false);
  const [error, setError] = useState(""), [detailError, setDetailError] = useState(""), [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null), returnFocus = useRef<HTMLElement | null>(null);
  const listRequest = useRef(0), detailRequest = useRef(0), page = useRef(0), savePending = useRef(false);
  const close = useCallback(() => {
    if (savePending.current) return;
    listRequest.current++; detailRequest.current++;
    setOpen(false); setSelected(null); setDetail(null); setData(empty); setQuery(""); setFilter("open"); setError(""); setDetailError(""); setMessage("");
  }, []);
  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);
    const show = () => { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setOpen(true); };
    window.addEventListener("atlas:open-tasks", show);
    return () => { clearTimeout(mountTimer); window.removeEventListener("atlas:open-tasks", show); };
  }, []);
  useEffect(() => { const timer = setTimeout(close, 0); return () => clearTimeout(timer); }, [pathname, close]);
  useEffect(() => {
    if (!mounted || !dialog.current) return;
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) { dialog.current.close(); returnFocus.current?.focus(); }
  }, [open, mounted]);
  const fetchPage = useCallback(async (nextPage = 0) => {
    const request = ++listRequest.current;
    setLoading(true); setError("");
    try {
      const result = await loadMyTasks({ filter, query, page: nextPage });
      if (request !== listRequest.current) return;
      window.dispatchEvent(new CustomEvent("atlas:task-count", { detail: result.openCount }));
      page.current = nextPage;
      setData((current) => ({ ...result, items: nextPage ? [...new Map([...current.items, ...result.items].map((task) => [keyOf(task), task])).values()] : result.items }));
    } catch (error) {
      if (request === listRequest.current) { if (!nextPage) setData(empty); setError(failure(error, "Your tasks could not be loaded. Try refreshing the list.")); }
    } finally { if (request === listRequest.current) setLoading(false); }
  }, [filter, query]);
  useEffect(() => {
    if (!open) return;
    listRequest.current++;
    const timer = setTimeout(() => { setData(empty); void fetchPage(); }, 200);
    // Invalidate the latest request token when filters change or the panel closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { clearTimeout(timer); listRequest.current++; };
  }, [open, fetchPage]);
  async function selectTask(task: MyTask) {
    if (savePending.current) return;
    const request = ++detailRequest.current;
    setSelected(task); setDetail(null); setDetailError(""); setMessage(""); setDetailLoading(true);
    try {
      const loaded = await loadMyTask(task.source, task.id);
      if (request === detailRequest.current) setDetail(loaded);
    } catch (error) { if (request === detailRequest.current) setDetailError(failure(error, "This task is no longer available, or your access has changed. Refresh the list.")); }
    finally { if (request === detailRequest.current) setDetailLoading(false); }
  }
  async function saveStatus(status: string) {
    if (!detail || !detail.editable || savePending.current || status === detail.status) return;
    savePending.current = true; setSaving(true); setDetailError(""); setMessage("");
    try {
      const result = await updateMyTaskStatus({ source: detail.source, id: detail.id, version: detail.version, status });
      if (!result.saved) { setDetailError(result.error); return; }
      setDetail(result.detail);
      setMessage(result.detail ? "Status saved." : "Status saved. Refresh the task to see its latest details.");
      await fetchPage();
    } catch (error) { setDetailError(failure(error, "The status could not be saved. Refresh the task before trying again.")); }
    finally { savePending.current = false; setSaving(false); }
  }
  async function refresh() {
    if (savePending.current) return;
    await fetchPage();
    if (selected) await selectTask(selected);
  }
  const visibleList = !selected;
  if (!mounted) return null;
  return createPortal(
    <dialog ref={dialog} aria-labelledby="my-tasks-title" onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={close} onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      className="fixed inset-x-4 top-4 m-0 h-[calc(100dvh-2rem)] max-h-[820px] w-auto max-w-[980px] overflow-hidden rounded-[28px] border border-blue-100 bg-white p-0 text-slate-800 shadow-[0_30px_100px_-24px_rgba(17,47,103,0.35)] backdrop:bg-slate-950/25 backdrop:backdrop-blur-[3px] sm:top-20 sm:h-[calc(100dvh-6rem)] lg:left-[180px]">
      {open && <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white"><ListTodo size={23} /></span>
            <div><h2 id="my-tasks-title" className="text-xl font-semibold tracking-tight text-slate-900">My tasks</h2><p className="mt-0.5 text-xs text-slate-500">Your assigned work, all in one place.</p></div></div>
          <div className="flex shrink-0 gap-1"><button type="button" aria-label="Refresh tasks" disabled={loading || saving} onClick={() => void refresh()} className="flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-blue-100 disabled:opacity-40"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
            <button type="button" aria-label="Close my tasks" disabled={saving} onClick={close} className="flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-blue-100 disabled:opacity-40"><X size={20} /></button></div>
        </header>
        <div className="grid min-h-0 flex-1 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section aria-label="Assigned task list" className={`${visibleList ? "flex" : "hidden sm:flex"} min-h-0 flex-col border-r border-slate-100 bg-[#f8faff]`}>
            <div className="space-y-4 border-b border-slate-100 p-4">
              <div className="flex gap-3 text-xs"><span className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-blue-700"><strong className="mr-1 text-lg font-semibold">{data.openCount}</strong> open</span><span className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-slate-500"><strong className="mr-1 text-lg font-semibold">{data.completedCount}</strong> completed</span></div>
              <label className="relative block"><Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input autoFocus aria-label="Find my tasks" value={query} maxLength={120} onChange={(event) => setQuery(event.target.value)} placeholder="Find a task or note…" className={`${inputClass} !pl-9`} /></label>
              <div className="flex rounded-xl bg-slate-100/80 p-1" aria-label="Task filters">{(["open", "completed", "all"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-medium capitalize ${filter === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{value}</button>)}</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {error && <div role="alert" className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
              {loading && !data.items.length ? <div role="status" className="flex items-center gap-2 p-5 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" />Loading your tasks…</div> : data.items.map((task) => <button key={keyOf(task)} type="button" disabled={saving} onClick={() => void selectTask(task)} aria-pressed={selected ? keyOf(selected) === keyOf(task) : false}
                className={`mb-2 flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors disabled:opacity-50 ${selected && keyOf(selected) === keyOf(task) ? "border-blue-200 bg-blue-50" : "border-transparent bg-white hover:border-blue-100 hover:bg-blue-50/60"}`}>
                <span className={`mt-0.5 shrink-0 ${taskClosed(task.status) ? "text-emerald-500" : task.status === "BLOCKED" ? "text-rose-400" : "text-blue-400"}`}>{taskClosed(task.status) ? <CheckCheck size={19} /> : <Circle size={19} />}</span>
                <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold leading-5 text-slate-800">{task.title}</span><span className="mt-1 block truncate text-xs text-slate-400">{task.context}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"><span className={`rounded-md px-1.5 py-0.5 ${taskClosed(task.status) ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{taskStatusLabel(task.status)}</span><span className={overdue(task) ? "text-rose-600" : "text-slate-400"}>{overdue(task) ? "Overdue · " : ""}{dueLabel(task.dueAt)}</span>{task.hasAttachments && <Paperclip aria-label="Has attached records" size={12} />}</span>
                </span><ChevronRight size={15} className="mt-1 shrink-0 text-slate-300" />
              </button>)}
              {!loading && !error && !data.items.length && <div className="px-4 py-10 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-400"><CheckCheck size={25} /></span><p className="mt-4 text-sm font-semibold">{query ? "No matching tasks" : filter === "completed" ? "No completed tasks yet" : "You're all caught up"}</p><p className="mt-2 text-xs leading-5 text-slate-400">{query ? "Try a different title or note." : "Tasks assigned to you appear here when you have access to their workspace."}</p></div>}
              {data.hasMore && <button type="button" disabled={loading} onClick={() => void fetchPage(page.current + 1)} className="mt-2 w-full rounded-xl border border-blue-100 bg-white py-3 text-sm text-blue-700 disabled:opacity-40">{loading ? "Loading…" : "Load more tasks"}</button>}
            </div>
          </section>
          <section aria-label="Task details" className={`${selected ? "flex" : "hidden sm:flex"} min-h-0 min-w-0 flex-col bg-white`}>
            {selected && <button type="button" disabled={saving} onClick={() => { detailRequest.current++; setSelected(null); setDetail(null); }} className="flex min-h-11 shrink-0 items-center gap-2 border-b border-slate-100 px-5 text-xs text-blue-700 sm:hidden"><ArrowLeft size={15} />Back to tasks</button>}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {detailLoading && <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" />Opening task…</p>}
              {detailError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{detailError}</p>}
              {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
              {detail && <>
                <p className="text-xs font-medium capitalize text-blue-600">{detail.kind} · {detail.context}</p><h3 className="mt-2 break-words text-2xl font-semibold leading-8 tracking-tight text-slate-900">{detail.title}</h3>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-slate-500"><CalendarDays size={14} />{dueLabel(detail.dueAt)}</span>{["HIGH", "CRITICAL"].includes(detail.priority) && <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">{detail.priority === "CRITICAL" ? "Critical" : "High priority"}</span>}</div>
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4"><label className="block text-xs font-medium text-slate-500">Task status</label>
                  {detail.editable ? <select aria-label="Task status" value={detail.status} disabled={saving} onChange={(event) => void saveStatus(event.target.value)} className={`${inputClass} mt-2 font-medium text-blue-700`}>{detail.statuses.map((status) => <option key={status} value={status}>{taskStatusLabel(status)}</option>)}</select> : <p className="mt-2 text-sm font-semibold text-slate-700">{taskStatusLabel(detail.status)}</p>}
                  <p className="mt-2 text-xs text-slate-400">{saving ? "Saving status…" : detail.editable ? "Choose a status to save it immediately." : "This task is read-only with your current access."}</p></div>
                <section className="mt-6"><h4 className="text-sm font-semibold">Task notes</h4><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">{detail.description || "No notes have been added to this task."}</p></section>
                {!!detail.checklist.length && <section className="mt-6"><h4 className="text-sm font-semibold">Checklist</h4><div className="mt-3 space-y-2">{detail.checklist.map((item) => <p key={item.id} className="flex items-start gap-2 text-sm text-slate-500">{item.done ? <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> : <Circle size={16} className="mt-0.5 shrink-0 text-slate-300" />}{item.title}</p>)}</div><p className="mt-3 text-xs text-slate-400">Open the full task to work through its checklist.</p></section>}
                {!!detail.notes.length && <section className="mt-6"><h4 className="text-sm font-semibold">Discussion</h4><div className="mt-3 space-y-3">{detail.notes.map((note) => <article key={note.id} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{note.author} · {dueLabel(note.at)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{note.body}</p></article>)}</div></section>}
                {!!detail.attachments.length && <section className="mt-6"><h4 className="flex items-center gap-2 text-sm font-semibold"><Paperclip size={15} />Attached records</h4><div className="mt-3 space-y-2">{detail.attachments.map((attachment) => attachment.href ? <Link key={attachment.key} href={attachment.href} onClick={close} className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 hover:bg-blue-50"><span className="min-w-0"><span className="block break-words text-sm font-medium text-blue-700">{attachment.title}</span><span className="mt-1 block text-xs text-slate-400">{attachment.detail}</span></span><ArrowUpRight size={16} className="shrink-0 text-blue-400" /></Link> : <p key={attachment.key} className="rounded-2xl border border-slate-100 p-4 text-xs text-slate-400">{attachment.title} · {attachment.detail}</p>)}</div></section>}
                <Link href={detail.href} onClick={close} className="mt-7 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">Open full task<ArrowUpRight size={14} /></Link>
              </>}
              {!selected && <div className="flex h-full flex-col items-center justify-center px-6 text-center"><span className="flex size-16 items-center justify-center rounded-[22px] bg-blue-50 text-blue-400"><ListTodo size={31} strokeWidth={1.5} /></span><h3 className="mt-5 text-lg font-semibold">A little focus for your day</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">Choose a task to see its notes, open attached records and update its status.</p></div>}
            </div>
          </section>
        </div>
      </div>}
    </dialog>, document.body,
  );
}
