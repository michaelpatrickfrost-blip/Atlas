import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { getModuleStatesForOrg, getEnabledModuleIds } from "@/core/modules/runtime";
import { getMissingDependencies } from "@/core/modules/registry";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { ModuleCard } from "@/app/(app)/apps/module-card";
import { toggleModuleAction } from "./actions";
import { Button } from "@/components/ui/button";

export default async function AppsPage() {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);

  const states = await getModuleStatesForOrg(session.organisationId);
  const enabledIds = await getEnabledModuleIds(session.organisationId);

  const installed = states.filter((entry) => entry.enabled && entry.module.id !== "pricing");
  const available = states.filter((entry) => !entry.enabled && entry.module.status !== "coming_soon" && entry.module.id !== "pricing");
  const comingSoon = states.filter((entry) => entry.module.status === "coming_soon");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">Manage apps</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Turn apps on or off for this company. Turning one off keeps its records.</p>
      </div>

      <Section title="Installed" entries={installed} enabledIds={enabledIds} />
      {states.filter(entry => entry.module.id === "pricing").map(entry => <section key={entry.module.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-white p-5"><div><h2 className="text-sm font-semibold">Sales → Price lists</h2><p className="mt-1 text-xs text-[var(--color-ink-muted)]">Price lists are a Sales feature. Agreements are in CRM. Their existing company access switch is kept here.</p></div><div className="flex items-center gap-4">{entry.enabled && <Link href="/sales/price-lists" className="text-sm text-[var(--color-atlas-blue)]">Open price lists</Link>}<form action={toggleModuleAction.bind(null, "pricing", !entry.enabled)}><Button type="submit" variant="secondary" disabled={!entry.entitled}>{entry.enabled ? "Disable price lists" : "Enable price lists"}</Button></form></div></section>)}
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
