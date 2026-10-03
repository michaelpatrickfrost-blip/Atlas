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
  missingDependencies,
}: {
  module: ModuleManifest;
  enabled: boolean;
  missingDependencies: string[];
}) {
  const comingSoon = module.status === "coming_soon";
  const blocked = missingDependencies.length > 0;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconChip icon={module.icon} color={accentColorForModule(module.id)} />
          <span className="truncate font-medium text-[var(--color-ink)]">{module.name}</span>
        </div>
        {enabled && <StatusPill label="Installed" tone="success" />}
      </div>
      <p className="flex-1 text-sm text-[var(--color-ink-muted)]">{module.description}</p>

      {blocked && (
        <p className="text-xs text-[var(--color-ink-faint)]">
          Requires: {missingDependencies.join(", ")}
        </p>
      )}

      {comingSoon ? (
        <Button variant="ghost" disabled className="self-start">
          Coming soon
        </Button>
      ) : enabled ? (
        <form action={toggleModuleAction.bind(null, module.id, false)} className="self-start">
          <Button variant="secondary" type="submit">
            Disable
          </Button>
        </form>
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
