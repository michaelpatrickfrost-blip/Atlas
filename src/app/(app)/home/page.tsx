import Link from "next/link";
import { Briefcase, Settings, ShieldCheck, Users } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { getNavigableModules, getEnabledModuleIds } from "@/core/modules/runtime";
import { getAttentionItems } from "@/core/attention/aggregate";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES, CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { canOpenCompanyAdmin } from "@/app/(app)/settings/settings-menu";
import { GoalMeter } from "@/modules/kpis/components/goal-meter";
import { loadGoalWorkspace } from "@/modules/kpis/services/workspace";

function greeting(name: string) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/London" }).format(new Date()));
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${hello}, ${name}.`;
}

export default async function HomePage() {
  const session = await requireSession();
  const [modules, attention, enabled] = await Promise.all([getNavigableModules(session), getAttentionItems(session), getEnabledModuleIds(session.organisationId)]);
  const goalBoard = enabled.has("kpis") ? await loadGoalWorkspace(session).catch(() => null) : null;
  const highlights = goalBoard?.goals.filter((goal) => goal.status === "ACTIVE").slice(0, 4) ?? [];
  const apps = [
    { id: "my-work", name: "My work", description: "Your rota, time off, tasks and goals", rootPath: "/profile", icon: Briefcase },
    ...(can(session, CUSTOMER_CAPABILITIES.read) ? [{ id: "customers", name: "Customers", description: "Accounts and relationships", rootPath: "/customers", icon: Users }] : []),
    ...modules.map((module) => ({ id: module.id, name: module.name, description: module.description, rootPath: module.rootPath, icon: module.icon })),
    ...(canOpenCompanyAdmin(session) ? [{ id: "settings", name: "Company admin", description: "People, brand and permissions", rootPath: "/settings", icon: Settings }] : []),
    ...(can(session, "atlas.companies.manage") ? [{ id: "platform", name: "Atlas console", description: "Company accounts", rootPath: "/atlas", icon: ShieldCheck }] : []),
  ];
  const first = session.userName.split(" ")[0];
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-6 pt-2">
        <div>
          <p className="text-sm text-[#6e6e73]">{session.organisationName}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-[#1d1d1f] sm:text-5xl">{greeting(first)}</h1>
        </div>
        {can(session, CORE_CAPABILITIES.modulesManage) && (
          <Link href="/apps" className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-medium text-white">Manage apps</Link>
        )}
      </header>
      <section aria-label="Business apps" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <Link key={app.id} href={app.rootPath} className="group flex items-start gap-4 rounded-3xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#0a3d8f] text-white">
                <Icon size={22} strokeWidth={2.25} color="#ffffff" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-[#1d1d1f]">{app.name}</span>
                <span className="mt-1 line-clamp-2 text-sm leading-snug text-[#6e6e73]">{app.description}</span>
              </span>
            </Link>
          );
        })}
      </section>
      {highlights.length > 0 && <section className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">Goals</h2><Link href="/kpis" className="text-sm font-medium text-[#0071e3]">Open scorecards</Link></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{highlights.map((goal) => <Link key={goal.id} href={goal.planId ? `/kpis/plans/${goal.planId}` : `/kpis/${goal.id}`} className="rounded-2xl bg-[#f5f5f7] p-4"><p className="text-xs text-[#6e6e73]">{goal.visibility === "COMPANY" ? goal.department || goal.teamName : goal.personName || "Personal"}{goal.metricName ? ` · ${goal.metricName}` : ""}</p><div className="mt-2"><GoalMeter name={goal.name} actual={goal.actual} target={goal.target} elapsed={goal.elapsed} verdict={goal.verdict} unit={goal.unit} currency={goal.currency} summary={goal.summary} status={goal.status} /></div></Link>)}</div>
      </section>}
      <section className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">Needs you</h2>
          <span className="rounded-full bg-[#0071e3] px-2.5 py-0.5 text-xs font-medium text-white">{attention.length}</span>
        </div>
        <div className="mt-2">
          {attention.map((item) => (
            <Link key={item.id} href={item.href} className="flex items-center justify-between gap-4 border-b border-black/[0.06] py-3.5 text-sm text-[#1d1d1f] last:border-b-0">
              <span>{item.label}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${item.severity === "critical" ? "bg-[#d12b45]/10 text-[#d12b45]" : item.severity === "warning" ? "bg-[#b26a08]/10 text-[#b26a08]" : "bg-black/[0.05] text-[#6e6e73]"}`}>
                {item.severity === "critical" ? "Urgent" : item.severity === "warning" ? "Review" : "Open"}
              </span>
            </Link>
          ))}
          {!attention.length && <p className="py-6 text-sm text-[#6e6e73]">Nothing waiting.</p>}
        </div>
      </section>
    </div>
  );
}
