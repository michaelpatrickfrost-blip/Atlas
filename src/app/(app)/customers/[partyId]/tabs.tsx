import Link from "next/link";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "contacts", label: "Contacts" },
  { key: "people", label: "Addresses" },
  { key: "relationships", label: "Hierarchy" },
  { key: "commercial", label: "Commercial" },
  { key: "finance", label: "Finance & Tax" },
  { key: "activity", label: "Notes & activity" },
] as const;

export type CustomerTabKey = (typeof TABS)[number]["key"];

export function CustomerTabs({ partyId, active }: { partyId: string; active: CustomerTabKey }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/customers/${partyId}?tab=${tab.key}`}
          className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${
            active === tab.key
              ? "border-[var(--color-atlas-blue)] text-[var(--color-ink)]"
              : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
