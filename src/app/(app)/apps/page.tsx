import { requireSession } from "@/core/auth/session";
import { getModuleStatesForOrg, getEnabledModuleIds } from "@/core/modules/runtime";
import { getMissingDependencies } from "@/core/modules/registry";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { ModuleCard } from "@/app/(app)/apps/module-card";

export default async function AppsPage() {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);

  const states = await getModuleStatesForOrg(session.organisationId);
  const enabledIds = await getEnabledModuleIds(session.organisationId);

  const installed = states.filter((entry) => entry.enabled);
  const available = states.filter((entry) => !entry.enabled && entry.module.status === "available");
  const comingSoon = states.filter((entry) => entry.module.status === "coming_soon");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Build Atlas around your business</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Install what you need. Add more as your business grows.</p>
      </div>

      <Section title="Installed" entries={installed} enabledIds={enabledIds} />
      <Section title="Available" entries={available} enabledIds={enabledIds} />
      <Section title="Coming soon" entries={comingSoon} enabledIds={enabledIds} />
    </div>
  );
}

function Section({
  title,
  entries,
  enabledIds,
}: {
  title: string;
  entries: Awaited<ReturnType<typeof getModuleStatesForOrg>>;
  enabledIds: Set<string>;
}) {
  if (entries.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">{title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {entries.map(({ module, enabled }) => (
          <ModuleCard
            key={module.id}
            module={module}
            enabled={enabled}
            missingDependencies={getMissingDependencies(module.id, enabledIds)}
          />
        ))}
      </div>
    </section>
  );
}
