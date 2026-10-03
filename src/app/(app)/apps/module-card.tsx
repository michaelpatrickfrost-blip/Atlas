import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toggleModuleAction } from "@/app/(app)/apps/actions";
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
  const Icon = module.icon;
  const comingSoon = module.status === "coming_soon";
  const blocked = missingDependencies.length > 0;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[var(--radius-atlas-sm)] bg-[var(--color-atlas-blue-soft)] text-[var(--color-atlas-blue)]">
            <Icon size={16} />
          </div>
          <span className="font-medium text-[var(--color-ink)]">{module.name}</span>
        </div>
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
        <form action={async () => toggleModuleAction(module.id, false)} className="self-start">
          <Button variant="secondary" type="submit">
            Disable
          </Button>
        </form>
      ) : (
        <form action={async () => toggleModuleAction(module.id, true)} className="self-start">
          <Button variant="primary" type="submit" disabled={blocked}>
            Add {module.name}
          </Button>
        </form>
      )}
    </Card>
  );
}
