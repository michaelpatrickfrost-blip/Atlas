import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconChip } from "@/components/ui/icon-chip";
import { StatusPill } from "@/components/ui/status-pill";
import { toggleModuleAction } from "@/app/(app)/apps/actions";
import { accentColorForModule } from "@/core/shared/module-colors";
import type { ModuleManifest } from "@/core/modules/types";

export function ModuleCard({
  module,
  enabled,
  entitled,
  missingDependencies,
}: {
  module: ModuleManifest;
  enabled: boolean;
  entitled: boolean;
  missingDependencies: string[];
}) {
  const comingSoon = module.status === "coming_soon";
  const blocked = missingDependencies.length > 0 || !entitled;

  return (
    <Card className="group flex min-h-56 flex-col gap-4 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="rounded-2xl p-1" style={{background:`linear-gradient(140deg, var(--color-accent-${accentColorForModule(module.id)}-soft), white)`}}><IconChip icon={module.icon} color={accentColorForModule(module.id)} size="lg" /></div>
          <span className="truncate font-medium text-[var(--color-ink)]">{module.name}</span>
        </div>
        {enabled && <StatusPill label="Installed" tone="success" />}
      </div>
      <p className="flex-1 text-sm text-[var(--color-ink-muted)]">{module.description}</p>

      {blocked && (
        <p className="text-xs text-[var(--color-ink-faint)]">
          {!entitled ? "Contact your Atlas administrator to add this app." : `Requires: ${missingDependencies.join(", ")}`}
        </p>
      )}

      {module.previewPath && <Link href={module.previewPath} className="flex items-center gap-1 text-xs font-medium text-[var(--color-atlas-blue)]">Preview design <ArrowUpRight size={13}/></Link>}
      {comingSoon ? (
        <Button variant="ghost" disabled className="self-start">
          Coming soon
        </Button>
      ) : enabled ? (
        <div className="flex items-center justify-between gap-3"><Link href={module.rootPath} className="flex items-center gap-2 rounded-xl bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-medium text-white">Open {module.name}<ArrowUpRight size={15}/></Link><form action={toggleModuleAction.bind(null, module.id, false)}>
          <Button variant="secondary" type="submit">
            Disable app
          </Button>
        </form></div>
      ) : (
        <form action={toggleModuleAction.bind(null, module.id, true)} className="self-start">
          <Button variant="primary" type="submit" disabled={blocked}>
            Add {module.name}
          </Button>
        </form>
      )}
    </Card>
  );
}
