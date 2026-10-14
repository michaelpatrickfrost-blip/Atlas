import Link from "next/link";
import { appAppearance } from "./app-appearance";
import { BookOpen, Briefcase, ChartNoAxesColumnIncreasing, ChevronRight, LayoutGrid, Settings, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";
import { APP_AREAS, areaForModule } from "@/core/modules/areas";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES, CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { canOpenCompanyAdmin } from "@/app/(app)/settings/settings-menu";

type Entry = { id: string; name: string; href: string; icon: LucideIcon; description?: string };
const AREA_ICONS: Record<string, LucideIcon> = { Customers: Users, Operations: Settings, People: Users, Business: ChartNoAxesColumnIncreasing, More: LayoutGrid, Company: ShieldCheck };
const APP_SUMMARIES: Record<string, string> = {
  crm: "Sales pipeline and customer insights.", sales: "Quotes, orders and sales management.",
  service: "Customer support and service management.", marketing: "Campaigns and customer engagement.",
  stock: "Stock, materials and warehouse management.", planning: "Product demand, stock cover and shortages.",
  logistics: "Warehouse fulfilment, dispatch and deliveries.", manufacturing: "Demand, materials, production, procurement and spend.",
  safety: "Workplace safety, risks and compliance.", quality: "Quality management and control.",
  kpis: "Track performance and business goals.", people: "People, contracts and HR management.",
  scheduling: "Workforce planning and scheduling.", teams: "Team capacity, holidays and resourcing.",
  payroll: "Payroll calculations and statutory reporting.", projects: "Project management and delivery.",
  plan: "Integrated business planning.", sop: "Sales and operations planning.",
  finance: "Accounts, payments and financial reporting.", analytics: "Live dashboards across your business.",
};

/** One permission-filtered directory, with an icon launcher on Home and a grouped workspace menu. */
export async function AppDirectory({ session, variant = "menu" }: { session: Session; variant?: "menu" | "launcher" }) {
  const modules = await getNavigableModules(session);
  const groups = new Map<string, Entry[]>(APP_AREAS.map((area) => [area, []]));
  if (can(session, CUSTOMER_CAPABILITIES.read)) groups.get("Customers")!.push({ id: "customers", name: "Customers", href: "/customers", icon: Users, description: "Manage customer data and relationships." });
  for (const app of modules.filter(app=>variant!=="launcher"||app.id!=="analytics")) groups.get(areaForModule(app.id))!.push({ id: app.id, name: app.name, href: app.rootPath, icon: app.icon, description: app.id === "scheduling" && app.name === "My rota" ? app.description : APP_SUMMARIES[app.id] ?? app.description });
  const company: Entry[] = [
    { id: 'guides', name: 'Guides', href: '/guides', icon: BookOpen, description: 'Clear steps, explanations and help for your work.' },
    ...(variant === "menu" ? [{id:"reports",name:"Reports",href:"/reports",icon:ChartNoAxesColumnIncreasing,description:"Filter data and download Excel."}] : []),
    { id: "my-work", name: "My work", href: "/profile", icon: Briefcase, description: "Your tasks, meetings and personal details." },
    ...(canOpenCompanyAdmin(session) ? [{ id: "settings", name: "Company admin", href: "/settings", icon: Settings, description: "Company setup, users and permissions." }] : []),
    ...(can(session, CORE_CAPABILITIES.modulesManage) ? [{ id: "apps", name: "Manage apps", href: "/apps", icon: LayoutGrid, description: "Configure the apps in your workspace." }] : []),
  ];
  const columns = [...[...groups].filter(([, entries]) => entries.length > 0), ["Company", company] as const];
  if (variant === "launcher") return (
    <nav aria-label="Apps" className="atlas-app-directory">
      {columns.map(([area, entries], index) => {
        const AreaIcon = AREA_ICONS[area] ?? LayoutGrid;
        return <section key={area} aria-label={area} className="atlas-app-group">
          <div className="atlas-app-group-heading">
            <span className="atlas-group-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <AreaIcon size={17} strokeWidth={1.65} aria-hidden="true" />
            <h2>{area}</h2>
            <span className="atlas-group-rule" aria-hidden="true" />
            <span className="atlas-app-count">{entries.length} {entries.length === 1 ? "app" : "apps"}</span>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <Link href={entry.href} prefetch={false} style={appAppearance(entry.id)} className="atlas-launcher-card group">
                  <span className="atlas-app-icon atlas-launcher-icon">
                    <entry.icon aria-hidden="true" size={27} strokeWidth={1.65} />
                  </span>
                  <span className="min-w-0 flex-1"><span className="atlas-launcher-title">{entry.name}</span><span className="atlas-launcher-description">{entry.description}</span></span>
                  <ChevronRight aria-hidden="true" size={16} className="atlas-launcher-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </section>;
      })}
    </nav>
  );
  return (
    <nav aria-label="Apps" className="atlas-menu-directory grid grid-cols-3 gap-x-2 gap-y-2 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-4 lg:grid-cols-4">
      {columns.map(([area, entries]) => (
        <section key={area} aria-label={area} className="min-w-0">
          <h2 className="px-1 text-[10px] font-semibold text-[var(--color-ink-muted)] sm:px-2 sm:text-xs">{area}</h2>
          <ul className="mt-1">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link href={entry.href} prefetch={false} style={appAppearance(entry.id)} className="atlas-menu-link flex min-h-7 items-center gap-1.5 rounded-lg px-1 py-[3px] text-[11px] leading-[14px] sm:min-h-9 sm:gap-2 sm:px-2 sm:text-sm sm:leading-5">
                  <span className="atlas-app-icon hidden size-6 shrink-0 rounded-lg sm:flex"><entry.icon size={15} strokeWidth={1.65} aria-hidden="true" /></span>
                  <span className="min-w-0 break-words">{entry.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
