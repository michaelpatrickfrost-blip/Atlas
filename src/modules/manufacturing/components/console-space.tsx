import type { ReactNode } from "react";
import { Factory } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { canOpenModule, isModuleEnabled } from "@/core/modules/runtime";
import type { ModuleManifest } from "@/core/modules/types";
import { AppHeader } from "@/components/shell/app-header";
import { FloatingModuleNav } from "@/components/shell/floating-module-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { supplyNavigation } from "../services/console";
export async function ConsoleSpace({ module, children }: { module: ModuleManifest; children: ReactNode }) {
  const session = await requireSession();
  if (!canOpenModule(session, module)) assertCapability(session, module.accessCapability);
  if (!await isModuleEnabled(session, module.id)) return <EmptyState title={`${module.name} is disabled`} description="Ask your workspace administrator to enable this app in Manage apps." />;
  const { navigation } = await supplyNavigation(session);
  return <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6"><FloatingModuleNav title="Manufacturing & Supply" items={navigation} /><AppHeader icon={Factory} title="Manufacturing & Supply" eyebrow="Plan. Make. Deliver." />{children}</div>;
}
