import Link from "next/link";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "people", label: "People & Places" },
  { key: "commercial", label: "Commercial" },
  { key: "finance", label: "Finance & Tax" },
  { key: "activity", label: "Activity" },
] as const;

export type CustomerTabKey = (typeof TABS)[number]["key"];

export function CustomerTabs({ partyId, active }: { partyId: string; active: CustomerTabKey }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-border)]">
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
