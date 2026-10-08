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
    <nav aria-label="Apps" className="space-y-5">
      {columns.map(([area, entries]) => (
        <section key={area} aria-label={area}>
          <div className="mb-2.5 flex items-center gap-3">
            <h3 className="text-xs font-medium text-[#6e6e73]">{area}</h3>
            <div aria-hidden="true" className="h-px flex-1 bg-black/[0.06]" />
          </div>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <Link href={entry.href} prefetch={false} className="flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <entry.icon aria-hidden="true" size={19} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 truncate text-[13px] font-medium leading-5 text-[#1d1d1f]">{entry.name}</span>
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
