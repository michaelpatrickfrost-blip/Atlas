import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listProspects, type ProspectFilter } from "@/modules/sales/services/prospects-queries";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/core/shared/money";
import type { ProspectLifecycleStage } from "@/generated/prisma/client";

const STAGE_TONE: Record<ProspectLifecycleStage, StatusTone> = {
  NEW: "neutral",
  CONTACTED: "neutral",
  QUALIFIED: "success",
  NURTURE: "warning",
  DISQUALIFIED: "danger",
  CONVERTED: "success",
};

const FILTERS: { key: ProspectFilter | "all"; label: string }[] = [
  { key: "all", label: "My prospects" },
  { key: "new", label: "New" },
  { key: "nurture", label: "Nurture" },
  { key: "target_accounts", label: "Target accounts" },
];

/** Prospect — the dedicated prospecting workspace (§8). Leads, target
 *  accounts and lists are view selectors here, not separate top-level nav. */
export default async function ProspectPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectRead);

  const { filter } = await searchParams;
  const prospects = await listProspects(session.organisationId, {
    filter: (filter as ProspectFilter) ?? "my_prospects",
    ownerUserId: session.userId,
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Prospect</h1>
        {can(session, SALES_CAPABILITIES.prospectCreate) && (
          <Link href="/sales/prospect/new">
            <Button variant="primary">Add prospect</Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={item.key === "all" ? "/sales/prospect" : `/sales/prospect?filter=${item.key}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              (filter ?? "all") === item.key
                ? "bg-[var(--color-atlas-blue-soft)] text-[var(--color-atlas-blue)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <DataTable<(typeof prospects)[number]>
        rows={prospects}
        getHref={(row) => `/sales/prospect/${row.id}`}
        emptyLabel="No prospects here."
        columns={[
          {
            header: "Company",
            render: (row) => (
              <span className="flex flex-col">
                <span className="font-medium text-[var(--color-ink)]">{row.companyName}</span>
                {row.contactFirstName && (
                  <span className="text-xs text-[var(--color-ink-faint)]">
                    {row.contactFirstName} {row.contactSurname}
                  </span>
                )}
              </span>
            ),
          },
          { header: "Source", render: (row) => row.source ?? "—" },
          { header: "Est. value", render: (row) => (row.estimatedValueAmount ? formatMoney(row.estimatedValueAmount, row.estimatedValueCurrency ?? "GBP") : "—"), align: "right" },
          { header: "Stage", render: (row) => <StatusPill label={row.lifecycleStage.replace("_", " ")} tone={STAGE_TONE[row.lifecycleStage]} /> },
        ]}
      />
    </div>
  );
}
