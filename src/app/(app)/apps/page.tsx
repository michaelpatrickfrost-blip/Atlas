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
  const available = states.filter((entry) => !entry.enabled && entry.module.status !== "coming_soon");
  const comingSoon = states.filter((entry) => entry.module.status === "coming_soon");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <div className="rounded-3xl border border-[#dce5fb] bg-[linear-gradient(115deg,#eef3ff,#f7f5ff_55%,#ffffff)] p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-[#66789e]">Your business, connected</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)]">A space for every part of your business</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Open your apps, shape your workspace, and expand as your team grows.</p>
      </div>

      <Section title="Installed" entries={installed} enabledIds={enabledIds} />
      <Section title="Available" entries={available} enabledIds={enabledIds} />
      <Section title="Planned apps" entries={comingSoon} enabledIds={enabledIds} />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ module, enabled, entitled }) => (
          <ModuleCard
            key={module.id}
            module={module}
            enabled={enabled} entitled={entitled}
            missingDependencies={getMissingDependencies(module.id, enabledIds)}
          />
        ))}
      </div>
    </section>
  );
}
