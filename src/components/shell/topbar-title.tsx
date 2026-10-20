"use client";

import { usePathname } from "next/navigation";

const CORE_TITLES: Array<[string, string]> = [
  ["/home", "Home"], ["/analytics", "Dashboards"], ["/reports", "Reports"], ["/guides", "Guides"],
  ["/chat", "Messages"], ["/settings", "Company admin"], ["/profile/settings", "Settings"],
  ["/profile", "My work"], ["/customers", "Customers"], ["/apps", "Manage apps"],
];

/** Macro-style panel title: the company, then the place you are in. */
export function TopbarTitle({ organisation, apps }: { organisation: string; apps: Array<[string, string]> }) {
  const pathname = usePathname();
  const match = [...CORE_TITLES, ...apps]
    .filter(([path]) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return (
    <p className="atlas-topbar-title hidden min-w-0 items-baseline gap-2 truncate sm:flex">
      <span className="truncate text-[var(--color-ink-faint)]">{organisation}</span>
      {match && <><span aria-hidden="true" className="text-[var(--color-border-strong)]">/</span><span className="truncate font-medium text-[var(--color-ink)]">{match[1]}</span></>}
    </p>
  );
}
