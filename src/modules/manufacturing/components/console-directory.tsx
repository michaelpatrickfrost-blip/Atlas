"use client";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, CalendarRange, Factory, Layers3, Package, SlidersHorizontal, Wallet } from "lucide-react";
import { CONSOLE_ROLES, type ConsoleDestination, type ConsoleRole } from "../domain/console";
const stageIcons = { Demand: CalendarRange, Materials: Layers3, Schedule: CalendarRange, Production: Factory, "Products & plant": Package, "Finance & procurement": Wallet };
const roleLabels = { all: "Whole operation", planner: "Planner", buyer: "Procurement", production: "Production", finance: "Finance" };
export function ConsoleDirectory({ destinations, role, pins }: { destinations: ConsoleDestination[]; role: ConsoleRole; pins: string[] }) {
  const [query, setQuery] = useState("");
  const [selectedPins, updatePins] = useOptimistic(pins, (_current: string[], next: string[]) => next);
  const [, startTransition] = useTransition();
  const [customising, setCustomising] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const visible = destinations.filter((item) => (role === "all" || item.roles.includes(role)) && `${item.label} ${item.description} ${item.stage}`.toLowerCase().includes(query.toLowerCase()));
  const stages = [...new Set(visible.map((item) => item.stage))];
  const shortcuts = selectedPins.map((id) => destinations.find((item) => item.id === id)).filter((item): item is ConsoleDestination => !!item);
  const roleHref = (next: ConsoleRole) => { const params = new URLSearchParams(search.toString()); params.set("role", next); return `/manufacturing?${params}`; };
  function togglePin(id: string) {
    const params = new URLSearchParams(search.toString());
    const next = selectedPins.includes(id) ? selectedPins.filter((pin) => pin !== id) : [...selectedPins, id].slice(-6);
    params.set("pins", next.join(","));
    startTransition(() => { updatePins(next); router.replace(`/manufacturing?${params}`, { scroll: false }); });
  }
  return <section className="space-y-5" aria-label="Supply workspace">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Console views" className="flex max-w-full flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1.5">{CONSOLE_ROLES.map((value) => <Link key={value} href={roleHref(value)} aria-current={role === value ? "page" : undefined} className={`rounded-xl px-3 py-2 text-xs font-semibold ${role === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:bg-white/60"}`}>{roleLabels[value]}</Link>)}</nav>
      <button type="button" onClick={() => setCustomising(!customising)} aria-expanded={customising} aria-controls="console-shortcuts" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><SlidersHorizontal size={14} />Customise shortcuts</button>
    </div>
    {customising && <div id="console-shortcuts" className="rounded-2xl border border-blue-100 bg-white p-5"><h3 className="text-sm font-semibold">Your quick access</h3><p className="mt-1 text-xs text-slate-500">Choose up to six destinations. Bookmark this view to keep your selection.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{destinations.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg p-2 text-xs hover:bg-blue-50"><input type="checkbox" checked={selectedPins.includes(item.id)} onChange={() => togglePin(item.id)} />{item.label}</label>)}</div></div>}
    {!!shortcuts.length && <nav aria-label="Quick access" className="flex flex-wrap gap-2">{shortcuts.map((item) => <Link key={item.id} href={item.href} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs font-semibold text-blue-700"><ArrowUpRight size={14} />{item.label}</Link>)}</nav>}
    <label className="block"><span className="sr-only">Find a supply workspace</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find demand, materials, machines, purchase orders, spend…" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm outline-blue-500" /></label>
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{stages.map((stage) => { const Icon = stageIcons[stage]; return <section key={stage} className="min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_6px_24px_-18px_rgba(52,83,132,0.22)]"><div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon size={20} /></span><h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{stage}</h3></div><div className="space-y-1">{visible.filter((item) => item.stage === stage).map((item) => <Link key={item.id} href={item.href} prefetch={false} className="group flex items-start gap-3 rounded-xl p-3 hover:bg-blue-50/70"><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800 group-hover:text-blue-700">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span><ArrowUpRight className="mt-0.5 shrink-0 text-slate-400 group-hover:text-blue-600" size={16} /></Link>)}</div></section>; })}</div>
    {!visible.length && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No accessible workspaces match this view. Choose Whole operation or change the search.</p>}
  </section>;
}
