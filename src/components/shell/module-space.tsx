import type { ModuleManifest } from "@/core/modules/types";
import { requireSession } from "@/core/auth/session";
import { canOpenModule, getEnabledModuleIds, getModuleNavigation } from "@/core/modules/runtime";
import { assertCapability } from "@/core/permissions/check";
import { EmptyState } from "@/components/ui/empty-state";
import { AppHeader } from "./app-header";
import { FloatingModuleNav } from "./floating-module-nav";

export async function ModuleSpace({ module, children, wide = false }: { module: ModuleManifest; children: React.ReactNode; wide?: boolean; chrome?: "panel" | "quiet" }) {
  const session = await requireSession();
  if (module.accessAnyOf?.length) {
    if (!canOpenModule(session, module)) throw new Error(`FORBIDDEN: missing capability "${module.accessCapability}"`);
  } else assertCapability(session, module.accessCapability);
  const enabled = await getEnabledModuleIds(session.organisationId);
  if (!enabled.has(module.id)) return <EmptyState title={`${module.name} is disabled`} description="Ask your workspace administrator to enable this app in Manage apps." />;
  const navigation = getModuleNavigation(module, session);
  return (
    <div className={`mx-auto flex w-full ${wide ? "max-w-[1440px]" : "max-w-6xl"} flex-col gap-6`}>
      <FloatingModuleNav title={module.name} items={navigation} />
      <AppHeader icon={module.icon} title={module.name} eyebrow="Atlas" />
      {children}
    </div>
  );
}
