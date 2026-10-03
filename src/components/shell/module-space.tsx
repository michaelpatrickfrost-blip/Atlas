import type { ModuleManifest } from "@/core/modules/types";
import { requireSession } from "@/core/auth/session";
import { getEnabledModuleIds, getModuleNavigation } from "@/core/modules/runtime";
import { assertCapability } from "@/core/permissions/check";
import { EmptyState } from "@/components/ui/empty-state";
import { AppHeader } from "./app-header";
import { iconForNav } from "./nav-icon";
import { ActiveLink } from "./active-link";

export async function ModuleSpace({ module, children, wide = false, chrome = "panel" }: { module: ModuleManifest; children: React.ReactNode; wide?: boolean; chrome?: "panel" | "quiet" }) {
  const session = await requireSession();
  assertCapability(session, module.accessCapability);
  const enabled = await getEnabledModuleIds(session.organisationId);
  if (!enabled.has(module.id)) return <EmptyState title={`${module.name} is disabled`} description="Ask your workspace administrator to enable this app in Manage apps." />;
  const navigation = getModuleNavigation(module, session);
  const peers = navigation.map((item) => item.href);
  const tabs = navigation.map((item) => {
    const Icon = iconForNav(item.label);
    const quiet = chrome === "quiet";
    return (
      <ActiveLink key={item.href} href={item.href} peers={peers} className={quiet ? "crm-nav inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm text-[var(--color-ink-muted)]" : "atlas-tab inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium"}>
        <Icon size={15} strokeWidth={1.8} />
        {item.label}
      </ActiveLink>
    );
  });
  return (
    <div className={`mx-auto flex w-full ${wide ? "max-w-[1440px]" : "max-w-6xl"} flex-col gap-6`}>
      <AppHeader icon={module.icon} title={module.name} eyebrow="Atlas">
        {chrome === "quiet" ? <div className="flex w-fit gap-1 rounded-full bg-black/[0.04] p-1">{tabs}</div> : tabs}
      </AppHeader>
      {children}
    </div>
  );
}
