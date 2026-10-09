import Link from "next/link";
import { ArrowRight, CalendarRange, Factory, ShoppingCart, TriangleAlert } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { readSupplyConsole } from "../services/console";
import { consoleRole } from "../domain/console";
import { ConsoleDirectory } from "./console-directory";
import { ActionForm } from "@/components/ui/action-form";
import { runMrpForm } from "@/app/(app)/manufacturing/planning/form-actions";

export default async function SupplyConsole({ searchParams }: { searchParams: Promise<{ role?: string; pins?: string }> }) {
  const session = await requireSession();
  const data = await readSupplyConsole(session);
  const query = await searchParams;
  const role = consoleRole(query.role);
  const allowed = new Set(data.destinations.map((item) => item.id));
  const pins = [...new Set((typeof query.pins === "string" ? query.pins.split(",") : ["demand", "mrp", "shortages", "schedule", "purchases", "spend"]).filter((id) => allowed.has(id)))].slice(0, 6);
  const canRun = ["manufacturing", "sales", "stock", "products"].every((id) => data.enabled.has(id)) && ["manufacturing.plan.manage", "sales.order.read", "stock.read", "core.products.read", "customers.read"].every((cap) => session.capabilities.has(cap));
  const metrics = [
    ...(data.production ? [{ label: "Active production", value: data.production[0], href: "/manufacturing/produce", icon: Factory, warning: false }, { label: "Late / blocked", value: `${data.production[1]} / ${data.production[2]}`, href: "/manufacturing/produce", icon: TriangleAlert, warning: data.production[1] + data.production[2] > 0 }] : []),
    ...(session.capabilities.has("manufacturing.plan.read") ? [{ label: "Make proposals", value: data.pending.find((row) => row.kind === "MAKE")?._count ?? 0, href: "/manufacturing/planning/planned-orders", icon: CalendarRange, warning: false }, { label: "Buy proposals", value: data.pending.find((row) => row.kind === "BUY")?._count ?? 0, href: "/manufacturing/planning/planned-orders", icon: ShoppingCart, warning: false }] : []),
  ];
  return <div className="space-y-7">
    <header className="overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-br from-[#edf5ff] via-white to-[#f3f7ff] p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">{session.organisationName} · connected operations</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Plan it. Make it. Deliver it.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Your manufacturing operation in one place. Start with demand, resolve materials, schedule the plant and follow production through to purchasing and Finance.</p></div>{canRun && <ActionForm action={runMrpForm}><button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Run material plan<ArrowRight size={16} /></button></ActionForm>}</div><ol aria-label="Manufacturing workflow" className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">{["Demand", "Material plan", "Buy / make", "Schedule", "Produce", "Stock & spend"].map((label, index) => <li className="inline-flex items-center gap-2" key={label}><span className="flex size-5 items-center justify-center rounded-full bg-white text-[10px] text-blue-600 ring-1 ring-blue-100">{index + 1}</span>{label}{index < 5 && <ArrowRight size={12} className="mx-1 text-slate-300" />}</li>)}</ol></header>
    {!!metrics.length && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Link href={metric.href} key={metric.label} className={`flex items-center justify-between rounded-[22px] border bg-white p-5 hover:border-blue-200 ${metric.warning ? "border-amber-200" : "border-slate-200/80"}`}><div><p className="text-xs text-slate-500">{metric.label}</p><p className={`mt-2 text-3xl font-semibold tracking-tight ${metric.warning ? "text-amber-700" : "text-slate-900"}`}>{metric.value}</p></div><span className={`flex size-11 items-center justify-center rounded-2xl ${metric.warning ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}><metric.icon size={21} /></span></Link>)}</div>}
    {session.capabilities.has("manufacturing.plan.read") && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><p>{data.run ? `Latest completed material plan: ${data.run.startedAt.toLocaleString("en-GB", { timeZone: "Europe/London" })} · ${data.run.productCount} products. Proposals are recommendations until reviewed.` : "No completed material plan yet. Set up product recipes and demand, then run the material plan."}</p>{allowed.has("mrp") && <Link href="/manufacturing/planning" className="font-semibold text-blue-600">Review material plan →</Link>}{data.run?.warnings.length ? <p className="w-full text-amber-700">{data.run.warnings.join(" ")}</p> : null}</div>}
    <ConsoleDirectory destinations={data.destinations} role={role} pins={pins} />
  </div>;
}
