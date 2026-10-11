"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ListTodo } from "lucide-react";
import { loadMyTaskCount } from "@/app/(app)/profile/task-actions";
const TaskCount = createContext<number | null>(null);
export function TaskNotifications({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true, pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try { const result = await loadMyTaskCount(); if (active) setCount(result); }
      catch { /* Keep the last confirmed count; the panel reports load failures. */ }
      finally { pending = false; }
    };
    const update = (event: Event) => { const value = (event as CustomEvent<number>).detail; if (Number.isSafeInteger(value) && value >= 0) setCount(value); };
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("atlas:task-count", update);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener("atlas:task-count", update); };
  }, []);
  return <TaskCount.Provider value={count}>{children}</TaskCount.Provider>;
}
export function useTaskCount() { return useContext(TaskCount); }
export function TasksButton() {
  const count = useContext(TaskCount);
  return <button type="button" aria-label="Open my tasks" title={count === null ? "My tasks" : `My tasks · ${count} open`} onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-tasks"))} className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 sm:size-10"><ListTodo size={20} />{count !== null && count > 0 && <span aria-label={`${count} open tasks`} className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-4 text-white">{count > 99 ? "99+" : count}</span>}</button>;
}
