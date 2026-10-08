import Link from "next/link";
import { Briefcase, Cable, LayoutGrid, Settings, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";
import { APP_AREAS, areaForModule } from "@/core/modules/areas";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES, CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { canOpenCompanyAdmin } from "@/app/(app)/settings/settings-menu";

type Entry = { id: string; name: string; href: string; icon: LucideIcon };

const ICON_TONES = [
  "from-blue-50 to-blue-100 text-blue-700 ring-blue-200/60",
  "from-violet-50 to-violet-100 text-violet-700 ring-violet-200/60",
  "from-emerald-50 to-emerald-100 text-emerald-700 ring-emerald-200/60",
  "from-amber-50 to-amber-100 text-amber-700 ring-amber-200/60",
  "from-rose-50 to-rose-100 text-rose-700 ring-rose-200/60",
  "from-cyan-50 to-cyan-100 text-cyan-700 ring-cyan-200/60",
];

function iconTone(id: string) {
  return ICON_TONES[Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % ICON_TONES.length];
}

/** One permission-filtered directory, with an icon launcher on Home and compact menu elsewhere. */
export async function AppDirectory({ session, variant = "menu" }: { session: Session; variant?: "menu" | "launcher" }) {
  const modules = await getNavigableModules(session);
  const groups = new Map<string, Entry[]>(APP_AREAS.map((area) => [area, []]));
  if (can(session, CUSTOMER_CAPABILITIES.read)) groups.get("Customers")!.push({ id: "customers", name: "Customers", href: "/customers", icon: Users });
  for (const app of modules) groups.get(areaForModule(app.id))!.push({ id: app.id, name: app.name, href: app.rootPath, icon: app.icon });
  const company: Entry[] = [
    { id: "my-work", name: "My work", href: "/profile", icon: Briefcase },
    ...(canOpenCompanyAdmin(session) ? [{ id: "settings", name: "Company admin", href: "/settings", icon: Settings }] : []),
    ...(can(session, CORE_CAPABILITIES.modulesManage) ? [{ id: "apps", name: "Manage apps", href: "/apps", icon: LayoutGrid }] : []),
    ...(can(session, "atlas.companies.manage") ? [{ id: "atlas", name: "Atlas Admin", href: "/atlas", icon: ShieldCheck }, { id: "connections", name: "Connections", href: "/atlas/connections", icon: Cable }] : []),
  ];
  const columns = [...[...groups].filter(([, entries]) => entries.length > 0), ["Company", company] as const];
  if (variant === "launcher") return (
    <nav aria-label="Apps" className="space-y-7">
      {columns.map(([area, entries]) => (
        <section key={area} aria-label={area}>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-xs font-medium text-[#6e6e73]">{area}</h3>
            <div aria-hidden="true" className="h-px flex-1 bg-black/[0.06]" />
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-7">
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <Link href={entry.href} prefetch={false} className="group flex h-full min-h-28 flex-col items-center gap-3 rounded-2xl px-2 py-3 text-center transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1 ring-inset transition-transform motion-safe:group-hover:-translate-y-0.5 ${iconTone(entry.id)}`}>
                    <entry.icon aria-hidden="true" size={27} strokeWidth={1.65} />
                  </span>
                  <span className="text-xs font-medium leading-4 text-[#1d1d1f] sm:text-[13px]">{entry.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
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
