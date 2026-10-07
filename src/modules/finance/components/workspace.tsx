import Link from "next/link";
import type { ReactNode } from "react";

export const financeField = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
export const financeSection = "space-y-4 border-t border-slate-200 pt-6";
export function FinanceWorkspace({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="space-y-7"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p></div><Link className="text-sm text-blue-700" href="/finance/help">Finance help</Link></header>{children}</div>;
}
export function FinanceEntities({ entities, selected, path }: { entities: { id: string; name: string; currency: string }[]; selected?: string; path: string }) {
  return <nav aria-label="Legal entity" className="flex flex-wrap gap-2">{entities.map(entity => <Link key={entity.id} href={`${path}?entity=${entity.id}`} aria-current={selected === entity.id ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm ${selected === entity.id ? "bg-blue-50 font-medium text-blue-800" : "text-slate-600 hover:bg-slate-50"}`}>{entity.name} · {entity.currency}</Link>)}</nav>;
}
export function FinancePagination({ page, count, href, size = 50 }: { page: number; count: number; href: string; size?: number }) {
  return <div className="flex items-center justify-between gap-4 text-sm text-slate-500"><span>{count ? `${page * size + 1}–${Math.min((page + 1) * size, count)} of ${count}` : "No records"}</span><div className="flex gap-5">{page > 0 && <Link className="text-blue-700" href={`${href}&page=${page - 1}`}>Previous</Link>}{(page + 1) * size < count && <Link className="text-blue-700" href={`${href}&page=${page + 1}`}>Next</Link>}</div></div>;
}
