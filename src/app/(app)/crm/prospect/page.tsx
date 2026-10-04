import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listIndustries, listProspects, listProspectTags, type ProspectFilter } from "@/modules/crm/services/prospects-queries";
import { createIndustry } from "@/modules/crm/services/prospects";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/core/shared/money";
import type { ProspectLifecycleStage } from "@/generated/prisma/client";
import { ownerRestriction } from "@/modules/crm/services/visibility";

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
export default async function ProspectPage({ searchParams }: { searchParams: Promise<{ filter?: string; industry?: string; tag?: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectRead);

  const { filter, industry, tag } = await searchParams;
  const effectiveFilter: ProspectFilter = (filter as ProspectFilter) ?? "my_prospects";
  const industries = await listIndustries(session.organisationId);
  const chosenIndustry = industries.some((item) => item.id === industry) ? industry : undefined;
  const [prospects, tags] = await Promise.all([
    listProspects(session.organisationId, {
      filter: effectiveFilter,
      ownerUserId: effectiveFilter === "my_prospects" ? session.userId : ownerRestriction(session),
      industryId: chosenIndustry,
      tag,
    }),
    listProspectTags(session.organisationId),
  ]);
  const groups = new Map<string, typeof prospects>();
  for (const prospect of prospects) {
    const name = prospect.industry?.name ?? "No industry";
    groups.set(name, [...(groups.get(name) ?? []), prospect]);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-ink)]">Prospects</h1>
        {can(session, SALES_CAPABILITIES.prospectCreate) && (
          <Link href="/crm/prospect/new">
            <Button variant="primary">Add prospect</Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {FILTERS.map((item) => {
          const params = new URLSearchParams();
          if (item.key !== "all") params.set("filter", item.key);
          if (chosenIndustry) params.set("industry", chosenIndustry);
          if (tag) params.set("tag", tag);
          const href = params.size ? `/crm/prospect?${params}` : "/crm/prospect";
          return (
            <Link
              key={item.key}
              href={href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                (filter ?? "all") === item.key
                  ? "bg-[#0071e3] text-white"
                  : "bg-white text-[#1d1d1f]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-3xl border border-black/[0.04] bg-white p-4">
        {filter && <input type="hidden" name="filter" value={filter} />}
        <label className="text-xs font-medium text-[#6e6e73]">Industry
          <select name="industry" defaultValue={chosenIndustry ?? ""} className="crm-field mt-1.5 block min-w-44">
            <option value="">All industries</option>
            {industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-[#6e6e73]">Tag
          <select name="tag" defaultValue={tag ?? ""} className="crm-field mt-1.5 block min-w-40">
            <option value="">All tags</option>
            {tags.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <Button type="submit">Show</Button>
      </form>

      {can(session, SALES_CAPABILITIES.prospectManage) && (
        <form action={createIndustry} className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-[#6e6e73]">New industry
            <input name="name" required minLength={2} maxLength={60} placeholder="Drainage, house bricks…" className="mt-1.5 block min-w-72" />
          </label>
          <Button type="submit" variant="secondary">Add industry</Button>
        </form>
      )}

      {[...groups.entries()].map(([name, rows]) => (
        <section key={name} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">{name} <span className="font-normal text-[#6e6e73]">{rows.length}</span></h2>
          <DataTable<(typeof prospects)[number]>
            rows={rows}
            getHref={(row) => `/crm/prospect/${row.id}`}
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
              { header: "Tags", render: (row) => row.tags.join(", ") || "—" },
              { header: "Source", render: (row) => row.source ?? "—" },
              { header: "Est. value", render: (row) => (row.estimatedValueAmount ? formatMoney(row.estimatedValueAmount, row.estimatedValueCurrency ?? "GBP") : "—"), align: "right" },
              { header: "Stage", render: (row) => <StatusPill label={row.lifecycleStage.replace("_", " ")} tone={STAGE_TONE[row.lifecycleStage]} /> },
            ]}
          />
        </section>
      ))}
      {!prospects.length && <p className="text-sm text-[#6e6e73]">No prospects in this view.</p>}
    </div>
  );
}
