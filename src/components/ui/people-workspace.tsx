import Link from "next/link";
import type { ReactNode } from "react";

export const workspacePanel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
export const workspaceField = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

export function PeopleWorkspaceHeader({ eyebrow, title, description, actions, children }: { eyebrow: string; title: string; description: string; actions?: ReactNode; children?: ReactNode }) {
  return <header className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">{eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>{children && <div className="mt-6">{children}</div>}
  </header>;
}

export function WorkspaceStats({ items }: { items: { label: string; value: string | number; detail?: string; href?: string; tone?: "warning" | "success" }[] }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map(item => { const content = <><p className="text-xs font-medium text-slate-500">{item.label}</p><p className={`mt-2 text-3xl font-semibold tracking-tight ${item.tone === "warning" ? "text-amber-700" : item.tone === "success" ? "text-emerald-700" : "text-slate-950"}`}>{item.value}</p>{item.detail && <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>}</>; return item.href ? <Link key={item.label} href={item.href} className={`${workspacePanel} transition hover:border-blue-300`}>{content}</Link> : <div key={item.label} className={workspacePanel}>{content}</div>; })}</div>;
}

export function WorkspaceTabs({ items, active }: { items: { label: string; href: string; id: string }[]; active: string }) {
  return <nav aria-label="Workspace views" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">{items.map(item => <Link key={item.id} href={item.href} aria-current={item.id === active ? "page" : undefined} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${item.id === active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>{item.label}</Link>)}</nav>;
}
