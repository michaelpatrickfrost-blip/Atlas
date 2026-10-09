import Link from "next/link";
import { Briefcase, Cable, ChartNoAxesColumnIncreasing, ChevronRight, LayoutGrid, Settings, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";
import { APP_AREAS, areaForModule } from "@/core/modules/areas";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES, CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { canOpenCompanyAdmin } from "@/app/(app)/settings/settings-menu";

type Entry = { id: string; name: string; href: string; icon: LucideIcon; description?: string };
const AREA_ICONS: Record<string, LucideIcon> = { Customers: Users, Operations: Settings, People: Users, Business: ChartNoAxesColumnIncreasing, More: LayoutGrid, Company: ShieldCheck };

/** One permission-filtered directory, with an icon launcher on Home and compact menu elsewhere. */
export async function AppDirectory({ session, variant = "menu" }: { session: Session; variant?: "menu" | "launcher" }) {
  const modules = await getNavigableModules(session);
  const groups = new Map<string, Entry[]>(APP_AREAS.map((area) => [area, []]));
  if (can(session, CUSTOMER_CAPABILITIES.read)) groups.get("Customers")!.push({ id: "customers", name: "Customers", href: "/customers", icon: Users, description: "Manage customer data and relationships." });
  for (const app of modules) groups.get(areaForModule(app.id))!.push({ id: app.id, name: app.name, href: app.rootPath, icon: app.icon, description: app.description });
  const company: Entry[] = [
    { id: "my-work", name: "My work", href: "/profile", icon: Briefcase, description: "Your tasks, meetings and personal details." },
    ...(canOpenCompanyAdmin(session) ? [{ id: "settings", name: "Company admin", href: "/settings", icon: Settings, description: "Company setup, users and permissions." }] : []),
    ...(can(session, CORE_CAPABILITIES.modulesManage) ? [{ id: "apps", name: "Manage apps", href: "/apps", icon: LayoutGrid, description: "Configure the apps in your workspace." }] : []),
    ...(can(session, "atlas.companies.manage") ? [{ id: "atlas", name: "Atlas Admin", href: "/atlas", icon: ShieldCheck, description: "Manage companies and Atlas administration." }, { id: "connections", name: "Connections", href: "/atlas/connections", icon: Cable, description: "Review and attach company imports." }] : []),
  ];
  const columns = [...[...groups].filter(([, entries]) => entries.length > 0), ["Company", company] as const];
  if (variant === "launcher") return (
    <nav aria-label="Apps" className="space-y-3">
      {columns.map(([area, entries]) => {
        const AreaIcon = AREA_ICONS[area] ?? LayoutGrid;
        return <section key={area} aria-label={area} className="rounded-[22px] border border-white/90 bg-white/90 p-4 shadow-[0_6px_24px_-16px_rgba(52,83,132,0.2)] sm:p-5">
          <div className="mb-3 flex items-center gap-3 px-1">
            <AreaIcon size={22} strokeWidth={1.8} aria-hidden="true" className="text-blue-600" />
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-950">{area}</h2>
            <span className="ml-auto text-xs text-slate-500">{entries.length} {entries.length === 1 ? "app" : "apps"}</span>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <Link href={entry.href} prefetch={false} className="atlas-launcher-card group flex h-full min-h-[86px] items-center gap-3.5 rounded-2xl border border-[#e6edf7] bg-white px-3 py-3 text-left shadow-[0_4px_16px_-12px_rgba(51,90,148,0.2)] transition hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-3.5">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-[#eaf3ff] text-[#075bff] transition-colors group-hover:bg-blue-100">
                    <entry.icon aria-hidden="true" size={29} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold leading-5 tracking-tight text-slate-950">{entry.name}</span><span className="mt-1 line-clamp-2 text-[12px] leading-[17px] text-[#7b879e]">{entry.description}</span></span>
                  <ChevronRight aria-hidden="true" size={16} className="shrink-0 text-[#526587]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>;
      })}
    </nav>
  );
  return (
    <nav aria-label="Apps" className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
      {columns.map(([area, entries]) => (
        <div key={area} className="min-w-0">
          <p className="px-2 text-[11px] font-medium text-[#86868b]">{area}</p>
          <ul className="mt-1.5">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link href={entry.href} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-[#1d1d1f] hover:bg-black/[0.045]">
                  <entry.icon size={15} strokeWidth={1.75} className="shrink-0 text-[#6e6e73]" />
                  <span className="truncate">{entry.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
