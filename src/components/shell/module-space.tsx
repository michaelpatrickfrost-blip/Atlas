import {accentColorForModule} from "@/core/shared/module-colors";
import type { ModuleManifest } from "@/core/modules/types";
import { requireSession } from "@/core/auth/session";
import { getEnabledModuleIds, getModuleNavigation } from "@/core/modules/runtime";
import { assertCapability } from "@/core/permissions/check";
import { EmptyState } from "@/components/ui/empty-state";
import { ActiveLink } from "./active-link";
export async function ModuleSpace({ module, children }: { module: ModuleManifest; children: React.ReactNode }) {
 const session = await requireSession();
 assertCapability(session, module.accessCapability);
 const enabled = await getEnabledModuleIds(session.organisationId);
 if (!enabled.has(module.id)) return <EmptyState title={`${module.name} is disabled`} description="Ask your workspace administrator to enable this app in Manage apps."/>;
 const Icon = module.icon;
 return <div className="mx-auto flex max-w-6xl flex-col gap-5">
  <div className="rounded-2xl border border-slate-200 bg-white px-4 pt-3 shadow-sm">
   <div className="mb-3 flex items-center gap-3"><div className="rounded-xl p-2 text-white" style={{background:`var(--color-accent-${accentColorForModule(module.id)})`}}><Icon size={20} strokeWidth={1.5}/></div><div><h1 className="text-base font-semibold tracking-tight">{module.name}</h1></div></div>
   <nav aria-label={`${module.name} navigation`} className="flex max-w-full gap-1 overflow-x-auto border-t border-slate-100 py-2">{getModuleNavigation(module, session).map(item => <ActiveLink key={item.href} href={item.href} className="atlas-tab whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium text-[var(--color-ink-muted)]">{item.label}</ActiveLink>)}</nav>
  </div>{children}
 </div>;
}
